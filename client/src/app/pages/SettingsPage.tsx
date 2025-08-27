import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { db } from '@/db/gymbud-db'
import { pendingCount, requestFlush } from '@/sync/queue'
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, User, Bell, Globe, Database, LogOut } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

function SettingsPage() {
  const { t, i18n } = useTranslation(['app', 'common', 'errors'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // Settings state
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial')
  const [language, setLanguage] = useState('en')

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
      
      // Load user preferences (placeholder)
      setNotifications(true)
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

  if (loading) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
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

        {/* Main content */}
        <div className="min-h-screen grid place-items-center py-4 relative z-10">
          <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
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

      {/* Main content */}
      <div className="min-h-screen grid place-items-center py-4 relative z-10">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
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

          {/* Account Section */}
          <div className="mb-6">
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
          <div className="mb-6">
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-white" />
                <span className="text-white text-sm">{t('app:settings.language')}</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/20 text-white text-sm rounded-lg px-3 py-1 border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent"
              >
                <option value="en" className="bg-slate-800 text-white">{t('common:languages.en')}</option>
                <option value="pt-BR" className="bg-slate-800 text-white">{t('common:languages.pt-BR')}</option>
              </select>
            </div>
          </div>

          {/* Units */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-white" />
              <h2 className="text-sm font-semibold text-white">{t('app:settings.units')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setUnits('imperial')}
                className={`p-2 rounded-lg text-xs transition-all duration-200 ${
                  units === 'imperial' 
                    ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t('app:settings.imperial')}
              </button>
              <button
                onClick={() => setUnits('metric')}
                className={`p-2 rounded-lg text-xs transition-all duration-200 ${
                  units === 'metric' 
                    ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t('app:settings.metric')}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white" />
                <span className="text-white text-sm">{t('app:settings.notifications')}</span>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#00BFA6] data-[state=checked]:to-[#64FFDA]"
              />
            </div>
          </div>

          {/* Sync Status */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-white" />
              <h2 className="text-sm font-semibold text-white">{t('app:settings.sync.title')}</h2>
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
              {syncing ? t('app:sync.syncing') : t('app:settings.sync.syncNow')}
            </Button>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7] text-sm py-2"
            >
              {saving ? t('app:settings.saving') : t('app:settings.save')}
            </Button>
            
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
      </div>
      
      <BottomNav />
    </div>
  )
}

export { SettingsPage as default }
export { SettingsPage }
