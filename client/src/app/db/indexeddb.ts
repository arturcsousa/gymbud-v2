import Dexie, { Table } from 'dexie'

// Database schema interfaces
export interface Profile {
  id: string
  data: Record<string, any>
  updated_at: string
  client_updated_at?: string
}

export interface Plan {
  id: string
  user_id: string
  data: Record<string, any>
  updated_at: string
  client_updated_at?: string
}

export interface Session {
  id: string
  user_id: string
  date: string
  status: 'planned' | 'in_progress' | 'completed' | 'skipped'
  data: Record<string, any>
  updated_at: string
  client_updated_at?: string
}

export interface SessionExercise {
  id: string
  session_id: string
  data: Record<string, any>
  updated_at: string
  client_updated_at?: string
}

export interface LoggedSet {
  id: string
  session_exercise_id: string
  reps?: number
  weight?: number
  rpe?: number
  duration?: number
  notes?: string
  updated_at: string
  client_updated_at?: string
}

export interface MutationQueueItem {
  op_id: string
  entity: string
  pk: string
  op: 'insert' | 'update' | 'delete'
  payload: Record<string, any>
  ts: string
  committed_at?: string
  error?: string
  user_id: string
}

// Dexie database class
export class GymBudDB extends Dexie {
  profiles!: Table<Profile>
  plans!: Table<Plan>
  sessions!: Table<Session>
  session_exercises!: Table<SessionExercise>
  logged_sets!: Table<LoggedSet>
  mutation_queue!: Table<MutationQueueItem>

  constructor() {
    super('GymBudDB')
    this.version(1).stores({
      profiles: 'id, updated_at',
      plans: 'id, user_id, updated_at',
      sessions: 'id, user_id, date, status, updated_at',
      session_exercises: 'id, session_id, updated_at',
      logged_sets: 'id, session_exercise_id, updated_at',
      mutation_queue: 'op_id, entity, pk, ts, user_id, committed_at'
    })
  }
}

// Database instance
export const db = new GymBudDB()

// CRUD helpers that write-through to IndexedDB first
export class OfflineDataManager {
  private userId: string | null = null

  setUserId(userId: string | null) {
    this.userId = userId
  }

  private generateId(): string {
    return crypto.randomUUID()
  }

  private generateTimestamp(): string {
    return new Date().toISOString()
  }

  // Enqueue mutation for sync
  private async enqueueMutation(
    entity: string,
    pk: string,
    op: 'insert' | 'update' | 'delete',
    payload: Record<string, any>
  ) {
    if (!this.userId) throw new Error('User not authenticated')
    
    const mutation: MutationQueueItem = {
      op_id: this.generateId(),
      entity,
      pk,
      op,
      payload,
      ts: this.generateTimestamp(),
      user_id: this.userId
    }

    await db.mutation_queue.add(mutation)
    return mutation
  }

  // Profile operations
  async getProfile(id: string): Promise<Profile | undefined> {
    return db.profiles.get(id)
  }

  async upsertProfile(data: Omit<Profile, 'id' | 'updated_at' | 'client_updated_at'>): Promise<Profile> {
    const now = this.generateTimestamp()
    const profile: Profile = {
      id: this.generateId(),
      ...data,
      updated_at: now,
      client_updated_at: now
    }

    await db.profiles.put(profile)
    return profile
  }

  // Session operations
  async getSessions(userId: string, limit = 50): Promise<Session[]> {
    return db.sessions
      .where('user_id')
      .equals(userId)
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray()
  }

  async getSession(id: string): Promise<Session | undefined> {
    return db.sessions.get(id)
  }

  async createSession(data: Omit<Session, 'id' | 'updated_at' | 'client_updated_at'>): Promise<Session> {
    const now = this.generateTimestamp()
    const session: Session = {
      id: this.generateId(),
      ...data,
      updated_at: now,
      client_updated_at: now
    }

    await db.sessions.add(session)
    await this.enqueueMutation('sessions', session.id, 'insert', session)
    return session
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const existing = await db.sessions.get(id)
    if (!existing) throw new Error('Session not found')

    const now = this.generateTimestamp()
    const updated: Session = {
      ...existing,
      ...updates,
      updated_at: now,
      client_updated_at: now
    }

    await db.sessions.put(updated)
    await this.enqueueMutation('sessions', id, 'update', updated)
    return updated
  }

  // Logged sets operations
  async getLoggedSets(sessionExerciseId: string): Promise<LoggedSet[]> {
    return db.logged_sets
      .where('session_exercise_id')
      .equals(sessionExerciseId)
      .toArray()
  }

  async createLoggedSet(data: Omit<LoggedSet, 'id' | 'updated_at' | 'client_updated_at'>): Promise<LoggedSet> {
    const now = this.generateTimestamp()
    const loggedSet: LoggedSet = {
      id: this.generateId(),
      ...data,
      updated_at: now,
      client_updated_at: now
    }

    await db.logged_sets.add(loggedSet)
    await this.enqueueMutation('logged_sets', loggedSet.id, 'insert', loggedSet)
    return loggedSet
  }

  async updateLoggedSet(id: string, updates: Partial<LoggedSet>): Promise<LoggedSet> {
    const existing = await db.logged_sets.get(id)
    if (!existing) throw new Error('Logged set not found')

    const now = this.generateTimestamp()
    const updated: LoggedSet = {
      ...existing,
      ...updates,
      updated_at: now,
      client_updated_at: now
    }

    await db.logged_sets.put(updated)
    await this.enqueueMutation('logged_sets', id, 'update', updated)
    return updated
  }

  async deleteLoggedSet(id: string): Promise<void> {
    await db.logged_sets.delete(id)
    await this.enqueueMutation('logged_sets', id, 'delete', {})
  }

  // Queue operations
  async getPendingMutations(): Promise<MutationQueueItem[]> {
    if (!this.userId) return []
    
    return db.mutation_queue
      .where('user_id')
      .equals(this.userId)
      .and(item => !item.committed_at)
      .toArray()
  }

  async markMutationCommitted(opId: string): Promise<void> {
    await db.mutation_queue.update(opId, {
      committed_at: this.generateTimestamp()
    })
  }

  async markMutationError(opId: string, error: string): Promise<void> {
    await db.mutation_queue.update(opId, { error })
  }

  async clearCommittedMutations(): Promise<void> {
    if (!this.userId) return
    
    await db.mutation_queue
      .where('user_id')
      .equals(this.userId)
      .and(item => !!item.committed_at)
      .delete()
  }
}

// Global instance
export const dataManager = new OfflineDataManager()
