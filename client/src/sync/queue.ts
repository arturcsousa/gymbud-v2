import { db, type QueueMutation, type QueueOp, type SyncEventRow } from '@/db/gymbud-db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { mapEdgeError, type ErrorCode } from '@/lib/errors/mapEdgeError'

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
    entity: opts.entity,
    op: opts.op,
    payload: opts.payload,
    user_id: opts.user_id,
    idempotency_key: opts.idempotency_key ?? id,
    status: 'queued',
    retries: 0,
    next_attempt_at: now,
    created_at: now,
    updated_at: now,
  }
  await db.queue_mutations.add(row)
  bc?.postMessage('queue-change')
  return id
}

export async function pendingCount(): Promise<number> {
  return db.queue_mutations.where('status').equals('queued').count()
}

async function sendToServer(m: QueueMutation): Promise<void> {
  if (m.entity === 'app2.logged_sets' && m.op === 'insert') {
    // Ensure the row uses the queue id as the primary key for idempotency
    const payload = { id: m.id, ...m.payload }

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
    const payload = { id: m.id, ...m.payload }

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
    const payload = { id: m.id, ...m.payload }

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
    const payload = { id: m.id, ...m.payload }

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
}

function backoffDelay(retries: number) {
  const base = Math.min(60, 2 ** retries) // seconds, capped at 60s
  return base * 1000
}

// Helper function to cap sync events to last 50
async function addSyncEvent(event: Omit<SyncEventRow, 'id'>): Promise<void> {
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

// Check if row has pending local mutations
async function hasPendingMutation(entity: string, rowId: string): Promise<boolean> {
  const count = await db.queue_mutations
    .where('[entity+payload.id+status]')
    .between([entity, rowId, 'queued'], [entity, rowId, 'queued'])
    .count()
  return count > 0
}

// Safe merge server data with local data
async function safeMergeRow(entity: string, serverRow: any): Promise<void> {
  const tableName = entity.replace('app2.', '') as 'sessions' | 'session_exercises' | 'logged_sets'
  const table = db[tableName]
  
  if (!table) return
  
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

// Pull fresh data from server
async function pullUpdates(): Promise<void> {
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
      .where('[status+next_attempt_at]')
      .between(['queued', 0], ['queued', now])
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
      // optimistic "processing" mark
      await db.queue_mutations.update(m.id, { status: 'processing', updated_at: Date.now() })
      try {
        await sendToServer(m) // will throw for now
        await db.queue_mutations.update(m.id, { status: 'done', updated_at: Date.now() })
        successCount++
      } catch (err) {
        const mappedError = mapEdgeError(err)
        lastErrorCode = mappedError.code
        
        const retries = (m.retries ?? 0) + 1
        const next = Date.now() + backoffDelay(retries)
        await db.queue_mutations.update(m.id, {
          status: 'queued',
          retries,
          next_attempt_at: next,
          updated_at: Date.now(),
        })
        failureCount++
        // Don't spam; console is fine in dev
        console.warn('[sync] retry scheduled', { id: m.id, retries, error: mappedError.code })
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
      
      toast.success(i18n.t('app.sync.success'), {
        description: i18n.t('app.sync.success_detail'),
      })
    } else if (failureCount > 0) {
      await updateMeta('last_sync_status', 'failure')
      await updateMeta('last_sync_error_code', lastErrorCode)
      await addSyncEvent({ ts: now, kind: 'failure', code: lastErrorCode || 'unknown' })
      
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

// Single-flight, cross-tab trigger
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

export async function enqueueLoggedSetVoid(setId: string, userId: string) {
  // Check if a void mutation for this set is already queued
  const existingVoid = await db.queue_mutations
    .where(['entity', 'op'])
    .equals(['app2.logged_sets', 'update'])
    .and(mutation => 
      mutation.payload?.id === setId && 
      mutation.payload?.voided === true &&
      mutation.status === 'queued'
    )
    .first()

  if (existingVoid) {
    // Already queued, skip duplicate
    return existingVoid
  }

  const mutation: QueueMutation = {
    id: crypto.randomUUID(),
    entity: 'app2.logged_sets',
    op: 'update',
    payload: { id: setId, voided: true },
    user_id: userId,
    idempotency_key: `void_${setId}`,
    status: 'queued',
    retries: 0,
    next_attempt_at: Date.now(),
    created_at: Date.now(),
    updated_at: Date.now()
  }
  
  await db.queue_mutations.add(mutation)
  return mutation
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

// Broadcast listeners
bc?.addEventListener('message', (ev) => {
  if (ev.data === 'flush') void flush()
  if (ev.data === 'pull') void pullUpdates().catch(console.error)
})
