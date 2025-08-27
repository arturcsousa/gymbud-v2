import { X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/app/hooks/usePWAInstall';

export function InstallBanner() {
  const { t } = useTranslation(['app']);
  const { showInstallBanner, triggerInstall, dismissInstallBanner } = usePWAInstall();

  if (!showInstallBanner) return null;

  const handleInstall = async () => {
    await triggerInstall();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#005870] to-[#0C8F93] border-b border-white/20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 text-white" />
          <div>
            <p className="text-white font-medium text-sm">
              {t('app:install.banner.title', 'Install GymBud')}
            </p>
            <p className="text-white/80 text-xs">
              {t('app:install.banner.description', 'Get the full app experience with offline access')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs px-3 py-1 h-auto"
          >
            {t('app:install.banner.install', 'Install')}
          </Button>
          
          <button
            onClick={dismissInstallBanner}
            className="p-1 text-white/70 hover:text-white transition-colors"
            aria-label={t('app:install.banner.dismiss', 'Dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
