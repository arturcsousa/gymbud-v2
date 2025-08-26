import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, Timer, Dumbbell, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dataManager, Session } from '@/app/db/indexeddb'

interface HistoryDetailPageProps {
  params: { id: string }
}

export function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { t } = useTranslation(['app', 'history', 'session'])
  const [, setLocation] = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [params.id])

  const loadSession = async () => {
    try {
      const sessionData = await dataManager.getSession(params.id)
      setSession(sessionData || null)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('history:detail.notFound.title')}</h1>
        <p className="text-muted-foreground mb-4">{t('history:detail.notFound.message')}</p>
        <Button onClick={() => setLocation('/history')}>
          {t('history:detail.backToHistory')}
        </Button>
      </div>
    )
  }

  const exercises = session.data?.exercises || []
  const totalSets = exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/history')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('history:detail.back')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {session.data?.name || t('app:session.workout')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {formatDate(session.date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(session.status)}
          {session.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/session/${session.id}`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              {t('history:detail.edit')}
            </Button>
          )}
        </div>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('history:detail.stats.date')}</p>
                <p className="font-medium">{formatDate(session.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('history:detail.stats.duration')}</p>
                <p className="font-medium">
                  {session.data?.duration 
                    ? formatTime(session.data.duration)
                    : t('history:detail.stats.notRecorded')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('history:detail.stats.exercises')}</p>
                <p className="font-medium">
                  {exercises.length} {t('history:stats.exercises')}, {totalSets} {t('history:stats.sets')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('session:exercises.title')}</h2>
        
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('history:detail.noExercises')}
              </p>
            </CardContent>
          </Card>
        ) : (
          exercises.map((exercise: any, exerciseIndex: number) => (
            <Card key={exercise.id || exerciseIndex}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {exercise.name || t('session:exercise.unnamed')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exercise.sets && exercise.sets.length > 0 ? (
                  <div className="space-y-2">
                    {/* Headers */}
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      <div className="col-span-1 text-center">{t('session:set.setNumber')}</div>
                      <div className="col-span-2 text-center">{t('session:set.reps')}</div>
                      <div className="col-span-2 text-center">{t('session:set.weight')}</div>
                      <div className="col-span-2 text-center">{t('session:set.rpe')}</div>
                      <div className="col-span-5">{t('session:set.notes')}</div>
                    </div>
                    
                    {/* Sets */}
                    {exercise.sets.map((set: any, setIndex: number) => (
                      <div key={set.id || setIndex} className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-muted">
                        <div className="col-span-1 text-center font-medium">
                          {setIndex + 1}
                        </div>
                        <div className="col-span-2 text-center">
                          {set.reps || '-'}
                        </div>
                        <div className="col-span-2 text-center">
                          {set.weight ? `${set.weight}kg` : '-'}
                        </div>
                        <div className="col-span-2 text-center">
                          {set.rpe || '-'}
                        </div>
                        <div className="col-span-5 text-muted-foreground">
                          {set.notes || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {t('history:detail.noSets')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Session notes (if any) */}
      {session.data?.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t('history:detail.notes.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{session.data.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
