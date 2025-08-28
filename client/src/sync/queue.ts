import { db, type QueueMutation, type QueueOp } from '@/db/gymbud-db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { mapEdgeError, type ErrorCode } from '@/lib/errors/mapEdgeError'
import { track } from '@/lib/telemetry'
import { upsertConflict, deleteConflict } from '@/db/conflicts'
import { shallowDiff } from '@/lib/diff'

const MAX_ATTEMPTS = 5
let flushLock = false
let pullLock = false
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('gymbud-sync') : null

export async function enqueue(opts: {
  entity: string
  op: QueueOp
  payload: any
  user_id?: string
  idempotency_key?: string
}): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const row: QueueMutation = {
    id,
    entity: opts.entity as any,
    op: opts.op,
    payload: opts.payload,
    user_id: opts.user_id,
    idempotency_key: opts.idempotency_key ?? id,
    status: 'pending',
    created_at: now,
    attempts: 0,
    // Legacy fields for backward compatibility
    retries: 0,
    next_attempt_at: now,
    updated_at: now,
  }
  await db.queue_mutations.add(row)
  bc?.postMessage('queue-change')
  return id
}

export async function pendingCount(): Promise<number> {
  return db.queue_mutations.where('status').equals('pending').count()
}

async function markFailure(m: QueueMutation, code: string): Promise<void> {
  await db.queue_mutations.update(m.id, {
    status: 'failed',
    attempts: (m.attempts ?? 0) + 1,
    last_error_code: code,
    last_error_at: Date.now(),
  })
}

type SendOptions = { override?: boolean };

async function sendToServer(m: QueueMutation, opts: SendOptions = {}): Promise<void> {
  try {
    if (m.entity === 'app2.logged_sets' && m.op === 'insert') {
      // Ensure the row uses the queue id as the primary key for idempotency
      const payload = { id: m.id, ...m.payload, override: opts.override }

      const { data, error } = await supabase.functions.invoke('sync-logged-sets', {
        body: { mutations: [{ id: m.id, entity: m.entity, op: m.op, payload }] }
      })

      if (error) throw new Error(error.message || 'SYNC_INVOKE_FAILED')

      const res = data?.results?.[0]
      if (!res || (res.status !== 'ok' && res.status !== 'skipped')) {
        throw new Error(res?.message || res?.code || 'SYNC_FAILED')
      }
      return
    }

    if (m.entity === 'logged_sets/void' && m.op === 'void') {
      // Handle void mutations for logged sets
      const payload = { id: m.id, ...m.payload, override: opts.override }

      const { data, error } = await supabase.functions.invoke('sync-logged-sets', {
        body: { mutations: [{ id: m.id, entity: m.entity, op: m.op, payload }] }
      })

      if (error) throw new Error(error.message || 'SYNC_INVOKE_FAILED')

      const res = data?.results?.[0]
      if (!res || (res.status !== 'ok' && res.status !== 'skipped')) {
        throw new Error(res?.message || res?.code || 'SYNC_FAILED')
      }
      return
    }

    if (m.entity === 'app2.sessions' && m.op === 'update') {
      // Ensure the row uses the queue id as the primary key for idempotency
      const payload = { id: m.id, ...m.payload, override: opts.override }

      const { data, error } = await supabase.functions.invoke('sync-sessions', {
        body: { mutations: [{ id: m.id, entity: m.entity, op: m.op, payload }] }
      })

      if (error) throw new Error(error.message || 'SYNC_INVOKE_FAILED')

      const res = data?.results?.[0]
      if (!res || (res.status !== 'ok' && res.status !== 'skipped')) {
        throw new Error(res?.message || res?.code || 'SYNC_FAILED')
      }
      return
    }

    if (m.entity === 'app2.session_exercises' && (m.op === 'insert' || m.op === 'update')) {
      // Ensure the row uses the queue id as the primary key for idempotency
      const payload = { id: m.id, ...m.payload, override: opts.override }

      const { data, error } = await supabase.functions.invoke('sync-session-exercises', {
        body: { mutations: [{ id: m.id, entity: m.entity, op: m.op, payload }] }
      })

      if (error) throw new Error(error.message || 'SYNC_INVOKE_FAILED')

      const res = data?.results?.[0]
      if (!res || (res.status !== 'ok' && res.status !== 'skipped')) {
        throw new Error(res?.message || res?.code || 'SYNC_FAILED')
      }
      return
    }

    if (m.entity === 'app2.coach_audit' && m.op === 'insert') {
      // Ensure the row uses the queue id as the primary key for idempotency
      const payload = { id: m.id, ...m.payload, override: opts.override }

      const { data, error } = await supabase.functions.invoke('sync-coach-audit', {
        body: { mutations: [{ id: m.id, entity: m.entity, op: m.op, payload }] }
      })

      if (error) throw new Error(error.message || 'SYNC_INVOKE_FAILED')

      const res = data?.results?.[0]
      if (!res || (res.status !== 'ok' && res.status !== 'skipped')) {
        throw new Error(res?.message || res?.code || 'SYNC_FAILED')
      }
      return
    }

    // keep others queued until we add server support
    throw new Error('UNSUPPORTED_MUTATION')
  } catch (e: any) {
    const mappedError = mapEdgeError(e);
    if (mappedError.code === 'version_conflict') {
      // fetch latest from server for this entity/id (lightweight GET via existing pull)
      const server = await fetchLatestFor(m.payload?.id || m.payload?.session_id || m.payload?.session_exercise_id).catch(() => null);
      const local = await snapshotLocal(m);
      const id = `${m.entity}:${local?.id || m.payload?.id}`;
      await upsertConflict({
        id,
        entity: m.entity.replace('app2.', '') as any,
        entity_id: local?.id || m.payload?.id,
        op: m.op,
        local,
        server,
        diff: shallowDiff(local, server),
        last_error_code: mappedError.code,
      });
      track({ type: 'sync_failure', code: mappedError.code }); // existing
      track({ type: 'conflict_detected' as any });
      // mark failed but don't drop it
      await db.queue_mutations.update(m.id, { status: 'failed', last_error_code: mappedError.code, last_error_at: Date.now() });
      return;
    }
    throw e; // existing retry/backoff logic
  }
}

