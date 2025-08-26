import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, Calendar, TrendingUp, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dataManager, Session } from '@/app/db/indexeddb'
import { supabase } from '@/lib/supabase'

export function HomePage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [todaySession, setTodaySession] = useState<Session | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUser(session.user)

      // Get today's session
      const today = new Date().toISOString().split('T')[0]
      const sessions = await dataManager.getSessions(session.user.id, 10)
      
      const todaySessionData = sessions.find(s => s.date.startsWith(today))
      setTodaySession(todaySessionData || null)

      // Get recent sessions (excluding today)
      const recent = sessions
        .filter(s => !s.date.startsWith(today))
        .slice(0, 5)
      setRecentSessions(recent)

    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (todaySession) {
      setLocation(`/session/${todaySession.id}`)
    } else {
      // Create new session
      try {
        const today = new Date().toISOString().split('T')[0]
        const newSession = await dataManager.createSession({
          user_id: user.id,
          date: today,
          status: 'in_progress',
          data: {
            started_at: new Date().toISOString(),
            exercises: []
          }
        })
        setLocation(`/session/${newSession.id}`)
      } catch (error) {
        console.error('Error creating session:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getStatusBadge = (status: Session['status']) => {
    const variants = {
      planned: 'secondary',
      in_progress: 'default',
      completed: 'success',
      skipped: 'destructive'
    } as const

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`app:session.status.${status}`)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('app:home.welcome')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('app:home.subtitle')}
        </p>
      </div>

      {/* Today's session card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('app:home.todaySession')}
              </CardTitle>
              <CardDescription>
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).format(new Date())}
              </CardDescription>
            </div>
            {todaySession && getStatusBadge(todaySession.status)}
          </div>
        </CardHeader>
        <CardContent className="relative">
          {todaySession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {todaySession.data?.name || t('app:session.workout')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {todaySession.data?.exercises?.length || 0} {t('app:session.exercises')}
                  </p>
                </div>
                <Button onClick={handleStartSession} className="gap-2">
                  <Play className="h-4 w-4" />
                  {todaySession.status === 'completed' 
                    ? t('app:session.view')
                    : t('app:session.continue')
                  }
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">{t('app:home.noSessionToday')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('app:home.readyToStart')}
              </p>
              <Button onClick={handleStartSession} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                {t('app:home.startSession')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('app:home.recentSessions')}
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/history')}
            >
              {t('app:home.viewAll')}
            </Button>
          </div>
          
          <div className="grid gap-3">
            {recentSessions.map((session) => (
              <Card 
                key={session.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setLocation(`/history/${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {session.data?.name || t('app:session.workout')}
                        </p>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.date)} • {session.data?.exercises?.length || 0} {t('app:session.exercises')}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {session.data?.duration && (
                        <p>{Math.round(session.data.duration / 60)}min</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => setLocation('/history')}
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm">{t('app:nav.history')}</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-20 flex-col gap-2"
          onClick={() => setLocation('/library')}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-sm">{t('app:nav.library')}</span>
        </Button>
      </div>
    </div>
  )
}
