import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
] as const

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

const MOBILITY_AREAS = [
  { value: 'tspine', label: 'Thoracic Spine' },
  { value: 'hips', label: 'Hips' },
  { value: 'ankles', label: 'Ankles' },
  { value: 'shoulders', label: 'Shoulders' }
] as const

type ConstraintArea = typeof CONSTRAINT_AREAS[number]['value']
type MobilityArea = typeof MOBILITY_AREAS[number]['value']
type ConstraintSeverity = 'mild' | 'moderate' | 'severe'

interface Constraint {
  area: ConstraintArea
  severity: ConstraintSeverity
  avoid_movements?: string[]
}

function ProfilePage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [mobilityFocus, setMobilityFocus] = useState<MobilityArea[]>([])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      experience_level: undefined,
      confidence: {
        squat: undefined,
        hinge: undefined,
        lunge: undefined,
        push: undefined,
        pull: undefined,
        carry: undefined
      },
      constraints: [],
      warmup_style: undefined,
      mobility_focus: [],
      rest_preference: undefined,
      intensity_style: undefined,
      rpe_coaching_level: undefined
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
          confidence: state.confidence || {},
          constraints: state.constraints || [],
          warmup_style: state.warmup_style,
          mobility_focus: state.mobility_focus || [],
          rest_preference: state.rest_preference,
          intensity_style: state.intensity_style,
          rpe_coaching_level: state.rpe_coaching_level
        })
        setConstraints(state.constraints || [])
        setMobilityFocus(state.mobility_focus || [])
      }
    }

    loadUserAndState()
  }, [form, navigate])

  const onSubmit = async (data: ProfileFormData) => {
    if (!userId) return

    setLoading(true)
    try {
      // Convert confidence values to proper type
      const processedData = {
        ...data,
        confidence: Object.fromEntries(
          Object.entries(data.confidence).map(([key, value]) => [
            key,
            Number(value) as 1 | 2 | 3 | 4 | 5
          ])
        ) as Record<'squat'|'hinge'|'lunge'|'push'|'pull'|'carry', 1|2|3|4|5>,
        constraints,
        mobility_focus: mobilityFocus
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

  const toggleMobilityArea = (area: MobilityArea) => {
    if (mobilityFocus.includes(area)) {
      setMobilityFocus(mobilityFocus.filter(a => a !== area))
    } else {
      setMobilityFocus([...mobilityFocus, area])
    }
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
                {t('onboarding:steps.profile.experience_level')}
              </Label>
              <Select onValueChange={(value) => form.setValue('experience_level', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Select your experience level" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Movement Confidence */}
            <div className="space-y-4">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.confidence')}
              </Label>
              <div className="space-y-4">
                {MOVEMENT_PATTERNS.map((pattern) => (
                  <div key={pattern.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-white/90 text-sm">{pattern.label}</Label>
                      <span className="text-white/70 text-sm">
                        {form.watch(`confidence.${pattern.key}`) || 1}/5
                      </span>
                    </div>
                    <Slider
                      value={[form.watch(`confidence.${pattern.key}`) || 1]}
                      onValueChange={(value) => form.setValue(`confidence.${pattern.key}`, value[0] as any)}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
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
                  Add Constraint
                </Button>
              </div>
              {constraints.map((constraint, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={constraint.area}
                    onValueChange={(value) => updateConstraint(index, 'area', value)}
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50 flex-1">
                      <SelectValue />
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
                    <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeConstraint(index)}
                    className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {/* Warmup Style */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.warmup')}
              </Label>
              <p className="text-white/70 text-sm">
                {t('onboarding:steps.profile.warmup_explain')}
              </p>
              <Select onValueChange={(value) => form.setValue('warmup_style', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Select warmup style" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="quick">Quick (5 min)</SelectItem>
                  <SelectItem value="standard">Standard (10 min)</SelectItem>
                  <SelectItem value="therapeutic">Therapeutic (15+ min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobility Focus */}
            <div className="space-y-3">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.mobility')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {MOBILITY_AREAS.map((area) => (
                  <div key={area.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.value}
                      checked={mobilityFocus.includes(area.value)}
                      onCheckedChange={() => toggleMobilityArea(area.value)}
                      className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50"
                    />
                    <Label htmlFor={area.value} className="text-white/90 text-sm">
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rest Preference */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.rest_pref')}
              </Label>
              <Select onValueChange={(value) => form.setValue('rest_preference', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Select rest preference" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shorter">Shorter</SelectItem>
                  <SelectItem value="as_prescribed">As Prescribed</SelectItem>
                  <SelectItem value="longer">Longer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Intensity Style */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.profile.intensity')}
              </Label>
              <Select onValueChange={(value) => form.setValue('intensity_style', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Select intensity guidance" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rpe">RPE (Rate of Perceived Exertion)</SelectItem>
                  <SelectItem value="rir">RIR (Reps in Reserve)</SelectItem>
                  <SelectItem value="fixed">Fixed Percentages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* RPE Coaching Level */}
            {form.watch('intensity_style') === 'rpe' && (
              <div className="space-y-2">
                <Label className="text-white font-medium">RPE Coaching Level</Label>
                <Select onValueChange={(value) => form.setValue('rpe_coaching_level', value as any)}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                    <SelectValue placeholder="Select coaching level" className="text-white/50" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teach_me">Teach Me</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/app/onboarding/goals')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    Next
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
