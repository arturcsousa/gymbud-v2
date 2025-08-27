import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
]

const HOME_BASIC_EQUIPMENT = [
  'dumbbells', 'resistance_bands', 'yoga_mat', 'pull_up_bar', 
  'kettlebell', 'foam_roller', 'stability_ball', 'jump_rope'
]

export function GoalsPage() {
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
      } else {
        // Set defaults based on locale
        const isMetric = i18n.language === 'pt-BR'
        form.setValue('units', isMetric ? 'metric' : 'imperial')
        form.setValue('date_format', isMetric ? 'dmy' : 'mdy')
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
      
      await OnboardingStore.saveState({
        user_id: userId,
        ...data,
        ai_tone,
        units: isMetric ? 'metric' : 'imperial',
        date_format: isMetric ? 'dmy' : 'mdy'
      })
      
      // Navigate to next step
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
      form.setValue('days_of_week', [...currentDays, day as any])
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

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t('onboarding:goals.title')}
          </CardTitle>
          <p className="text-sm text-gray-600 text-center mt-2">
            {t('onboarding:goals.explain')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>{t('onboarding:goals.goal_primary')}</Label>
              <Select onValueChange={(value) => form.setValue('goal_primary', value as any)}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>{t('onboarding:goals.days_per_week')}</Label>
              <Select onValueChange={(value) => form.setValue('days_per_week', Number(value) as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="How many days per week?" />
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

            {watchedDaysPerWeek && (
              <div className="space-y-2">
                <Label>{t('onboarding:goals.days_of_week')}</Label>
                <p className="text-xs text-gray-500 mb-2">
                  {t('onboarding:goals.schedule_explain')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={form.getValues('days_of_week')?.includes(day.value as any)}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                      />
                      <Label htmlFor={day.value}>{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('onboarding:goals.environment')}</Label>
              <Select onValueChange={(value) => form.setValue('environment', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Where do you train?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial_gym">Commercial Gym</SelectItem>
                  <SelectItem value="home_basic">Home (Basic Equipment)</SelectItem>
                  <SelectItem value="home_rack">Home (Full Rack Setup)</SelectItem>
                  <SelectItem value="outdoors_mixed">Outdoors/Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watchedEnvironment === 'home_basic' && (
              <div className="space-y-2">
                <Label>{t('onboarding:goals.equipment_basic')}</Label>
                <p className="text-xs text-gray-500 mb-2">
                  {t('onboarding:goals.equipment_explain')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {HOME_BASIC_EQUIPMENT.map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={form.getValues('equipment')?.includes(equipment)}
                        onCheckedChange={(checked) => handleEquipmentToggle(equipment, checked as boolean)}
                      />
                      <Label htmlFor={equipment} className="capitalize">
                        {equipment.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {watchedGoal && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {t('onboarding:goals.tone_auto')} <strong>{GOAL_TONE_MAP[watchedGoal]}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/app/onboarding/biometrics')}
              >
                {t('onboarding:biometrics.back')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading || !watchedGoal || !watchedDaysPerWeek}
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

export { GoalsPage }
