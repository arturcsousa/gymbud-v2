import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOnlineStatus } from '@/lib/net/useOnlineStatus'

export function OfflineBanner() {
  const { t } = useTranslation(['app'])
  const isOnline = useOnlineStatus()
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    try {
      // Placeholder for manual sync trigger
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsManualSyncing(false)
    }
  }

  if (isOnline) return null

  return (
    <Card className="mx-4 mt-4 border-orange-200 bg-orange-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-900">
              {t('app:sync.offline')}
            </p>
            <p className="text-sm text-orange-700">
              {t('app:sync.offlineMessage')}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualSync}
          disabled={isManualSyncing}
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isManualSyncing ? 'animate-spin' : ''}`} />
          {isManualSyncing ? t('app:sync.syncing') : t('app:sync.retry')}
        </Button>
      </CardContent>
    </Card>
  )
}
