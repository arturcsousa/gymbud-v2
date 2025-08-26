import { useState } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'

interface AuthPageProps {
  params: { action?: string }
}

export function AuthPage({ params }: AuthPageProps) {
  const { t } = useTranslation(['app', 'auth'])
  const [, setLocation] = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isSignUp = params.action === 'signup'
  const isReset = params.action === 'reset'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-confirm`
        })
        if (error) throw error
        setMessage(t('auth:reset.emailSent'))
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        })
        if (error) throw error
        setMessage(t('auth:signup.checkEmail'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
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

  const handleMagicLink = async () => {
    if (!email) {
      setError(t('auth:errors.emailRequired'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
      setMessage(t('auth:magicLink.sent'))
    } catch (error: any) {
      setError(error.message || t('auth:errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">GymBud</CardTitle>
          <CardDescription>
            {isReset 
              ? t('auth:reset.title')
              : isSignUp 
                ? t('auth:signup.title')
                : t('auth:signin.title')
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth:fields.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth:placeholders.email')}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password field (not shown for reset) */}
            {!isReset && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth:fields.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth:placeholders.password')}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                isReset 
                  ? t('auth:reset.submit')
                  : isSignUp 
                    ? t('auth:signup.submit')
                    : t('auth:signin.submit')
              )}
            </Button>

            {/* Magic link option (for sign in only) */}
            {!isSignUp && !isReset && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleMagicLink}
                disabled={loading}
              >
                {t('auth:magicLink.button')}
              </Button>
            )}
          </form>

          {/* Navigation links */}
          <div className="mt-6 text-center space-y-2">
            {!isReset && (
              <div>
                <span className="text-sm text-muted-foreground">
                  {isSignUp ? t('auth:signup.hasAccount') : t('auth:signin.noAccount')}
                </span>{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setLocation(isSignUp ? '/auth/signin' : '/auth/signup')}
                >
                  {isSignUp ? t('auth:signin.link') : t('auth:signup.link')}
                </Button>
              </div>
            )}
            
            {!isSignUp && (
              <div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setLocation('/auth/reset')}
                >
                  {t('auth:reset.link')}
                </Button>
              </div>
            )}

            {isReset && (
              <div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setLocation('/auth/signin')}
                >
                  {t('auth:signin.backToSignIn')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
