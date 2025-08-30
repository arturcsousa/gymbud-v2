import { createClient } from '@supabase/supabase-js'

type PlanResponse = { ok: true; data: { plan_id: string; status: string } } |
                    { ok: false; error: { code: string; message: string } }

type SessionResponse = { ok: true; data: { session_id: string; plan_id: string } } |
                       { ok: false; error: { code: string; message: string } }

export async function createPlanThenSession(supabase: ReturnType<typeof createClient>) {
  // 1) Create/get plan
  const planRes = await fetch('/api/plan-get-or-create') // or your existing call
  const planJson = await planRes.json() as PlanResponse

  if (!planJson?.ok || !planJson.data?.plan_id) {
    throw new Error(`Plan creation failed: ${!planJson?.ok ? planJson : 'no plan_id in response'}`)
  }

  const planId = planJson.data.plan_id
  console.log('=== CLIENT: Parsed plan response ===')
  console.log('plan_id:', planId)

  // 2) Call session-get-or-create with a *non-empty* body
  const { data, error } = await supabase.functions.invoke<SessionResponse>(
    'session-get-or-create',
    { body: { plan_id: planId } }
  )

  console.log('=== CLIENT: Session creation response ===')
  console.log('Session data:', data)
  console.log('Session error:', error)

  if (error) throw error
  if (!data?.ok || !data.data?.session_id) {
    throw new Error(`Session creation failed: ${JSON.stringify(data)}`)
  }

  return data.data // { session_id, plan_id }
}
