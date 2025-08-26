import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Square, Plus, Minus, Timer, Weight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { dataManager, Session, LoggedSet } from '@/app/db/indexeddb'
import { supabase } from '@/lib/supabase'

interface SessionPageProps {
  params: { id: string }
}

interface ExerciseSet {
  id: string
  reps?: number
  weight?: number
  rpe?: number
  duration?: number
  notes?: string
  completed: boolean
}

interface Exercise {
  id: string
  name: string
  sets: ExerciseSet[]
}

export function SessionPage({ params }: SessionPageProps) {
  const { t } = useTranslation(['app', 'session'])
  const [, setLocation] = useLocation()
  const [session, setSession] = useState<Session | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    loadSession()
  }, [params.id])

  useEffect(() => {
    let interval: number | null = null
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning])

  const loadSession = async () => {
    try {
      const sessionData = await dataManager.getSession(params.id)
      if (!sessionData) {
        setLocation('/404')
        return
      }

      setSession(sessionData)
      
      // Load exercises from session data
      const sessionExercises = sessionData.data?.exercises || []
      setExercises(sessionExercises)

      // Start timer if session is in progress
      if (sessionData.status === 'in_progress') {
        const startTime = new Date(sessionData.data?.started_at || sessionData.updated_at).getTime()
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setTimer(elapsed)
        setIsTimerRunning(true)
      }

    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSession = async (updates: Partial<Session>) => {
    if (!session) return

    try {
      const updatedSession = await dataManager.updateSession(session.id, updates)
      setSession(updatedSession)
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const saveExercises = async () => {
    if (!session) return

    await updateSession({
      data: {
        ...session.data,
        exercises,
        duration: timer
      }
    })
  }

  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: t('session:exercise.newExercise'),
      sets: []
    }
    setExercises([...exercises, newExercise])
  }

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ))
  }

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  const addSet = (exerciseId: string) => {
    const newSet: ExerciseSet = {
      id: crypto.randomUUID(),
      completed: false
    }
    
    updateExercise(exerciseId, {
      sets: [...(exercises.find(ex => ex.id === exerciseId)?.sets || []), newSet]
    })
  }

  const updateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    const exercise = exercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, ...updates } : set
    )
    
    updateExercise(exerciseId, { sets: updatedSets })
  }

  const removeSet = (exerciseId: string, setId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const updatedSets = exercise.sets.filter(set => set.id !== setId)
    updateExercise(exerciseId, { sets: updatedSets })
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const completeSession = async () => {
    if (!session) return

    await updateSession({
      status: 'completed',
      data: {
        ...session.data,
        exercises,
        duration: timer,
        completed_at: new Date().toISOString()
      }
    })

    setIsTimerRunning(false)
    setLocation('/history')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
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
        <h1 className="text-2xl font-bold mb-4">{t('session:notFound.title')}</h1>
        <p className="text-muted-foreground mb-4">{t('session:notFound.message')}</p>
        <Button onClick={() => setLocation('/')}>
          {t('common:backHome')}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {session.data?.name || t('session:workout')}
          </h1>
          <p className="text-muted-foreground">
            {new Date(session.date).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={session.status === 'completed' ? 'success' : 'default'}>
          {t(`app:session.status.${session.status}`)}
        </Badge>
      </div>

      {/* Timer and controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {t('session:timer.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-mono font-bold">
              {formatTime(timer)}
            </div>
            <div className="flex gap-2">
              {session.status !== 'completed' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTimer}
                  >
                    {isTimerRunning ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimer(0)}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('session:exercises.title')}</h2>
          {session.status !== 'completed' && (
            <Button onClick={addExercise} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('session:exercises.add')}
            </Button>
          )}
        </div>

        {exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Input
                  value={exercise.name}
                  onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                  className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
                  placeholder={t('session:exercise.namePlaceholder')}
                  disabled={session.status === 'completed'}
                />
                {session.status !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExercise(exercise.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sets */}
              <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 text-sm font-medium text-center">
                      {setIndex + 1}
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">{t('session:set.reps')}</Label>
                      <Input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exercise.id, set.id, { 
                          reps: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="0"
                        disabled={session.status === 'completed'}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">{t('session:set.weight')}</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exercise.id, set.id, { 
                          weight: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        placeholder="0"
                        disabled={session.status === 'completed'}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">{t('session:set.rpe')}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={set.rpe || ''}
                        onChange={(e) => updateSet(exercise.id, set.id, { 
                          rpe: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="RPE"
                        disabled={session.status === 'completed'}
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <Label className="text-xs">{t('session:set.notes')}</Label>
                      <Input
                        value={set.notes || ''}
                        onChange={(e) => updateSet(exercise.id, set.id, { notes: e.target.value })}
                        placeholder={t('session:set.notesPlaceholder')}
                        disabled={session.status === 'completed'}
                      />
                    </div>
                    
                    {session.status !== 'completed' && (
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(exercise.id, set.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {session.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSet(exercise.id)}
                    className="w-full mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('session:set.add')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {exercises.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Weight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('session:exercises.empty')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action buttons */}
      {session.status !== 'completed' && (
        <div className="flex gap-4 pt-6">
          <Button onClick={saveExercises} variant="outline" className="flex-1">
            {t('session:actions.save')}
          </Button>
          <Button onClick={completeSession} className="flex-1">
            {t('session:actions.complete')}
          </Button>
        </div>
      )}
    </div>
  )
}
