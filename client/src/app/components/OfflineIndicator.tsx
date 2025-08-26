import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/lib/net/useOnlineStatus'

export function OfflineIndicator() {
  const { t } = useTranslation(['app'])
  const isOnline = useOnlineStatus()
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  const handleForceSync = async () => {
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
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t('app:sync.offline')}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForceSync}
          disabled={isManualSyncing}
          className="text-yellow-700 hover:bg-yellow-100"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isManualSyncing ? 'animate-spin' : ''}`} />
          {t('app:sync.retry')}
        </Button>
      </div>
    </div>
  )
}
