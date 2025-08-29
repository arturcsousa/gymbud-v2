import { ok, fail, jsonResponse, options } from '../_shared/http.ts';
import { requireUser, getClient } from '../_shared/auth.ts';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

// Request schema
const RequestSchema = z.object({
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tz: z.string().optional().default('America/New_York'),
  plan_id: z.string().uuid().nullable().optional()
});

// Response types
type SessionExercise = {
  id: string;
  exercise_id: string;
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  prescription: {
    rpe?: number;
    tempo?: string | null;
    stage?: string;
  };
};

type SessionResponse = {
  id: string;
  status: 'pending' | 'active' | 'completed';
  baseline: boolean;
  planned_at: string;
  exercises: SessionExercise[];
};

Deno.serve(async (req) => {
  const start = Date.now();
  
  // Handle CORS preflight
  const corsResponse = options(req);
  if (corsResponse) return corsResponse;
  
  // Method validation
  if (req.method !== 'POST') {
    return jsonResponse(fail('invalid_payload', 'POST required'), 405);
  }
  
  // Auth validation
  const { user, error: authErr } = await requireUser(req);
  if (!user) {
    const code = authErr === 'auth_invalid' ? 'auth_invalid' : 'auth_missing';
    return jsonResponse(fail(code, 'Authentication required'), 401);
  }

  // Parse and validate request
  let body: unknown;
  try { 
    body = await req.json(); 
  } catch { 
    return jsonResponse(fail('invalid_payload', 'Invalid JSON'), 400); 
  }
  
  const parseResult = RequestSchema.safeParse(body);
  if (!parseResult.success) {
    return jsonResponse(fail('invalid_payload', 'Validation failed', parseResult.error.format()), 422);
  }
  
  const { today: requestedToday, tz, plan_id } = parseResult.data;
  
  // Calculate today in the specified timezone
  const today = requestedToday || new Date().toLocaleDateString('en-CA', { timeZone: tz });
  
  const { supabase } = getClient(req);

  try {
    // Step 1: Plan selection
    let selectedPlanId: string;
    
    if (plan_id) {
      // Validate ownership of specified plan
      const { data: planCheck, error: planError } = await supabase
        .from('plans')
        .select('id')
        .eq('id', plan_id)
        .eq('user_id', user.id)
        .single();
        
      if (planError || !planCheck) {
        return jsonResponse(fail('not_found', 'Plan not found or access denied'), 404);
      }
      selectedPlanId = plan_id;
    } else {
      // Select user's active plan
      const { data: activePlan, error: activePlanError } = await supabase
        .from('plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
        
      if (activePlanError || !activePlan) {
        return jsonResponse(fail('not_found', 'No active plan found'), 404);
      }
      selectedPlanId = activePlan.id;
    }

    // Step 2: Check for existing session today
    const { data: existingSession, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        baseline,
        planned_at,
        session_exercises (
          id,
          exercise_id,
          exercise_name,
          order_index,
          prescription
        )
      `)
      .eq('user_id', user.id)
      .eq('plan_id', selectedPlanId)
      .gte('planned_at', `${today}T00:00:00`)
      .lt('planned_at', `${today}T23:59:59`)
      .in('status', ['pending', 'active'])
      .order('planned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Session lookup error:', sessionError);
      return jsonResponse(fail('internal', 'Database error'), 500);
    }

    if (existingSession) {
      // Return existing session with exercises
      const exercises = await buildExerciseList(supabase, existingSession.session_exercises || []);
      
      const response: SessionResponse = {
        id: existingSession.id,
        status: existingSession.status,
        baseline: existingSession.baseline || false,
        planned_at: existingSession.planned_at,
        exercises
      };
      
      // Telemetry
      queueMicrotask(() => {
        console.log('engine_session_get_or_create', {
          user_id: user.id,
          session_id: existingSession.id,
          action: 'existing',
          duration_ms: Date.now() - start
        });
      });
      
      return jsonResponse(ok({ session: response }));
    }

    // Step 3: Generate new session
    const newSession = await generateNewSession(supabase, user.id, selectedPlanId, today, tz);
    
    // Telemetry
    queueMicrotask(() => {
      console.log('engine_session_get_or_create', {
        user_id: user.id,
        session_id: newSession.id,
        action: 'created',
        duration_ms: Date.now() - start
      });
    });
    
    return jsonResponse(ok({ session: newSession }));
    
  } catch (error) {
    console.error('Engine session error:', error);
    
    // Telemetry for failures
    queueMicrotask(() => {
      console.log('engine_session_get_or_create', {
        user_id: user.id,
        action: 'failed',
        error: error.message,
        duration_ms: Date.now() - start
      });
    });
    
    return jsonResponse(fail('internal', 'Internal server error'), 500);
  }
});

async function generateNewSession(
  supabase: any, 
  userId: string, 
  planId: string, 
  today: string, 
  tz: string
): Promise<SessionResponse> {
  // Get plan details and seed
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('seed, created_at')
    .eq('id', planId)
    .single();
    
  if (planError || !plan) {
    throw new Error('Plan not found');
  }

  // Count completed sessions for this plan to determine rotation
  const { count: completedCount, error: countError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .eq('status', 'completed');
    
  if (countError) {
    throw new Error('Failed to count completed sessions');
  }

  // Determine if this is the user's first session ever (baseline)
  const { count: totalSessions, error: totalError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (totalError) {
    throw new Error('Failed to count total sessions');
  }

  const isBaseline = (totalSessions || 0) === 0;
  
  // Generate deterministic day slot from completed sessions
  const planSeed = plan.seed || {};
  const daysInRotation = planSeed.days?.length || 3; // Default 3-day rotation
  const daySlot = (completedCount || 0) % daysInRotation;
  
  // Create session
  const sessionId = crypto.randomUUID();
  const plannedAt = `${today}T12:00:00.000Z`; // Noon UTC as default
  
  const { error: insertError } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      user_id: userId,
      plan_id: planId,
      status: 'pending',
      baseline: isBaseline,
      planned_at: plannedAt,
      session_date: today
    });
    
  if (insertError) {
    throw new Error(`Failed to create session: ${insertError.message}`);
  }

  // Generate exercises for this day slot
  const exercises = await generateSessionExercises(
    supabase, 
    sessionId, 
    userId, 
    planSeed, 
    daySlot, 
    completedCount || 0
  );

  return {
    id: sessionId,
    status: 'pending',
    baseline: isBaseline,
    planned_at: plannedAt,
    exercises
  };
}

async function generateSessionExercises(
  supabase: any,
  sessionId: string,
  userId: string,
  planSeed: any,
  daySlot: number,
  completedSessions: number
): Promise<SessionExercise[]> {
  const dayConfig = planSeed.days?.[daySlot] || { exercises: [] };
  const exercises: SessionExercise[] = [];
  
  // Deload logic - every 12 sessions by default
  const deloadCycle = planSeed.deload_every || 12;
  const isDeloadWeek = completedSessions > 0 && (completedSessions % deloadCycle) === 0;
  
  for (let i = 0; i < dayConfig.exercises.length; i++) {
    const exerciseConfig = dayConfig.exercises[i];
    const exerciseId = exerciseConfig.exercise_id;
    
    if (!exerciseId) continue;
    
    // Get exercise details with localization
    const { data: exerciseData, error: exerciseError } = await supabase
      .rpc('rpc_get_exercise_by_id', {
        p_exercise_id: exerciseId,
        lang: 'en' // Default to English for now
      });
      
    if (exerciseError || !exerciseData) {
      console.warn(`Exercise ${exerciseId} not found, skipping`);
      continue;
    }

    // Progressive overload calculation
    const prescription = await calculateProgression(
      supabase,
      userId,
      exerciseId,
      exerciseConfig,
      isDeloadWeek
    );
    
    const sessionExerciseId = crypto.randomUUID();
    
    // Insert session exercise
    const { error: insertError } = await supabase
      .from('session_exercises')
      .insert({
        id: sessionExerciseId,
        session_id: sessionId,
        exercise_id: exerciseId,
        exercise_name: exerciseData.name,
        order_index: i,
        prescription: prescription
      });
      
    if (insertError) {
      console.warn(`Failed to insert session exercise: ${insertError.message}`);
      continue;
    }

    exercises.push({
      id: sessionExerciseId,
      exercise_id: exerciseId,
      name: exerciseData.name,
      sets: prescription.sets || 3,
      reps: prescription.reps || '8-10',
      rest_sec: prescription.rest_sec || 90,
      prescription: {
        rpe: prescription.rpe,
        tempo: prescription.tempo || null
      }
    });
  }
  
  return exercises;
}

async function calculateProgression(
  supabase: any,
  userId: string,
  exerciseId: string,
  exerciseConfig: any,
  isDeloadWeek: boolean
): Promise<any> {
  // Get most recent non-voided logged sets for this exercise
  const { data: recentSets, error: setsError } = await supabase
    .from('logged_sets')
    .select(`
      reps,
      weight_kg,
      rpe,
      created_at,
      sessions!inner (
        user_id,
        status
      ),
      session_exercises!inner (
        exercise_id
      )
    `)
    .eq('sessions.user_id', userId)
    .eq('session_exercises.exercise_id', exerciseId)
    .eq('sessions.status', 'completed')
    .eq('voided', false)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (setsError) {
    console.warn(`Failed to get recent sets for exercise ${exerciseId}:`, setsError);
  }

  // Base prescription from plan seed
  const basePrescription = {
    sets: exerciseConfig.sets || 3,
    reps: exerciseConfig.reps || '8-10',
    rest_sec: exerciseConfig.rest_sec || 90,
    rpe: exerciseConfig.rpe || 7,
    tempo: exerciseConfig.tempo || null
  };

  // If no recent sets or deload week, use base prescription
  if (!recentSets || recentSets.length === 0 || isDeloadWeek) {
    if (isDeloadWeek) {
      // Reduce intensity for deload
      basePrescription.rpe = Math.max(5, (basePrescription.rpe || 7) - 2);
    }
    return basePrescription;
  }

  // Analyze recent performance to determine progression
  const lastSession = recentSets.slice(0, basePrescription.sets);
  const targetReps = parseInt(exerciseConfig.reps?.split('-')[1] || '10');
  const targetsHit = lastSession.filter(set => set.reps >= targetReps).length;
  const totalSets = lastSession.length;
  
  // If hit targets on most sets, progress
  if (targetsHit >= Math.ceil(totalSets * 0.7)) {
    // Small progression - could be weight, reps, or RPE based on plan
    const progressionStep = exerciseConfig.progression_step || { weight_kg: 2.5 };
    
    if (progressionStep.weight_kg) {
      basePrescription.weight_kg = (lastSession[0]?.weight_kg || 0) + progressionStep.weight_kg;
    }
    if (progressionStep.rpe) {
      basePrescription.rpe = Math.min(10, (basePrescription.rpe || 7) + progressionStep.rpe);
    }
  }
  
  return basePrescription;
}

async function buildExerciseList(supabase: any, sessionExercises: any[]): Promise<SessionExercise[]> {
  const exercises: SessionExercise[] = [];
  
  // Sort by order_index
  const sortedExercises = sessionExercises.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  
  for (const se of sortedExercises) {
    const prescription = se.prescription || {};
    
    exercises.push({
      id: se.id,
      exercise_id: se.exercise_id,
      name: se.exercise_name || 'Unknown Exercise',
      sets: prescription.sets || 3,
      reps: prescription.reps || '8-10',
      rest_sec: prescription.rest_sec || 90,
      prescription: {
        rpe: prescription.rpe,
        tempo: prescription.tempo || null,
        stage: prescription.stage
      }
    });
  }
  
  return exercises;
}
