import { supabase } from '@/lib/supabase'
import { db } from '@/db/gymbud-db'
import { pullUpdates } from '@/sync/queue'
import { telemetry } from '@/lib/telemetry'

export interface ExportData {
  profiles: any[]
  plans: any[]
  sessions: any[]
  session_exercises: any[]
  logged_sets: any[]
  export_metadata: {
    user_id: string
    exported_at: string
    version: string
    include_voided: boolean
  }
}

export interface RegeneratePlanResult {
  success: boolean
  plan_id?: string
  error?: string
}

export interface DeleteAccountResult {
  success: boolean
  error?: string
  details?: any[]
}

/**
 * Regenerate user's plan by calling plan-get-or-create with rotated seed
 */
export async function regeneratePlan(): Promise<RegeneratePlanResult> {
  try {
    telemetry.track('settings.plan.regenerate_requested')

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Call plan-get-or-create Edge Function with force regeneration
    const { data, error } = await supabase.functions.invoke('plan-get-or-create', {
      body: { 
        force_regenerate: true,
        rotate_seed: true 
      }
    })

    if (error) {
      telemetry.track('settings.plan.regenerate_failed', { error: error.message })
      return { success: false, error: error.message }
    }

    // Clear Dexie mirrors (keep meta and sync_events)
    await Promise.all([
      db.sessions.clear(),
      db.session_exercises.clear(),
      db.logged_sets.clear(),
      db.queue_mutations.clear()
    ])

    // Trigger fresh engine-session-get-or-create call
    const { error: sessionError } = await supabase.functions.invoke('engine-session-get-or-create', {
      body: {}
    })

    if (sessionError) {
      console.warn('Failed to refresh session after plan regeneration:', sessionError)
    }

    telemetry.track('settings.plan.regenerate_succeeded', { plan_id: data?.plan_id })
    return { success: true, plan_id: data?.plan_id }

  } catch (error: unknown) {
    console.error('Plan regeneration error:', error)
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    telemetry.track('settings.plan.regenerate_failed', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

/**
 * Export user data as JSON or CSV
 */
export async function exportUserData(format: 'json' | 'csv', includeVoided: boolean = false): Promise<{ success: boolean; error?: string }> {
  try {
    telemetry.track('settings.export.started', { format })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Pull latest updates from server first
    await pullUpdates()

    // Assemble data from Dexie and Supabase
    const [sessions, sessionExercises, loggedSets, profilesResult, plansResult] = await Promise.all([
      db.sessions.where('user_id').equals(user.id).toArray(),
      db.session_exercises.where('user_id').equals(user.id).toArray(),
      includeVoided 
        ? db.logged_sets.where('user_id').equals(user.id).toArray()
        : db.logged_sets.where('user_id').equals(user.id).and(item => !item.voided).toArray(),
      supabase.from('profiles').select('*').eq('user_id', user.id),
      supabase.from('plans').select('*').eq('user_id', user.id)
    ])

    const exportData: ExportData = {
      profiles: profilesResult.data || [],
      plans: plansResult.data || [],
      sessions,
      session_exercises: sessionExercises,
      logged_sets: loggedSets,
      export_metadata: {
        user_id: user.id,
        exported_at: new Date().toISOString(),
        version: '1.0',
        include_voided: includeVoided
      }
    }

    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `gymbud-export-${timestamp}.json`)
    } else {
      // CSV format - create multiple files
      const csvFiles = [
        { name: 'sessions.csv', data: arrayToCSV(sessions) },
        { name: 'session_exercises.csv', data: arrayToCSV(sessionExercises) },
        { name: 'logged_sets.csv', data: arrayToCSV(loggedSets) },
        { name: 'plans.csv', data: arrayToCSV(plansResult.data || []) },
        { name: 'profiles.csv', data: arrayToCSV(profilesResult.data || []) }
      ]

      // For now, just download the main sessions CSV (ZIP would require additional library)
      const blob = new Blob([csvFiles[0].data], { type: 'text/csv' })
      downloadBlob(blob, `gymbud-export-${timestamp}.csv`)
    }

    telemetry.track('settings.export.completed', { format, records: Object.keys(exportData).length })
    return { success: true }

  } catch (error: unknown) {
    console.error('Export failed:', error)
    const message = error instanceof Error ? error.message : 'Export failed'
    telemetry.track('settings.export.failed', { error: message })
    return { success: false, error: message }
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    telemetry.track('settings.account.delete_requested')

    // Call account-delete Edge Function
    const { data, error } = await supabase.functions.invoke('account-delete', {
      body: {}
    })

    if (error) {
      telemetry.track('settings.account.delete_failed', { error: error.message })
      return { success: false, error: error.message }
    }

    // Clear all Dexie data
    await Promise.all([
      db.profiles.clear(),
      db.plans.clear(),
      db.sessions.clear(),
      db.session_exercises.clear(),
      db.logged_sets.clear(),
      db.queue_mutations.clear(),
      db.sync_events.clear(),
      db.conflicts.clear(),
      db.meta.clear()
    ])

    // Sign out user
    await supabase.auth.signOut()

    telemetry.track('settings.account.delete_confirmed')
    return { success: true, details: data?.details }

  } catch (error: unknown) {
    console.error('Account deletion error:', error)
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    telemetry.track('settings.account.delete_failed', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

/**
 * Get app version and build info
 */
export function getVersionInfo() {
  return {
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
    build: import.meta.env.VITE_BUILD_SHA || 'development',
    buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString()
  }
}

/**
 * Check if PWA can be installed
 */
export function canInstallPWA(): boolean {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window
}

/**
 * Trigger PWA install prompt
 */
export async function installPWA(): Promise<boolean> {
  try {
    telemetry.track('settings.about.install_prompt_shown')
    
    // This would be handled by the PWA install prompt event
    // For now, just track the attempt
    telemetry.track('settings.about.install_prompt_clicked')
    
    return true
  } catch (error: unknown) {
    console.error('PWA install error:', error)
    return false
  }
}

// Helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function arrayToCSV(array: any[]): string {
  if (!array.length) return ''
  
  const headers = Object.keys(array[0])
  const csvContent = [
    headers.join(','),
    ...array.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}
