import { db, type QueueMutation, type QueueOp, type SyncEventRow } from '@/db/gymbud-db'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { mapEdgeError, type ErrorCode } from '@/lib/errors/mapEdgeError'

let flushLock = false
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

    if (batch.length === 0) return

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

// Broadcast listeners
bc?.addEventListener('message', (ev) => {
  if (ev.data === 'flush') void flush()
})
