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
  const { t, i18n } = useTranslation(['onboarding'])
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

  const watchedGoal = form.watch('goal_primary')
  const watchedEnvironment = form.watch('environment')

  useEffect(() => {
    const loadUserAndState = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        navigate('/auth')
        return
      }

      setUserId(session.user.id)

      // Load existing state if available
      const state = await OnboardingStore.getState(session.user.id)
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
  }, [form, navigate, i18n.language])

  const onSubmit = async (data: GoalsFormData) => {
    if (!userId) return

    setLoading(true)
    try {
      // Auto-set ai_tone based on goal
      const ai_tone = watchedGoal ? GOAL_TONE_MAP[watchedGoal] : 'supportive'
      
      // Set locale-based defaults
      const isMetric = i18n.language === 'pt-BR'
      
      // Create extended state with additional fields
      const extendedState = {
        user_id: userId,
        ...data,
        days_per_week: Number(data.days_per_week) as 2 | 3 | 4 | 5 | 6,
        ai_tone,
        units: isMetric ? 'metric' as const : 'imperial' as const,
        date_format: isMetric ? 'dmy' as const : 'mdy' as const,
        updated_at: Date.now()
      }
      
      await OnboardingStore.saveState(extendedState)
      
      navigate('/app/onboarding/profile')
    } catch (error) {
      console.error('Failed to save goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    const currentDays = form.getValues('days_of_week') || []
    if (checked) {
      form.setValue('days_of_week', [...currentDays, day as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'])
    } else {
      form.setValue('days_of_week', currentDays.filter(d => d !== day))
    }
  }

  const handleEquipmentToggle = (equipment: string, checked: boolean) => {
    const currentEquipment = form.getValues('equipment') || []
    if (checked) {
      form.setValue('equipment', [...currentEquipment, equipment])
    } else {
      form.setValue('equipment', currentEquipment.filter(e => e !== equipment))
    }
  }

  const handleGoalChange = (value: string) => {
    form.setValue('goal_primary', value as GoalsFormData['goal_primary'])
  }

  const handleDaysPerWeekChange = (value: string) => {
    const numValue = Number(value) as 2 | 3 | 4 | 5 | 6
    form.setValue('days_per_week', numValue)
  }

  const handleEnvironmentChange = (value: string) => {
    form.setValue('environment', value as GoalsFormData['environment'])
    // Clear equipment when switching away from home_basic
    if (value !== 'home_basic') {
      form.setValue('equipment', [])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white text-center">
            {t('onboarding:goals.title')}
          </CardTitle>
          <p className="text-white/80 text-center">
            {t('onboarding:goals.explain')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Primary Goal */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:goals.goal_primary')}
              </Label>
              <Select onValueChange={handleGoalChange} value={watchedGoal || ''}>
                <SelectTrigger className="bg-white/90 border-white/20">
                  <SelectValue placeholder="Select your primary goal" />
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
                {t('onboarding:goals.days_per_week')}
              </Label>
              <Select onValueChange={handleDaysPerWeekChange} value={form.watch('days_per_week')?.toString() || ''}>
                <SelectTrigger className="bg-white/90 border-white/20">
                  <SelectValue placeholder="Select training frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 days per week</SelectItem>
                  <SelectItem value="3">3 days per week</SelectItem>
                  <SelectItem value="4">4 days per week</SelectItem>
                  <SelectItem value="5">5 days per week</SelectItem>
                  <SelectItem value="6">6 days per week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:goals.days_of_week')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={form.getValues('days_of_week')?.includes(day.value as any) || false}
                      onCheckedChange={(checked: boolean) => handleDayToggle(day.value, checked)}
                    />
                    <Label htmlFor={day.value} className="text-white/90">{day.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment */}
            <div className="space-y-2">
              <Label className="text-white font-medium">
                {t('onboarding:goals.environment')}
              </Label>
              <Select onValueChange={handleEnvironmentChange} value={watchedEnvironment || ''}>
                <SelectTrigger className="bg-white/90 border-white/20">
                  <SelectValue placeholder="Select your training environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial_gym">Commercial Gym</SelectItem>
                  <SelectItem value="home_basic">Home (Basic Equipment)</SelectItem>
                  <SelectItem value="home_rack">Home (Full Rack)</SelectItem>
                  <SelectItem value="outdoors_mixed">Outdoors/Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipment (only for home_basic) */}
            {watchedEnvironment === 'home_basic' && (
              <div className="space-y-2">
                <Label className="text-white font-medium">
                  {t('onboarding:goals.equipment_basic')}
                </Label>
                <p className="text-white/70 text-sm">
                  {t('onboarding:goals.equipment_explain')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {HOME_BASIC_EQUIPMENT.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={form.getValues('equipment')?.includes(equipment) || false}
                        onCheckedChange={(checked: boolean) => handleEquipmentToggle(equipment, checked)}
                      />
                      <Label htmlFor={equipment} className="text-white/90 capitalize">
                        {equipment.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate('/app/onboarding/biometrics')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {t('onboarding:goals.back')}
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? 'Saving...' : t('onboarding:goals.next')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default GoalsPage
