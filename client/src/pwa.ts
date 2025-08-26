// Check if PWA register is available (only in production builds with VitePWA)

export const initPWA = async () => {
  // Check if PWA register is available (only in production builds with VitePWA)
  try {
    if (import.meta.env.PROD) {
      const { registerSW } = await import('virtual:pwa-register')
      
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
    } else {
      console.info('[PWA] Service worker registration not available in development')
    }
  } catch (error) {
    console.info('[PWA] Service worker registration not available:', error)
  }
}
