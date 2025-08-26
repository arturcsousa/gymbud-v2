import { useState } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AuthPageProps {
  params: {
    action?: string
  }
}

export function AuthPage({ params }: AuthPageProps) {
  const { t } = useTranslation(['auth', 'common'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const action = params.action || 'signin'
  const isSignUp = action === 'signup'
  const isReset = action === 'reset'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setError('Password reset email sent!')
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setLocation('/')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setLocation('/')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (isReset) return t('auth:reset.title')
    if (isSignUp) return t('auth:signup.title')
    return t('auth:signin.title')
  }

  return (
    <ContentLayout title={getTitle()}>
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                {t('auth:email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
                placeholder={t('auth:emailPlaceholder')}
              />
            </div>

            {!isReset && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  {t('auth:password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
                  placeholder={t('auth:passwordPlaceholder')}
                />
              </div>
            )}

            {error && (
              <div className="text-white bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-12 text-base font-semibold rounded-xl transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
              ) : (
                <>
                  {isReset && t('auth:reset.submit')}
                  {isSignUp && t('auth:signup.submit')}
                  {!isReset && !isSignUp && t('auth:signin.submit')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {!isReset && (
              <>
                <button
                  onClick={() => setLocation(isSignUp ? '/auth/signin' : '/auth/signup')}
                  className="text-white/80 hover:text-white text-sm underline transition-colors"
                >
                  {isSignUp ? t('auth:signin.link') : t('auth:signup.link')}
                </button>
                <br />
                <button
                  onClick={() => setLocation('/auth/reset')}
                  className="text-white/80 hover:text-white text-sm underline transition-colors"
                >
                  {t('auth:reset.link')}
                </button>
              </>
            )}
            
            {isReset && (
              <button
                onClick={() => setLocation('/auth/signin')}
                className="text-white/80 hover:text-white text-sm underline transition-colors"
              >
                {t('auth:signin.link')}
              </button>
            )}
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}
