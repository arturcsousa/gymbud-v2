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
  // Handle CORS preflight requests
  const corsResponse = options(req);
  if (corsResponse) return corsResponse;

  try {
    const { user, supabase } = await requireUser(req, { allowServiceRole: false });
    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody> | undefined;

    // Use today's date if not provided
    const resolvedDate = body?.date ?? new Date().toISOString().slice(0, 10);

    // 1) Resolve plan_id: prefer explicit, else user's active plan
    let planId = body?.plan_id ?? null;

    if (!planId) {
      const plan = await supabase
        .from("app2.plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (plan.error) throw plan.error;
      if (!plan.data) {
        // If your flow requires an active plan, you can create one here or let the RPC handle it.
        // Return a typed error so UI can route to onboarding if desired.
        return new Response(JSON.stringify(err("not_found", "No active plan for user")), {
          status: 404,
          headers: CORS_HEADERS
        });
      }
      planId = plan.data.id;
    }

    // 2) Check for existing session for this plan+date
    const existing = await supabase
      .from("app2.sessions")
      .select("id, plan_id, session_date, status")
      .eq("plan_id", planId)
      .eq("session_date", resolvedDate)
      .limit(1)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data) {
      // Fetch exercises if session exists
      const sx = await supabase
        .from("app2.session_exercises")
        .select("id, exercise_id, order_index, prescription")
        .eq("session_id", existing.data.id)
        .order("order_index", { ascending: true });

      if (sx.error) throw sx.error;

      return new Response(JSON.stringify(ok({
        plan_id: planId,
        reused: true,
        session: existing.data,
        exercises: sx.data
      })), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // 3) Create new session (prefer RPC; soft-fallback to direct insert if RPC not exposed)
    let sessionId: string | undefined;

    // Try RPC first
    const sessionResult = await supabase.rpc("create_training_session_from_plan", {
      p_user_id: user.id,
      p_locale: body?.lang ?? "en"
    });

    if (!sessionResult.error) {
      sessionId = sessionResult.data?.[0]?.session_id;
    } else {
      // If the RPC fails because of exposure/privileges, fall back to direct insert.
      // (Remove this branch once the RPC is exposed in API settings.)
      const ins = await supabase
        .from("app2.sessions")
        .insert({ plan_id: planId, status: "pending", session_date: resolvedDate })
        .select("id")
        .single();

      if (ins.error) throw ins.error;
      sessionId = ins.data.id;
    }

    if (!sessionId) {
      return new Response(JSON.stringify(err("internal", "Failed to create session")), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    // 4) If RPC did not set session_date, ensure it now (safe even if already set)
    const upd = await supabase
      .from("app2.sessions")
      .update({ session_date: resolvedDate, baseline: !!body?.baseline })
      .eq("id", sessionId)
      .select("id, plan_id, session_date, status")
      .single();

    if (upd.error) throw upd.error;

    // 5) Fetch exercises (may be empty)
    const sx = await supabase
      .from("app2.session_exercises")
      .select("id, exercise_id, order_index, prescription")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true });

    if (sx.error) throw sx.error;

    // Optional populate if exercises are empty and requested
    if ((!sx.data || sx.data.length === 0) && body?.populate === true) {
      // Try to populate via RPC or Edge Function
      try {
        await supabase.rpc("engine_build_session", { p_session_id: sessionId });
        
        // Re-fetch exercises after population
        const sxPopulated = await supabase
          .from("app2.session_exercises")
          .select("id, exercise_id, order_index, prescription")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });
        
        if (!sxPopulated.error) {
          return new Response(JSON.stringify(ok({
            plan_id: planId,
            reused: false,
            session: upd.data,
            exercises: sxPopulated.data
          })), {
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
    await supabase.from("app2.coach_audit").insert({
      user_id: user.id,
      action: "session_get_or_create",
      meta: { plan_id: planId, session_id: sessionId, reused: false, date: resolvedDate }
    }).catch(() => {}); // Non-blocking

    return new Response(JSON.stringify(ok({
      plan_id: planId,
      reused: false,
      session: upd.data,
      exercises: sx.data
    })), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (e) {
    return toHttpError(e);
  }
});