// Helper to snapshot local row referenced by mutation
async function snapshotLocal(m: QueueMutation) {
  switch (m.entity.replace('app2.', '')) {
    case 'sessions': return await db.sessions.get(m.payload?.id);
    case 'session_exercises': return await db.session_exercises.get(m.payload?.id);
    case 'logged_sets': return await db.logged_sets.get(m.payload?.id);
    case 'coach_audit': return m.payload; // ephemeral log; treat payload as local
    default: return m.payload;
  }
}

// Helper to fetch latest server data for conflict resolution
async function fetchLatestFor(_entityId: string) {
  // This would ideally be a lightweight GET endpoint
  // For now, we'll return null and rely on the next pull to get server data
  // In a full implementation, you'd have a dedicated endpoint for single-row fetches
  return null;
}

function backoffDelay(retries: number) {
  const base = Math.min(60, 2 ** retries) // seconds, capped at 60s
  return base * 1000
}

// Helper function to cap sync events to last 50
async function addSyncEvent(event: { ts: number; kind: 'success' | 'failure'; code?: string; items?: number }): Promise<void> {
  await db.sync_events.add(event)
  
  // Cap to last 50 events
  const count = await db.sync_events.count()
  if (count > 50) {
    const oldestEvents = await db.sync_events.orderBy('ts').limit(count - 50).toArray()
    const idsToDelete = oldestEvents.map(e => e.id!).filter(Boolean)
    await db.sync_events.bulkDelete(idsToDelete)
  }
}

// Helper function to update meta
async function updateMeta(key: string, value: any): Promise<void> {
  await db.meta.put({ key, value, updated_at: Date.now() })
}

// Check if row has pending local mutations for conflict detection
async function hasLocalPendingMutationFor(rowId: string, entity: string): Promise<boolean> {
  const count = await db.queue_mutations
    .where('[entity+status]')
    .equals([`app2.${entity}`, 'pending'])
    .filter(m => m.payload?.id === rowId)
    .count();
  return count > 0;
}

// Check if row has pending local mutations
async function hasPendingMutation(entity: string, rowId: string): Promise<boolean> {
  const count = await db.queue_mutations
    .where('[entity+payload.id+status]')
    .between([entity, rowId, 'pending'], [entity, rowId, 'pending'])
    .count()
  return count > 0
}

// Check if row has pending void mutation
async function hasPendingVoidMutation(setId: string): Promise<boolean> {
  const mutation = await db.queue_mutations
    .where('[entity+op]')
    .equals(['logged_sets/void', 'void'])
    .and(mutation => {
      const payload = mutation.payload as { id?: string; voided?: boolean } | undefined
      return payload?.id === setId && 
             payload?.voided === true &&
             mutation.status === 'pending'
    })
    .first()
  
  return !!mutation
}

