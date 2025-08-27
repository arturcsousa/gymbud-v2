import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/gymbud-db';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Check if install banner was dismissed
  const checkInstallBannerDismissed = useCallback(async () => {
    try {
      const dismissed = await db.meta.get('install_banner_dismissed');
      return dismissed?.value === 'true';
    } catch (error) {
      console.error('Error checking install banner dismissal:', error);
      return false;
    }
  }, []);

  // Dismiss install banner
  const dismissInstallBanner = useCallback(async () => {
    try {
      await db.meta.put({
        key: 'install_banner_dismissed',
        value: 'true',
        updated_at: new Date().toISOString()
      });
      setShowInstallBanner(false);
    } catch (error) {
      console.error('Error dismissing install banner:', error);
    }
  }, []);

  // Trigger install prompt
  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallBanner(false);
        // Clear the prompt as it can only be used once
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        // User dismissed, hide banner for this session
        await dismissInstallBanner();
        return false;
      }
    } catch (error) {
      console.error('Error triggering install:', error);
      return false;
    }
  }, [installPrompt, dismissInstallBanner]);

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = async (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);

      // Check if banner was previously dismissed
      const wasDismissed = await checkInstallBannerDismissed();
      if (!wasDismissed && !isInstalled) {
        setShowInstallBanner(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstallBannerDismissed, isInstalled]);

  return {
    isInstallable,
    isInstalled,
    showInstallBanner,
    triggerInstall,
    dismissInstallBanner
  };
}
