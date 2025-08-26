import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

interface Session {
  id: string
  name: string
  date: string
  status: 'completed' | 'in_progress' | 'planned'
  duration?: number
  exercises?: number
  sets?: number
}

function HistoryPage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Load mock sessions for now
        const mockSessions: Session[] = [
          {
            id: '1',
            name: 'Push Day',
            date: '2025-01-25',
            status: 'completed',
            duration: 45,
            exercises: 6,
            sets: 18
          },
          {
            id: '2', 
            name: 'Pull Day',
            date: '2025-01-23',
            status: 'completed',
            duration: 50,
            exercises: 5,
            sets: 15
          },
          {
            id: '3',
            name: 'Leg Day',
            date: '2025-01-21',
            status: 'completed', 
            duration: 60,
            exercises: 7,
            sets: 21
          }
        ]
        setSessions(mockSessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    setLocation('/')
  }

  const handleViewSession = (sessionId: string) => {
    setLocation(`/history/${sessionId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'planned':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-white/20 text-white border-white/30'
    }
  }

  if (loading) {
    return (
      <ContentLayout title={t('app:nav.history')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </ContentLayout>
    )
  }

  // Calculate stats
  const totalWorkouts = sessions.filter(s => s.status === 'completed').length
  const avgDuration = sessions
    .filter(s => s.status === 'completed' && s.duration)
    .reduce((acc: number, s) => acc + (s.duration || 0), 0) / totalWorkouts || 0
  const totalExercises = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc: number, s) => acc + (s.exercises || 0), 0)
  const totalSets = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc: number, s) => acc + (s.sets || 0), 0)

  return (
    <ContentLayout
      title={t('app:nav.history')}
      showNavigation={true}
      onBack={handleBackToHome}
      backLabel={t('app:nav.home')}
      nextLabel=""
      onNext={() => {}}
    >
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:history.stats')}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalWorkouts}</div>
              <div className="text-white/70 text-sm">{t('app:history.totalWorkouts')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{Math.round(avgDuration)}m</div>
              <div className="text-white/70 text-sm">{t('app:history.avgDuration')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalExercises}</div>
              <div className="text-white/70 text-sm">{t('app:history.totalExercises')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalSets}</div>
              <div className="text-white/70 text-sm">{t('app:history.totalSets')}</div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleViewSession(session.id)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {session.name}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {new Date(session.date).toLocaleDateString()}
                  </p>
                </div>
                
                <Badge className={getStatusColor(session.status)}>
                  {t(`app:history.status.${session.status}`)}
                </Badge>
              </div>

              {session.status === 'completed' && (
                <div className="flex items-center justify-between text-white/80 text-sm">
                  <span>{session.duration}m</span>
                  <span>{session.exercises} {t('app:history.exercises')}</span>
                  <span>{session.sets} {t('app:history.sets')}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center">
            <div className="text-white/70 mb-4">
              {t('app:history.noSessions')}
            </div>
            <Button
              onClick={handleBackToHome}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-xl"
            >
              {t('app:history.startFirst')}
            </Button>
          </div>
        )}
      </div>
    </ContentLayout>
  )
}

export { HistoryPage as default }
export { HistoryPage }
