import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-12">
          <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">{t('app:notFound.title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('app:notFound.message')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => setLocation('/')} className="gap-2">
              <Home className="h-4 w-4" />
              {t('common:backHome')}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common:goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
