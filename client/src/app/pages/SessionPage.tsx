import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Play, Pause, CheckCircle } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

interface WorkoutSet {
  id: string
  reps: string
  weight: string
  completed: boolean
}

function SessionPage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    loadSession()
    startTimer()
  }, [])

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
      const initialSets: WorkoutSet[] = [
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ]
      setSets(initialSets)
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

  const updateSet = (setId: string, field: keyof WorkoutSet, value: string | boolean) => {
    setSets(prevSets => 
      prevSets.map(set => 
        set.id === setId ? { ...set, [field]: value } : set
      )
    )
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < 4) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setSets([
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ])
    }
  }

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1)
      setSets([
        { id: '1', reps: '', weight: '', completed: false },
        { id: '2', reps: '', weight: '', completed: false },
        { id: '3', reps: '', weight: '', completed: false }
      ])
    }
  }

  const handleFinishWorkout = () => {
    setIsTimerRunning(false)
    setLocation('/history')
  }

  const handlePauseWorkout = () => {
    setLocation('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-900 via-teal-950 to-black">
        <div className="pb-20 min-h-screen grid place-items-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl p-6 shadow-xl ring-1 ring-white/10">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">{t('app:session.loading')}</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const currentExerciseData = {
    id: '1',
    name: 'Bench Press',
    sets: 3,
    reps: '8-10',
    weight: 135
  }
  const progress = ((currentExerciseIndex + 1) / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-900 via-teal-950 to-black">
      <div className="pb-20 p-4 min-h-screen flex flex-col">
        <div className="max-w-md mx-auto space-y-4 flex-1">
          {/* Header with Progress */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-4 shadow-xl ring-1 ring-white/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white text-sm font-medium">
                {t('app:session.exercise')} {currentExerciseIndex + 1} {t('common:of')} 5
              </span>
              <div className="flex items-center gap-2">
                <div className="text-white text-lg font-bold">
                  {formatTime(timer)}
                </div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Exercise */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-4 shadow-xl ring-1 ring-white/10">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-white mb-1">
                {currentExerciseData?.name}
              </h2>
              <div className="flex justify-center gap-4 text-sm text-white/80">
                <span>{currentExerciseData?.sets} {t('app:session.sets')}</span>
                <span>{currentExerciseData?.reps} {t('app:session.reps')}</span>
                <span>{currentExerciseData?.weight} lbs</span>
              </div>
            </div>

            {/* Sets */}
            <div className="space-y-3">
              {sets.map((set, index) => (
                <div key={set.id} className="bg-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">
                      {t('app:session.set')} {index + 1}
                    </span>
                    <Badge 
                      variant={set.completed ? "default" : "secondary"}
                      className={
                        set.completed 
                          ? "bg-green-500/20 text-green-300 border-green-500/30 text-xs"
                          : "bg-white/20 text-white border-white/30 text-xs"
                      }
                    >
                      {set.completed ? t('app:session.completed') : t('app:session.pending')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <Label className="text-white text-xs mb-1 block">
                        {t('app:session.reps')}
                      </Label>
                      <Input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white text-xs mb-1 block">
                        {t('app:session.weight')} (lbs)
                      </Label>
                      <Input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => updateSet(set.id, 'completed', !set.completed)}
                    variant={set.completed ? "secondary" : "default"}
                    className={
                      set.completed 
                        ? "w-full bg-white/20 text-white hover:bg-white/30 h-8 text-xs"
                        : "w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-8 text-xs"
                    }
                  >
                    {set.completed ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('app:session.completed')}
                      </>
                    ) : (
                      t('app:session.markComplete')
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              onClick={currentExerciseIndex > 0 ? handlePreviousExercise : handlePauseWorkout}
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentExerciseIndex > 0 ? t('app:session.previous') : t('app:session.pause')}
            </Button>

            <Button
              onClick={currentExerciseIndex < 4 ? handleNextExercise : handleFinishWorkout}
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] flex items-center gap-2"
            >
              {currentExerciseIndex < 4 ? t('app:session.nextExercise') : t('app:session.finish')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

export { SessionPage as default }
export { SessionPage }
