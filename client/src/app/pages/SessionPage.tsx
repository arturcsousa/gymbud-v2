import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
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

        {/* Loading content */}
        <div className="relative z-10 px-6 pt-8 pb-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">{t('app:session.loading')}</span>
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

      {/* Main content - positioned directly on page */}
      <div className="relative z-10 px-6 pt-8 pb-4 space-y-6">
        {/* Header with Progress */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white text-sm font-medium">
              {t('app:session.exercise')} {currentExerciseIndex + 1} {t('common:of')} 5
            </span>
            <div className="text-white text-sm font-bold">
              {formatTime(timer)}
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
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {currentExerciseData?.name}
          </h2>
          <div className="flex justify-center gap-4 text-sm text-white/80">
            <span>{currentExerciseData?.sets} {t('app:session.sets')}</span>
            <span>{currentExerciseData?.reps} {t('app:session.reps')}</span>
            <span>{currentExerciseData?.weight} lbs</span>
          </div>
        </div>

        {/* Sets - Compact */}
        <div className="space-y-3">
          {sets.map((set, index) => (
            <div key={set.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-3 shadow-xl ring-1 ring-white/20">
              <div className="flex items-center justify-between mb-3">
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
                  {set.completed ? '✓' : '○'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
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
                    {t('app:session.weight')}
                  </Label>
                  <Input
                    type="number"
                    value={set.weight}
                    onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
                    placeholder="0"
                  />
                </div>

                <Button
                  onClick={() => updateSet(set.id, 'completed', !set.completed)}
                  variant={set.completed ? "secondary" : "default"}
                  className={
                    set.completed 
                      ? "bg-white/20 text-white hover:bg-white/30 h-8 text-xs px-3"
                      : "bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-8 text-xs px-3"
                  }
                >
                  {set.completed ? <CheckCircle className="w-3 h-3" /> : '✓'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-center gap-3">
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
