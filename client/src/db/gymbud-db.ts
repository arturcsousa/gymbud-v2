import Dexie, { Table } from 'dexie'
import { OnboardingState } from './onboarding-store'

export type QueueOp = 'insert' | 'update' | 'delete' | 'void'
export type QueueStatus = 'pending' | 'inflight' | 'failed' | 'done'

export interface MetaRow { key: string; value: any; updated_at: number }

export interface SyncEventRow {
  id?: number
  ts: number
  kind: 'success' | 'failure'
  code?: string
  items?: number
  type?: string
  data?: any
  created_at?: string
}

export interface QueueMutation {
  id: string
  entity: 'sessions' | 'session_exercises' | 'logged_sets' | 'coach_audit' | 'app2.logged_sets' | 'app2.sessions' | 'app2.session_exercises' | 'app2.coach_audit' | 'logged_sets/void'
  op: QueueOp
  payload: any                  // shape to send to server later
  user_id?: string
  idempotency_key?: string
  status: QueueStatus
  created_at: number
  attempts?: number             // # of send attempts
  last_error_code?: string      // from mapEdgeError
  last_error_at?: number        // ms timestamp
  // Legacy fields for backward compatibility
  retries?: number
  next_attempt_at?: number      // epoch ms
  updated_at?: number
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

export type AppSettings = {
  language: 'en' | 'pt-BR';
  units: 'metric' | 'imperial';
  notifications_opt_in: boolean;
  updated_at: number; // ms epoch
};

export type ConflictRecord = {
  id: string;               // `${entity}:${entity_id}`
  entity: 'sessions' | 'session_exercises' | 'logged_sets' | 'coach_audit';
  entity_id: string;
  op: 'insert' | 'update' | 'void';
  local: any;               // local snapshot we tried to push (or current Dexie row)
  server: any;              // latest from server
  diff?: Array<{ field: string; local: any; server: any }>;
  last_error_code?: string; // 'version_conflict', etc.
  first_seen_at: number;
  updated_at: number;
};

export class GymBudDB extends Dexie {
  meta!: Table<MetaRow, string>
  sync_events!: Table<SyncEventRow, number>
  queue_mutations!: Table<QueueMutation, string>
  sessions!: Table<SessionRow, string>
  session_exercises!: Table<SessionExerciseRow, string>
  logged_sets!: Table<LoggedSetRow, string>
  onboarding_state!: Table<OnboardingState, string>
  settings!: Table<{ key: string; value: any }, string>
  conflicts!: Table<ConflictRecord, string>

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

    // Add failure tracking fields and settings table in version 4
    this.version(4).stores({
      meta: 'key, updated_at',
      sync_events: '++id, ts',
      queue_mutations:
        'id, entity, op, created_at, status, attempts, last_error_code, last_error_at',
      sessions:
        'id, user_id, plan_id, status, started_at, completed_at, updated_at, [user_id+started_at]',
      session_exercises:
        'id, session_id, order_index, updated_at, [session_id+order_index]',
      logged_sets:
        'id, session_exercise_id, set_number, updated_at, [session_exercise_id+set_number]',
      onboarding_state: 'user_id, updated_at',
      settings: 'key' // single-row KV
    })

    // Add conflicts store in version 5
    this.version(5).stores({
      meta: 'key, updated_at',
      sync_events: '++id, ts',
      queue_mutations:
        'id, entity, op, created_at, status, attempts, last_error_code, last_error_at',
      sessions:
        'id, user_id, plan_id, status, started_at, completed_at, updated_at, [user_id+started_at]',
      session_exercises:
        'id, session_id, order_index, updated_at, [session_id+order_index]',
      logged_sets:
        'id, session_exercise_id, set_number, updated_at, [session_exercise_id+set_number]',
      onboarding_state: 'user_id, updated_at',
      settings: 'key',
      conflicts: 'id, entity, entity_id, first_seen_at'
    })
  }
}

export const db = new GymBudDB()

export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.get('app');
  if (row) return row.value as AppSettings;
  const def: AppSettings = { language: 'en', units: 'metric', notifications_opt_in: false, updated_at: Date.now() };
  await db.settings.put({ key: 'app', value: def });
  return def;
}

export async function setSettings(s: Partial<AppSettings>) {
  const cur = await getSettings();
  const next = { ...cur, ...s, updated_at: Date.now() } as AppSettings;
  await db.settings.put({ key: 'app', value: next });
  return next;
}
