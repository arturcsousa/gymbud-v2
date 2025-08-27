import { useState, useEffect, useRef } from 'react'
import { useLocation, useParams } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Play, 
  SkipForward,
  Plus,
  Info,
  Timer,
  Undo2
} from 'lucide-react'
import { toast } from 'sonner'
import BottomNav from '@/components/BottomNav'
import { useSessionData } from '@/hooks/useSessionData'

interface RestTimerState {
  isActive: boolean
  timeRemaining: number
  prescribedTime: number
  actualStartTime: number | null
}

function SessionPage() {
  const { t } = useTranslation(['session', 'common'])
  const [, setLocation] = useLocation()
  const params = useParams()
  const sessionId = params.id
  
  // Session data
  const {
    session,
    exercises,
    currentExercise,
    currentExerciseIndex,
    isLoading,
    error,
    logSet,
    updateSession,
    getExerciseSets,
    getNextSetNumber,
    isLoggingSet,
    isUpdatingSession
  } = useSessionData(sessionId)

  // UI state
  const [workoutStartTime] = useState(Date.now())
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [currentSetData, setCurrentSetData] = useState({
    reps: '',
    weight: '',
    rpe: 5
  })
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    timeRemaining: 0,
    prescribedTime: 0,
    actualStartTime: null
  })
  const [showInstructions, setShowInstructions] = useState(false)
  
  const restIntervalRef = useRef<NodeJS.Timeout>()
  const workoutIntervalRef = useRef<NodeJS.Timeout>()

  // Start workout timer
  useEffect(() => {
    workoutIntervalRef.current = setInterval(() => {
      setWorkoutTimer(Math.floor((Date.now() - workoutStartTime) / 1000))
    }, 1000)

    return () => {
      if (workoutIntervalRef.current) {
        clearInterval(workoutIntervalRef.current)
      }
    }
  }, [workoutStartTime])

  // Rest timer effect
  useEffect(() => {
    if (restTimer.isActive && restTimer.timeRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }))
      }, 1000)
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }
  }, [restTimer.isActive, restTimer.timeRemaining])

  // Mark session as active when component mounts
  useEffect(() => {
    if (session && session.status === 'pending') {
      updateSession({
        status: 'active',
        startedAt: new Date().toISOString()
      })
    }
  }, [session, updateSession])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLogSet = async () => {
    if (!currentExercise) return

    const setNumber = getNextSetNumber(currentExercise.session_exercise_id)
    
    try {
      await logSet({
        sessionExerciseId: currentExercise.session_exercise_id,
        setNumber,
        reps: currentSetData.reps ? parseInt(currentSetData.reps) : undefined,
        weight: currentSetData.weight ? parseFloat(currentSetData.weight) : undefined,
        rpe: currentSetData.rpe
      })

      // Start rest timer if prescribed
      if (currentExercise.rest_sec > 0) {
        setRestTimer({
          isActive: true,
          timeRemaining: currentExercise.rest_sec,
          prescribedTime: currentExercise.rest_sec,
          actualStartTime: Date.now()
        })
      }

      // Clear form
      setCurrentSetData({
        reps: '',
        weight: '',
        rpe: 5
      })

      toast.success(t('session:set_logged_announcement', { 
        number: setNumber, 
        reps: currentSetData.reps 
      }))
    } catch (error) {
      toast.error(t('session:errors.failed_to_log_set'))
    }
  }

  const handleSkipRest = () => {
    setRestTimer(prev => ({ ...prev, isActive: false, timeRemaining: 0 }))
  }

  const handleAddRestTime = () => {
    setRestTimer(prev => ({ 
      ...prev, 
      timeRemaining: prev.timeRemaining + 30,
      prescribedTime: prev.prescribedTime + 30
    }))
  }

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      // Navigate to previous exercise logic would go here
      toast.info('Previous exercise navigation not yet implemented')
    } else {
      setLocation('/')
    }
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      // Navigate to next exercise logic would go here
      toast.info('Next exercise navigation not yet implemented')
    } else {
      handleFinishWorkout()
    }
  }

  const handleFinishWorkout = async () => {
    try {
      await updateSession({
        status: 'completed',
        completedAt: new Date().toISOString()
      })
      
      toast.success(t('session:completion.workout_complete'))
      setLocation('/history')
    } catch (error) {
      toast.error(t('session:errors.failed_to_update_session'))
    }
  }

  if (isLoading) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden pb-20"
        style={{ background: '#005870' }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
          }}
        />
        
        <div className="relative z-10 px-6 pt-8 pb-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">{t('session:loading')}</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error || !session || !currentExercise) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden pb-20"
        style={{ background: '#005870' }}
      >
        <div className="relative z-10 px-6 pt-8 pb-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
            <div className="text-center py-8">
              <p className="text-white text-sm">{t('session:errors.session_not_found')}</p>
              <Button 
                onClick={() => setLocation('/')}
                className="mt-4 bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900"
              >
                {t('common:back')}
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100
  const currentSets = getExerciseSets(currentExercise.session_exercise_id)
  const nextExercise = exercises[currentExerciseIndex + 1]
  const isLastExercise = currentExerciseIndex === exercises.length - 1

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20"
      style={{ background: '#005870' }}
    >
      {/* Background gradients */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 px-6 pt-8 pb-4 space-y-4">
        
        {/* Header with Progress */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white text-sm font-medium">
              {t('session:header.exercise_progress', { 
                current: currentExerciseIndex + 1, 
                total: exercises.length 
              })}
            </span>
            <div className="text-white text-sm font-bold">
              {formatTime(workoutTimer)}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        {/* Exercise Focus Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {currentExercise.exercise_name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-white/80">
                {currentExercise.is_warmup && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                    {t('session:exercise_card.warmup')}
                  </Badge>
                )}
                <span>{currentExercise.sets} {t('session:sets')}</span>
                <span>•</span>
                <span>
                  {currentExercise.reps_scalar 
                    ? t('session:exercise_card.target_reps_exact', { reps: currentExercise.reps_scalar })
                    : currentExercise.reps_array_json 
                      ? `${currentExercise.reps_array_json[0]}-${currentExercise.reps_array_json[1]} reps`
                      : 'Reps TBD'
                  }
                </span>
                <span>•</span>
                <span>{t('session:exercise_card.rest_time', { seconds: currentExercise.rest_sec })}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
          
          {showInstructions && (
            <div className="bg-white/5 rounded-lg p-3 text-white/90 text-sm">
              <p className="font-medium mb-1">{t('session:exercise_card.instructions')}</p>
              <p>Exercise instructions would appear here from the exercise library.</p>
            </div>
          )}
        </div>

        {/* Set Log Strip */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white font-medium text-sm">
              {t('session:set_logging.set_number', { number: getNextSetNumber(currentExercise.session_exercise_id) })}
            </span>
            <Badge 
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-xs"
            >
              {currentSets.length}/{currentExercise.sets}
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-3 items-end mb-3">
            <div>
              <Label className="text-white text-xs mb-1 block">
                {t('session:set_logging.reps')}
              </Label>
              <Input
                type="number"
                value={currentSetData.reps}
                onChange={(e) => setCurrentSetData(prev => ({ ...prev, reps: e.target.value }))}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
                placeholder="0"
              />
            </div>
            
            <div>
              <Label className="text-white text-xs mb-1 block">
                {t('session:set_logging.weight')}
              </Label>
              <Input
                type="number"
                step="0.5"
                value={currentSetData.weight}
                onChange={(e) => setCurrentSetData(prev => ({ ...prev, weight: e.target.value }))}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-8 text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <Label className="text-white text-xs mb-1 block">
                {t('session:set_logging.effort')}
              </Label>
              <select
                value={currentSetData.rpe}
                onChange={(e) => setCurrentSetData(prev => ({ ...prev, rpe: parseInt(e.target.value) }))}
                className="w-full h-8 bg-white/20 border border-white/30 text-white text-sm rounded-md px-2"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-slate-800">
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleLogSet}
              disabled={isLoggingSet || !currentSetData.reps}
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-8 text-xs px-3"
            >
              {isLoggingSet ? '...' : t('session:set_logging.log_set')}
            </Button>
          </div>

          {currentSets.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
              onClick={() => toast.info('Undo functionality coming in Phase E2')}
            >
              <Undo2 className="w-3 h-3 mr-1" />
              {t('session:set_logging.undo_last')}
            </Button>
          )}
        </div>

        {/* Rest Timer */}
        {restTimer.isActive && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 shadow-xl ring-1 ring-white/20 text-center">
            <div className="mb-4">
              <Timer className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-white font-bold text-lg">{t('session:rest_timer.rest_time')}</h3>
            </div>
            
            <div className="text-4xl font-bold text-white mb-4">
              {formatTime(restTimer.timeRemaining)}
            </div>
            
            {restTimer.timeRemaining === 0 && (
              <div className="text-green-300 font-bold mb-4">
                {t('session:rest_timer.rest_complete')}
              </div>
            )}
            
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipRest}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                {t('session:rest_timer.skip_rest')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddRestTime}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('session:rest_timer.add_30s')}
              </Button>
            </div>
          </div>
        )}

        {/* Upcoming Exercise */}
        {nextExercise && !restTimer.isActive && (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 shadow-xl ring-1 ring-white/10">
            <div className="text-center">
              <p className="text-white/60 text-xs mb-1">{t('session:upcoming.next_exercise', { exercise: nextExercise.exercise_name })}</p>
              <p className="text-white/40 text-xs">{t('session:upcoming.sets_remaining', { sets: nextExercise.sets })}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex justify-between items-center gap-3">
            <Button
              onClick={handlePreviousExercise}
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentExerciseIndex > 0 ? t('session:navigation.previous_exercise') : t('session:navigation.pause_workout')}
            </Button>

            <Button
              onClick={handleNextExercise}
              disabled={isUpdatingSession}
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] flex items-center gap-2"
            >
              {isLastExercise ? t('session:navigation.finish_workout') : t('session:navigation.next_exercise')}
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
