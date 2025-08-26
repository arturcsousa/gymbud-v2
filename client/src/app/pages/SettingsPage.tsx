import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, User, Globe, Download, Trash2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common'])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const exportData = async () => {
    // Placeholder for data export functionality
    console.log('Export data functionality to be implemented')
  }

  const clearData = async () => {
    // Placeholder for data clearing functionality
    console.log('Clear data functionality to be implemented')
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t('settings:title')}</h1>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{t('settings:profile.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-2">
              <Label>{t('settings:profile.email')}</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>{t('settings:language.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => changeLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={i18n.language === 'pt-BR' ? 'default' : 'outline'}
              onClick={() => changeLanguage('pt-BR')}
            >
              Português (BR)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings:data.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button variant="outline" onClick={exportData} className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              {t('settings:data.export')}
            </Button>
            <Button variant="outline" onClick={clearData} className="justify-start text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('settings:data.clear')}
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              {t('settings:data.warning')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings:account.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            disabled={loading}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loading ? t('common:loading') : t('settings:account.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
