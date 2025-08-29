import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Target,
  Plus,
  CheckCircle2,
  Info,
  Undo2,
  MoreVertical,
  RefreshCw,
  Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSessionData } from '@/hooks/useSessionData'
import { useExerciseDetails } from '@/hooks/useExerciseDetails'
import { ReplaceExerciseSheet } from '@/components/ReplaceExerciseSheet'
import { CoachPanel } from '@/components/CoachPanel'

interface RestTimerState {
  isActive: boolean
  timeLeft: number
  prescribedTime: number
  startTime: number
}

function SessionPage() {
  const { id: sessionId } = useParams()
  const [, setLocation] = useLocation()
  const { t } = useTranslation('session')
  
  // Session data and actions
  const {
    session,
    exercises,
    loggedSets,
    isLoading,
    error,
    logSet,
    undoLastSet,
    updateSession,
    logRestEvent,
    logExerciseNavigation,
    isUndoingSet
  } = useSessionData(sessionId)

  // Fetch exercise details for current exercise
  const currentExercise = exercises[currentExerciseIndex]
  const { data: exerciseDetails, isLoading: isLoadingExercise } = useExerciseDetails(
    currentExercise?.variant_id || undefined
  )

  // UI state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [setInputs, setSetInputs] = useState({ reps: '', weight: '', rpe: '' })
  const [restTimer, setRestTimer] = useState<RestTimerState>({ 
    isActive: false, 
    timeLeft: 0, 
    prescribedTime: 0, 
    startTime: 0 
  })
  const [workoutStartTime] = useState(Date.now())
  const [isCoachPanelOpen, setIsCoachPanelOpen] = useState(false)
  
  // Refs for accessibility
  const restTimerRef = useRef<HTMLDivElement>(null)
  const setInputRef = useRef<HTMLInputElement>(null)

  // Current exercise and its sets
  const currentExerciseSets = loggedSets.filter(
    set => set.session_exercise_id === currentExercise?.session_exercise_id
  )
  const completedSets = currentExerciseSets.length
  const nextSetNumber = completedSets + 1

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (restTimer.isActive && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }))
      }, 1000)
    } else if (restTimer.isActive && restTimer.timeLeft === 0) {
      // Timer completed
      setRestTimer(prev => ({ ...prev, isActive: false }))
      logRestEvent('rest_completed', restTimer.prescribedTime)
      
      // Accessibility announcement
      const announcement = t('accessibility.restCompleted')
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(announcement)
        speechSynthesis.speak(utterance)
      }
    }
    return () => clearInterval(interval)
  }, [restTimer.isActive, restTimer.timeLeft, restTimer.prescribedTime, logRestEvent, t])

  // Start session if not active
  useEffect(() => {
    if (session && session.status === 'pending') {
      updateSession({
        status: 'active',
        started_at: new Date().toISOString()
      })
    }
  }, [session, updateSession])

  const handleLogSet = () => {
    if (!currentExercise) return

    const reps = parseInt(setInputs.reps) || 0
    const weight = parseFloat(setInputs.weight) || 0
    const rpe = parseInt(setInputs.rpe) || 0

    logSet({
      sessionExerciseId: currentExercise.session_exercise_id,
      setNumber: nextSetNumber,
      reps,
      weight,
      rpe
    })

    // Clear inputs
    setSetInputs({ reps: '', weight: '', rpe: '' })

    // Start rest timer if not the last set
    if (completedSets + 1 < currentExercise.sets) {
      const restTime = currentExercise.rest_sec
      setRestTimer({
        isActive: true,
        timeLeft: restTime,
        prescribedTime: restTime,
        startTime: Date.now()
      })
      logRestEvent('rest_started', restTime)
    }
  }

  const handleUndoLastSet = () => {
    if (!currentExercise || completedSets === 0) return

    // Cancel rest timer if active
    if (restTimer.isActive) {
      setRestTimer({ isActive: false, timeLeft: 0, prescribedTime: 0, startTime: 0 })
      
      // Accessibility announcement
      const announcement = t('accessibility.undoReturnToSet', { setNumber: completedSets })
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(announcement)
        speechSynthesis.speak(utterance)
      }
    }

    undoLastSet(currentExercise.session_exercise_id)
  }

  const handleSkipRest = () => {
    if (!restTimer.isActive) return
    
    const actualRestTime = Math.floor((Date.now() - restTimer.startTime) / 1000)
    setRestTimer({ isActive: false, timeLeft: 0, prescribedTime: 0, startTime: 0 })
    logRestEvent('rest_skipped', actualRestTime)
  }

  const handleAddTime = () => {
    setRestTimer(prev => ({
      ...prev,
      timeLeft: prev.timeLeft + 30
    }))
  }

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1)
      logExerciseNavigation('exercise_previous')
    }
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      logExerciseNavigation('exercise_advanced')
    }
  }

  const handleFinishWorkout = () => {
    updateSession({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    setLocation('/app/home')
  }

  const handleExerciseReplaced = () => {
    // Update the current exercise in the local state
    // The actual data will be updated via the ReplaceExerciseSheet component
    // This triggers a re-render with the new exercise name
    window.location.reload() // Simple approach to refresh the session data
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getWorkoutDuration = () => {
    return Math.floor((Date.now() - workoutStartTime) / 1000)
  }

  // Get target reps for display
  const getTargetReps = () => {
    if (!currentExercise) return '0'
    return currentExercise.reps?.toString() || '0'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">{t('loading')}</div>
      </div>
    )
  }

  if (error || !session || !currentExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Session not found</div>
      </div>
    )
  }

  const progressPercentage = ((currentExerciseIndex + 1) / exercises.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-medium">
              {t('header.exercise_progress')}: {currentExerciseIndex + 1}/{exercises.length}
            </div>
            <div className="text-teal-300 font-mono">
              {formatTime(getWorkoutDuration())}
            </div>
            <Button
              onClick={() => setIsCoachPanelOpen(true)}
              variant="ghost"
              size="sm"
              className="text-teal-300"
            >
              <Brain className="w-4 h-4" />
              AI Coach
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Exercise Focus Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{currentExercise.exercise_name}</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="text-teal-300">
                    <Info className="w-4 h-4" />
                  </Button>
                  
                  {/* Exercise Options Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
                      <ReplaceExerciseSheet
                        sessionExerciseId={currentExercise.session_exercise_id}
                        currentExerciseId={currentExercise.session_exercise_id}
                        currentExerciseName={currentExercise.exercise_name}
                        onExerciseReplaced={handleExerciseReplaced}
                      >
                        <DropdownMenuItem 
                          className="text-white hover:bg-slate-700 cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t('swap.replace')}
                        </DropdownMenuItem>
                      </ReplaceExerciseSheet>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{currentExercise.sets} sets</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{getTargetReps()} reps</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{currentExercise.rest_sec}s</span>
                </div>
              </div>

              {/* Exercise Cues Ticker */}
              {exerciseDetails?.cues && exerciseDetails.cues.length > 0 && (
                <div className="mt-3 p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                  <div className="text-xs text-teal-300 font-medium mb-1">Form Cues</div>
                  <div className="text-sm text-teal-100">
                    {exerciseDetails.cues.join(' • ')}
                  </div>
                </div>
              )}

              {/* Contraindications Warning */}
              {exerciseDetails?.contraindications && exerciseDetails.contraindications.length > 0 && (
                <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="text-xs text-orange-300 font-medium mb-1">⚠️ Safety Notes</div>
                  <div className="text-sm text-orange-100">
                    {exerciseDetails.contraindications.join(' • ')}
                  </div>
                </div>
              )}

              {/* Swap Exercise CTA Button */}
              <div className="mt-4">
                <ReplaceExerciseSheet
                  sessionExerciseId={currentExercise.session_exercise_id}
                  currentExerciseId={currentExercise.session_exercise_id}
                  currentExerciseName={currentExercise.exercise_name}
                  onExerciseReplaced={handleExerciseReplaced}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('swap.replace')}
                  </Button>
                </ReplaceExerciseSheet>
              </div>

              {currentExercise.is_warmup && (
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 mt-2">
                  {t('exercise_card.warmup')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Set Logging Strip */}
        {!restTimer.isActive && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    Set {nextSetNumber}
                  </h3>
                  <div className="text-sm text-gray-300">
                    {completedSets}/{currentExercise.sets} completed
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {t('set_logging.reps')}
                    </label>
                    <Input
                      ref={setInputRef}
                      type="number"
                      value={setInputs.reps}
                      onChange={(e) => setSetInputs(prev => ({ ...prev, reps: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder={getTargetReps()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {t('set_logging.weight')}
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      value={setInputs.weight}
                      onChange={(e) => setSetInputs(prev => ({ ...prev, weight: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder={currentExercise.weight?.toString() || '0'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {t('set_logging.effort')}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={setInputs.rpe}
                      onChange={(e) => setSetInputs(prev => ({ ...prev, rpe: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="RPE"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleLogSet}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={!setInputs.reps}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('set_logging.log_set')}
                  </Button>
                  
                  <Button
                    onClick={handleUndoLastSet}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    disabled={completedSets === 0 || isUndoingSet}
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rest Timer */}
        {restTimer.isActive && (
          <Card className="bg-gradient-to-br from-teal-600/20 to-blue-600/20 backdrop-blur-lg border-teal-400/30">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Rest Time</h3>
                
                <div 
                  ref={restTimerRef}
                  className="text-4xl font-bold text-teal-300"
                  aria-live="polite"
                  aria-label={`${restTimer.timeLeft} seconds remaining`}
                >
                  {formatTime(restTimer.timeLeft)}
                </div>

                <div className="flex justify-center space-x-3">
                  <Button
                    onClick={handleSkipRest}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    Skip
                  </Button>
                  <Button
                    onClick={handleAddTime}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    +30s
                  </Button>
                </div>

                {/* Next Exercise Preview */}
                {currentExerciseIndex < exercises.length - 1 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-300 mb-1">Next Exercise:</p>
                    <p className="text-white font-medium">
                      {exercises[currentExerciseIndex + 1].exercise_name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Footer */}
        <div className="flex justify-between items-center pt-4">
          <Button
            onClick={handlePreviousExercise}
            variant="outline"
            disabled={currentExerciseIndex === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {currentExerciseIndex === exercises.length - 1 ? (
            <Button
              onClick={handleFinishWorkout}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finish
            </Button>
          ) : (
            <Button
              onClick={handleNextExercise}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Next Exercise
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
      {isCoachPanelOpen && sessionId && (
        <CoachPanel
          sessionId={sessionId}
          isOpen={isCoachPanelOpen}
          onClose={() => setIsCoachPanelOpen(false)}
        />
      )}
    </div>
  )
}

export default SessionPage
