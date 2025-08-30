// supabase/functions/plan-get-or-create/index.ts
// Idempotently ensures exactly one ACTIVE plan for the current user.
// Behavior:
// 1) If ACTIVE exists => return it
// 2) Else if DRAFT exists => promote to ACTIVE (update seed), return it
// 3) Else INSERT ACTIVE with provided seed, return it

// Run with user-context (RLS enforced) by forwarding Authorization header.

import { requireUser } from '../_shared/auth.ts';
import { json, ok, fail } from '../_shared/http.ts';

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

function extractPlanFields(seed: PlanSeed) {
  // Map frontend values to database enum values
  const mapExperienceLevel = (level: string) => {
    switch (level) {
      case 'beginner': return 'new';
      case 'intermediate': return 'returning'; 
      case 'advanced': return 'advanced';
      default: return 'new';
    }
  };

  const mapEnvironment = (env: string) => {
    switch (env) {
      case 'commercial_gym': return 'professional_gym';
      case 'home_basic': return 'home_gym';
      case 'home_rack': return 'home_gym';
      case 'outdoors_mixed': return 'bodyweight_only';
      default: return 'professional_gym';
    }
  };

  const mapCoachingTone = (tone: string) => {
    switch (tone) {
      case 'supportive': return 'supportive';
      case 'direct': return 'drill_sergeant';
      case 'motivational': return 'funny';
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

function isPlanSeed(value: unknown): value is PlanSeed {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.goal_primary === 'string' &&
    typeof obj.days_per_week === 'number' &&
    Array.isArray(obj.days_of_week) &&
    typeof obj.environment === 'string' &&
    Array.isArray(obj.equipment) &&
    typeof obj.experience_level === 'string' &&
    typeof obj.confidence === 'object' &&
    obj.confidence !== null &&
    !Array.isArray(obj.confidence) &&
    Array.isArray(obj.constraints) &&
    typeof obj.warmup_style === 'string' &&
    Array.isArray(obj.mobility_focus) &&
    typeof obj.rest_preference === 'string' &&
    typeof obj.intensity_style === 'string' &&
    typeof obj.rpe_coaching_level === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.biometrics === 'object' &&
    obj.biometrics !== null &&
    !Array.isArray(obj.biometrics) &&
    typeof obj.ai_tone === 'string' &&
    typeof obj.units === 'string' &&
    typeof obj.date_format === 'string'
  );
}

Deno.serve(async (req) => {
  console.log('=== PLAN-GET-OR-CREATE START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight if this ever gets called cross-origin
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    console.log('Invalid method, returning 405');
    return json(405, fail('method_not_allowed', 'POST required'));
  }

  console.log('Starting authentication...');
  // Use shared auth pattern with error handling
  let user, supabase;
  try {
    const authResult = await requireUser(req);
    user = authResult.user;
    supabase = authResult.supabase;
    console.log('Authentication successful, user ID:', user.id);
  } catch (error) {
    console.error('Authentication failed:', error);
    return json(401, fail('auth_invalid', 'Authentication failed'));
  }
  
  const userId = user.id;

  console.log('Parsing request body...');
  let body: InputBody = {};
  try {
    body = (await req.json()) as InputBody;
    console.log('Received request body:', JSON.stringify(body, null, 2));
  } catch (error) {
    console.log('Failed to parse request body (allowing empty):', error);
    // allow empty body for promote-from-draft path
  }

  try {
    console.log('Checking for existing ACTIVE plan...');
    // 1) If ACTIVE exists, return it
    const { data: active, error: activeErr } = await supabase
      .schema("app2")
      .from("plans")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (activeErr) {
      console.error('Error checking for active plan:', activeErr);
      return json(500, fail('internal', activeErr.message));
    }
    
    if (active) {
      console.log('Found existing active plan:', active.id);
      return json(200, ok({ plan_id: active.id, status: "active" }));
    }
    
    console.log('No active plan found, checking for DRAFT...');

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

    if (draftErr) {
      console.error('Error checking for draft plan:', draftErr);
      return json(500, fail('internal', draftErr.message));
    }

    if (draft) {
      console.log('Found draft plan to promote:', draft.id);
      const newSeed = typeof body.seed !== "undefined" ? body.seed : (draft.seed ?? {});
      const { data: promoted, error: promoteErr } = await supabase
        .schema("app2")
        .from("plans")
        .update({ status: "active", seed: newSeed, updated_at: new Date().toISOString() })
        .eq("id", draft.id)
        .select("id")
        .single();

      if (promoteErr) {
        console.error('Error promoting draft plan:', promoteErr);
        return json(409, fail('conflict_promote_failed', promoteErr.message));
      }
      
      console.log('Successfully promoted draft to active:', promoted.id);
      return json(200, ok({ plan_id: promoted.id, status: "active" }));
    }

    console.log('No draft found, creating new plan...');
    // 3) No ACTIVE or DRAFT — must INSERT using provided seed
    if (typeof body.seed === "undefined" || body.seed === null) {
      console.log('No seed provided for new plan creation');
      return json(400, fail('invalid_payload', 'Seed is required when no draft exists.'));
    }

    const planSeed = body.seed;
    console.log('Plan seed validation input:', JSON.stringify(planSeed, null, 2));
    
    if (!isPlanSeed(planSeed)) {
      console.log('Plan seed validation failed');
      return json(400, fail('invalid_payload', 'Invalid seed provided.'));
    }
    
    console.log('Plan seed validation passed');
    const planFields = extractPlanFields(planSeed);
    
    console.log('Plan insertion data:', {
      user_id: userId,
      status: "active",
      seed: planSeed,
      ...planFields
    });

    console.log('Attempting database insert...');
    const { data: inserted, error: insertErr } = await supabase
      .schema("app2")
      .from("plans")
      .insert({ 
        user_id: userId, 
        status: "active", 
        seed: planSeed,
        ...planFields
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error('Database insert error:', insertErr);
      console.error('Insert error details:', {
        code: insertErr.code,
        message: insertErr.message,
        details: insertErr.details,
        hint: insertErr.hint
      });
      return json(409, fail('version_conflict', insertErr.message));
    }
    
    console.log('Successfully created new plan:', inserted.id);
    return json(200, ok({ plan_id: inserted.id, status: "active" }));

  } catch (error) {
    console.error("Unexpected error in plan-get-or-create:", error);
    console.error("Error stack:", error.stack);
    return json(500, fail('internal', error.message));
  }
});
