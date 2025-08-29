import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useSettings } from '@/providers/SettingsProvider'
import { requestNotificationPermission, scheduleNotifications, clearScheduledNotifications, type NotificationPreferences } from '@/services/notificationScheduler'
import { Bell, Clock } from 'lucide-react'

export function NotificationPreferencesCard() {
  const { t } = useTranslation(['settings'])
  const { settings, update } = useSettings()
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: settings.notifications_opt_in || false,
    dailyTime: '20:00',
    weeklyDay: 0, // Sunday
    weeklyTime: '18:00',
    quietHoursStart: '',
    quietHoursEnd: ''
  })

  useEffect(() => {
    // Load preferences from settings or localStorage
    const stored = localStorage.getItem('notification_preferences')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse stored notification preferences:', error)
      }
    }
  }, [])

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Request permission first
      const permissionResult = await requestNotificationPermission()
      if (!permissionResult.granted) {
        toast({
          title: t('notifications.permission.denied'),
          description: permissionResult.error,
          variant: 'destructive',
        })
        return
      }
    }

    const newPreferences = { ...preferences, enabled }
    setPreferences(newPreferences)
    
    // Update global settings
    await update({ notifications_opt_in: enabled })
    
    // Schedule or clear notifications
    if (enabled) {
      await scheduleNotifications(newPreferences)
    } else {
      await clearScheduledNotifications()
    }

    // Store preferences
    localStorage.setItem('notification_preferences', JSON.stringify(newPreferences))
  }

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      if (preferences.enabled) {
        await scheduleNotifications(preferences)
        toast({
          title: t('notifications.save'),
          description: 'Notification preferences saved successfully',
        })
      }
      
      // Store preferences
      localStorage.setItem('notification_preferences', JSON.stringify(preferences))
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-white" />
        <h2 className="text-sm font-semibold text-white">{t('notifications.title')}</h2>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white text-sm font-medium">{t('notifications.enable')}</span>
          <div className="text-white/70 text-xs mt-1">{t('notifications.desc')}</div>
        </div>
        <Switch
          checked={preferences.enabled}
          onCheckedChange={handleToggleNotifications}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#00BFA6] data-[state=checked]:to-[#64FFDA]"
        />
      </div>

      {preferences.enabled && (
        <>
          {/* Daily Reminder */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-white" />
                <h3 className="text-white font-medium text-sm">{t('notifications.daily.title')}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs">{t('notifications.daily.time')}</Label>
                  <Input
                    type="time"
                    value={preferences.dailyTime}
                    onChange={(e) => updatePreference('dailyTime', e.target.value)}
                    className="bg-white/20 text-white border-white/30 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-white font-medium text-sm">{t('notifications.weekly.title')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs">{t('notifications.weekly.weekday')}</Label>
                  <Select 
                    value={preferences.weeklyDay.toString()} 
                    onValueChange={(v) => updatePreference('weeklyDay', parseInt(v))}
                  >
                    <SelectTrigger className="bg-white/20 text-white border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map(day => (
                        <SelectItem key={day} value={day.toString()}>
                          {t(`notifications.weekdays.${day}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/70 text-xs">{t('notifications.weekly.time')}</Label>
                  <Input
                    type="time"
                    value={preferences.weeklyTime}
                    onChange={(e) => updatePreference('weeklyTime', e.target.value)}
                    className="bg-white/20 text-white border-white/30 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="text-white font-medium text-sm">{t('notifications.quietHours.title')}</h3>
                <p className="text-white/70 text-xs mt-1">{t('notifications.quietHours.desc')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-xs">{t('notifications.quietHours.start')}</Label>
                  <Input
                    type="time"
                    value={preferences.quietHoursStart || ''}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    className="bg-white/20 text-white border-white/30 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">{t('notifications.quietHours.end')}</Label>
                  <Input
                    type="time"
                    value={preferences.quietHoursEnd || ''}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    className="bg-white/20 text-white border-white/30 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSavePreferences}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7] text-sm py-2"
          >
            {loading ? 'Saving...' : t('notifications.save')}
          </Button>
        </>
      )}
    </div>
  )
}
