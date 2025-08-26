import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, User, Globe, Download, Trash2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { supabase } from '@/lib/supabase'
import { dataManager } from '@/app/db/indexeddb'

export function SettingsPage() {
  const { t } = useTranslation(['app', 'settings'])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    setExportLoading(true)
    setMessage(null)

    try {
      // Get all user data from IndexedDB
      const sessions = await dataManager.getSessions(user.id, 1000)
      const profile = await dataManager.getProfile(user.id)

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile,
        sessions,
        exported_at: new Date().toISOString(),
        version: '1.0'
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gymbud-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage(t('settings:export.success'))
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage(t('settings:export.error'))
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    const confirmed = window.confirm(t('settings:delete.confirmation'))
    if (!confirmed) return

    setDeleteLoading(true)
    setMessage(null)

    try {
      // Delete user account (this would need proper implementation)
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error

      setMessage(t('settings:delete.success'))
      
      // Sign out and redirect
      setTimeout(() => {
        supabase.auth.signOut()
      }, 2000)
    } catch (error) {
      console.error('Error deleting account:', error)
      setMessage(t('settings:delete.error'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          {t('settings:title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('settings:subtitle')}
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings:account.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{t('settings:account.email')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.email || t('settings:account.notAvailable')}
            </p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">{t('settings:account.memberSince')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.created_at 
                ? new Date(user.created_at).toLocaleDateString()
                : t('settings:account.notAvailable')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings:language.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings:language.current')}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings:language.description')}
              </p>
            </div>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings:data.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings:data.export.title')}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings:data.export.description')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={exportLoading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exportLoading ? t('settings:data.export.loading') : t('settings:data.export.button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('settings:danger.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings:danger.signOut.title')}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {t('settings:danger.signOut.description')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('settings:danger.signOut.button')}
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-destructive">
                  {t('settings:danger.delete.title')}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('settings:danger.delete.description')}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteLoading ? t('settings:danger.delete.loading') : t('settings:danger.delete.button')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
