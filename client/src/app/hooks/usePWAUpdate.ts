import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function usePWAUpdate() {
  const { t } = useTranslation();
  const updateTriggered = useRef(false);

  useEffect(() => {
    // Check if PWA register is available (only in production builds)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Import dynamically to avoid build errors in development
      import('virtual:pwa-register')
        .then(({ registerSW }) => {
          registerSW({
            immediate: true,
            onRegisteredSW(_swUrl: string, _registration: ServiceWorkerRegistration) {
              // Optional: expose for debugging
              // console.log("SW registered:", registration);
            },
            onRegisterError(_error: any) {
              // Usually silent on prod; no toast necessary
              // console.error("SW register error", error);
            },
            onNeedRefresh() {
              if (updateTriggered.current) return;
              updateTriggered.current = true;

              toast.info(t("app.update.available"), {
                description: t("app.update.description"),
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
}
