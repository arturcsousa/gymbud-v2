import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ProfileSchema, type ProfileFormData } from '@/schemas/onboarding'
import { OnboardingStore } from '@/db/onboarding-store'
import { supabase } from '@/lib/supabase'

const CONSTRAINT_AREAS = [
  { value: 'shoulder', label: 'Shoulder' },
  { value: 'elbow', label: 'Elbow' },
  { value: 'wrist', label: 'Wrist' },
  { value: 'hip', label: 'Hip' },
  { value: 'knee', label: 'Knee' },
  { value: 'ankle', label: 'Ankle' },
  { value: 'low_back', label: 'Lower Back' },
  { value: 'cardio_limits', label: 'Cardio Limitations' }
] as const

type ConstraintArea = typeof CONSTRAINT_AREAS[number]['value']
type ConstraintSeverity = 'mild' | 'moderate' | 'severe'

interface Constraint {
  area: ConstraintArea
  severity: ConstraintSeverity
  avoid_movements?: string[]
}

// Auto-populate fields based on experience level
const getConfidenceFromExperience = (level: 'beginner' | 'intermediate' | 'advanced') => {
  const confidenceMap = {
    beginner: 1,
    intermediate: 3,
    advanced: 5
  } as const

  const value = confidenceMap[level] as 1 | 2 | 3 | 4 | 5
  return {
    squat: value,
    hinge: value,
    lunge: value,
    push: value,
    pull: value,
    carry: value
  }
}

function ProfilePage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [constraints, setConstraints] = useState<Constraint[]>([])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      experience_level: undefined,
      constraints: []
    }
  })

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
          constraints: state.constraints || []
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
      // Auto-populate fields based on experience level
      const processedData = {
        ...data,
        confidence: getConfidenceFromExperience(data.experience_level),
        constraints,
        warmup_style: 'standard' as const,
        mobility_focus: [] as const,
        rest_preference: 'as_prescribed' as const,
        intensity_style: 'rpe' as const,
        rpe_coaching_level: 'standard' as const
      }

      await OnboardingStore.saveState({
        user_id: userId,
        ...processedData
      })
      
      // Navigate to next step
      navigate('/app/onboarding/review')
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const addConstraint = () => {
    setConstraints([...constraints, { area: 'shoulder', severity: 'mild' }])
  }

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index))
  }

  const updateConstraint = (index: number, field: keyof Constraint, value: any) => {
    const updated = [...constraints]
    updated[index] = { ...updated[index], [field]: value }
    setConstraints(updated)
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
            {t('onboarding:steps.profile.title')}
          </h1>
          <p className="text-white/70 text-sm max-w-md mx-auto">
            {t('onboarding:steps.profile.explain')}
          </p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Experience Level */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.experience_level')} <span className="text-red-300">*</span>
              </Label>
              <Select onValueChange={(value) => form.setValue('experience_level', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50 data-[placeholder]:text-white/50">
                  <SelectValue placeholder={t('onboarding:steps.profile.experience_placeholder', 'Select your experience level')} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="beginner">{t('onboarding:steps.profile.experience.beginner', 'Beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('onboarding:steps.profile.experience.intermediate', 'Intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('onboarding:steps.profile.experience.advanced', 'Advanced')}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.experience_level && (
                <p className="text-sm text-red-300">{form.formState.errors.experience_level.message}</p>
              )}
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-white font-medium">
                  {t('onboarding:steps.profile.constraints')}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addConstraint}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  {t('onboarding:steps.profile.add_constraint', 'Add Constraint')}
                </Button>
              </div>
              
              {constraints.length === 0 && (
                <p className="text-white/60 text-sm italic">
                  {t('onboarding:steps.profile.no_constraints', 'No injuries or constraints? Great! You can skip this section.')}
                </p>
              )}
              
              {constraints.map((constraint, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={constraint.area}
                    onValueChange={(value) => updateConstraint(index, 'area', value)}
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {CONSTRAINT_AREAS.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {t(`onboarding:steps.profile.constraint_areas.${area.value}`, area.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={constraint.severity}
                    onValueChange={(value) => updateConstraint(index, 'severity', value)}
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="mild">{t('onboarding:steps.profile.severity.mild', 'Mild')}</SelectItem>
                      <SelectItem value="moderate">{t('onboarding:steps.profile.severity.moderate', 'Moderate')}</SelectItem>
                      <SelectItem value="severe">{t('onboarding:steps.profile.severity.severe', 'Severe')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeConstraint(index)}
                    className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
                  >
                    {t('onboarding:steps.profile.remove', 'Remove')}
                  </Button>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/app/onboarding/goals')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('onboarding:navigation.previous', 'Previous')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
              >
                {loading ? t('common:loading', 'Loading...') : (
                  <>
                    {t('onboarding:navigation.next', 'Next')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
export { ProfilePage }
