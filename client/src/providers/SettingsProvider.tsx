import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSettings, setSettings, AppSettings } from '@/db/gymbud-db';
import { loadCloudSettings, saveCloudSettings } from '@/lib/settingsCloud';
import i18n from '@/i18n';
import { toast } from 'sonner';

type Ctx = {
  settings: AppSettings | null;
  update(partial: Partial<AppSettings>): Promise<void>;
  syncing: boolean;
};
const SettingsCtx = createContext<Ctx>({ settings: null, update: async () => {}, syncing: false });
export const useSettings = () => useContext(SettingsCtx);

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setState] = useState<AppSettings | null>(null);
  const [syncing, setSyncing] = useState(false);

  // boot: load local, then reconcile with cloud
  useEffect(() => {
    (async () => {
      const local = await getSettings();
      setState(local);
      const cloud = await loadCloudSettings();
      if (cloud && cloud.updated_at > local.updated_at) {
        await setSettings(cloud);
        setState(cloud);
        applySideEffects(cloud);
      } else if (!cloud || local.updated_at > (cloud.updated_at ?? 0)) {
        // push local up if newer/missing
        setSyncing(true);
        await saveCloudSettings(local);
        setSyncing(false);
      }
      applySideEffects(local);
    })();
  }, []);

  const update = async (partial: Partial<AppSettings>) => {
    const next = await setSettings(partial);
    setState(next);
    applySideEffects(next);
    setSyncing(true);
    const ok = await saveCloudSettings(next);
    setSyncing(false);
    if (!ok) toast.error(i18n.t('errors.save_failed') || 'Could not save to cloud');
    else toast.success(i18n.t('settings.saved') || 'Saved');
  };

  const value = useMemo(() => ({ settings, update, syncing }), [settings, syncing]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

function applySideEffects(s: AppSettings) {
  if (i18n.language !== s.language) i18n.changeLanguage(s.language);
  // units: nothing global to set now; components read from context
}
