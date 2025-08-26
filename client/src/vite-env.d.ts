/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_PWA_VERSION?: string
  readonly VITE_SYNC_INTERVAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
