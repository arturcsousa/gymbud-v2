import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

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
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          background: '#005870', // PALETTE.deepTeal
        }}
      >
        {/* Main teal gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
          }}
        />
        
        {/* Subtle lighter teal curved section with diagonal clip */}
        <div 
          className="absolute top-0 right-0 w-2/3 h-full"
          style={{
            background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Main content */}
        <div className="min-h-screen grid place-items-center py-4 relative z-10">
          <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">Loading...</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Calculate stats
  const totalWorkouts = sessions.filter(s => s.status === 'completed').length
  const avgDuration = sessions
    .filter(s => s.status === 'completed' && s.duration)
    .reduce((acc: number, s) => acc + (s.duration || 0), 0) / totalWorkouts || 0
  const totalSets = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc: number, s) => acc + (s.sets || 0), 0)

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20"
      style={{
        background: '#005870', // PALETTE.deepTeal
      }}
    >
      {/* Main teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      {/* Subtle lighter teal curved section with diagonal clip */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Main content */}
      <div className="min-h-screen grid place-items-center py-4 relative z-10">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToHome}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">
              {t('app:nav.history')}
            </h1>
          </div>

          {/* Stats Summary */}
          <div className="bg-white/10 rounded-xl p-4 mb-6">
            <h2 className="text-sm font-semibold text-white mb-3">
              {t('app:history.stats')}
            </h2>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-white">{totalWorkouts}</div>
                <div className="text-white/70 text-xs">{t('app:history.totalWorkouts')}</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-white">{Math.round(avgDuration)}m</div>
                <div className="text-white/70 text-xs">{t('app:history.avgDuration')}</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-white">{totalSets}</div>
                <div className="text-white/70 text-xs">{t('app:history.totalSets')}</div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white mb-3">
              {t('app:history.recentSessions')}
            </h2>
            
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleViewSession(session.id)}
                className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">
                      {session.name}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Badge className={`${getStatusColor(session.status)} text-xs px-2 py-0`}>
                    {t(`app:history.status.${session.status}`)}
                  </Badge>
                </div>

                {session.status === 'completed' && (
                  <div className="flex items-center justify-between text-white/80 text-xs">
                    <span>{session.duration}m</span>
                    <span>{session.exercises} {t('app:history.exercises')}</span>
                    <span>{session.sets} {t('app:history.sets')}</span>
                  </div>
                )}
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-white/70 text-sm mb-3">
                  {t('app:history.noSessions')}
                </div>
                <Button
                  onClick={handleBackToHome}
                  className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] text-xs px-4 py-2"
                >
                  {t('app:history.startFirst')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BottomNav className="z-20" />
    </div>
  )
}

export { HistoryPage as default }
export { HistoryPage }
