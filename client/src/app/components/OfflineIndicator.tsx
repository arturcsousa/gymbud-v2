import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WifiOff, RefreshCw } from 'lucide-react'
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
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-orange-100 border border-orange-300 rounded-lg px-3 py-2 shadow-lg">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-800">
          {t('app:offline.indicator')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForceSync}
          disabled={isManualSyncing}
          className="h-6 px-2 text-orange-700 hover:bg-orange-200"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isManualSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
