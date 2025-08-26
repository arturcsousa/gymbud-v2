import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Calendar, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { dataManager, Session } from '@/app/db/indexeddb'
import { supabase } from '@/lib/supabase'

export function HistoryPage() {
  const { t } = useTranslation(['app', 'history'])
  const [, setLocation] = useLocation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Session['status'] | 'all'>('all')

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchQuery, statusFilter])

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

  const filterSessions = () => {
    let filtered = sessions

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(session => 
        session.data?.name?.toLowerCase().includes(query) ||
        session.data?.exercises?.some((ex: any) => 
          ex.name?.toLowerCase().includes(query)
        )
      )
    }

    setFilteredSessions(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">{t('app:session.completed')}</Badge>
      case 'in_progress':
        return <Badge variant="secondary">{t('app:session.inProgress')}</Badge>
      case 'planned':
        return <Badge variant="outline">{t('app:session.planned')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSessionStats = (session: Session) => {
    const exercises = session.data?.exercises || []
    const totalSets = exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0)
    const duration = session.data?.duration ? Math.round(session.data.duration / 60) : null

    return { exercises: exercises.length, sets: totalSets, duration }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          {t('history:title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('history:subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('history:search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                {t('history:filters.all')}
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                {t('app:session.status.completed')}
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                {t('app:session.status.in_progress')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {sessions.length === 0 
                  ? t('history:empty.title')
                  : t('history:noResults.title')
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {sessions.length === 0 
                  ? t('history:empty.message')
                  : t('history:noResults.message')
                }
              </p>
              {sessions.length === 0 && (
                <Button onClick={() => setLocation('/')}>
                  {t('history:empty.startFirst')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => {
            const stats = getSessionStats(session)
            
            return (
              <Card 
                key={session.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setLocation(`/history/${session.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {session.data?.name || t('app:session.workout')}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {formatDate(session.date)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {stats.exercises} {t('history:stats.exercises')}
                        </span>
                        <span>
                          {stats.sets} {t('history:stats.sets')}
                        </span>
                        {stats.duration && (
                          <span>
                            {stats.duration} {t('history:stats.minutes')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Button variant="ghost" size="sm">
                        {t('history:actions.view')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Load more button (for future pagination) */}
      {filteredSessions.length >= 50 && (
        <div className="text-center">
          <Button variant="outline">
            {t('history:actions.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
