import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { db } from '@/db/gymbud-db'
import { pendingCount, requestFlush } from '@/sync/queue'
import { usePWAUpdate } from '@/app/hooks/usePWAUpdate'
import { usePWAInstall } from '@/app/hooks/usePWAInstall'
import { RefreshCw, Clock, CheckCircle, AlertCircle, Download, Smartphone, Info } from 'lucide-react'

function SettingsPage() {
  const { t, i18n } = useTranslation(['app', 'common', 'errors'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  
  // Settings state
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial')
  const [language, setLanguage] = useState('en')

  // PWA hooks
  const { checkForUpdates } = usePWAUpdate()
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall()

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
  
  const recentSyncEvents = useLiveQuery(
    () => db.sync_events.orderBy('ts').reverse().limit(10).toArray(),
    []
  )

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
      
      // Load user preferences (placeholder)
      setNotifications(true)
      setDarkMode(false)
      setUnits('imperial')
      setLanguage(i18n.language)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Save settings (placeholder)
      console.log('Saving settings:', {
        notifications,
        darkMode,
        units,
        language
      })
      
      // Change language if different
      if (language !== i18n.language) {
        await i18n.changeLanguage(language)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
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

  const formatEventTime = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleCheckForUpdates = async () => {
    setCheckingUpdates(true)
    try {
      await checkForUpdates()
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleInstallApp = async () => {
    try {
      await triggerInstall()
    } catch (error) {
      console.error('Error installing app:', error)
    }
  }

  if (loading) {
    return (
      <ContentLayout title={t('app:nav.settings')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout
      title={t('app:nav.settings')}
      showNavigation={true}
      onBack={handleBackToHome}
      onNext={handleSaveSettings}
      nextLabel={t('app:settings.save')}
      backLabel={t('app:nav.home')}
      nextDisabled={saving}
    >
      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:settings.account')}
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white text-sm mb-2 block">
                {t('app:settings.email')}
              </Label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 opacity-60"
              />
              <p className="text-white/60 text-xs mt-1">
                {t('app:settings.emailReadonly')}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:settings.preferences')}
          </h2>
          
          <div className="space-y-6">
            {/* Language */}
            <div>
              <Label className="text-white text-sm mb-2 block">
                {t('app:settings.language')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl text-left transition-all duration-200 ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="font-medium">English</div>
                  <div className="text-sm opacity-70">EN</div>
                </button>
                <button
                  onClick={() => setLanguage('pt-BR')}
                  className={`p-3 rounded-xl text-left transition-all duration-200 ${
                    language === 'pt-BR' 
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="font-medium">Português</div>
                  <div className="text-sm opacity-70">PT-BR</div>
                </button>
              </div>
            </div>

            {/* Units */}
            <div>
              <Label className="text-white text-sm mb-2 block">
                {t('app:settings.units')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUnits('imperial')}
                  className={`p-3 rounded-xl text-left transition-all duration-200 ${
                    units === 'imperial' 
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="font-medium">{t('app:settings.imperial')}</div>
                  <div className="text-sm opacity-70">lbs, ft, in</div>
                </button>
                <button
                  onClick={() => setUnits('metric')}
                  className={`p-3 rounded-xl text-left transition-all duration-200 ${
                    units === 'metric' 
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="font-medium">{t('app:settings.metric')}</div>
                  <div className="text-sm opacity-70">kg, cm</div>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm font-medium">
                  {t('app:settings.notifications')}
                </Label>
                <p className="text-white/70 text-xs mt-1">
                  {t('app:settings.notificationsDesc')}
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#00BFA6] data-[state=checked]:to-[#64FFDA]"
              />
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm font-medium">
                  {t('app:settings.darkMode')}
                </Label>
                <p className="text-white/70 text-xs mt-1">
                  {t('app:settings.darkModeDesc')}
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#00BFA6] data-[state=checked]:to-[#64FFDA]"
              />
            </div>
          </div>
        </div>

        {/* Sync Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:settings.sync.title')}
          </h2>
          
          <div className="space-y-4">
            {/* Sync Status */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">
                    {t('app:settings.sync.status')}
                  </span>
                  {syncMeta?.lastSyncStatus === 'running' && (
                    <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                  )}
                  {syncMeta?.lastSyncStatus === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {syncMeta?.lastSyncStatus === 'failure' && (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Clock className="h-3 w-3" />
                  {syncMeta?.lastSyncAt ? (
                    <span>
                      {t('app:sync.lastSync')}: {formatTimeAgo(syncMeta.lastSyncAt)}
                    </span>
                  ) : (
                    <span>{t('app:sync.never')}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {pendingMutationsCount !== undefined && pendingMutationsCount > 0 && (
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    {t('app:sync.pending', { count: pendingMutationsCount })}
                  </Badge>
                )}
                
                {syncMeta?.lastSyncStatus === 'failure' && syncMeta?.lastSyncErrorCode && (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                    {t(`errors:${syncMeta.lastSyncErrorCode}`)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Sync Now Button */}
            <Button
              onClick={handleSyncNow}
              disabled={syncing || syncMeta?.lastSyncStatus === 'running'}
              className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7] rounded-xl font-medium"
            >
              {syncing || syncMeta?.lastSyncStatus === 'running' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('app:sync.syncing')}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('app:settings.sync.syncNow')}
                </>
              )}
            </Button>

            {/* Recent Events Timeline */}
            {recentSyncEvents && recentSyncEvents.length > 0 && (
              <div>
                <h3 className="text-white text-sm font-medium mb-2">
                  {t('app:settings.sync.recentEvents')}
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentSyncEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-white/40">•</span>
                      <span className="font-mono">{formatEventTime(event.ts)}</span>
                      <span>—</span>
                      {event.kind === 'success' ? (
                        <span className="text-green-400">
                          {t('app:settings.sync.success')} 
                          {event.items && ` (${event.items} ${t('app:settings.sync.items')})`}
                        </span>
                      ) : (
                        <span className="text-red-400">
                          {t('app:settings.sync.failure')}
                          {event.code && ` (${t(`errors:${event.code}`)})`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!recentSyncEvents || recentSyncEvents.length === 0) && (
              <div className="text-center py-4">
                <p className="text-white/60 text-sm">
                  {t('app:settings.sync.noEvents')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Data Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:settings.data')}
          </h2>
          
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/20 rounded-xl"
            >
              {t('app:settings.exportData')}
            </Button>
          </div>
        </div>

        {/* About/Version Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">
            {t('app:settings.about')}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">
                {t('app:settings.version')} 1.0.0
              </span>
            </div>
            <Button
              onClick={handleCheckForUpdates}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/20 rounded-xl"
            >
              {checkingUpdates ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('app:settings.checkingForUpdates')}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t('app:settings.checkForUpdates')}
                </>
              )}
            </Button>
            <Button
              onClick={handleInstallApp}
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/20 rounded-xl"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              {isInstalled ? (
                t('app:settings.appInstalled')
              ) : isInstallable ? (
                t('app:settings.installApp')
              ) : (
                t('app:settings.installNotAvailable')
              )}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-red-500/20">
          <h2 className="text-lg font-bold text-red-300 mb-4">
            {t('app:settings.dangerZone')}
          </h2>
          
          <div className="space-y-3">
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-red-300 hover:bg-red-500/20 rounded-xl"
            >
              {t('app:auth.signOut')}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-red-300 hover:bg-red-500/20 rounded-xl"
            >
              {t('app:settings.deleteAccount')}
            </Button>
          </div>
        </div>
      </div>
    </ContentLayout>
  )
}

export { SettingsPage as default }
export { SettingsPage }
