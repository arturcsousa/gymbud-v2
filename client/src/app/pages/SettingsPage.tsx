import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, User, Globe, Download, Trash2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { supabase } from '@/lib/supabase'
import { useDataManager } from '@/app/data/manager'

export default function SettingsPage() {
  const { t } = useTranslation(['settings', 'common'])
  const dataManager = useDataManager()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear local data
      await dataManager.clearAllData()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleExportData = async () => {
    try {
      setExportLoading(true)
      
      // Get all user data
      const sessions = await dataManager.getAllSessions()
      const exercises = await dataManager.getAllSessionExercises()
      const sets = await dataManager.getAllLoggedSets()
      
      const exportData = {
        sessions,
        exercises,
        sets,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
      
      // Create and download file
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
      
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm(t('settings:danger.delete.confirmation'))) {
      return
    }
    
    try {
      setDeleteLoading(true)
      
      // Clear local data first
      await dataManager.clearAllData()
      
      // Sign out (account deletion would be handled server-side)
      await supabase.auth.signOut()
      
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('settings:title')}</h1>
      </div>

      {/* Account Information */}
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
            <p className="text-sm text-muted-foreground">
              {user?.email || t('settings:account.notAvailable')}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">{t('settings:account.memberSince')}</Label>
            <p className="text-sm text-muted-foreground">
              {user?.created_at 
                ? new Date(user.created_at).toLocaleDateString()
                : t('settings:account.notAvailable')
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings:language.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{t('settings:language.current')}</Label>
            <p className="text-sm text-muted-foreground mb-2">
              {t('settings:language.description')}
            </p>
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
              <p className="text-sm text-muted-foreground">
                {t('settings:data.export.description')}
              </p>
            </div>
            <Button 
              onClick={handleExportData}
              disabled={exportLoading}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
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
          {/* Sign Out */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings:danger.signOut.title')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings:danger.signOut.description')}
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              {t('settings:danger.signOut.button')}
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-destructive">
                {t('settings:danger.delete.title')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings:danger.delete.description')}
              </p>
            </div>
            <Button 
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteLoading ? t('settings:danger.delete.loading') : t('settings:danger.delete.button')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
