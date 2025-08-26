import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface SessionPageProps {
  params: {
    id: string
  }
}

export default function SessionPage({ params }: SessionPageProps) {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [session, setSession] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [currentExercise, setCurrentExercise] = useState(0)
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    loadSession()
    startTimer()
  }, [params.id])

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
    try {
      // Load session data (placeholder)
      setSession({
        id: params.id,
        name: 'Push Day',
        status: 'in_progress',
        startedAt: new Date()
      })

      // Load exercises (placeholder)
      setExercises([
        { id: '1', name: 'Bench Press', sets: 3, reps: '8-10', weight: 135 },
        { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: 60 },
        { id: '3', name: 'Push-ups', sets: 2, reps: '15-20', weight: 0 },
        { id: '4', name: 'Shoulder Press', sets: 3, reps: '8-10', weight: 95 },
        { id: '5', name: 'Tricep Dips', sets: 2, reps: '12-15', weight: 0 }
      ])

      // Initialize sets for current exercise
      setSets([
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ])
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTimer = () => {
    setIsTimerRunning(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSetComplete = (setIndex: number) => {
    const newSets = [...sets]
    newSets[setIndex].completed = !newSets[setIndex].completed
    setSets(newSets)
  }

  const handleSetChange = (setIndex: number, field: string, value: string) => {
    const newSets = [...sets]
    newSets[setIndex][field] = value
    setSets(newSets)
  }

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1)
      // Reset sets for next exercise
      setSets([
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ])
    }
  }

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1)
      // Reset sets for previous exercise
      setSets([
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ])
    }
  }

  const handleFinishWorkout = () => {
    setIsTimerRunning(false)
    // Save session and navigate to history
    setLocation('/history')
  }

  const handlePauseWorkout = () => {
    setLocation('/')
  }

  if (loading) {
    return (
      <ContentLayout title={t('app:session.loading')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </ContentLayout>
    )
  }

  const currentExerciseData = exercises[currentExercise]
  const progress = ((currentExercise + 1) / exercises.length) * 100

  return (
    <ContentLayout
      showNavigation={true}
      onBack={currentExercise > 0 ? handlePreviousExercise : handlePauseWorkout}
      onNext={currentExercise < exercises.length - 1 ? handleNextExercise : handleFinishWorkout}
      nextLabel={currentExercise < exercises.length - 1 ? t('app:session.nextExercise') : t('app:session.finish')}
      backLabel={currentExercise > 0 ? t('app:session.previous') : t('app:session.pause')}
    >
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="mb-4 sm:mb-8 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm font-medium">
              {t('app:session.exercise')} {currentExercise + 1} {t('common:of')} {exercises.length}
            </span>
            <span className="text-white text-sm font-medium">
              {Math.round(progress)}% {t('app:session.complete')}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block">
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(timer)}
            </div>
            <div className="text-white/70 text-sm">
              {t('app:session.workoutTime')}
            </div>
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {currentExerciseData?.name}
            </h2>
            <div className="flex justify-center gap-4 text-sm text-white/80">
              <span>{currentExerciseData?.sets} {t('app:session.sets')}</span>
              <span>{currentExerciseData?.reps} {t('app:session.reps')}</span>
              {currentExerciseData?.weight > 0 && (
                <span>{currentExerciseData?.weight} lbs</span>
              )}
            </div>
          </div>

          {/* Sets */}
          <div className="space-y-4">
            {sets.map((set, index) => (
              <div key={set.id} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">
                    {t('app:session.set')} {index + 1}
                  </span>
                  <Badge 
                    variant={set.completed ? "default" : "secondary"}
                    className={
                      set.completed 
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-white/20 text-white border-white/30"
                    }
                  >
                    {set.completed ? t('app:session.completed') : t('app:session.pending')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-white text-sm mb-1 block">
                      {t('app:session.reps')}
                    </Label>
                    <Input
                      type="number"
                      value={set.reps}
                      onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                      placeholder="0"
                    />
                  </div>
                  
                  {currentExerciseData?.weight > 0 && (
                    <div>
                      <Label className="text-white text-sm mb-1 block">
                        {t('app:session.weight')} (lbs)
                      </Label>
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleSetComplete(index)}
                  variant={set.completed ? "secondary" : "default"}
                  className={
                    set.completed 
                      ? "w-full bg-white/20 text-white hover:bg-white/30"
                      : "w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1]"
                  }
                >
                  {set.completed ? t('app:session.undo') : t('app:session.markComplete')}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">
            {t('app:session.exerciseList')}
          </h3>
          
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  index === currentExercise 
                    ? 'bg-white/20'
                    : index < currentExercise 
                      ? 'bg-green-500/20'
                      : 'bg-white/10'
                }`}
              >
                <div>
                  <div className="text-white font-medium">
                    {exercise.name}
                  </div>
                  <div className="text-white/70 text-sm">
                    {exercise.sets} × {exercise.reps}
                  </div>
                </div>
                
                <Badge 
                  variant="secondary"
                  className={
                    index === currentExercise 
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : index < currentExercise 
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : "bg-white/20 text-white border-white/30"
                  }
                >
                  {index === currentExercise 
                    ? t('app:session.current')
                    : index < currentExercise 
                      ? t('app:session.completed')
                      : t('app:session.upcoming')
                  }
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}
