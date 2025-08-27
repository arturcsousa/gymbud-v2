import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { OnboardingStore, type OnboardingState } from '@/db/onboarding-store'
import { type PlanSeed, type PlanCreateRequest, type PlanCreateResponse } from '@/types/planseed'
import { supabase } from '@/lib/supabase'

export function ReviewPage() {
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
      // Convert onboarding state to PlanSeed
      const planSeed: PlanSeed = {
        first_name: onboardingState.first_name!,
        last_name: onboardingState.last_name!,
        biometrics: {
          height_cm: onboardingState.height_cm!,
          weight_kg: onboardingState.weight_kg!,
          body_fat_pct: onboardingState.body_fat_pct,
          rhr_bpm: onboardingState.rhr_bpm,
          birthdate: onboardingState.birthdate
        },
        goal_primary: onboardingState.goal_primary!,
        days_per_week: onboardingState.days_per_week!,
        days_of_week: onboardingState.days_of_week!,
        session_windows: onboardingState.session_windows,
        environment: onboardingState.environment!,
        equipment: onboardingState.equipment,
        ai_tone: onboardingState.ai_tone!,
        units: onboardingState.units!,
        date_format: onboardingState.date_format!,
        experience_level: onboardingState.experience_level!,
        confidence: onboardingState.confidence!,
        constraints: onboardingState.constraints,
        warmup_style: onboardingState.warmup_style!,
        mobility_focus: onboardingState.mobility_focus,
        rest_preference: onboardingState.rest_preference!,
        intensity_style: onboardingState.intensity_style!,
        rpe_coaching_level: onboardingState.rpe_coaching_level!
      }

      // Call plan-get-or-create Edge Function
      const { data, error } = await supabase.functions.invoke('plan-get-or-create', {
        body: { seed: planSeed } as PlanCreateRequest
      })

      if (error) {
        console.error('Failed to create plan:', error)
        throw error
      }

      const response = data as PlanCreateResponse

      // Update user profile with units/date_format/ai_tone if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          units: planSeed.units,
          date_format: planSeed.date_format,
          ai_tone: planSeed.ai_tone
        })
        .eq('id', userId)

      if (profileError) {
        console.warn('Failed to update profile preferences:', profileError)
      }

      // Clear onboarding state
      await OnboardingStore.clearState(userId)

      // Navigate to home with baseline session CTA
      navigate(`/?baseline_session=${response.baseline_session_id}`)
      
    } catch (error) {
      console.error('Failed to create plan:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!onboardingState) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t('onboarding:review.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Biometrics Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Personal Information</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app/onboarding/biometrics')}
              >
                {t('onboarding:review.edit')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span> {onboardingState.first_name} {onboardingState.last_name}
              </div>
              <div>
                <span className="text-gray-600">Height:</span> {onboardingState.height_cm}cm
              </div>
              <div>
                <span className="text-gray-600">Weight:</span> {onboardingState.weight_kg}kg
              </div>
              {onboardingState.body_fat_pct && (
                <div>
                  <span className="text-gray-600">Body Fat:</span> {onboardingState.body_fat_pct}%
                </div>
              )}
            </div>
          </div>

          {/* Goals Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Goals & Schedule</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app/onboarding/goals')}
              >
                {t('onboarding:review.edit')}
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Primary Goal:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.goal_primary?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Training Days:</span> {onboardingState.days_per_week} days/week
              </div>
              <div>
                <span className="text-gray-600">Days:</span>{' '}
                {onboardingState.days_of_week?.map(day => (
                  <Badge key={day} variant="outline" className="ml-1">
                    {day.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <div>
                <span className="text-gray-600">Environment:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.environment?.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">AI Tone:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.ai_tone}
                </Badge>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Training Profile</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app/onboarding/profile')}
              >
                {t('onboarding:review.edit')}
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Experience:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.experience_level}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Warm-up Style:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.warmup_style}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Intensity Style:</span>{' '}
                <Badge variant="secondary" className="ml-2">
                  {onboardingState.intensity_style?.toUpperCase()}
                </Badge>
              </div>
              {onboardingState.constraints && onboardingState.constraints.length > 0 && (
                <div>
                  <span className="text-gray-600">Constraints:</span>{' '}
                  {onboardingState.constraints.map((constraint, index) => (
                    <Badge key={index} variant="outline" className="ml-1">
                      {constraint.area} ({constraint.severity})
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Plan Button */}
          <div className="pt-6">
            <Button 
              onClick={createPlan}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? t('onboarding:review.creating') : t('onboarding:review.confirm')}
            </Button>
          </div>

          {loading && (
            <div className="text-center text-sm text-gray-600">
              This may take a few moments...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { ReviewPage }
