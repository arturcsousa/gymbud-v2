// supabase/functions/session-get-or-create/index.ts
// Idempotently materializes (or fetches) a session for a given day.
// Assumes shared utilities exist (per your codebase): _shared/auth.ts, _shared/http.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getClient, requireUser } from "../_shared/auth.ts";
import { ok, err, toHttpError, options, CORS_HEADERS } from "../_shared/http.ts";

type ReqBody = {
  date?: string;               // ISO date; if absent, use user TZ "today"
  lang?: "en" | "pt-BR";
  n?: number;                  // max 12
  equipment?: string[];
  plan_id?: string | null;     // optional explicit plan
};

function toISODateInTZ(tz: string): string {
  const now = new Date();
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' });
    const parts = fmt.formatToParts(now).reduce((a,p)=>{a[p.type]=p.value; return a;}, {} as any);
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return now.toISOString().slice(0,10);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = options(req);
  if (corsResponse) return corsResponse;

  try {
    const { user, supabase } = await requireUser(req, { allowServiceRole: false });
    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody> | undefined;

    // 1) Resolve timezone and session date
    const tzRes = await supabase.rpc("fn_user_tz", { p_user_id: user.id });
    if (tzRes.error) throw tzRes.error;
    const userTZ: string = tzRes.data ?? "America/New_York";
    const resolvedDate = body?.date ?? toISODateInTZ(userTZ);

    // 2) Idempotent lookup
    const existing = await supabase
      .from("sessions")
      .select("id, user_id, session_date, status")
      .eq("user_id", user.id)
      .eq("session_date", resolvedDate)
      .limit(1)
      .maybeSingle();

    if (existing.error) throw existing.error;
    if (existing.data) {
      // Return existing materialization
      const sx = await supabase.from("session_exercises")
        .select("id, exercise_id, order_index, prescription")
        .eq("session_id", existing.data.id)
        .order("order_index", { ascending: true });
      if (sx.error) throw sx.error;
      return new Response(JSON.stringify(ok({ session: existing.data, exercises: sx.data })), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // 3) New session skeleton
    const insSession = await supabase
      .from("sessions")
      .insert([{ user_id: user.id, session_date: resolvedDate, status: "pending" }])
      .select("id")
      .single();
    if (insSession.error) throw insSession.error;
    const sessionId = insSession.data.id;

    // 4) Pull plan seed (active or explicit)
    const seedRes = await supabase.rpc("fn_plan_seed", { p_user_id: user.id, p_plan_id: body?.plan_id ?? null });
    if (seedRes.error) throw seedRes.error;
    const planSeed = (seedRes.data ?? {}) as any;

    // 5) Session index for overload/deload
    const countRes = await supabase.rpc("fn_user_completed_sessions_count", { p_user_id: user.id });
    if (countRes.error) throw countRes.error;
    const sessionIndex = (Number(countRes.data) || 0) + 1;

    // 6) Determine exercise list (rotation-aware if provided in seed; else deterministic picker)
    const n = Math.max(1, Math.min(12, body?.n ?? 6));
    const equipment = body?.equipment ?? null;

    let exerciseIds: string[] = [];

    const rotation = Array.isArray(planSeed?.rotation) ? planSeed.rotation : null;
    if (rotation && rotation.length > 0) {
      // Pick rotation block by session index (baseline-friendly and deterministic)
      const block = rotation[(sessionIndex - 1) % rotation.length];

      // Block may declare explicit exercise IDs or filters; support both.
      if (Array.isArray(block?.exercise_ids) && block.exercise_ids.length > 0) {
        exerciseIds = block.exercise_ids.slice(0, n);
      } else {
        // fall back to deterministic picker with optional per-block equipment
        const picker = await supabase.rpc("fn_pick_exercises", {
          p_user_id: user.id,
          p_session_date: resolvedDate,
          p_equipment: Array.isArray(block?.equipment) ? block.equipment : equipment,
          p_n: n
        });
        if (picker.error) throw picker.error;
        exerciseIds = (picker.data ?? []).map((r: any) => r.exercise_id);
      }
    } else {
      // No rotation in plan: use deterministic picker
      const picker = await supabase.rpc("fn_pick_exercises", {
        p_user_id: user.id,
        p_session_date: resolvedDate,
        p_equipment: equipment,
        p_n: n
      });
      if (picker.error) throw picker.error;
      exerciseIds = (picker.data ?? []).map((r: any) => r.exercise_id);
    }

    if (exerciseIds.length === 0) {
      await supabase.from("sessions").delete().eq("id", sessionId);
      return new Response(JSON.stringify(err("not_found", "No exercises available for the given constraints.")), {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    // 7) Build per-exercise prescription with overload/deload and seed merge
    //    Default sets/reps are conservative unless seed overrides within fn_build_prescription
    const defaultSets = 3, defaultReps = 10;

    // Choose default rest from seed (handled again in fn_build_prescription, but here as safe default)
    const restSeed = Number(planSeed?.preferences?.rest_sec) || 90;

    // Build rows
    const rows: Array<{ session_id: string; exercise_id: string; order_index: number; prescription: any; }> = [];
    for (let idx = 0; idx < exerciseIds.length; idx++) {
      const exId = exerciseIds[idx];

      // Allow per-exercise overrides in planSeed, e.g. seed.exercises[exercise_id] or by name
      let perExSeed = planSeed?.exercises?.[exId] ?? null;
      // fallback: if planSeed declares tags/names, you can extend this switch; keeping minimal and safe.

      const pres = await supabase.rpc("fn_build_prescription", {
        p_user_id: user.id,
        p_exercise_id: exId,
        p_seed: perExSeed ?? planSeed ?? {},
        p_default_sets: defaultSets,
        p_default_reps: defaultReps,
        p_default_rest: restSeed,
        p_session_index: sessionIndex
      });
      if (pres.error) throw pres.error;

      rows.push({
        session_id: sessionId,
        exercise_id: exId,
        order_index: idx,
        prescription: pres.data
      });
    }

    const insSx = await supabase.from("session_exercises").insert(rows).select("id");
    if (insSx.error) throw insSx.error;

    // 8) Baseline detection (first ever session): mark sessions.baseline = true if this is first created
    //    (We won't flip status; baseline=true is informational; your other EF enforces baseline on completed)
    const baseline = (sessionIndex === 1);
    if (baseline) {
      await supabase.from("sessions").update({ baseline: true }).eq("id", sessionId);
    }

    // 9) Audit
    await supabase.from("coach_audit").insert([{
      user_id: user.id,
      tool: "session_materialize",
      args_json: { session_date: resolvedDate, n, equipment, session_index: sessionIndex, plan_id: body?.plan_id ?? null },
      args_hash: "sha1", // replace with your shared hash util if available
      explain: "Deterministic Engine v2 (plan-aware, overload/deload, baseline)"
    }]);

    // 10) Return data
    const sx = await supabase
      .from("session_exercises")
      .select("id, exercise_id, order_index, prescription")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true });

    if (sx.error) throw sx.error;

    const session = await supabase
      .from("sessions")
      .select("id, user_id, session_date, status, baseline")
      .eq("id", sessionId)
      .single();

    if (session.error) throw session.error;

    return new Response(JSON.stringify(ok({ session: session.data, exercises: sx.data })), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (e) {
    return toHttpError(e);
  }
});
