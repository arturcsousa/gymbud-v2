// supabase/functions/session-get-or-create/index.ts
// Simplified session creation that works with existing database schema

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getClient, requireUser } from "../_shared/auth.ts";
import { ok, err, toHttpError, options, CORS_HEADERS } from "../_shared/http.ts";

type ReqBody = {
  date?: string;               // ISO date; if absent, use today
  lang?: "en" | "pt-BR";
  plan_id?: string | null;     // optional explicit plan
  baseline?: boolean;          // mark session as baseline
  populate?: boolean;          // auto-populate exercises if empty
};

serve(async (req) => {
  console.log('=== SESSION-GET-OR-CREATE START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  const corsResponse = options(req);
  if (corsResponse) {
    console.log('Returning CORS preflight response');
    return corsResponse;
  }

  try {
    console.log('Starting authentication...');
    const { user, supabase } = await requireUser(req, { allowServiceRole: false });
    console.log('Auth successful, user ID:', user.id);

    console.log('Parsing request body...');
    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody> | undefined;
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Early validation: if plan_id is provided, ensure it's not empty/null
    if (body?.plan_id !== undefined && (!body.plan_id || body.plan_id.trim() === '')) {
      console.error('Invalid plan_id provided:', body.plan_id);
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: 'INVALID_PLAN_ID', message: 'plan_id cannot be empty' }
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Use today's date if not provided
    const resolvedDate = body?.date ?? new Date().toISOString().slice(0, 10);
    console.log('Resolved date:', resolvedDate);

    // 1) Resolve plan_id: prefer explicit, else user's active plan
    let planId = body?.plan_id ?? null;
    console.log('Initial plan_id from body:', planId);

    if (!planId) {
      console.log('No plan_id provided, looking up active plan for user...');
      const plan = await supabase
        .from("app2.plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      console.log('Active plan query result:', { data: plan.data, error: plan.error });
      
      if (plan.error) {
        console.error('Error fetching active plan:', plan.error);
        throw plan.error;
      }
      if (!plan.data) {
        console.log('No active plan found for user, returning 404');
        return new Response(JSON.stringify(err("not_found", "No active plan for user")), {
          status: 404,
          headers: CORS_HEADERS
        });
      }
      planId = plan.data.id;
      console.log('Found active plan ID:', planId);
    }

    // 2) Check for existing session for this plan+date
    console.log('Checking for existing session with plan_id:', planId, 'and date:', resolvedDate);
    const existing = await supabase
      .from("app2.sessions")
      .select("id, plan_id, session_date, status")
      .eq("plan_id", planId)
      .eq("session_date", resolvedDate)
      .limit(1)
      .maybeSingle();

    console.log('Existing session query result:', { data: existing.data, error: existing.error });

    if (existing.error) {
      console.error('Error checking for existing session:', existing.error);
      throw existing.error;
    }

    if (existing.data) {
      console.log('Found existing session:', existing.data.id);
      // Fetch exercises if session exists
      console.log('Fetching exercises for existing session...');
      const sx = await supabase
        .from("app2.session_exercises")
        .select("id, exercise_id, order_index, prescription")
        .eq("session_id", existing.data.id)
        .order("order_index", { ascending: true });

      console.log('Session exercises query result:', { count: sx.data?.length, error: sx.error });

      if (sx.error) {
        console.error('Error fetching session exercises:', sx.error);
        throw sx.error;
      }

      const response = {
        plan_id: planId,
        reused: true,
        session: existing.data,
        exercises: sx.data
      };
      console.log('Returning existing session response:', JSON.stringify(response, null, 2));
      
      return new Response(JSON.stringify(ok(response)), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // 3) Create new session (prefer RPC; soft-fallback to direct insert if RPC not exposed)
    console.log('No existing session found, creating new session...');
    let sessionId: string | undefined;

    // Try RPC first
    console.log('Attempting RPC create_training_session_from_plan...');
    const sessionResult = await supabase.rpc("create_training_session_from_plan", {
      p_user_id: user.id,
      p_locale: body?.lang ?? "en"
    });

    console.log('RPC result:', { data: sessionResult.data, error: sessionResult.error });

    if (!sessionResult.error) {
      sessionId = sessionResult.data?.[0]?.session_id;
      console.log('RPC successful, session ID:', sessionId);
    } else {
      console.log('RPC failed, falling back to direct insert. Error:', sessionResult.error);
      // If the RPC fails because of exposure/privileges, fall back to direct insert.
      const ins = await supabase
        .from("app2.sessions")
        .insert({ plan_id: planId, status: "pending", session_date: resolvedDate })
        .select("id")
        .single();

      console.log('Direct insert result:', { data: ins.data, error: ins.error });

      if (ins.error) {
        console.error('Direct insert failed:', ins.error);
        throw ins.error;
      }
      sessionId = ins.data.id;
      console.log('Direct insert successful, session ID:', sessionId);
    }

    if (!sessionId) {
      console.error('Failed to get session ID from both RPC and direct insert');
      return new Response(JSON.stringify(err("internal", "Failed to create session")), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    // 4) If RPC did not set session_date, ensure it now (safe even if already set)
    console.log('Updating session with date and baseline flag...');
    const updateData = { session_date: resolvedDate, baseline: !!body?.baseline };
    console.log('Update data:', updateData);
    
    const upd = await supabase
      .from("app2.sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select("id, plan_id, session_date, status")
      .single();

    console.log('Session update result:', { data: upd.data, error: upd.error });

    if (upd.error) {
      console.error('Error updating session:', upd.error);
      throw upd.error;
    }

    // 5) Fetch exercises (may be empty)
    console.log('Fetching exercises for new session...');
    const sx = await supabase
      .from("app2.session_exercises")
      .select("id, exercise_id, order_index, prescription")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true });

    console.log('New session exercises query result:', { count: sx.data?.length, error: sx.error });

    if (sx.error) {
      console.error('Error fetching new session exercises:', sx.error);
      throw sx.error;
    }

    // Optional populate if exercises are empty and requested
    if ((!sx.data || sx.data.length === 0) && body?.populate === true) {
      console.log('Exercises are empty and populate=true, attempting to populate...');
      // Try to populate via RPC or Edge Function
      try {
        console.log('Calling engine_build_session RPC...');
        await supabase.rpc("engine_build_session", { p_session_id: sessionId });
        console.log('engine_build_session RPC completed');
        
        // Re-fetch exercises after population
        console.log('Re-fetching exercises after population...');
        const sxPopulated = await supabase
          .from("app2.session_exercises")
          .select("id, exercise_id, order_index, prescription")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });
        
        console.log('Post-population exercises query result:', { count: sxPopulated.data?.length, error: sxPopulated.error });
        
        if (!sxPopulated.error) {
          const populatedResponse = {
            plan_id: planId,
            reused: false,
            session: upd.data,
            exercises: sxPopulated.data
          };
          console.log('Returning populated session response:', JSON.stringify(populatedResponse, null, 2));
          
          return new Response(JSON.stringify(ok(populatedResponse)), {
            status: 200,
            headers: CORS_HEADERS
          });
        }
      } catch (e) {
        // Population failed, continue with empty exercises
        console.warn("Exercise population failed:", e);
      }
    }

    // Audit log
    console.log('Creating audit log entry...');
    const auditData = {
      user_id: user.id,
      action: "session_get_or_create",
      meta: { plan_id: planId, session_id: sessionId, reused: false, date: resolvedDate }
    };
    console.log('Audit data:', auditData);
    
    await supabase.from("app2.coach_audit").insert(auditData).catch((e) => {
      console.warn('Audit log failed (non-blocking):', e);
    });

    const finalResponse = {
      plan_id: planId,
      reused: false,
      session: upd.data,
      exercises: sx.data
    };
    console.log('Returning final response:', JSON.stringify(finalResponse, null, 2));
    console.log('=== SESSION-GET-OR-CREATE SUCCESS ===');

    return new Response(JSON.stringify(ok(finalResponse)), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (e) {
    console.error('=== SESSION-GET-OR-CREATE ERROR ===');
    console.error('Error details:', e);
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace');
    return toHttpError(e);
  }
});
