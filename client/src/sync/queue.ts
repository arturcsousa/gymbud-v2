import { db, type QueueMutation, type QueueOp } from '@/db/gymbud-db'

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

// Placeholder sender – to be implemented in Step 3 (Supabase/EF writes)
async function sendToServer(_m: QueueMutation): Promise<void> {
  // NOTE: Intentionally not implemented yet; we'll wire this to Edge Functions next step.
  // Throw to trigger backoff while keeping mutations pending.
  throw new Error('SEND_NOT_IMPLEMENTED')
}

function backoffDelay(retries: number) {
  const base = Math.min(60, 2 ** retries) // seconds, capped at 60s
  return base * 1000
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

    for (const m of batch) {
      // optimistic "processing" mark
      await db.queue_mutations.update(m.id, { status: 'processing', updated_at: Date.now() })
      try {
        await sendToServer(m) // will throw for now
        await db.queue_mutations.update(m.id, { status: 'done', updated_at: Date.now() })
      } catch (err) {
        const retries = (m.retries ?? 0) + 1
        const next = Date.now() + backoffDelay(retries)
        await db.queue_mutations.update(m.id, {
          status: 'queued',
          retries,
          next_attempt_at: next,
          updated_at: Date.now(),
        })
        // Don't spam; console is fine in dev
        console.warn('[sync] retry scheduled', { id: m.id, retries })
      }
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
