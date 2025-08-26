// Check if PWA register is available (only in production builds with VitePWA)

export async function initPWA() {
  // Only initialize PWA in production builds
  if (import.meta.env.PROD) {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      
      const updateSW = registerSW({
        onNeedRefresh() {
          // Show update available notification
          console.log('PWA update available')
        },
        onOfflineReady() {
          // Show offline ready notification
          console.log('PWA ready to work offline')
        },
      })

      // Optional: Check for updates periodically
      setInterval(() => {
        updateSW(true)
      }, 60000) // Check every minute
      
    } catch (error) {
      console.warn('PWA registration failed:', error)
    }
  }
}
