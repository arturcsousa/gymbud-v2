import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dataManager, Session } from '@/app/db/indexeddb'
import { supabase } from '@/lib/supabase'

interface Session {
  id: string
  name: string
  date: string
  status: 'completed' | 'in_progress' | 'planned'
  duration?: number
  exercises?: number
  totalSets?: number
  totalReps?: number
}

export function HistoryPage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const sessionData = await dataManager.getSessions(session.user.id, 100)
      setSessions(sessionData)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">{t('app:session.completed')}</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">{t('app:session.inProgress')}</Badge>
      case 'planned':
        return <Badge variant="outline" className="bg-white/20 text-white border-white/30">{t('app:session.planned')}</Badge>
      default:
        return <Badge variant="outline" className="bg-white/20 text-white border-white/30">{status}</Badge>
    }
  }

  const handleSessionClick = (sessionId: string) => {
    setLocation(`/history/${sessionId}`)
  }

  const handleBackToHome = () => {
    setLocation('/')
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

  return (
    <ContentLayout
      title={t('app:nav.history')}
      showNavigation={true}
      onBack={handleBackToHome}
      backLabel={t('app:nav.home')}
      nextLabel=""
      onNext={() => {}}
    >
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:history.summary')}
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.length}
              </div>
              <div className="text-white/70 text-sm">
                {t('app:history.totalWorkouts')}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round(sessions.reduce((acc, s) => acc + (s.data?.duration || 0), 0) / sessions.length) || 0}
              </div>
              <div className="text-white/70 text-sm">
                {t('app:history.avgDuration')} min
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.reduce((acc, s) => acc + (s.data?.exercises?.length || 0), 0)}
              </div>
              <div className="text-white/70 text-sm">
                {t('app:history.totalExercises')}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sessions.reduce((acc, s) => acc + (s.data?.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0), 0)}
              </div>
              <div className="text-white/70 text-sm">
                {t('app:history.totalSets')}
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session.id)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {session.data?.name || t('app:session.workout')}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {formatDate(session.date)}
                  </p>
                </div>
                
                {getStatusBadge(session.status)}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-white/80">
                <div>
                  <span className="font-medium">{session.data?.duration || 0}</span>
                  <span className="ml-1">{t('app:session.minutes')}</span>
                </div>
                <div>
                  <span className="font-medium">{session.data?.exercises?.length || 0}</span>
                  <span className="ml-1">{t('app:session.exercises')}</span>
                </div>
                <div>
                  <span className="font-medium">{session.data?.exercises?.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0) || 0}</span>
                  <span className="ml-1">{t('app:session.sets')}</span>
                </div>
                <div>
                  <span className="font-medium">{session.data?.exercises?.reduce((acc, ex) => acc + (ex.sets?.reduce((acc, set) => acc + (set.reps || 0), 0) || 0), 0) || 0}</span>
                  <span className="ml-1">{t('app:session.reps')}</span>
                </div>
              </div>
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
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-11 px-6 text-base font-semibold rounded-xl transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('app:session.start')}
            </Button>
          </div>
        )}
      </div>
    </ContentLayout>
  )
}
