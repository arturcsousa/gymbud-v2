import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function usePWAUpdate() {
  const { t } = useTranslation();
  const updateTriggered = useRef(false);
  const updateSW = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (updateSW.current) {
      try {
        await updateSW.current(false);
      } catch (error) {
        console.error('Manual update check failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Check if PWA register is available (only in production builds)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Import dynamically to avoid build errors in development
      import('virtual:pwa-register')
        .then((module) => {
          const { registerSW } = module;
          const updateFunction = registerSW({
            immediate: true,
            onRegisteredSW(_swUrl: string, _registration: ServiceWorkerRegistration | undefined) {
              // Optional: expose for debugging
              // console.log("SW registered:", registration);
            },
            onRegisterError(_error: unknown) {
              // Usually silent on prod; no toast necessary
              // console.error("SW register error", error);
            },
            onNeedRefresh() {
              if (updateTriggered.current) return;
              updateTriggered.current = true;

              const currentVersion = import.meta.env.VITE_APP_VERSION || 'unknown';
              
              toast.info(t("app.update.available"), {
                description: t("app.update.description_with_version", {
                  defaultValue: "A new version of GymBud is ready ({{version}}).",
                  version: currentVersion
                }),
                action: {
                  label: t("app.update.action"),
                  onClick: () => {
                    // trigger the update
                    const doReload = () => {
                      // Ensure we get the fresh assets
                      window.location.reload();
                    };
                    // Ask SW to skip waiting if available
                    navigator.serviceWorker?.getRegistration().then((reg) => {
                      const waiting = reg?.waiting;
                      if (waiting) {
                        waiting.postMessage({ type: "SKIP_WAITING" });
                        waiting.addEventListener("statechange", (e: Event) => {
                          const sw = e.target as ServiceWorker;
                          if (sw.state === "activated") doReload();
                        });
                      } else {
                        doReload();
                      }
                    });
                  },
                },
              });
            },
            onOfflineReady() {
              toast.success(t("app.update.offline_ready"));
            },
          });

          // Store update function for manual checks
          updateSW.current = updateFunction;
        })
        .catch(() => {
          // PWA register not available (development mode)
          // Silent fail - no action needed
        });
    }

    return () => {
      // no cleanup required
    };
  }, [t]);

  return {
    checkForUpdates
  };
}
