import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { syncEngine, SyncStatus } from '@/app/sync/engine'

interface OfflineIndicatorProps {
  status: SyncStatus
}

export function OfflineIndicator({ status }: OfflineIndicatorProps) {
  const { t } = useTranslation(['app', 'common'])

  const handleSyncClick = () => {
    syncEngine.forcSync()
  }

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return t('app:sync.never')
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return t('app:sync.justNow')
    if (diffMins < 60) return t('app:sync.minutesAgo', { count: diffMins })
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return t('app:sync.hoursAgo', { count: diffHours })
    
    return t('app:sync.daysAgo', { count: Math.floor(diffHours / 24) })
  }

  return (
    <div className="bg-background border-b border-border px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {status.isOnline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          
          <span className={status.isOnline ? 'text-green-700' : 'text-red-700'}>
            {status.isOnline ? t('app:status.online') : t('app:status.offline')}
          </span>
          
          {!status.isOnline && (
            <span className="text-muted-foreground">
              • {t('app:status.offlineMessage')}
            </span>
          )}
        </div>

        {/* Sync status and controls */}
        <div className="flex items-center gap-4 text-sm">
          {/* Pending mutations */}
          {status.pendingMutations > 0 && (
            <span className="text-amber-600">
              {t('app:sync.pending', { count: status.pendingMutations })}
            </span>
          )}
          
          {/* Error indicator */}
          {status.error && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="max-w-xs truncate" title={status.error}>
                {status.error}
              </span>
            </div>
          )}
          
          {/* Last sync time */}
          <span className="text-muted-foreground">
            {t('app:sync.lastSync')}: {formatLastSync(status.lastSyncTime)}
          </span>
          
          {/* Sync button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncClick}
            disabled={status.isSyncing || !status.isOnline}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${status.isSyncing ? 'animate-spin' : ''}`} />
            <span className="ml-1">
              {status.isSyncing ? t('app:sync.syncing') : t('app:sync.sync')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
