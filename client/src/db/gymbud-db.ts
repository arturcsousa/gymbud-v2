import Dexie, { Table } from 'dexie'
import { OnboardingState } from './onboarding-store'

export type QueueOp = 'insert' | 'update' | 'delete' | 'void'
export type QueueStatus = 'queued' | 'processing' | 'done' | 'error'

export interface MetaRow { key: string; value: any; updated_at: number }

export interface SyncEventRow {
  id?: number
  ts: number
  kind: 'success' | 'failure'
  code?: string
  items?: number
}

export interface QueueMutation {
  id: string
  entity: string                // e.g., 'app2.logged_sets'
  op: QueueOp
  payload: any                  // shape to send to server later
  user_id?: string
  idempotency_key?: string
  status: QueueStatus
  retries: number
  next_attempt_at: number       // epoch ms
  created_at: number
  updated_at: number
}

export interface SessionRow {
  id: string
  user_id: string
  plan_id: string | null
  status: 'draft' | 'active' | 'completed'
  started_at: string | null
  completed_at: string | null
  notes?: string | null
  updated_at: number
}

export interface SessionExerciseRow {
  id: string
  session_id: string
  exercise_name: string
  order_index: number
  updated_at: number
}

export interface LoggedSetRow {
  id: string
  session_exercise_id: string
  set_number: number
  reps?: number | null
  weight?: number | null
  rpe?: number | null
  notes?: string | null
  voided?: boolean
  meta?: Record<string, any> | null
  updated_at: number
}

export class GymBudDB extends Dexie {
  meta!: Table<MetaRow, string>
  sync_events!: Table<SyncEventRow, number>
  queue_mutations!: Table<QueueMutation, string>
  sessions!: Table<SessionRow, string>
  session_exercises!: Table<SessionExerciseRow, string>
  logged_sets!: Table<LoggedSetRow, string>
  onboarding_state!: Table<OnboardingState, string>

  constructor() {
    super('gymbud')
    this.version(1).stores({
      // primary key first, then indexes/compounds
      meta: 'key, updated_at',
      queue_mutations:
        'id, status, next_attempt_at, created_at, entity, [status+next_attempt_at]',
      sessions:
        'id, user_id, plan_id, status, started_at, completed_at, updated_at, [user_id+started_at]',
      session_exercises:
        'id, session_id, order_index, updated_at, [session_id+order_index]',
      logged_sets:
        'id, session_exercise_id, set_number, updated_at, [session_exercise_id+set_number]'
    })
    
    // Add sync_events table in version 2
    this.version(2).stores({
      meta: 'key, updated_at',
      sync_events: '++id, ts',
      queue_mutations:
        'id, status, next_attempt_at, created_at, entity, [status+next_attempt_at]',
      sessions:
        'id, user_id, plan_id, status, started_at, completed_at, updated_at, [user_id+started_at]',
      session_exercises:
        'id, session_id, order_index, updated_at, [session_id+order_index]',
      logged_sets:
        'id, session_exercise_id, set_number, updated_at, [session_exercise_id+set_number]'
    })

    // Add onboarding_state table in version 3
    this.version(3).stores({
      meta: 'key, updated_at',
      sync_events: '++id, ts',
      queue_mutations:
        'id, status, next_attempt_at, created_at, entity, [status+next_attempt_at]',
      sessions:
        'id, user_id, plan_id, status, started_at, completed_at, updated_at, [user_id+started_at]',
      session_exercises:
        'id, session_id, order_index, updated_at, [session_id+order_index]',
      logged_sets:
        'id, session_exercise_id, set_number, updated_at, [session_exercise_id+set_number]',
      onboarding_state: 'user_id, updated_at'
    })
  }
}

export const db = new GymBudDB()
