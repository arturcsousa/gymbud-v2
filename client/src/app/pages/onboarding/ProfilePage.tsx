import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

import { ProfileSchema, type ProfileFormData } from '@/schemas/onboarding'
import { OnboardingStore } from '@/db/onboarding-store'
import { supabase } from '@/lib/supabase'

const MOVEMENT_PATTERNS = [
  { key: 'squat', label: 'Squat' },
  { key: 'hinge', label: 'Hip Hinge' },
  { key: 'lunge', label: 'Lunge' },
  { key: 'push', label: 'Push' },
  { key: 'pull', label: 'Pull' },
  { key: 'carry', label: 'Carry' }
]

const CONSTRAINT_AREAS = [
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'elbow', label: 'Elbow' },
  { value: 'wrist', label: 'Wrist' },
  { value: 'hip', label: 'Hip' },
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'low_back', label: 'Lower Back' },
  { value: 'cardio_limits', label: 'Cardio Limitations' }
]

const MOBILITY_AREAS = [
  { value: 'tspine', label: 'Thoracic Spine' },
  { value: 'hips', label: 'Hips' },
  { value: 'ankles', label: 'Ankles' },
  { value: 'shoulders', label: 'Shoulders' }
]

export function ProfilePage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [constraints, setConstraints] = useState<any[]>([])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      experience_level: undefined,
      confidence: {
        squat: 3,
        hinge: 3,
        lunge: 3,
        push: 3,
        pull: 3,
        carry: 3
      },
      constraints: [],
      warmup_style: undefined,
      mobility_focus: [],
      rest_preference: undefined,
      intensity_style: undefined,
      rpe_coaching_level: undefined
    }
  })

  const watchedIntensityStyle = form.watch('intensity_style')

  // Get user ID and load existing state
  useEffect(() => {
    const loadUserAndState = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth')
        return
      }
      
      setUserId(user.id)
      
      // Load existing onboarding state
      const state = await OnboardingStore.getState(user.id)
      if (state) {
        form.reset({
          experience_level: state.experience_level,
          confidence: state.confidence || {
            squat: 3, hinge: 3, lunge: 3, push: 3, pull: 3, carry: 3
          },
          constraints: state.constraints || [],
          warmup_style: state.warmup_style,
          mobility_focus: state.mobility_focus || [],
          rest_preference: state.rest_preference,
          intensity_style: state.intensity_style,
          rpe_coaching_level: state.rpe_coaching_level
        })
        setConstraints(state.constraints || [])
      }
    }

    loadUserAndState()
  }, [form, navigate])

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return

    setLoading(true)
    try {
      await OnboardingStore.saveState({
        user_id: userId,
        ...data,
        constraints
      })
      
      // Navigate to next step
      navigate('/app/onboarding/review')
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfidenceChange = (movement: string, value: number[]) => {
    form.setValue(`confidence.${movement}` as any, value[0] as any)
  }

  const handleMobilityToggle = (area: string, checked: boolean) => {
    const current = form.getValues('mobility_focus') || []
    if (checked) {
      form.setValue('mobility_focus', [...current, area as any])
    } else {
      form.setValue('mobility_focus', current.filter(a => a !== area))
    }
  }

  const addConstraint = () => {
    setConstraints([...constraints, { area: '', severity: 'mild', avoid_movements: [] }])
  }

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index))
  }

  const updateConstraint = (index: number, field: string, value: any) => {
    const updated = [...constraints]
    updated[index] = { ...updated[index], [field]: value }
    setConstraints(updated)
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t('onboarding:profile.title')}
          </CardTitle>
          <p className="text-sm text-gray-600 text-center mt-2">
            {t('onboarding:profile.explain')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>{t('onboarding:profile.experience_level')}</Label>
              <Select onValueChange={(value) => form.setValue('experience_level', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>{t('onboarding:profile.confidence')}</Label>
              {MOVEMENT_PATTERNS.map((movement) => (
                <div key={movement.key} className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">{movement.label}</Label>
                    <span className="text-sm text-gray-500">
                      {form.watch(`confidence.${movement.key}` as any) || 3}/5
                    </span>
                  </div>
                  <Slider
                    value={[form.watch(`confidence.${movement.key}` as any) || 3]}
                    onValueChange={(value) => handleConfidenceChange(movement.key, value)}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{t('onboarding:profile.constraints')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addConstraint}>
                  Add Constraint
                </Button>
              </div>
              {constraints.map((constraint, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Constraint {index + 1}</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeConstraint(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select 
                      value={constraint.area}
                      onValueChange={(value) => updateConstraint(index, 'area', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONSTRAINT_AREAS.map((area) => (
                          <SelectItem key={area.value} value={area.value}>
                            {area.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={constraint.severity}
                      onValueChange={(value) => updateConstraint(index, 'severity', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="severe">Severe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>{t('onboarding:profile.warmup')}</Label>
              <p className="text-xs text-gray-500 mb-2">
                {t('onboarding:profile.warmup_explain')}
              </p>
              <Select onValueChange={(value) => form.setValue('warmup_style', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warm-up style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Jump right in)</SelectItem>
                  <SelectItem value="quick">Quick (5 minutes)</SelectItem>
                  <SelectItem value="standard">Standard (10 minutes)</SelectItem>
                  <SelectItem value="therapeutic">Therapeutic (15+ minutes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('onboarding:profile.mobility')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {MOBILITY_AREAS.map((area) => (
                  <div key={area.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.value}
                      checked={form.getValues('mobility_focus')?.includes(area.value as any)}
                      onCheckedChange={(checked) => handleMobilityToggle(area.value, checked as boolean)}
                    />
                    <Label htmlFor={area.value}>{area.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('onboarding:profile.rest_pref')}</Label>
              <Select onValueChange={(value) => form.setValue('rest_preference', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rest preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shorter">Shorter (I like to move quickly)</SelectItem>
                  <SelectItem value="as_prescribed">As Prescribed (Follow the plan)</SelectItem>
                  <SelectItem value="longer">Longer (I need more recovery)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('onboarding:profile.intensity')}</Label>
              <Select onValueChange={(value) => form.setValue('intensity_style', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select intensity guidance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rpe">RPE (Rate of Perceived Exertion)</SelectItem>
                  <SelectItem value="rir">RIR (Reps in Reserve)</SelectItem>
                  <SelectItem value="fixed">Fixed Weights (No autoregulation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watchedIntensityStyle === 'rpe' && (
              <div className="space-y-2">
                <Label>RPE Coaching Level</Label>
                <Select onValueChange={(value) => form.setValue('rpe_coaching_level', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How much RPE coaching do you want?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teach_me">Teach Me (Detailed explanations)</SelectItem>
                    <SelectItem value="standard">Standard (Brief reminders)</SelectItem>
                    <SelectItem value="advanced">Advanced (Minimal guidance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/app/onboarding/goals')}
              >
                {t('onboarding:biometrics.back')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Saving...' : t('onboarding:biometrics.next')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export { ProfilePage }
