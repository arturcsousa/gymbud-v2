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

import { GoalsSchema, type GoalsFormData } from '@/schemas/onboarding'
import { OnboardingStore } from '@/db/onboarding-store'
import { supabase } from '@/lib/supabase'

// Reference data
const GOAL_TONE_MAP = {
  'fat_loss': 'supportive',
  'muscle_gain': 'focused',
  'performance': 'direct',
  'longevity': 'kind',
  'general_fitness': 'reassuring'
} as const

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' }
] as const

const HOME_BASIC_EQUIPMENT = [
  'dumbbells', 'resistance_bands', 'yoga_mat', 'pull_up_bar', 
  'kettlebell', 'foam_roller', 'stability_ball', 'jump_rope'
]

function GoalsPage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const form = useForm<GoalsFormData>({
    resolver: zodResolver(GoalsSchema),
    defaultValues: {
      goal_primary: undefined,
      days_per_week: undefined,
      days_of_week: [],
      session_windows: [],
      environment: undefined,
      equipment: []
    }
  })

  const watchedEnvironment = form.watch('environment')
  const watchedDaysPerWeek = form.watch('days_per_week')

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
          goal_primary: state.goal_primary,
          days_per_week: state.days_per_week,
          days_of_week: state.days_of_week || [],
          session_windows: state.session_windows || [],
          environment: state.environment,
          equipment: state.equipment || []
        })
      }
    }

    loadUserAndState()
  }, [form, navigate])

  const onSubmit = async (data: GoalsFormData) => {
    if (!userId) return

    setLoading(true)
    try {
      // Convert days_per_week to number for schema validation
      const processedData = {
        ...data,
        days_per_week: Number(data.days_per_week) as 2 | 3 | 4 | 5 | 6,
        coach_tone: GOAL_TONE_MAP[data.goal_primary]
      }

      await OnboardingStore.saveState({
        user_id: userId,
        ...processedData
      })
      
      // Navigate to next step
      navigate('/app/onboarding/profile')
    } catch (error) {
      console.error('Failed to save goals:', error)
    } finally {
      setLoading(false)
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
      <div className="relative z-10 px-6 pt-8 pb-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('onboarding:steps.goals.title')}
          </h1>
          <p className="text-white/70 text-sm max-w-md mx-auto">
            {t('onboarding:steps.goals.explain')}
          </p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Primary Goal */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.goals.goal_primary')}
              </Label>
              <Select onValueChange={(value) => form.setValue('goal_primary', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Select your primary goal" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fat_loss">Fat Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="longevity">Longevity</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days per Week */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.goals.days_per_week')}
              </Label>
              <Select onValueChange={(value) => form.setValue('days_per_week', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="How many days per week?" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="4">4 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="6">6 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days of Week Selection */}
            {watchedDaysPerWeek && (
              <div className="space-y-3">
                <Label className="text-white font-medium">
                  {t('onboarding:steps.goals.days_of_week')}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={form.watch('days_of_week')?.includes(day.value)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('days_of_week') || []
                          if (checked) {
                            form.setValue('days_of_week', [...current, day.value])
                          } else {
                            form.setValue('days_of_week', current.filter(d => d !== day.value))
                          }
                        }}
                        className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50"
                      />
                      <Label htmlFor={day.value} className="text-white/90 text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Environment */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:steps.goals.environment')}
              </Label>
              <Select onValueChange={(value) => form.setValue('environment', value as any)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white focus:bg-white/30 focus:border-white/50">
                  <SelectValue placeholder="Where do you train?" className="text-white/50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial_gym">Commercial Gym</SelectItem>
                  <SelectItem value="home_basic">Home (Basic Equipment)</SelectItem>
                  <SelectItem value="home_rack">Home (Full Setup)</SelectItem>
                  <SelectItem value="outdoors_mixed">Outdoors/Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Selection for Home Basic */}
            {watchedEnvironment === 'home_basic' && (
              <div className="space-y-3">
                <Label className="text-white font-medium">
                  {t('onboarding:steps.goals.equipment_basic')}
                </Label>
                <p className="text-white/70 text-sm">
                  {t('onboarding:steps.goals.equipment_explain')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {HOME_BASIC_EQUIPMENT.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={form.watch('equipment')?.includes(equipment)}
                        onCheckedChange={(checked) => {
                          const current = form.getValues('equipment') || []
                          if (checked) {
                            form.setValue('equipment', [...current, equipment])
                          } else {
                            form.setValue('equipment', current.filter(e => e !== equipment))
                          }
                        }}
                        className="border-white/30 data-[state=checked]:bg-white/20 data-[state=checked]:border-white/50"
                      />
                      <Label htmlFor={equipment} className="text-white/90 text-sm capitalize">
                        {equipment.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/app/onboarding/biometrics')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('onboarding:steps.goals.back')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    {t('onboarding:steps.goals.next')}
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

export default GoalsPage
export { GoalsPage }
