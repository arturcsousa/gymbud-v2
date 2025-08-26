import { useState } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Moon } from 'lucide-react'

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
    if (isSignUp) return 'Create your account'
    return 'Welcome back'
  }

  const getSubtitle = () => {
    if (isReset) return 'Enter your email to reset your password'
    if (isSignUp) return 'Join thousands of people getting stronger'
    return 'Sign in to continue your fitness journey'
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #334155 100%)'
      }}
    >
      {/* Header with Logo and Dark Mode Toggle */}
      <div className="flex justify-between items-center p-6 pt-12">
        <div className="flex items-center gap-3">
          {/* GymBud Logo */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
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
        
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors">
          <Moon className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Step Indicator */}
        <div className="text-center mb-12">
          <p className="text-white/60 text-sm mb-6">
            {isSignUp ? 'Step 1 of 2' : isReset ? 'Password Reset' : 'Welcome Back'}
          </p>
          
          <h1 className="text-white text-4xl font-bold mb-4">
            {getTitle()}
          </h1>
          
          <p className="text-white/70 text-lg">
            {getSubtitle()}
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-white/40 focus:border-[#18C7B6]/50 focus:ring-[#18C7B6]/20 rounded-2xl text-lg px-6"
                placeholder="Email address"
              />
            </div>

            {/* Password Field */}
            {!isReset && (
              <div className="space-y-3">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-white/40 focus:border-[#18C7B6]/50 focus:ring-[#18C7B6]/20 rounded-2xl text-lg px-6"
                  placeholder="Password"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-white bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#18C7B6] hover:bg-[#0C8F93] text-slate-900 text-lg font-semibold rounded-2xl transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
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
          <div className="text-center space-y-4 pt-6">
            {!isReset && (
              <button
                onClick={() => setLocation(isSignUp ? '/auth/signin' : '/auth/signup')}
                className="text-white/70 hover:text-white text-base transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
              </button>
            )}
            
            {!isSignUp && !isReset && (
              <div>
                <button
                  onClick={() => setLocation('/auth/reset')}
                  className="text-white/70 hover:text-white text-base transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}
            
            {isReset && (
              <button
                onClick={() => setLocation('/auth/signin')}
                className="text-white/70 hover:text-white text-base transition-colors"
              >
                Back to sign in
              </button>
            )}

            {/* Skip for now - only show on signup */}
            {isSignUp && (
              <div className="pt-8">
                <button
                  onClick={() => setLocation('/')}
                  className="text-white/70 hover:text-white text-lg transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
