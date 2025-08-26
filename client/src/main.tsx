import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App.tsx'
import './index.css'
import { initPWA } from './pwa'

initPWA()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
