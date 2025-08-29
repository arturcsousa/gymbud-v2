import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { db } from '@/db/gymbud-db'
import { useSettings } from '@/providers/SettingsProvider'
import { pendingCount, requestFlush, retryFailed, retryAllFailed, deleteFailed, clearAllFailed, retryWithOverride, acceptServerVersion } from '@/sync/queue'
import { errorLabels } from '@/lib/errors/mapEdgeError'
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, User, Globe, Database, LogOut, Code } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { SettingsUtilities } from '@/components/SettingsUtilities'
import { NotificationPreferencesCard } from '@/components/NotificationPreferences'

function SyncEventsLog() {
  const { t } = useTranslation(['settings'])
  const events = useLiveQuery(
    () => db.sync_events.orderBy('ts').reverse().limit(10).toArray(),
    []
  )

  if (!events?.length) return <p className="text-white/70 text-xs">{t('sync.noEvents')}</p>

  return (
    <ul className="space-y-2 text-sm">
      {events.map(ev => (
        <li key={ev.id} className="text-white/80 text-xs">
          <span>{new Date(ev.ts).toLocaleTimeString()} — {ev.kind}</span>
        </li>
      ))}
    </ul>
  )
}

function DeadLetterPanel() {
  const { t } = useTranslation(['settings'])
  const failed = useLiveQuery(
    () => db.queue_mutations.where('status').equals('failed').reverse().limit(50).toArray(),
    [],
    []
  )

  if (!failed?.length) {
    return <p className="text-white/80">{t('sync.noFailed')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={retryAllFailed} variant="default" size="sm" className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7]">
          {t('sync.retryAll')}
        </Button>
        <Button onClick={clearAllFailed} variant="destructive" size="sm" className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30">
          {t('sync.deleteAll')}
        </Button>
      </div>
      <ul className="divide-y divide-white/10 rounded-xl ring-1 ring-white/10 bg-white/5">
        {failed.map(m => (
          <li key={m.id} className="p-3 flex items-center justify-between">
            <div className="text-sm text-white/90">
              <div className="font-semibold">{m.entity} · {m.op}</div>
              <div className="text-white/70">
                {errorLabels[m.last_error_code as keyof typeof errorLabels] || errorLabels.unknown}{' '}
                {m.attempts ? `(${m.attempts}x)` : null}
              </div>
              <div className="text-white/60">
                {t('sync.lastTried')} {new Date(m.last_error_at ?? Date.now()).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => retryFailed(m.id)}
                className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7]"
              >
                {t('sync.retry')}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => deleteFailed(m.id)}
                className="border-white/30 text-white hover:bg-white/10"
              >
                {t('sync.delete')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConflictsPanel() {
  const { t } = useTranslation(['settings']);
  const conflicts = useLiveQuery(() => db.conflicts.orderBy('updated_at').reverse().toArray(), [], []);

  if (!conflicts?.length) {
    return <p className="text-white/80">{t('conflicts.none')}</p>;
  }

  const formatVal = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-white/10 rounded-xl ring-1 ring-white/10 bg-white/5">
        {conflicts.map(c => (
          <li key={c.id} className="p-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="text-sm">
              <div className="font-semibold text-white">
                {c.entity} · {c.entity_id}
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
                  {t('conflicts.badge')}
                </span>
              </div>
              <div className="text-white/70">{t('conflicts.seenAt', { ts: new Date(c.first_seen_at).toLocaleString() })}</div>
              {c.diff?.length ? (
                <table className="mt-2 w-full text-xs text-white/80">
                  <thead className="text-white/60">
                    <tr><th className="text-left pr-2">{t('conflicts.field')}</th><th className="text-left pr-2">{t('conflicts.local')}</th><th className="text-left">{t('conflicts.server')}</th></tr>
                  </thead>
                  <tbody>
                    {c.diff.map((d, i) => (
                      <tr key={i}>
                        <td className="align-top pr-2">{d.field}</td>
                        <td className="align-top pr-2">{formatVal(d.local)}</td>
                        <td className="align-top">{formatVal(d.server)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-white/60">{t('conflicts.noFieldDiff')}</div>}
            </div>
            <div className="flex md:flex-col gap-2 md:justify-center">
              <Button size="sm" variant="secondary" onClick={() => retryWithOverride(c.id)}>
                {t('conflicts.keepMine')}
              </Button>
              <Button size="sm" variant="default" onClick={() => acceptServerVersion(c.id)}>
                {t('conflicts.keepServer')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingsPage() {
  const { t } = useTranslation(['app', 'common', 'errors', 'settings'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [devMode, setDevMode] = useState(false)
  
  // Use settings context
  const { settings, update, syncing: settingsSyncing } = useSettings()
  
  // Settings state
  const [email, setEmail] = useState('')

  // Live sync data
  const pendingMutationsCount = useLiveQuery(() => pendingCount(), [])
  const syncMeta = useLiveQuery(async () => {
    const lastSyncAt = await db.meta.get('last_sync_at')
    const lastSyncStatus = await db.meta.get('last_sync_status')
    const lastSyncErrorCode = await db.meta.get('last_sync_error_code')
    
    return {
      lastSyncAt: lastSyncAt?.value,
      lastSyncStatus: lastSyncStatus?.value,
      lastSyncErrorCode: lastSyncErrorCode?.value
    }
  }, [])

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setLocation('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleBackToHome = () => {
    setLocation('/')
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      await requestFlush()
    } finally {
      setSyncing(false)
    }
  }

  const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return t('app:sync.justNow')
    if (diffMins < 60) return t('app:sync.minutesAgo', { count: diffMins })
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return t('app:sync.hoursAgo', { count: diffHours })
    
    const diffDays = Math.floor(diffHours / 24)
    return t('app:sync.daysAgo', { count: diffDays })
  }

  if (loading || !settings) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden pb-20"
        style={{
          background: '#005870', // PALETTE.deepTeal
        }}
      >
        {/* Main teal gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
          }}
        />
        
        {/* Subtle lighter teal curved section with diagonal clip */}
        <div 
          className="absolute top-0 right-0 w-2/3 h-full"
          style={{
            background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Loading content */}
        <div className="relative z-10 px-6 pt-8 pb-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">Loading...</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20"
      style={{
        background: '#005870', // PALETTE.deepTeal
      }}
    >
      {/* Main teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      {/* Subtle lighter teal curved section with diagonal clip */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Main content - positioned directly on page */}
      <div className="relative z-10 px-6 pt-8 pb-4 space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToHome}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">
              {t('app:nav.settings')}
            </h1>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">{t('app:settings.account')}</h2>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <Label className="text-white text-xs mb-1 block opacity-70">
              {t('app:settings.email')}
            </Label>
            <div className="text-white text-sm truncate">
              {email || 'Not available'}
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{t('settings.language')}</span>
            </div>
            <Select value={settings.language} onValueChange={(v) => update({ language: v as any })}>
              <SelectTrigger className="w-32 bg-white/20 text-white border-white/30">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Units */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{t('settings.units')}</span>
            </div>
            <Select value={settings.units} onValueChange={(v) => update({ units: v as any })}>
              <SelectTrigger className="w-32 bg-white/20 text-white border-white/30">
                <SelectValue placeholder="Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t('settings.metric')}</SelectItem>
                <SelectItem value="imperial">{t('settings.imperial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Notifications */}
        <NotificationPreferencesCard />

        {/* Utilities Section */}
        <SettingsUtilities />

        {/* Sync Status */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-white" />
            <h2 className="text-sm font-semibold text-white">{t('app:settings.sync.title')}</h2>
            {settingsSyncing && <span className="text-white/60 text-xs">{t('sync.syncing')}</span>}
          </div>
          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-xs">{t('app:settings.sync.status')}</span>
              <div className="flex items-center gap-1">
                {syncMeta?.lastSyncStatus === 'success' && (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                )}
                {syncMeta?.lastSyncStatus === 'failure' && (
                  <AlertCircle className="h-3 w-3 text-red-400" />
                )}
                <span className="text-white text-xs">
                  {syncMeta?.lastSyncAt ? formatTimeAgo(syncMeta.lastSyncAt) : t('app:sync.never')}
                </span>
              </div>
            </div>
            {pendingMutationsCount !== undefined && pendingMutationsCount > 0 && (
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                {t('app:sync.pending', { count: pendingMutationsCount })}
              </Badge>
            )}
          </div>
          <Button
            onClick={handleSyncNow}
            disabled={syncing || syncMeta?.lastSyncStatus === 'running'}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7] text-sm py-2"
          >
            {syncing ? t('app:sync.syncing') : t('settings:sync.syncNow')}
          </Button>
        </div>

        {/* Developer Mode Toggle */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Developer Mode</span>
            </div>
            <Switch
              checked={devMode}
              onCheckedChange={setDevMode}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#00BFA6] data-[state=checked]:to-[#64FFDA]"
            />
          </div>
        </div>

        {/* Sync Events Log (Dev Mode Only) */}
        {devMode && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl ring-1 ring-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">{t('settings:sync.recentEvents')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SyncEventsLog />
            </CardContent>
          </Card>
        )}

        {/* Dead-Letter Queue (Dev Mode Only) */}
        {devMode && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl ring-1 ring-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">{t('settings:sync.deadLetterQueue')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DeadLetterPanel />
            </CardContent>
          </Card>
        )}

        {/* Conflicts Panel (Dev Mode Only) */}
        {devMode && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-xl ring-1 ring-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">{t('conflicts.title')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ConflictsPanel />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20 space-y-3">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-red-300 hover:bg-red-500/20 text-sm py-2"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('app:auth.signOut')}
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

export { SettingsPage as default }
export { SettingsPage }
