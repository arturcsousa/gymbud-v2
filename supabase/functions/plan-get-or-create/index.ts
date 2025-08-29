// supabase/functions/plan-get-or-create/index.ts
// Idempotently ensures exactly one ACTIVE plan for the current user.
// Behavior:
// 1) If ACTIVE exists => return it
// 2) Else if DRAFT exists => promote to ACTIVE (update seed), return it
// 3) Else INSERT ACTIVE with provided seed, return it

// Run with user-context (RLS enforced) by forwarding Authorization header.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface InputBody {
  seed?: Json; // Optional if promoting existing draft; required if inserting fresh
}

interface PlanSeed {
  goal_primary: string;
  days_per_week: number;
  days_of_week: string[];
  environment: string;
  equipment: string[];
  experience_level: string;
  confidence: Record<string, number>;
  constraints: string[];
  warmup_style: string;
  mobility_focus: string[];
  rest_preference: string;
  intensity_style: string;
  rpe_coaching_level: string;
  first_name: string;
  last_name: string;
  biometrics: {
    height_cm: number;
    weight_kg: number;
    body_fat_pct?: number;
    rhr_bpm?: number;
    birthdate?: string;
  };
  ai_tone: string;
  units: string;
  date_format: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
  });
}

function extractPlanFields(seed: PlanSeed) {
  // Map frontend values to database enum values
  const mapExperienceLevel = (level: string) => {
    switch (level) {
      case 'beginner': return 'beginner';
      case 'intermediate': return 'intermediate'; 
      case 'advanced': return 'advanced';
      default: return 'beginner';
    }
  };

  const mapEnvironment = (env: string) => {
    switch (env) {
      case 'commercial_gym': return 'commercial_gym';
      case 'home_basic': return 'home_basic';
      case 'outdoors_mixed': return 'outdoors_mixed';
      default: return 'commercial_gym';
    }
  };

  const mapCoachingTone = (tone: string) => {
    switch (tone) {
      case 'supportive': return 'supportive';
      case 'direct': return 'direct';
      case 'motivational': return 'motivational';
      default: return 'supportive';
    }
  };

  return {
    goals: [seed.goal_primary], // Convert single goal to array
    experience_level: mapExperienceLevel(seed.experience_level),
    years_away: null, // Not captured in onboarding
    frequency_days_per_week: seed.days_per_week,
    schedule_days: seed.days_of_week,
    session_duration_min: 45, // Default session duration
    environment: mapEnvironment(seed.environment),
    coaching_tone: mapCoachingTone(seed.ai_tone),
    height_cm: seed.biometrics.height_cm,
    weight_kg: seed.biometrics.weight_kg,
    resting_hr: seed.biometrics.rhr_bpm || null,
    body_fat_pct: seed.biometrics.body_fat_pct || null,
    locale: 'en', // Default locale
    baseline_completed: false
  };
}

serve(async (req) => {
  // Handle CORS preflight if this ever gets called cross-origin
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const auth = req.headers.get("Authorization");
  if (!auth) return json(401, { error: "auth_missing" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: "server_misconfigured" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve current user (RLS will also scope rows)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "auth_invalid" });
  const userId = userData.user.id;

  let body: InputBody = {};
  try {
    body = (await req.json()) as InputBody;
  } catch {
    // allow empty body for promote-from-draft path
  }

  try {
    // 1) If ACTIVE exists, return it
    const { data: active, error: activeErr } = await supabase
      .schema("app2")
      .from("plans")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (activeErr) return json(500, { error: "select_active_failed", detail: activeErr.message });
    if (active) return json(200, { plan_id: active.id, status: "active" });

    // 2) Try to find a DRAFT to promote
    const { data: draft, error: draftErr } = await supabase
      .schema("app2")
      .from("plans")
      .select("id, status, seed")
      .eq("user_id", userId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftErr) return json(500, { error: "select_draft_failed", detail: draftErr.message });

    if (draft) {
      const newSeed = typeof body.seed !== "undefined" ? body.seed : (draft.seed ?? {});
      const { data: promoted, error: promoteErr } = await supabase
        .schema("app2")
        .from("plans")
        .update({ status: "active", seed: newSeed, updated_at: new Date().toISOString() })
        .eq("id", draft.id)
        .select("id")
        .single();

      if (promoteErr) return json(409, { error: "conflict_promote_failed", detail: promoteErr.message });
      return json(200, { plan_id: promoted.id, status: "active" });
    }

    // 3) No ACTIVE or DRAFT — must INSERT using provided seed
    if (typeof body.seed === "undefined" || body.seed === null) {
      return json(400, { error: "invalid_seed", detail: "Seed is required when no draft exists." });
    }

    const planSeed = body.seed as PlanSeed;
    const planFields = extractPlanFields(planSeed);

    const { data: inserted, error: insertErr } = await supabase
      .schema("app2")
      .from("plans")
      .insert({ 
        user_id: userId, 
        status: "active", 
        seed: body.seed as Json,
        ...planFields
      })
      .select("id")
      .single();

    if (insertErr) return json(409, { error: "conflict_insert_failed", detail: insertErr.message });
    return json(200, { plan_id: inserted.id, status: "active" });

  } catch (error) {
    console.error("Unexpected error in plan-get-or-create:", error);
    return json(500, { error: "internal_server_error", detail: error.message });
  }
});
