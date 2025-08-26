import { useState } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface AuthPageProps {
  params: {
    action?: string
  }
}

const PALETTE = {
  deepTeal: '#005870',
  teal: '#0C8F93',
  aqua: '#18C7B6',
  orange: '#FF9F1C',
}

export function AuthPage({ params }: AuthPageProps) {
  const { t } = useTranslation(['auth', 'common'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
        setError(t('auth:reset.emailSent'))
      } else if (isSignUp) {
        console.log('Attempting signup with:', { email, passwordLength: password.length })
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        console.log('Signup response:', { data, error })
        if (error) {
          console.error('Signup error details:', error)
          throw error
        }
        // Check if email confirmation is required
        if (data?.user && !data.session) {
          setError(t('auth:signup.checkEmail'))
          return
        }
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
      setError(error.message || t('auth:errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (isReset) return t('auth:reset.title')
    if (isSignUp) return t('auth:signup.title')
    return t('auth:signin.title')
  }

  const getSubtitle = () => {
    if (isReset) return t('auth:reset.subtitle')
    if (isSignUp) return t('auth:signup.subtitle')
    return t('auth:signin.subtitle')
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PALETTE.deepTeal} 0%, ${PALETTE.teal} 50%, ${PALETTE.aqua} 100%)`,
      }}
    >
      {/* Curved orange accent section */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full opacity-20"
        style={{
          background: `linear-gradient(135deg, ${PALETTE.aqua} 0%, ${PALETTE.orange} 70%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Decorative gradient blobs */}
      <div 
        className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: PALETTE.orange }}
      />
      <div 
        className="absolute bottom-20 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: PALETTE.aqua }}
      />

      {/* Header with Language Switcher only */}
      <div className="relative z-20 flex justify-end items-center p-4 pt-6">
        <div className="text-white">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Centered GymBud White Logo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            <img 
              src="/images/gymbud-wh.png" 
              alt="GymBud" 
              className="w-20 h-20 mb-4"
            />
          </motion.div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight"
            >
              {getTitle()}
            </motion.h1>
          </div>

          {/* Glassmorphic Form Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/20 rounded-2xl text-lg px-6 backdrop-blur-sm transition-all duration-200"
                  placeholder={t('auth:placeholders.email')}
                />
              </div>

              {/* Password Field */}
              {!isReset && (
                <div className="space-y-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-white/20 rounded-2xl text-lg px-6 pr-14 backdrop-blur-sm transition-all duration-200"
                    placeholder={t('auth:placeholders.password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-sm backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-2xl transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-0"
                style={{ 
                  backgroundColor: PALETTE.aqua, 
                  color: PALETTE.deepTeal 
                }}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: PALETTE.deepTeal }}></div>
                ) : (
                  <>
                    {isReset && t('auth:reset.submit')}
                    {isSignUp && t('auth:signup.submit')}
                    {!isReset && !isSignUp && t('auth:signin.submit')}
                  </>
                )}
              </Button>
            </form>

            {/* Bottom Links */}
            <div className="text-center space-y-4 pt-8">
              {!isReset && (
                <button
                  onClick={() => setLocation(isSignUp ? '/auth/signin' : '/auth/signup')}
                  className="text-white/80 hover:text-white text-base transition-colors font-medium"
                >
                  {isSignUp ? 
                    `${t('auth:signup.hasAccount')} ${t('auth:signup.link')}` : 
                    `${t('auth:signin.noAccount')} ${t('auth:signin.link')}`
                  }
                </button>
              )}
              
              {!isSignUp && !isReset && (
                <div>
                  <button
                    onClick={() => setLocation('/auth/reset')}
                    className="text-white/80 hover:text-white text-base transition-colors font-medium"
                  >
                    {t('auth:reset.link')}
                  </button>
                </div>
              )}
              
              {isReset && (
                <button
                  onClick={() => setLocation('/auth/signin')}
                  className="text-white/80 hover:text-white text-base transition-colors font-medium"
                >
                  {t('auth:reset.backToSignIn')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
