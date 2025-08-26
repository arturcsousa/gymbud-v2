import React, { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Square, Plus, Trash2, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface LoggedSet {
  id: string
  set_number: number
  reps?: number
  weight?: number
  rpe?: number
  notes?: string
}

interface SessionExercise {
  id: string
  exercise_name: string
  order_index: number
  logged_sets: LoggedSet[]
}

interface Session {
  id: string
  status: 'draft' | 'active' | 'completed'
  started_at?: string
  completed_at?: string
  notes?: string
  exercises: SessionExercise[]
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('session')
  const [session, setSession] = useState<Session | null>(null)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    // Load session data - placeholder for now
    if (id) {
      setSession({
        id,
        status: 'active',
        started_at: new Date().toISOString(),
        exercises: []
      })
    }
  }, [id])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(timer => timer + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => setIsRunning(true)
  const pauseTimer = () => setIsRunning(false)
  const stopTimer = () => {
    setIsRunning(false)
    setTimer(0)
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading session...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('workout')}</span>
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Timer */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5" />
              <span className="text-2xl font-mono">{formatTime(timer)}</span>
            </div>
            <div className="flex space-x-2">
              <Button onClick={startTimer} disabled={isRunning} size="sm">
                <Play className="h-4 w-4" />
              </Button>
              <Button onClick={pauseTimer} disabled={!isRunning} size="sm" variant="outline">
                <Pause className="h-4 w-4" />
              </Button>
              <Button onClick={stopTimer} size="sm" variant="outline">
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('exercises.title')}</span>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('exercises.add')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.exercises.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('exercises.empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {session.exercises.map((exercise, index) => (
                <div key={exercise.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{exercise.exercise_name}</h3>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Sets */}
                  <div className="space-y-2">
                    {exercise.logged_sets.map((set, setIndex) => (
                      <div key={set.id} className="grid grid-cols-5 gap-2 items-center">
                        <Label className="text-sm">{t('set.setNumber')} {set.set_number}</Label>
                        <Input 
                          type="number" 
                          placeholder={t('set.reps')}
                          value={set.reps || ''}
                          className="text-sm"
                        />
                        <Input 
                          type="number" 
                          placeholder={t('set.weight')}
                          value={set.weight || ''}
                          className="text-sm"
                        />
                        <Input 
                          type="number" 
                          placeholder={t('set.rpe')}
                          value={set.rpe || ''}
                          className="text-sm"
                        />
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('set.add')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button className="flex-1">
          {t('actions.save')}
        </Button>
        <Button variant="outline" className="flex-1">
          {t('actions.complete')}
        </Button>
      </div>
    </div>
  )
}
