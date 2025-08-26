import { useEffect, useState, ReactNode } from 'react'
import { Route, Switch } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

import { supabase } from '@/lib/supabase'
import { GradientLayout } from '@/app/components/GradientLayout'

import { AuthGuard } from '@/app/components/AuthGuard'
import { OfflineIndicator } from '@/app/components/OfflineIndicator'
import { ConflictBanner } from '@/app/components/ConflictBanner'

// Pages
import AuthPage from '@/app/pages/AuthPage'
import HomePage from '@/app/pages/HomePage'
import SessionPage from '@/app/pages/SessionPage'
import HistoryPage from '@/app/pages/HistoryPage'
import HistoryDetailPage from '@/app/pages/HistoryDetailPage'
import { LibraryPage } from '@/app/pages/LibraryPage'
import SettingsPage from '@/app/pages/SettingsPage'
import NotFoundPage from '@/app/pages/NotFoundPage'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Setup persistence (commented out for now to avoid build issues)
// const persister = createSyncStoragePersister({
//   storage: window.localStorage,
// })
// persistQueryClient({
//   queryClient,
//   persister,
// })

interface AppShellProps {
  children?: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Auth state management
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <GradientLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </GradientLayout>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GradientLayout>
        {/* Offline indicator */}
        <OfflineIndicator />
        
        {/* Conflict resolution banner */}
        <ConflictBanner />

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {children || (
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
          )}
        </div>
      </GradientLayout>
    </QueryClientProvider>
  )
}