// Safe merge server data with local data - Enhanced for conflict detection
interface LoggedSetWithVoided {
  id: string
  voided?: boolean
  session_exercise_id?: string
  set_number?: number
  updated_at?: string | number
}

async function safeMergeRow(entity: string, serverRow: any): Promise<void> {
  const tableName = entity.replace('app2.', '') as 'sessions' | 'session_exercises' | 'logged_sets'
  const table = db[tableName]
  
  if (!table) return
  
  // Check for conflicts during pull/merge
  if (await hasLocalPendingMutationFor(serverRow.id, tableName)) {
    const local = await table.get(serverRow.id);
    await upsertConflict({
      id: `${tableName}:${serverRow.id}`,
      entity: tableName,
      entity_id: serverRow.id,
      op: 'update',
      local,
      server: serverRow,
      diff: shallowDiff(local, serverRow),
      last_error_code: 'version_conflict'
    });
    track({ type: 'conflict_detected' as any });
    // skip auto-merge; let user resolve
    return;
  }
  
  // Special handling for logged_sets with void reconciliation
  if (entity === 'app2.logged_sets') {
    const localRow = await table.get(serverRow.id) as LoggedSetWithVoided | undefined
    const hasPendingVoid = await hasPendingVoidMutation(serverRow.id)
    
    // Merge rules for void reconciliation
    if (localRow?.voided && !serverRow.voided && hasPendingVoid) {
      // Local void pending, server non-void: Keep local void optimistic
      console.log(`[sync] Keeping local void for set ${serverRow.id} - pending void mutation`)
      return
    }
    
    if (serverRow.voided && localRow?.voided) {
      // Server confirms void: Clear local pending and confirm voided
      await table.put({ ...serverRow, voided: true })
      console.log(`[sync] Confirmed void for set ${serverRow.id}`)
      return
    }
    
    if (!serverRow.voided && localRow?.voided && !hasPendingVoid) {
      // Server says non-void, local has void but no pending: Trust server
      console.log(`[sync] Reverting local void for set ${serverRow.id} - no pending mutation`)
      await table.put({ ...serverRow, voided: false })
      return
    }
    
    // Deduplicate by (session_exercise_id, set_number) - server canonical
    const existingBySetNumber = await table
      .where('[session_exercise_id+set_number]')
      .equals([serverRow.session_exercise_id, serverRow.set_number])
      .first() as LoggedSetWithVoided | undefined
    
    if (existingBySetNumber && existingBySetNumber.id !== serverRow.id) {
      // Duplicate detected - server row is canonical
      await table.delete(existingBySetNumber.id)
      console.log(`[sync] Deduplicated set ${existingBySetNumber.id} in favor of ${serverRow.id}`)
    }
  }
  
  // Check if we have pending mutations for this row
  const hasPending = await hasPendingMutation(entity, serverRow.id)
  
  if (!hasPending) {
    // No local changes, safe to upsert server data
    await table.put(serverRow)
  } else {
    // Has pending changes - only update if server is newer
    const localRow = await table.get(serverRow.id)
    if (!localRow || new Date(serverRow.updated_at) > new Date(localRow.updated_at)) {
      // Server is newer, but preserve local changes by selective merge
      // For now, skip updating to avoid clobbering - field-level merge would go here
      console.log(`[sync] Skipping merge for ${entity}:${serverRow.id} - has pending local changes`)
    }
  }
}

export async function pullUpdates(): Promise<void> {
  if (pullLock) return
  pullLock = true
  
  try {
    const lastPullMeta = await db.meta.get('last_pull_at')
    const since = lastPullMeta?.value || '1970-01-01T00:00:00Z'
    
    const { data, error } = await supabase.functions.invoke('pull-updates', {
      body: { since }
    })
    
    if (error) throw new Error(error.message || 'PULL_INVOKE_FAILED')
    
    if (!data?.ok) {
      throw new Error(data?.error || 'PULL_FAILED')
    }
    
    let totalPulled = 0
    
    // Merge sessions
    for (const session of data.data.sessions || []) {
      await safeMergeRow('app2.sessions', session)
      totalPulled++
    }
    
    // Merge session_exercises  
    for (const exercise of data.data.session_exercises || []) {
      await safeMergeRow('app2.session_exercises', exercise)
      totalPulled++
    }
    
    // Merge logged_sets
    for (const loggedSet of data.data.logged_sets || []) {
      await safeMergeRow('app2.logged_sets', loggedSet)
      totalPulled++
    }
    
    // Update watermark
    await updateMeta('last_pull_at', data.until)
    await updateMeta('last_pull_status', 'success')
    await updateMeta('last_pull_error_code', null)
    
    if (totalPulled > 0) {
      await addSyncEvent({ ts: Date.now(), kind: 'success', items: totalPulled })
    }
    
    // Nudge other tabs
    bc?.postMessage('queue-change')
    
  } catch (err) {
    const mappedError = mapEdgeError(err)
    await updateMeta('last_pull_status', 'failure')
    await updateMeta('last_pull_error_code', mappedError.code)
    await addSyncEvent({ ts: Date.now(), kind: 'failure', code: mappedError.code })
    
    console.warn('[sync] pull failed', { error: mappedError.code })
    throw err
  } finally {
    pullLock = false
  }
}

