import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { regeneratePlan, exportUserData, deleteAccount, getVersionInfo, canInstallPWA, installPWA } from '@/services/settingsUtilities'
import { Download, Trash2, RotateCcw, Info, Smartphone } from 'lucide-react'

export function SettingsUtilities() {
  const { t } = useTranslation(['settings'])
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [includeVoided, setIncludeVoided] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const versionInfo = getVersionInfo()

  const handleRegeneratePlan = async () => {
    if (!confirm(t('utilities.regenerate.confirm'))) return

    setLoading('regenerate')
    try {
      const result = await regeneratePlan()
      if (result.success) {
        toast.success(`${t('utilities.regenerate.success')} - Plan ID: ${result.plan_id}`)
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : String(result.error)
        toast.error(`${t('utilities.regenerate.error')}: ${errorMessage}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`${t('utilities.regenerate.error')}: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleExportData = async () => {
    setLoading('export')
    try {
      const result = await exportUserData(exportFormat, includeVoided)
      if (result.success) {
        toast.success(t('utilities.export.success'))
      } else {
        const errorMessage = result.error || 'Export failed'
        toast.error(`${t('utilities.export.error')}: ${errorMessage}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`${t('utilities.export.error')}: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error(`${t('utilities.delete.error')}: ${t('utilities.delete.confirmPrompt')}`)
      return
    }

    setLoading('delete')
    try {
      const result = await deleteAccount()
      if (result.success) {
        toast.success(`${t('utilities.delete.done')}: Redirecting to home page...`)
        setTimeout(() => setLocation('/'), 2000)
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error)
        toast.error(`${t('utilities.delete.error')}: ${errorMessage}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`${t('utilities.delete.error')}: ${errorMessage}`)
    } finally {
      setLoading(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleInstallPWA = async () => {
    setLoading('install')
    try {
      const success = await installPWA()
      if (success) {
        toast.success('App Install: Install prompt triggered')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Install Error: ${errorMessage}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-white" />
        <h2 className="text-sm font-semibold text-white">{t('utilities.title')}</h2>
      </div>

      {/* Regenerate Plan */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-sm">{t('utilities.regenerate.title')}</h3>
              <p className="text-white/70 text-xs mt-1">{t('utilities.regenerate.desc')}</p>
            </div>
            <Button
              onClick={handleRegeneratePlan}
              disabled={loading === 'regenerate'}
              size="sm"
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7]"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {loading === 'regenerate' ? '...' : t('utilities.regenerate.cta')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium text-sm">{t('utilities.export.title')}</h3>
              <p className="text-white/70 text-xs mt-1">{t('utilities.export.desc')}</p>
            </div>
            <Button
              onClick={handleExportData}
              disabled={loading === 'export'}
              size="sm"
              className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7]"
            >
              <Download className="w-3 h-3 mr-1" />
              {loading === 'export' ? '...' : t('utilities.export.cta')}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'json' | 'csv')}>
              <SelectTrigger className="w-32 bg-white/20 text-white border-white/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">{t('utilities.export.format.json')}</SelectItem>
                <SelectItem value="csv">{t('utilities.export.format.csv')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-voided"
                checked={includeVoided}
                onCheckedChange={(checked) => setIncludeVoided(checked === true)}
                className="border-white/30"
              />
              <label htmlFor="include-voided" className="text-white/80 text-xs">
                {t('utilities.export.includeVoided')}
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-300 font-medium text-sm">{t('utilities.delete.title')}</h3>
              <p className="text-red-200/70 text-xs mt-1">{t('utilities.delete.desc')}</p>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {t('utilities.delete.cta')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-red-500/30">
                <DialogHeader>
                  <DialogTitle className="text-red-300">{t('utilities.delete.title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-white/80 text-sm">{t('utilities.delete.confirmHint')}</p>
                  <Input
                    placeholder={t('utilities.delete.confirmPrompt')}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="bg-white/10 border-white/30 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setDeleteDialogOpen(false)}
                      variant="outline"
                      className="flex-1 border-white/30 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={loading === 'delete' || deleteConfirmText !== 'DELETE'}
                      variant="destructive"
                      className="flex-1 bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                    >
                      {loading === 'delete' ? '...' : t('utilities.delete.cta')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="bg-white/10 backdrop-blur-xl border-white/20">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-white font-medium text-sm">{t('utilities.about.title')}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">{t('utilities.about.version')}</span>
              <span className="text-white">{versionInfo.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">{t('utilities.about.build')}</span>
              <span className="text-white font-mono">{versionInfo.build.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {canInstallPWA() && (
              <Button
                onClick={handleInstallPWA}
                disabled={loading === 'install'}
                size="sm"
                className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4FD1C7]"
              >
                <Smartphone className="w-3 h-3 mr-1" />
                {loading === 'install' ? '...' : t('utilities.about.installApp')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => window.open('https://gymbud.ai/privacy', '_blank')}
            >
              {t('utilities.about.privacy')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
