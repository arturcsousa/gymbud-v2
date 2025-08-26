import { useEffect, useState } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useTranslation } from 'react-i18next'

import { supabase } from '@/lib/supabase'
import { dataManager } from '@/app/db/indexeddb'
import { syncEngine, SyncStatus } from '@/app/sync/engine'

import { AuthGuard } from '@/app/components/AuthGuard'
import { OfflineIndicator } from '@/app/components/OfflineIndicator'
import { AppHeader } from '@/app/components/AppHeader'
import { ConflictBanner } from '@/app/components/ConflictBanner'

// Pages
import { HomePage } from '@/app/pages/HomePage'
import { SessionPage } from '@/app/pages/SessionPage'
import { HistoryPage } from '@/app/pages/HistoryPage'
import { HistoryDetailPage } from '@/app/pages/HistoryDetailPage'
import { LibraryPage } from '@/app/pages/LibraryPage'
import { SettingsPage } from '@/app/pages/SettingsPage'
import { AuthPage } from '@/app/pages/AuthPage'
import { NotFoundPage } from '@/app/pages/NotFoundPage'

// Create persisted query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'gymbud-query-cache',
})

// Persist query client
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
})

export function AppShell() {
  const { t } = useTranslation(['app', 'common'])
  const [location] = useLocation()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncEngine.getStatus())
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Auth state management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      dataManager.setUserId(session?.user?.id ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        dataManager.setUserId(session?.user?.id ?? null)
        
        if (event === 'SIGNED_IN') {
          // Trigger sync when user signs in
          syncEngine.forcSync()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sync status subscription
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe(setSyncStatus)
    return unsubscribe
  }, [])

  // Network status for TanStack Query
  useEffect(() => {
    queryClient.getQueryCache().subscribe(() => {
      queryClient.setDefaultOptions({
        queries: {
          networkMode: syncStatus.isOnline ? 'online' : 'offlineFirst',
        },
        mutations: {
          networkMode: syncStatus.isOnline ? 'online' : 'offlineFirst',
        },
      })
    })
  }, [syncStatus.isOnline])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Offline indicator */}
        <OfflineIndicator status={syncStatus} />
        
        {/* Conflict resolution banner */}
        <ConflictBanner />
        
        {/* App header (only show when authenticated and not on auth pages) */}
        {user && !location.startsWith('/auth') && (
          <AppHeader user={user} syncStatus={syncStatus} />
        )}

        {/* Main content */}
        <main className={user && !location.startsWith('/auth') ? 'pt-16' : ''}>
          <Switch>
            {/* Auth routes */}
            <Route path="/auth/:action?" component={AuthPage} />
            
            {/* Protected app routes */}
            <AuthGuard user={user}>
              <Route path="/" component={HomePage} />
              <Route path="/session/:id" component={SessionPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/history/:id" component={HistoryDetailPage} />
              <Route path="/library" component={LibraryPage} />
              <Route path="/settings" component={SettingsPage} />
            </AuthGuard>
            
            {/* 404 fallback */}
            <Route component={NotFoundPage} />
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  )
}