export async function flush(maxBatch = 50): Promise<void> {
  if (flushLock) return
  flushLock = true
  
  try {
    const now = Date.now()
    const batch = await db.queue_mutations
      .where('status')
      .equals('pending')
      .limit(maxBatch)
      .toArray()

    if (batch.length === 0) {
      // No mutations to flush, try pull updates
      try {
        await pullUpdates()
      } catch (err) {
        // Pull failed, but don't throw - flush succeeded with 0 items
      }
      return
    }

    // Update meta: sync started
    await updateMeta('last_sync_at', new Date().toISOString())
    await updateMeta('last_sync_status', 'running')

    let successCount = 0
    let failureCount = 0
    let lastErrorCode: ErrorCode | null = null

    for (const m of batch) {
      // optimistic "inflight" mark
      await db.queue_mutations.update(m.id, { status: 'inflight', updated_at: Date.now() })
      try {
        // Check if this mutation has override flag from conflict resolution
        const hasOverride = m.payload?.override === true;
        await sendToServer(m, { override: hasOverride })
        await db.queue_mutations.update(m.id, { status: 'done', updated_at: Date.now() })
        successCount++
      } catch (err: any) {
        const mappedError = mapEdgeError(err)
        lastErrorCode = mappedError.code
        
        const attempts = (m.attempts ?? 0) + 1
        
        // Check if we should mark as failed
        if (attempts >= MAX_ATTEMPTS || 
            mappedError.code === 'invalid_payload' || 
            mappedError.code === 'rls_denied') {
          await markFailure(m, mappedError.code)
          track({ type: 'sync_failure', code: mappedError.code })
          failureCount++
        } else {
          // Retry with backoff
          const next = Date.now() + backoffDelay(attempts)
          await db.queue_mutations.update(m.id, {
            status: 'pending',
            attempts,
            last_error_code: mappedError.code,
            last_error_at: Date.now(),
            // Legacy fields
            retries: attempts,
            next_attempt_at: next,
            updated_at: Date.now(),
          })
          failureCount++
        }
        
        // Don't spam; console is fine in dev
        console.warn('[sync] retry scheduled', { id: m.id, attempts, error: mappedError.code })
      }
    }

    // After successful flush, try to pull updates
    if (successCount > 0 && failureCount === 0) {
      try {
        await pullUpdates()
      } catch (err) {
        // Pull failed, but flush succeeded - don't change flush status
        console.warn('[sync] post-flush pull failed', err)
      }
    }

    // Update meta and add sync event based on results
    if (successCount > 0 && failureCount === 0) {
      await updateMeta('last_sync_status', 'success')
      await updateMeta('last_sync_error_code', null)
      await addSyncEvent({ ts: now, kind: 'success', items: successCount })
      
      track({ type: 'sync_success', items: successCount })
      
      toast.success(i18n.t('app.sync.success'), {
        description: i18n.t('app.sync.success_detail'),
      })
    } else if (failureCount > 0) {
      await updateMeta('last_sync_status', 'failure')
      await updateMeta('last_sync_error_code', lastErrorCode)
      await addSyncEvent({ ts: now, kind: 'failure', code: lastErrorCode || 'unknown' })
      
      track({ type: 'sync_failure', code: lastErrorCode || 'unknown' })
      
      toast.error(i18n.t('app.sync.failure'), {
        description: i18n.t('app.sync.failure_detail'),
      })
    }

    // Nudge other tabs
    bc?.postMessage('queue-change')
  } finally {
    flushLock = false
  }
}

export function requestFlush() {
  if (flushLock) return
  bc?.postMessage('flush') // other tabs too
  void flush()
}

// Manual pull trigger
export function requestPull() {
  if (pullLock) return
  bc?.postMessage('pull') // other tabs too
  void pullUpdates().catch(console.error)
}

