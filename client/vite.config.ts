import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Generate version from git or timestamp
const generateVersion = () => {
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || `dev-${timestamp}`
}

const APP_VERSION = generateVersion()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GymBud',
        short_name: 'GymBud',
        description: 'AI personal training. Deterministic, offline-first.',
        theme_color: '#005870',
        background_color: '#001a22',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: `/icons/icon-192.png?v=${APP_VERSION}`, sizes: '192x192', type: 'image/png' },
          { src: `/icons/icon-512.png?v=${APP_VERSION}`, sizes: '512x512', type: 'image/png' },
          { src: `/icons/maskable-512.png?v=${APP_VERSION}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'Start Session', url: '/app/home', icons: [{ src: `/icons/icon-192.png?v=${APP_VERSION}`, sizes: '192x192', type: 'image/png' }] }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: { enabled: true, navigateFallbackAllowlist: [/^\/$/,/^\/app\//] }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
    'import.meta.env': 'import.meta.env'
  }
})
