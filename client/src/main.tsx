import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.tsx'
import './index.css'
import './i18n'
import { initPWA } from './pwa'
import { initSync } from './sync/init'

// Initialize PWA
initPWA().catch(console.error)

// Initialize sync system
initSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
