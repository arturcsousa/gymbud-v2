import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
// vite-plugin-pwa register API
import { registerSW } from "virtual:pwa-register";

export function usePWAUpdate() {
  const { t } = useTranslation();
  const updateTriggered = useRef(false);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        // Optional: expose for debugging
        // console.log("SW registered:", registration);
      },
      onRegisterError(error) {
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
              // `registerSW` returns a function on `updateServiceWorker`
              // but we can also postMessage to waiting worker here.
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

    return () => {
      // no cleanup required
    };
  }, [t]);
}