// expose a retry with override:
export async function retryWithOverride(conflictId: string) {
  const c = await db.conflicts.get(conflictId);
  if (!c) return false;
  // find the failed mutation that corresponds to this conflict
  const target = await db.queue_mutations
    .where({ entity: `app2.${c.entity}`, status: 'failed' })
    .filter(m => (m.payload?.id || m.payload?.session_id) === c.entity_id)
    .first();
  if (!target) return false;

  // reset status & add override marker the sender can pick up
  await db.queue_mutations.update(target.id, { 
    status: 'pending', 
    last_error_code: undefined, 
    last_error_at: undefined, 
    payload: { ...target.payload, override: true }
  });
  await deleteConflict(conflictId);
  await flush(); // existing orchestrator
  track({ type: 'conflict_resolved_keep_mine' as any });
  return true;
}

export async function acceptServerVersion(conflictId: string) {
  const c = await db.conflicts.get(conflictId);
  if (!c) return false;
  // overwrite local mirror with server snapshot and drop failed mutation(s)
  switch (c.entity) {
    case 'sessions': 
      if (c.server) await db.sessions.put(c.server); 
      break;
    case 'session_exercises': 
      if (c.server) await db.session_exercises.put(c.server); 
      break;
    case 'logged_sets': 
      if (c.server) await db.logged_sets.put(c.server); 
      break;
    case 'coach_audit': 
      /* nothing to mirror */ 
      break;
  }
  // delete any failed queued mutations against this entity
  await db.queue_mutations
    .where({ entity: `app2.${c.entity}`, status: 'failed' })
    .filter(m => (m.payload?.id || m.payload?.session_id) === c.entity_id)
    .delete();

  await deleteConflict(conflictId);
  track({ type: 'conflict_resolved_keep_server' as any });
  return true;
}

// Helper functions for common operations
export async function enqueueLoggedSet(payload: {
  id: string;
  session_exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  duration_sec?: number;
  notes?: string;
}): Promise<string> {
  return enqueue({
    entity: 'app2.logged_sets',
    op: 'insert',
    payload,
    idempotency_key: payload.id,
  });
}

export async function voidLoggedSet(setId: string, userId: string): Promise<string> {
  // Check if a void mutation for this set is already queued
  const existingVoid = await db.queue_mutations
    .where('[entity+op]')
    .equals(['logged_sets/void', 'void'])
    .and(mutation => {
      const payload = mutation.payload as { id?: string; voided?: boolean } | undefined
      return payload?.id === setId && 
             payload?.voided === true &&
             mutation.status === 'pending'
    })
    .first()

  if (existingVoid) {
    throw new Error('Void mutation already queued for this set')
  }

  return enqueue({
    entity: 'logged_sets/void',
    op: 'void',
    payload: { id: setId, voided: true },
    user_id: userId,
    idempotency_key: `void_${setId}`
  })
}

export async function enqueueSessionUpdate(payload: {
  id: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  updated_at?: string;
}): Promise<string> {
  return enqueue({
    entity: 'app2.sessions',
    op: 'update',
    payload,
    idempotency_key: `session-${payload.id}-${Date.now()}`,
  });
}

// Dead-Letter Queue Management Functions
export async function retryFailed(id: string): Promise<void> {
  const m = await db.queue_mutations.get(id) as QueueMutation | undefined
  if (!m || m.status !== 'failed') return
  
  await db.queue_mutations.update(id, { 
    status: 'pending', 
    last_error_code: undefined, 
    last_error_at: undefined 
  })
  await flush() // existing flush orchestrator
  track({ type: 'sync_failure', code: 'manual_retry' })
}

export async function retryAllFailed(): Promise<void> {
  const failed = await db.queue_mutations.where('status').equals('failed').toArray()
  await Promise.all(failed.map(m => db.queue_mutations.update(m.id, { 
    status: 'pending', 
    last_error_code: undefined, 
    last_error_at: undefined 
  })))
  await flush()
  track({ type: 'sync_failure', code: 'manual_retry_all' })
}

export async function deleteFailed(id: string): Promise<void> {
  await db.queue_mutations.delete(id)
  track({ type: 'sync_failure', code: 'manual_delete' })
}

export async function clearAllFailed(): Promise<void> {
  const count = await db.queue_mutations.where('status').equals('failed').count()
  await db.queue_mutations.where('status').equals('failed').delete()
  track({ type: 'sync_success', items: count })
}

// Broadcast listeners
bc?.addEventListener('message', (ev) => {
  if (ev.data === 'flush') void flush()
  if (ev.data === 'pull') void pullUpdates().catch(console.error)
})
