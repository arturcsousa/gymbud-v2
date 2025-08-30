import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { BioSchema, type BioFormData } from '@/schemas/onboarding'
import { OnboardingStore } from '@/db/onboarding-store'
import { supabase } from '@/lib/supabase'
import { telemetry } from '@/lib/telemetry'

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
      telemetry.track('onb_step_viewed', { step_id: 'biometrics' })
      
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
      telemetry.track('onb_saved', { step_id: 'biometrics' })
      
      // Navigate to next step
      navigate('/app/onboarding/goals')
    } catch (error) {
      console.error('Failed to save biometrics:', error)
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
            {t('onboarding:steps.biometrics.title')}
          </h1>
          <p className="text-white/70 text-sm max-w-md mx-auto">
            {t('onboarding:steps.biometrics.explain')}
          </p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-white font-medium">
                  {t('onboarding:steps.biometrics.first_name')} <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="Artur"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-300">{form.formState.errors.first_name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-white font-medium">
                  {t('onboarding:steps.biometrics.last_name')} <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Sousa"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-300">{form.formState.errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height_cm" className="text-white font-medium">
                  {t('onboarding:steps.biometrics.height_cm')} <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="height_cm"
                  type="number"
                  {...form.register('height_cm', { valueAsNumber: true })}
                  placeholder="167"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
                {form.formState.errors.height_cm && (
                  <p className="text-sm text-red-300">{form.formState.errors.height_cm.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight_kg" className="text-white font-medium">
                  {t('onboarding:steps.biometrics.weight_kg')} <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  {...form.register('weight_kg', { valueAsNumber: true })}
                  placeholder="80"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
                {form.formState.errors.weight_kg && (
                  <p className="text-sm text-red-300">{form.formState.errors.weight_kg.message}</p>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="body_fat_pct" className="text-white/70 font-medium text-sm">
                  {t('onboarding:steps.biometrics.body_fat_pct')}
                </Label>
                <Input
                  id="body_fat_pct"
                  type="number"
                  step="0.1"
                  {...form.register('body_fat_pct', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                  })}
                  placeholder="20"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rhr_bpm" className="text-white/70 font-medium text-sm">
                  {t('onboarding:steps.biometrics.rhr_bpm')}
                </Label>
                <Input
                  id="rhr_bpm"
                  type="number"
                  {...form.register('rhr_bpm', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? undefined : parseFloat(value)
                  })}
                  placeholder="65"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
                />
              </div>
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-white/70 font-medium text-sm">
                {t('onboarding:steps.biometrics.birthdate')} <span className="text-red-300">*</span>
              </Label>
              <Input
                id="birthdate"
                type="date"
                {...form.register('birthdate')}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white/50"
              />
              {form.formState.errors.birthdate && (
                <p className="text-sm text-red-300">{form.formState.errors.birthdate.message}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('onboarding:steps.biometrics.back')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    {t('onboarding:steps.biometrics.next')}
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

export default BiometricsPage
export { BiometricsPage }
