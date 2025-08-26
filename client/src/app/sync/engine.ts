import { supabase } from '@/lib/supabase'
import { dataManager, MutationQueueItem } from '@/app/db/indexeddb'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncTime: string | null
  pendingMutations: number
  error: string | null
}

export class SyncEngine {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: localStorage.getItem('lastSyncTime'),
    pendingMutations: 0,
    error: null
  }

  private listeners: ((status: SyncStatus) => void)[] = []
  private syncInterval: number | null = null
  private retryTimeouts: Map<string, number> = new Map()

  constructor() {
    this.setupNetworkListeners()
    this.setupPeriodicSync()
    this.updatePendingCount()
  }

  // Status management
  getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates }
    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  private async updatePendingCount() {
    const pending = await dataManager.getPendingMutations()
    this.updateStatus({ pendingMutations: pending.length })
  }

  // Network detection
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true, error: null })
      this.replayQueue()
    })

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false })
    })
  }

  // Periodic sync setup
  private setupPeriodicSync() {
    const intervalSec = parseInt(import.meta.env.VITE_SYNC_INTERVAL_SEC || '900')
    
    this.syncInterval = window.setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.replayQueue()
      }
    }, intervalSec * 1000)

    // Background sync registration (if supported)
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-queue')
      }).catch(console.warn)
    }
  }

  // Queue operations
  async enqueue(
    entity: string,
    pk: string,
    op: 'insert' | 'update' | 'delete',
    payload: Record<string, any>
  ) {
    // This is handled by dataManager.enqueueMutation internally
    await this.updatePendingCount()
    
    // Try immediate sync if online
    if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
      this.replayQueue()
    }
  }

  async replayQueue(): Promise<void> {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return
    }

    this.updateStatus({ isSyncing: true, error: null })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }

      const mutations = await dataManager.getPendingMutations()
      
      for (const mutation of mutations) {
        await this.processMutation(mutation)
      }

      // Clean up committed mutations
      await dataManager.clearCommittedMutations()
      
      this.updateStatus({
        lastSyncTime: new Date().toISOString(),
        error: null
      })
      
      localStorage.setItem('lastSyncTime', this.syncStatus.lastSyncTime!)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      
      // Handle auth errors specially
      if (errorMessage.includes('auth') || errorMessage.includes('401') || errorMessage.includes('403')) {
        this.updateStatus({ error: 'Authentication required. Please sign in again.' })
        // Pause queue processing until re-auth
        return
      }
      
      this.updateStatus({ error: errorMessage })
      console.error('Sync error:', error)
    } finally {
      this.updateStatus({ isSyncing: false })
      await this.updatePendingCount()
    }
  }

  private async processMutation(mutation: MutationQueueItem): Promise<void> {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    try {
      await this.executeMutation(mutation)
      await dataManager.markMutationCommitted(mutation.op_id)
      
      // Clear any retry timeout
      const timeoutId = this.retryTimeouts.get(mutation.op_id)
      if (timeoutId) {
        clearTimeout(timeoutId)
        this.retryTimeouts.delete(mutation.op_id)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if this is a retryable error
      if (this.isRetryableError(error)) {
        const retryCount = mutation.error ? parseInt(mutation.error.split(':')[1] || '0') : 0
        
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount) // Exponential backoff
          const newError = `retry:${retryCount + 1}:${errorMessage}`
          
          await dataManager.markMutationError(mutation.op_id, newError)
          
          // Schedule retry
          const timeoutId = window.setTimeout(() => {
            this.retryTimeouts.delete(mutation.op_id)
            this.processMutation({ ...mutation, error: newError })
          }, delay)
          
          this.retryTimeouts.set(mutation.op_id, timeoutId)
        } else {
          // Max retries exceeded
          await dataManager.markMutationError(mutation.op_id, `failed:${errorMessage}`)
        }
      } else {
        // Non-retryable error
        await dataManager.markMutationError(mutation.op_id, `failed:${errorMessage}`)
      }
      
      throw error
    }
  }

  private async executeMutation(mutation: MutationQueueItem): Promise<void> {
    const { entity, op, payload, pk } = mutation

    switch (entity) {
      case 'profiles':
        await this.syncProfile(op, payload, pk)
        break
      case 'sessions':
        await this.syncSession(op, payload, pk)
        break
      case 'logged_sets':
        await this.syncLoggedSet(op, payload, pk)
        break
      default:
        throw new Error(`Unknown entity type: ${entity}`)
    }
  }

  private async syncProfile(op: string, payload: any, pk: string): Promise<void> {
    switch (op) {
      case 'insert':
      case 'update':
        const { error } = await supabase
          .from('profiles')
          .upsert(payload)
        if (error) throw error
        break
      case 'delete':
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', pk)
        if (deleteError) throw deleteError
        break
    }
  }

  private async syncSession(op: string, payload: any, pk: string): Promise<void> {
    switch (op) {
      case 'insert':
      case 'update':
        const { error } = await supabase
          .from('sessions')
          .upsert(payload)
        if (error) throw error
        break
      case 'delete':
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('id', pk)
        if (deleteError) throw deleteError
        break
    }
  }

  private async syncLoggedSet(op: string, payload: any, pk: string): Promise<void> {
    switch (op) {
      case 'insert':
      case 'update':
        const { error } = await supabase
          .from('logged_sets')
          .upsert(payload)
        if (error) throw error
        break
      case 'delete':
        const { error: deleteError } = await supabase
          .from('logged_sets')
          .delete()
          .eq('id', pk)
        if (deleteError) throw deleteError
        break
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false
    
    const message = error.message?.toLowerCase() || ''
    const status = error.status || error.code
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) return true
    
    // Temporary server errors
    if (status >= 500 && status < 600) return true
    if (status === 429) return true // Rate limiting
    
    // Auth errors are not retryable (need user intervention)
    if (status === 401 || status === 403) return false
    
    return false
  }

  // Conflict resolution
  async reconcile(entity: string, incoming: any): Promise<any> {
    // Default policy: Last-Write-Wins comparing ISO timestamps
    // Tie goes to server
    
    const local = await this.getLocalEntity(entity, incoming.id)
    if (!local) return incoming
    
    const serverTime = new Date(incoming.updated_at).getTime()
    const clientTime = new Date(local.client_updated_at || local.updated_at).getTime()
    
    if (serverTime >= clientTime) {
      return incoming // Server wins
    } else {
      return local // Client wins
    }
  }

  private async getLocalEntity(entity: string, id: string): Promise<any> {
    switch (entity) {
      case 'profiles':
        return dataManager.getProfile(id)
      case 'sessions':
        return dataManager.getSession(id)
      default:
        return null
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    await this.replayQueue()
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.retryTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    this.retryTimeouts.clear()
    
    this.listeners.length = 0
  }
}

// Global sync engine instance
export const syncEngine = new SyncEngine()
