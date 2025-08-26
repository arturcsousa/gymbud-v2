import { registerSW } from 'virtual:pwa-register'

export const initPWA = () => {
  const updateSW = registerSW({
    immediate: false,
    onNeedRefresh() {
      // SW waiting: emit event for a future in-app toast
      window.dispatchEvent(new CustomEvent('pwa:need-refresh'))
    },
    onOfflineReady() {
      // App is cache-ready for offline
      window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
    }
  })

  // Allow manual checks (used by "Sync now" for now)
  ;(window as any).__gymbud_check_sw = () => updateSW()
}
