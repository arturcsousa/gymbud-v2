import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { OnboardingStore, type OnboardingState } from '@/db/onboarding-store'
import { type PlanSeed, type PlanCreateResponse } from '@/types/planseed'
import { supabase } from '@/lib/supabase'

function ReviewPage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null)

  // Get user ID and load onboarding state
  useEffect(() => {
    const loadUserAndState = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }
      
      setUserId(user.id)
      
      // Load onboarding state
      const state = await OnboardingStore.getState(user.id)
      if (!state) {
        // If no state, redirect to first step
        navigate('/app/onboarding/biometrics')
        return
      }
      
      setOnboardingState(state)
    }

    loadUserAndState()
  }, [navigate])

  const createPlan = async () => {
    if (!userId || !onboardingState) return

    setLoading(true)
    try {
      // Helper function to generate confidence from experience level
      const getConfidenceFromExperience = (level: string): Record<'squat'|'hinge'|'lunge'|'push'|'pull'|'carry', 1|2|3|4|5> => {
        const value = (level === 'beginner' ? 1 : level === 'intermediate' ? 3 : 5) as 1|2|3|4|5
        return {
          squat: value,
          hinge: value,
          lunge: value,
          push: value,
          pull: value,
          carry: value
        }
      }

      // Helper function to map frontend environment to database enum
      const mapEnvironment = (env: string) => {
        switch (env) {
          case 'gym': return 'commercial_gym'
          case 'home': return 'home_basic'
          case 'bodyweight': return 'outdoors_mixed'
          default: return 'commercial_gym'
        }
      }

      // Convert onboarding state to PlanSeed
      const planSeed: PlanSeed = {
        goal_primary: onboardingState.goal_primary!,
        days_per_week: onboardingState.days_per_week!,
        days_of_week: onboardingState.days_of_week!,
        environment: mapEnvironment(onboardingState.environment!),
        equipment: onboardingState.equipment || [],
        experience_level: onboardingState.experience_level!,
        confidence: onboardingState.confidence || getConfidenceFromExperience(onboardingState.experience_level!),
        constraints: onboardingState.constraints || [],
        warmup_style: onboardingState.warmup_style || 'standard',
        mobility_focus: onboardingState.mobility_focus || [],
        rest_preference: onboardingState.rest_preference || 'as_prescribed',
        intensity_style: onboardingState.intensity_style || 'rpe',
        rpe_coaching_level: onboardingState.rpe_coaching_level || 'standard',
        first_name: onboardingState.first_name!,
        last_name: onboardingState.last_name!,
        biometrics: {
          height_cm: onboardingState.height_cm!,
          weight_kg: onboardingState.weight_kg!,
          body_fat_pct: onboardingState.body_fat_pct,
          rhr_bpm: onboardingState.rhr_bpm,
          birthdate: onboardingState.birthdate
        },
        ai_tone: 'supportive', // Default value - could be made configurable
        units: 'metric', // Default value - could be made configurable  
        date_format: 'dmy' // Default value - could be made configurable
      }

      // Step 1: Call plan creation Edge Function
      console.log('=== CLIENT: Starting plan creation ===');
      console.log('Plan seed being sent:', JSON.stringify(planSeed, null, 2));
      
      const { data: planData, error: planError } = await supabase.functions.invoke('plan-get-or-create', {
        body: { seed: planSeed }
      })

      console.log('=== CLIENT: Plan creation response ===');
      console.log('Plan data:', planData);
      console.log('Plan error:', planError);

      if (planError) {
        console.error('=== CLIENT: Plan creation error ===');
        console.error('Error message:', planError.message);
        console.error('Full error object:', planError);
        throw planError
      }

      const planResponse = planData as PlanCreateResponse
      console.log('=== CLIENT: Parsed plan response ===');
      console.log('Plan response:', planResponse);
      
      if ('error' in planResponse) {
        console.error('=== CLIENT: Plan response contains error ===');
        console.error('Plan error detail:', planResponse.detail);
        console.error('Plan error message:', planResponse.error);
        throw new Error(planResponse.detail || planResponse.error || 'Failed to create plan')
      }

      // Step 2: Call session creation Edge Function
      console.log('=== CLIENT: Starting session creation ===');
      console.log('Using plan_id:', planResponse.data.plan_id);
      
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('session-get-or-create', {
        body: { 
          plan_id: planResponse.data.plan_id,
          // date will default to user timezone "today"
          // timezone will be resolved from user profile
        }
      })

      console.log('=== CLIENT: Session creation response ===');
      console.log('Session data:', sessionData);
      console.log('Session error:', sessionError);

      if (sessionError) {
        console.error('=== CLIENT: Session creation error ===');
        console.error('Error message:', sessionError.message);
        console.error('Full error object:', sessionError);
        throw sessionError
      }

      if (!sessionData?.session?.id) {
        console.error('=== CLIENT: Session response missing session ID ===');
        console.error('Session response:', sessionData);
        throw new Error('Session creation failed - no session ID returned')
      }

      console.log('=== CLIENT: Session created successfully ===');
      console.log('Session ID:', sessionData.session.id);

      // Clear onboarding state
      await OnboardingStore.clearState(userId)
      
      // Navigate to the created session
      navigate(`/session/${sessionData.session.id}`)
    } catch (error) {
      console.error('Failed to create plan and session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!onboardingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
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

      {/* Main content */}
      <div className="relative z-10 px-6 pt-8 pb-8 space-y-6 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('onboarding:steps.review.title')}
          </h1>
          <p className="text-white/70 text-sm max-w-md mx-auto">
            {t('onboarding:steps.review.explain')}
          </p>
        </div>

        {/* Review Cards */}
        <div className="space-y-4">
          {/* Personal Info */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Personal Information</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/onboarding/biometrics')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('onboarding:steps.review.edit')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/70">Name:</span>
                <span className="text-white ml-2">{onboardingState.first_name} {onboardingState.last_name}</span>
              </div>
              <div>
                <span className="text-white/70">Height:</span>
                <span className="text-white ml-2">{onboardingState.height_cm} cm</span>
              </div>
              <div>
                <span className="text-white/70">Weight:</span>
                <span className="text-white ml-2">{onboardingState.weight_kg} kg</span>
              </div>
              {onboardingState.body_fat_pct && (
                <div>
                  <span className="text-white/70">Body Fat:</span>
                  <span className="text-white ml-2">{onboardingState.body_fat_pct}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Goals & Schedule */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Goals & Schedule</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/onboarding/goals')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('onboarding:steps.review.edit')}
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-white/70">Primary Goal:</span>
                <Badge className="ml-2 bg-white/20 text-white border-white/30">
                  {onboardingState.goal_primary?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <span className="text-white/70">Training Days:</span>
                <span className="text-white ml-2">{onboardingState.days_per_week} days/week</span>
              </div>
              <div>
                <span className="text-white/70">Environment:</span>
                <span className="text-white ml-2 capitalize">
                  {onboardingState.environment?.replace('_', ' ')}
                </span>
              </div>
              {onboardingState.days_of_week && (
                <div>
                  <span className="text-white/70">Days:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {onboardingState.days_of_week.map((day) => (
                      <Badge key={day} className="bg-white/20 text-white border-white/30 text-xs">
                        {day.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Training Profile */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Training Profile</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/onboarding/profile')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {t('onboarding:steps.review.edit')}
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-white/70">Experience:</span>
                <span className="text-white ml-2 capitalize">{onboardingState.experience_level}</span>
              </div>
              <div>
                <span className="text-white/70">Warmup Style:</span>
                <span className="text-white ml-2 capitalize">
                  {onboardingState.warmup_style?.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-white/70">Intensity Style:</span>
                <span className="text-white ml-2 uppercase">{onboardingState.intensity_style}</span>
              </div>
              {onboardingState.constraints && onboardingState.constraints.length > 0 && (
                <div>
                  <span className="text-white/70">Constraints:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {onboardingState.constraints.map((constraint, index) => (
                      <Badge key={index} className="bg-orange-500/20 text-orange-200 border-orange-400/30 text-xs">
                        {constraint.area.replace('_', ' ')} ({constraint.severity})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Plan Button */}
        <div className="pt-6">
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/app/onboarding/profile')}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={createPlan}
              disabled={loading}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('onboarding:steps.review.creating')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('onboarding:steps.review.confirm')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewPage
export { ReviewPage }
