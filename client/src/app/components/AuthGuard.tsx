import { ReactNode } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'

interface AuthGuardProps {
  user: any
  children: ReactNode
}

export function AuthGuard({ user, children }: AuthGuardProps) {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()

  // If user is not authenticated, redirect to auth
  if (!user) {
    setLocation('/auth/signin')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('app:auth.redirecting')}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
