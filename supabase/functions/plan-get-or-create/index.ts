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

    // 0) Ensure user profile exists (using SECURITY DEFINER function)
    console.log('Ensuring user profile exists...');
    
    // Extract profile data from seed if available
    let profileData = {
      p_user_id: userId,
      p_first_name: 'User', // Default fallback
      p_last_name: 'User',   // Default fallback
      p_height_cm: 170,      // Default fallback
      p_weight_kg: 70,       // Default fallback
      p_updated_at: new Date().toISOString()
    };

    if (body.seed && isPlanSeed(body.seed)) {
      profileData = {
        p_user_id: userId,
        p_first_name: body.seed.first_name,
        p_last_name: body.seed.last_name,
        p_height_cm: body.seed.biometrics.height_cm,
        p_weight_kg: body.seed.biometrics.weight_kg,
        p_body_fat_pct: body.seed.biometrics.body_fat_pct || null,
        p_rhr_bpm: body.seed.biometrics.rhr_bpm || null,
        p_birthdate: body.seed.biometrics.birthdate || null,
        p_updated_at: new Date().toISOString()
      };
    }

    const { error: profileErr } = await supabase.rpc('ef_upsert_profile', profileData);

    if (profileErr) {
      console.error('Profile upsert error:', profileErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'internal', message: `Profile setup failed: ${profileErr.message}` }
      }), { status: 500, headers: CORS_HEADERS });
    }
    console.log('User profile ensured');

    // 1) Check for existing ACTIVE plan
    console.log('Checking for active plan...');
    const { data: active, error: activeErr } = await supabase.rpc('ef_get_active_plan', {
      p_user_id: userId
    });

    if (activeErr) {
      console.error('Active plan check error:', activeErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'internal', message: activeErr.message }
      }), { status: 500, headers: CORS_HEADERS });
    }
    
    if (active && active.length > 0) {
      console.log('Found active plan:', active[0].id);
      return new Response(JSON.stringify({
        ok: true,
        data: { plan_id: active[0].id, status: "active" }
      }), { status: 200, headers: CORS_HEADERS });
    }

    // 2) Check for DRAFT to promote
    console.log('Checking for draft plan...');
    const { data: draft, error: draftErr } = await supabase.rpc('ef_get_draft_plan', {
      p_user_id: userId
    });

    if (draftErr) {
      console.error('Draft plan check error:', draftErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'internal', message: draftErr.message }
      }), { status: 500, headers: CORS_HEADERS });
    }

    if (draft && draft.length > 0) {
      console.log('Found draft to promote:', draft[0].id);
      const newSeed = body.seed || draft[0].seed || {};
      const { data: promoted, error: promoteErr } = await supabase.rpc('ef_promote_draft', {
        p_plan_id: draft[0].id,
        p_seed: newSeed,
        p_updated_at: new Date().toISOString()
      });

      if (promoteErr) {
        console.error('Draft promotion error:', promoteErr);
        return new Response(JSON.stringify({
          ok: false,
          error: { code: 'conflict_promote_failed', message: promoteErr.message }
        }), { status: 409, headers: CORS_HEADERS });
      }
      
      console.log('Promoted draft to active:', promoted[0].id);
      return new Response(JSON.stringify({
        ok: true,
        data: { plan_id: promoted[0].id, status: "active" }
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
    const { data: inserted, error: insertErr } = await supabase.rpc('ef_create_plan', {
      p_user_id: userId,
      p_seed: planSeed,
      p_goals: planFields.goals,
      p_experience_level: planFields.experience_level,
      p_years_away: planFields.years_away,
      p_frequency_days_per_week: planFields.frequency_days_per_week,
      p_schedule_days: planFields.schedule_days,
      p_session_duration_min: planFields.session_duration_min,
      p_environment: planFields.environment,
      p_coaching_tone: planFields.coaching_tone,
      p_height_cm: planFields.height_cm,
      p_weight_kg: planFields.weight_kg,
      p_resting_hr: planFields.resting_hr,
      p_body_fat_pct: planFields.body_fat_pct,
      p_locale: planFields.locale,
      p_baseline_completed: planFields.baseline_completed
    });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({
        ok: false,
        error: { code: 'version_conflict', message: insertErr.message }
      }), { status: 409, headers: CORS_HEADERS });
    }
    
    console.log('Created plan:', inserted[0].id);
    return new Response(JSON.stringify({
      ok: true,
      data: { plan_id: inserted[0].id, status: "active" }
    }), { status: 200, headers: CORS_HEADERS });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: { code: 'internal', message: error.message }
    }), { status: 500, headers: CORS_HEADERS });
  }
});
