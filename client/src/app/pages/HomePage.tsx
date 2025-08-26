import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, Calendar, TrendingUp, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Session {
  id: string
  status: 'draft' | 'active' | 'completed'
  started_at?: string
  completed_at?: string
  notes?: string
}

function HomePage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [todaySession, setTodaySession] = useState<Session | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Placeholder for loading today's session and recent sessions
      // This would normally fetch from IndexedDB via dataManager
      setTodaySession(null)
      setRecentSessions([])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewSession = () => {
    // Generate a new session ID and navigate to it
    const sessionId = Date.now().toString()
    setLocation(`/session/${sessionId}`)
  }

  const continueSession = (sessionId: string) => {
    setLocation(`/session/${sessionId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('app:home.welcome')}</h1>
        <p className="text-muted-foreground">{t('app:home.subtitle')}</p>
      </div>

      {/* Today's Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5" />
            <span>{t('app:home.todayWorkout')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySession ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('app:home.continueWorkout')}</p>
                <p className="text-sm text-muted-foreground">
                  {todaySession.started_at && 
                    `Started ${new Date(todaySession.started_at).toLocaleTimeString()}`
                  }
                </p>
              </div>
              <Button onClick={() => continueSession(todaySession.id)}>
                <Play className="h-4 w-4 mr-2" />
                {t('app:home.continue')}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t('app:home.noWorkoutToday')}</p>
              <Button onClick={startNewSession}>
                <Play className="h-4 w-4 mr-2" />
                {t('app:home.startWorkout')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{t('app:home.stats.thisWeek')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t('app:home.stats.workouts')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>{t('app:home.stats.streak')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t('app:home.stats.days')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('app:home.stats.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{t('app:home.stats.workouts')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('app:home.recentSessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('app:home.noRecentSessions')}
            </p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {session.completed_at && new Date(session.completed_at).toLocaleDateString()}
                    </p>
                    <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => continueSession(session.id)}>
                    {t('app:home.view')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { HomePage as default }
