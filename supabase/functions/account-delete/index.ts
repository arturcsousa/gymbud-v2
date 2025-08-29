import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client for cascading deletes
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Start transaction-like operations
    const deletionResults = []

    try {
      // Delete user data in dependency order (RLS will ensure only user's data is deleted)
      
      // 1. Delete logged_sets (depends on session_exercises)
      const { error: loggedSetsError } = await supabaseClient
        .from('logged_sets')
        .delete()
        .eq('user_id', user.id)
      
      if (loggedSetsError) {
        deletionResults.push({ table: 'logged_sets', error: loggedSetsError.message })
      } else {
        deletionResults.push({ table: 'logged_sets', success: true })
      }

      // 2. Delete session_exercises (depends on sessions)
      const { error: sessionExercisesError } = await supabaseClient
        .from('session_exercises')
        .delete()
        .eq('user_id', user.id)
      
      if (sessionExercisesError) {
        deletionResults.push({ table: 'session_exercises', error: sessionExercisesError.message })
      } else {
        deletionResults.push({ table: 'session_exercises', success: true })
      }

      // 3. Delete sessions (depends on plans)
      const { error: sessionsError } = await supabaseClient
        .from('sessions')
        .delete()
        .eq('user_id', user.id)
      
      if (sessionsError) {
        deletionResults.push({ table: 'sessions', error: sessionsError.message })
      } else {
        deletionResults.push({ table: 'sessions', success: true })
      }

      // 4. Delete plans
      const { error: plansError } = await supabaseClient
        .from('plans')
        .delete()
        .eq('user_id', user.id)
      
      if (plansError) {
        deletionResults.push({ table: 'plans', error: plansError.message })
      } else {
        deletionResults.push({ table: 'plans', success: true })
      }

      // 5. Delete coach_audit records
      const { error: coachAuditError } = await supabaseClient
        .from('coach_audit')
        .delete()
        .eq('user_id', user.id)
      
      if (coachAuditError) {
        deletionResults.push({ table: 'coach_audit', error: coachAuditError.message })
      } else {
        deletionResults.push({ table: 'coach_audit', success: true })
      }

      // 6. Mark profile for deletion (instead of deleting immediately)
      const { error: profileError } = await supabaseClient
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
        return new Response(
          JSON.stringify({ 
            error: 'Partial deletion failure', 
            details: deletionResults,
            message: 'Some data could not be deleted. Please contact support.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // All deletions successful
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account data deleted successfully',
          details: deletionResults
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Account deletion error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Account deletion failed', 
          message: error.message,
          details: deletionResults
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Account deletion function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
