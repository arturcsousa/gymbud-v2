// supabase/functions/session-get-or-create/index.ts
// Simplified session creation that works with existing database schema

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getClient, requireUser } from "../_shared/auth.ts";
import { ok, err, toHttpError, options, CORS_HEADERS } from "../_shared/http.ts";

type ReqBody = {
  date?: string;               // ISO date; if absent, use today
  lang?: "en" | "pt-BR";
  plan_id?: string | null;     // optional explicit plan
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

    // Check for existing session for this date
    const existing = await supabase
      .from("sessions")
      .select("id, user_id, session_date, status")
      .eq("user_id", user.id)
      .eq("session_date", resolvedDate)
      .limit(1)
      .maybeSingle();

    if (existing.error) throw existing.error;
    
    if (existing.data) {
      // Return existing session with exercises
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

    // Create new session using existing function
    const sessionResult = await supabase.rpc("create_training_session_from_plan", {
      p_user_id: user.id,
      p_locale: body?.lang ?? "en"
    });

    if (sessionResult.error) throw sessionResult.error;
    
    const sessionId = sessionResult.data?.[0]?.session_id;
    if (!sessionId) {
      return new Response(JSON.stringify(err("internal", "Failed to create session")), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    // Update session with the requested date
    await supabase
      .from("sessions")
      .update({ session_date: resolvedDate })
      .eq("id", sessionId);

    // Get the created session
    const session = await supabase
      .from("sessions")
      .select("id, user_id, session_date, status")
      .eq("id", sessionId)
      .single();

    if (session.error) throw session.error;

    // Get session exercises (may be empty for now)
    const sx = await supabase
      .from("session_exercises")
      .select("id, exercise_id, order_index, prescription")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true });

    if (sx.error) throw sx.error;

    return new Response(JSON.stringify(ok({ session: session.data, exercises: sx.data })), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (e) {
    return toHttpError(e);
  }
});
