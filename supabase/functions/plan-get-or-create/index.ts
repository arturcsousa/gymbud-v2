// supabase/functions/plan-get-or-create/index.ts
// Idempotently ensures exactly one ACTIVE plan for the current user.

import { requireUser } from '../_shared/auth.ts';
import { CORS_HEADERS } from '../_shared/http.ts';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface InputBody {
  seed?: Json;
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
    goals: [seed.goal_primary],
    experience_level: mapExperienceLevel(seed.experience_level),
    years_away: null,
    frequency_days_per_week: seed.days_per_week,
    schedule_days: seed.days_of_week,
    session_duration_min: 45,
    environment: mapEnvironment(seed.environment),
    coaching_tone: mapCoachingTone(seed.ai_tone),
    height_cm: seed.biometrics.height_cm,
    weight_kg: seed.biometrics.weight_kg,
    resting_hr: seed.biometrics.rhr_bpm || null,
    body_fat_pct: seed.biometrics.body_fat_pct || null,
    locale: 'en',
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
  
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log('Handling OPTIONS');
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      console.log('Invalid method');
      return new Response(JSON.stringify({ 
        ok: false, 
        error: { code: 'method_not_allowed', message: 'POST required' } 
      }), { 
        status: 405, 
        headers: CORS_HEADERS 
      });
    }

    console.log('Starting auth...');
    const authResult = await requireUser(req);
    const user = authResult.user;
    const supabase = authResult.supabase;
    console.log('Auth success:', user.id);

    console.log('Parsing body...');
    const body = await req.json() as InputBody;
    console.log('Body received:', JSON.stringify(body, null, 2));

    const userId = user.id;

    // 1) Check for existing ACTIVE plan
    console.log('Checking for active plan...');
    const { data: active, error: activeErr } = await supabase
      .from("plans")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (activeErr) {
      console.error('Active plan check error:', activeErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'internal', message: activeErr.message }
      }), { status: 500, headers: CORS_HEADERS });
    }
    
    if (active) {
      console.log('Found active plan:', active.id);
      return new Response(JSON.stringify({
        ok: true,
        data: { plan_id: active.id, status: "active" }
      }), { status: 200, headers: CORS_HEADERS });
    }

    // 2) Check for DRAFT to promote
    console.log('Checking for draft plan...');
    const { data: draft, error: draftErr } = await supabase
      .from("plans")
      .select("id, status, seed")
      .eq("user_id", userId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftErr) {
      console.error('Draft plan check error:', draftErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'internal', message: draftErr.message }
      }), { status: 500, headers: CORS_HEADERS });
    }

    if (draft) {
      console.log('Found draft to promote:', draft.id);
      const newSeed = body.seed || draft.seed || {};
      const { data: promoted, error: promoteErr } = await supabase
        .from("plans")
        .update({ 
          status: "active", 
          seed: newSeed, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", draft.id)
        .select("id")
        .single();

      if (promoteErr) {
        console.error('Draft promotion error:', promoteErr);
        return new Response(JSON.stringify({
          ok: false,
          error: { code: 'conflict_promote_failed', message: promoteErr.message }
        }), { status: 409, headers: CORS_HEADERS });
      }
      
      console.log('Promoted draft to active:', promoted.id);
      return new Response(JSON.stringify({
        ok: true,
        data: { plan_id: promoted.id, status: "active" }
      }), { status: 200, headers: CORS_HEADERS });
    }

    // 3) Create new plan
    console.log('Creating new plan...');
    if (!body.seed) {
      console.log('No seed provided');
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'invalid_payload', message: 'Seed is required when no draft exists.' }
      }), { status: 400, headers: CORS_HEADERS });
    }

    const planSeed = body.seed;
    console.log('Validating seed...');
    
    if (!isPlanSeed(planSeed)) {
      console.log('Seed validation failed');
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'invalid_payload', message: 'Invalid seed provided.' }
      }), { status: 400, headers: CORS_HEADERS });
    }
    
    console.log('Seed validation passed');
    const planFields = extractPlanFields(planSeed);
    
    console.log('Inserting plan with fields:', planFields);
    const { data: inserted, error: insertErr } = await supabase
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
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'version_conflict', message: insertErr.message }
      }), { status: 409, headers: CORS_HEADERS });
    }
    
    console.log('Created plan:', inserted.id);
    return new Response(JSON.stringify({
      ok: true,
      data: { plan_id: inserted.id, status: "active" }
    }), { status: 200, headers: CORS_HEADERS });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: { code: 'internal', message: error.message }
    }), { status: 500, headers: CORS_HEADERS });
  }
});
