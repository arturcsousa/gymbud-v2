import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/lib/net/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  const { t } = useTranslation('app')
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    const onOfflineReady = () => console.info('[PWA] offline ready')
    const onNeedRefresh = () => console.info('[PWA] update available')
    window.addEventListener('pwa:offline-ready', onOfflineReady)
    window.addEventListener('pwa:need-refresh', onNeedRefresh)
    return () => {
      window.removeEventListener('pwa:offline-ready', onOfflineReady)
      window.removeEventListener('pwa:need-refresh', onNeedRefresh)
    }
  }, [])

  async function syncNow() {
    setSyncing(true)
    try {
      // Step 1 placeholder: check SW updates
      if ((window as any).__gymbud_check_sw) await (window as any).__gymbud_check_sw()

      // Step 2 (next step): we'll flush the mutation queue here
      window.dispatchEvent(new CustomEvent('gymbud:sync-now'))
      setLastSync(new Date().toLocaleString())
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="w-full sticky top-0 z-50">
      <div className={`w-full text-sm text-white px-3 py-2 flex items-center justify-between
        ${online ? 'bg-emerald-600' : 'bg-amber-600'}`}>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
          {syncing
            ? t('sync.syncing')
            : online
              ? t('sync.online') + (lastSync ? ` — ${t('sync.lastSync', { time: lastSync })}` : '')
              : t('sync.offline')}
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 transition"
        >
          {t('sync.syncNow')}
        </button>
      </div>
    </div>
  )
}
