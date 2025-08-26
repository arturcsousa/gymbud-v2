import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'

function SettingsPage() {
  const { t, i18n } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Settings state
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial')
  const [language, setLanguage] = useState('en')

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
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/20 rounded-xl"
            >
              {t('app:settings.syncData')}
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
