import { useState } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Moon, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

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
        setError('Password reset email sent!')
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
          setError('Please check your email for a confirmation link before signing in.')
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
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    if (isReset) return 'Reset your password'
    if (isSignUp) return 'Join GymBud'
    return 'Welcome back'
  }

  const getSubtitle = () => {
    if (isReset) return 'Enter your email to reset your password'
    if (isSignUp) return 'Start your fitness journey with AI-powered training'
    return 'Continue your fitness journey'
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

      {/* Header with Logo and Dark Mode Toggle */}
      <div className="relative z-20 flex justify-between items-center p-6 pt-12">
        <div className="flex items-center gap-4">
          {/* GymBud Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-4 bg-slate-800 rounded-full"></div>
                <div className="w-6 h-6 border-2 border-slate-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                  <div className="absolute w-1 h-1 bg-slate-800 rounded-full ml-2 mt-1"></div>
                  <div className="absolute w-1 h-1 bg-slate-800 rounded-full mr-2 mt-1"></div>
                </div>
                <div className="w-2 h-4 bg-slate-800 rounded-full"></div>
              </div>
            </div>
            <span className="text-white text-2xl font-bold">GymBud</span>
          </div>
        </div>
        
        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 shadow-lg">
          <Moon className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Step Indicator */}
          <div className="text-center mb-12">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-sm mb-6 font-medium"
            >
              {isSignUp ? 'Step 1 of 2' : isReset ? 'Password Reset' : 'Welcome Back'}
            </motion.p>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight"
            >
              {getTitle()}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-lg leading-relaxed"
            >
              {getSubtitle()}
            </motion.p>
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
                  placeholder="Email address"
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
                    placeholder="Password"
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
                    {isReset && 'Send Reset Email'}
                    {isSignUp && 'Create Account'}
                    {!isReset && !isSignUp && 'Sign In'}
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
                  {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
                </button>
              )}
              
              {!isSignUp && !isReset && (
                <div>
                  <button
                    onClick={() => setLocation('/auth/reset')}
                    className="text-white/80 hover:text-white text-base transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              
              {isReset && (
                <button
                  onClick={() => setLocation('/auth/signin')}
                  className="text-white/80 hover:text-white text-base transition-colors font-medium"
                >
                  Back to sign in
                </button>
              )}

              {/* Skip for now - only show on signup */}
              {isSignUp && (
                <div className="pt-6">
                  <button
                    onClick={() => setLocation('/')}
                    className="text-white/70 hover:text-white text-lg transition-colors font-medium"
                    style={{ color: PALETTE.orange }}
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
