import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { requireUser, getClient } from '../_shared/auth.ts'
import { ok, fail, jsonResponse } from '../_shared/http.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth validation
    const { user, supabase } = await requireUser(req)

    // Create service role client for cascading deletes
    const supabaseAdmin = getClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Start transaction-like operations
    const deletionResults = []

    try {
      // Delete user data in dependency order (RLS will ensure only user's data is deleted)
      
      // 1. Delete logged_sets (depends on session_exercises)
      const { error: loggedSetsError } = await supabase
        .from('logged_sets')
        .delete()
        .eq('user_id', user.id)
      
      if (loggedSetsError) {
        deletionResults.push({ table: 'logged_sets', error: loggedSetsError.message })
      } else {
        deletionResults.push({ table: 'logged_sets', success: true })
      }

      // 2. Delete session_exercises (depends on sessions)
      const { error: sessionExercisesError } = await supabase
        .from('session_exercises')
        .delete()
        .eq('user_id', user.id)
      
      if (sessionExercisesError) {
        deletionResults.push({ table: 'session_exercises', error: sessionExercisesError.message })
      } else {
        deletionResults.push({ table: 'session_exercises', success: true })
      }

      // 3. Delete sessions (depends on plans)
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', user.id)
      
      if (sessionsError) {
        deletionResults.push({ table: 'sessions', error: sessionsError.message })
      } else {
        deletionResults.push({ table: 'sessions', success: true })
      }

      // 4. Delete plans
      const { error: plansError } = await supabase
        .from('plans')
        .delete()
        .eq('user_id', user.id)
      
      if (plansError) {
        deletionResults.push({ table: 'plans', error: plansError.message })
      } else {
        deletionResults.push({ table: 'plans', success: true })
      }

      // 5. Delete coach_audit records
      const { error: coachAuditError } = await supabase
        .from('coach_audit')
        .delete()
        .eq('user_id', user.id)
      
      if (coachAuditError) {
        deletionResults.push({ table: 'coach_audit', error: coachAuditError.message })
      } else {
        deletionResults.push({ table: 'coach_audit', success: true })
      }

      // 6. Mark profile for deletion (instead of deleting immediately)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      
      if (profileError) {
        deletionResults.push({ table: 'profiles', error: profileError.message })
      } else {
        deletionResults.push({ table: 'profiles', success: true, action: 'marked_for_deletion' })
      }

      // Check if all operations succeeded
      const hasErrors = deletionResults.some(result => result.error)
      
      if (hasErrors) {
        return fail(500, 'Partial deletion failure', deletionResults, 'Some data could not be deleted. Please contact support.')
      }

      // All deletions successful
      return ok({ 
        success: true, 
        message: 'Account data deleted successfully',
        details: deletionResults
      })

    } catch (error) {
      console.error('Account deletion error:', error)
      return fail(500, 'Account deletion failed', deletionResults, error.message)
    }

  } catch (error) {
    console.error('Account deletion function error:', error)
    return fail(500, 'Internal server error', null, error.message)
  }
})
