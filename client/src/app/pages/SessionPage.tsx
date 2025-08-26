import React, { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Square, Plus, Trash2, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useDataManager, Session, SessionExercise } from '@/app/data/manager'
import { supabase } from '@/lib/supabase'

interface LoggedSet {
  id: string
  session_exercise_id: string
  set_number: number
  reps?: number
  weight?: number
  rpe?: number
  notes?: string
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['session', 'common'])
  const dataManager = useDataManager()
  
  const [session, setSession] = useState<Session | null>(null)
  const [exercises, setExercises] = useState<SessionExercise[]>([])
  const [sets, setSets] = useState<LoggedSet[]>([])
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    loadSession()
  }, [id])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const loadSession = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      
      // Load session
      const sessionData = await dataManager.getSession(id)
      if (!sessionData) return
      
      setSession(sessionData)
      
      // Load exercises
      const exerciseData = await dataManager.getSessionExercises(id)
      setExercises(exerciseData)
      
      // Load sets
      const setData = await dataManager.getLoggedSets(id)
      setSets(setData)
      
      // Set timer if session is active
      if (sessionData.status === 'active' && sessionData.started_at) {
        const elapsed = Math.floor((Date.now() - new Date(sessionData.started_at).getTime()) / 1000)
        setTimer(elapsed)
        setIsTimerRunning(true)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const startSession = async () => {
    if (!session) return
    
    const updatedSession = {
      ...session,
      status: 'active' as const,
      started_at: new Date().toISOString()
    }
    
    await dataManager.updateSession(session.id, updatedSession)
    setSession(updatedSession)
    setIsTimerRunning(true)
  }

  const pauseSession = async () => {
    if (!session) return
    
    const updatedSession = {
      ...session,
      status: 'paused' as const
    }
    
    await dataManager.updateSession(session.id, updatedSession)
    setSession(updatedSession)
    setIsTimerRunning(false)
  }

  const completeSession = async () => {
    if (!session) return
    
    const updatedSession = {
      ...session,
      status: 'completed' as const,
      completed_at: new Date().toISOString()
    }
    
    await dataManager.updateSession(session.id, updatedSession)
    setSession(updatedSession)
    setIsTimerRunning(false)
  }

  const addExercise = async () => {
    if (!session) return
    
    const newExercise: Omit<SessionExercise, 'id'> = {
      session_id: session.id,
      exercise_name: '',
      order_index: exercises.length
    }
    
    const exercise = await dataManager.createSessionExercise(newExercise)
    setExercises(prev => [...prev, exercise])
  }

  const updateExercise = async (exerciseId: string, updates: Partial<SessionExercise>) => {
    await dataManager.updateSessionExercise(exerciseId, updates)
    setExercises(prev => prev.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex))
  }

  const removeExercise = async (exerciseId: string) => {
    await dataManager.deleteSessionExercise(exerciseId)
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId))
    setSets(prev => prev.filter(set => set.session_exercise_id !== exerciseId))
  }

  const addSet = async (exerciseId: string) => {
    const exerciseSets = sets.filter(set => set.session_exercise_id === exerciseId)
    const setNumber = exerciseSets.length + 1
    
    const newSet: Omit<LoggedSet, 'id'> = {
      session_exercise_id: exerciseId,
      set_number: setNumber
    }
    
    const set = await dataManager.createLoggedSet(newSet)
    setSets(prev => [...prev, set])
  }

  const updateSet = async (setId: string, updates: Partial<LoggedSet>) => {
    await dataManager.updateLoggedSet(setId, updates)
    setSets(prev => prev.map(set => set.id === setId ? { ...set, ...updates } : set))
  }

  const removeSet = async (setId: string) => {
    await dataManager.deleteLoggedSet(setId)
    setSets(prev => prev.filter(set => set.id !== setId))
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('common:loading')}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">{t('session:notFound.title')}</h1>
            <p className="text-muted-foreground">{t('session:notFound.message')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                {t('session:workout')}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(timer)}
                </div>
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                  {t(`app:sessionStatus.${session.status}`)}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              {session.status === 'pending' && (
                <Button onClick={startSession}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              {session.status === 'active' && (
                <>
                  <Button variant="outline" onClick={pauseSession}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={completeSession}>
                    <Square className="h-4 w-4 mr-2" />
                    {t('session:actions.complete')}
                  </Button>
                </>
              )}
              {session.status === 'paused' && (
                <>
                  <Button onClick={startSession}>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                  <Button onClick={completeSession}>
                    <Square className="h-4 w-4 mr-2" />
                    {t('session:actions.complete')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('session:exercises.title')}</h2>
          {session.status !== 'completed' && (
            <Button onClick={addExercise} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t('session:exercises.add')}
            </Button>
          )}
        </div>

        {exercises.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{t('session:exercises.empty')}</p>
            </CardContent>
          </Card>
        ) : (
          exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={sets.filter(set => set.session_exercise_id === exercise.id)}
              onUpdateExercise={updateExercise}
              onRemoveExercise={removeExercise}
              onAddSet={addSet}
              onUpdateSet={updateSet}
              onRemoveSet={removeSet}
              disabled={session.status === 'completed'}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface ExerciseCardProps {
  exercise: SessionExercise
  sets: LoggedSet[]
  onUpdateExercise: (id: string, updates: Partial<SessionExercise>) => void
  onRemoveExercise: (id: string) => void
  onAddSet: (exerciseId: string) => void
  onUpdateSet: (setId: string, updates: Partial<LoggedSet>) => void
  onRemoveSet: (setId: string) => void
  disabled: boolean
  t: any
}

function ExerciseCard({
  exercise,
  sets,
  onUpdateExercise,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  disabled,
  t
}: ExerciseCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Input
            value={exercise.exercise_name || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateExercise(exercise.id, { exercise_name: e.target.value })}
            className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
            placeholder={t('session:exercise.namePlaceholder')}
            disabled={disabled}
          />
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveExercise(exercise.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sets */}
        <div className="space-y-2">
          {sets.map((set) => (
            <div key={set.id} className="grid grid-cols-6 gap-2 items-center p-2 border rounded">
              <Label className="text-sm font-medium">
                {t('session:set.setNumber')} {set.set_number}
              </Label>
              
              <div>
                <Label className="text-xs text-muted-foreground">{t('session:set.reps')}</Label>
                <Input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSet(set.id, { reps: parseInt(e.target.value) || undefined })}
                  className="h-8"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">{t('session:set.weight')}</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={set.weight || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSet(set.id, { weight: parseFloat(e.target.value) || undefined })}
                  className="h-8"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">{t('session:set.rpe')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={set.rpe || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSet(set.id, { rpe: parseInt(e.target.value) || undefined })}
                  className="h-8"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">{t('session:set.notes')}</Label>
                <Input
                  value={set.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateSet(set.id, { notes: e.target.value })}
                  className="h-8"
                  placeholder={t('session:set.notesPlaceholder')}
                  disabled={disabled}
                />
              </div>
              
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveSet(set.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSet(exercise.id)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('session:set.add')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
