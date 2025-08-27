import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { BioSchema, type BioFormData } from '@/schemas/onboarding'
import { OnboardingStore } from '@/db/onboarding-store'
import { supabase } from '@/lib/supabase'
import { Telemetry } from '@/lib/telemetry'

function BiometricsPage() {
  const [, navigate] = useLocation()
  const { t } = useTranslation(['onboarding'])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const form = useForm<BioFormData>({
    resolver: zodResolver(BioSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      height_cm: undefined,
      weight_kg: undefined,
      body_fat_pct: undefined,
      rhr_bpm: undefined,
      birthdate: undefined
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
      
      // Track step viewed
      Telemetry.track({ type: 'onb_step_viewed', step_id: 'biometrics' })
      
      // Load existing onboarding state
      const state = await OnboardingStore.getState(user.id)
      if (state) {
        form.reset({
          first_name: state.first_name || '',
          last_name: state.last_name || '',
          height_cm: state.height_cm,
          weight_kg: state.weight_kg,
          body_fat_pct: state.body_fat_pct,
          rhr_bpm: state.rhr_bpm,
          birthdate: state.birthdate
        })
      }
    }

    loadUserAndState()
  }, [form, navigate])

  const onSubmit = async (data: BioFormData) => {
    if (!userId) return

    setLoading(true)
    try {
      await OnboardingStore.saveState({
        user_id: userId,
        ...data
      })
      
      // Track step saved
      Telemetry.track({ type: 'onb_saved', step_id: 'biometrics' })
      
      // Navigate to next step
      navigate('/app/onboarding/goals')
    } catch (error) {
      console.error('Failed to save biometrics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t('onboarding:biometrics.title')}
          </CardTitle>
          <p className="text-sm text-gray-600 text-center mt-2">
            {t('onboarding:biometrics.explain')}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('onboarding:biometrics.first_name')}</Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="John"
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('onboarding:biometrics.last_name')}</Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Doe"
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height_cm">{t('onboarding:biometrics.height_cm')}</Label>
                <Input
                  id="height_cm"
                  type="number"
                  {...form.register('height_cm', { valueAsNumber: true })}
                  placeholder="175"
                />
                {form.formState.errors.height_cm && (
                  <p className="text-sm text-red-500">{form.formState.errors.height_cm.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight_kg">{t('onboarding:biometrics.weight_kg')}</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  {...form.register('weight_kg', { valueAsNumber: true })}
                  placeholder="70.5"
                />
                {form.formState.errors.weight_kg && (
                  <p className="text-sm text-red-500">{form.formState.errors.weight_kg.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="body_fat_pct">{t('onboarding:biometrics.body_fat_pct')}</Label>
                <Input
                  id="body_fat_pct"
                  type="number"
                  step="0.1"
                  {...form.register('body_fat_pct', { valueAsNumber: true })}
                  placeholder="15.0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rhr_bpm">{t('onboarding:biometrics.rhr_bpm')}</Label>
                <Input
                  id="rhr_bpm"
                  type="number"
                  {...form.register('rhr_bpm', { valueAsNumber: true })}
                  placeholder="65"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">{t('onboarding:biometrics.birthdate')}</Label>
              <Input
                id="birthdate"
                type="date"
                {...form.register('birthdate')}
              />
            </div>

            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/')}
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

export default BiometricsPage
