import { z } from "npm:zod@3.23.8";
import { requireUser, getClient } from "../_shared/auth.ts";
import { parseJson, zUUID } from "../_shared/validate.ts";
import { ok, err, cors } from "../_shared/http.ts";

// Request schema
const zCoachSuggestRequest = z.object({
  session_id: zUUID,
  language: z.enum(['en', 'pt-BR']).default('en'),
  constraints: z.object({
    no_equipment: z.array(z.string()).optional(),
    time_limit_min: z.number().int().min(5).max(180).optional(),
    pain_flags: z.array(z.string()).optional(),
    fatigue: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
});

type CoachSuggestRequest = z.infer<typeof zCoachSuggestRequest>;

interface CoachRecommendation {
  id: string;
  kind: 'substitute' | 'tweak_prescription' | 'skip_with_alternative' | 'deload';
  cause: string;
  status: 'suggested';
  session_exercise_id: string;
  suggested_exercise_id?: string;
  delta_json: {
    type: string;
    from_exercise_id?: string;
    to_exercise_id?: string;
    rationale: string;
    confidence: number;
    fields?: Record<string, any>;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors();

  // Validate method
  if (req.method !== 'POST') {
    return cors(err(405, 'METHOD_NOT_ALLOWED', 'Only POST allowed'));
  }

  // Validate auth
  const { user, error: authError } = await requireUser(req);
  if (authError || !user) {
    return cors(err(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  // Parse request
  const { data: payload, error: parseError } = await parseJson(req, zCoachSuggestRequest);
  if (parseError) return cors(parseError);

  try {
    const { supabase } = getClient(req);
    
    // IMPORTANT: scope to the app2 schema
    const db = supabase.schema('app2');
    
    const recommendations = await generateSuggestions(db, user.id, payload);
    
    return cors(ok({ items: recommendations }));
  } catch (error) {
    console.error('Coach suggest error:', error);
    return cors(err(500, 'INTERNAL_ERROR', 'Failed to generate suggestions'));
  }
});

async function generateSuggestions(
  db: any,
  userId: string,
  payload: CoachSuggestRequest
): Promise<CoachRecommendation[]> {
  // Load session context with RLS
  const { data: session } = await db
    .from('sessions')
    .select('*')
    .eq('id', payload.session_id)
    .eq('user_id', userId)
    .single();

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  // Load session exercises
  const { data: sessionExercises } = await db
    .from('session_exercises')
    .select(`
      *,
      exercises:exercise_id (
        id,
        name,
        equipment,
        muscle_groups,
        movement_pattern
      )
    `)
    .eq('session_id', payload.session_id)
    .order('order_index');

  if (!sessionExercises?.length) {
    return [];
  }

  // Load recent logged sets for context (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: recentSets } = await db
    .from('logged_sets')
    .select(`
      *,
      session_exercises!inner (
        exercise_id,
        sessions!inner (
          user_id
        )
      )
    `)
    .eq('session_exercises.sessions.user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  // Generate suggestions based on constraints
  const suggestions: CoachRecommendation[] = [];
  const constraints = payload.constraints || {};

  for (const sessionExercise of sessionExercises) {
    const exercise = sessionExercise.exercises;
    if (!exercise) continue;

    // Equipment substitution
    if (constraints.no_equipment?.length) {
      const needsUnavailableEquipment = constraints.no_equipment.some(eq => 
        exercise.equipment?.includes(eq)
      );
      
      if (needsUnavailableEquipment) {
        const substitute = await findSubstitute(db, exercise, constraints.no_equipment, payload.language);
        if (substitute) {
          // Check for existing identical suggestion
          const existing = await checkExistingSuggestion(
            db, 
            payload.session_id, 
            sessionExercise.id, 
            'substitute', 
            'no_equipment',
            substitute.id
          );
          
          if (!existing) {
            const recommendation = await createRecommendation(
              db,
              userId,
              'substitute',
              'no_equipment',
              sessionExercise.id,
              substitute.id,
              {
                type: 'substitute',
                from_exercise_id: exercise.id,
                to_exercise_id: substitute.id,
                rationale: `No ${constraints.no_equipment.join(', ')} available`,
                confidence: 0.84
              }
            );
            suggestions.push(recommendation);
          }
        }
      }
    }

    // Time constraint deload
    if (constraints.time_limit_min && constraints.time_limit_min < 45) {
      const existing = await checkExistingSuggestion(
        db,
        payload.session_id,
        sessionExercise.id,
        'deload',
        'time_limit'
      );
      
      if (!existing) {
        const recommendation = await createRecommendation(
          db,
          userId,
          'deload',
          'time_limit',
          sessionExercise.id,
          undefined,
          {
            type: 'deload',
            rationale: `Reduce volume due to ${constraints.time_limit_min}min time limit`,
            confidence: 0.78,
            fields: {
              rest_sec: Math.max(60, (sessionExercise.rest_sec || 120) - 30),
              reps_exact: Math.max(1, (sessionExercise.reps_exact || 8) - 2)
            }
          }
        );
        suggestions.push(recommendation);
      }
    }

    // Fatigue-based adjustments
    if (constraints.fatigue === 'high') {
      const existing = await checkExistingSuggestion(
        db,
        payload.session_id,
        sessionExercise.id,
        'tweak_prescription',
        'fatigue'
      );
      
      if (!existing) {
        const recommendation = await createRecommendation(
          db,
          userId,
          'tweak_prescription',
          'fatigue',
          sessionExercise.id,
          undefined,
          {
            type: 'tweak_prescription',
            rationale: 'Reduce intensity due to high fatigue',
            confidence: 0.72,
            fields: {
              intensity_pct: Math.max(0.6, (sessionExercise.intensity_pct || 0.8) - 0.1),
              reps_exact: Math.max(1, (sessionExercise.reps_exact || 8) - 1)
            }
          }
        );
        suggestions.push(recommendation);
      }
    }

    // Limit to 10 suggestions max
    if (suggestions.length >= 10) break;
  }

  return suggestions.slice(0, 10);
}

async function findSubstitute(
  db: any, 
  originalExercise: any, 
  unavailableEquipment: string[],
  language: string
): Promise<any> {
  // Query localized exercise library for substitutes
  const { data: alternatives } = await db
    .from('v_exercise_library_localized')
    .select('*')
    .eq('language', language)
    .contains('muscle_groups', originalExercise.muscle_groups || [])
    .eq('movement_pattern', originalExercise.movement_pattern)
    .not('equipment', 'cs', `{${unavailableEquipment.join(',')}}`)
    .neq('id', originalExercise.id)
    .limit(5);

  // Return first suitable alternative (in real implementation, this would use more sophisticated matching)
  return alternatives?.[0] || null;
}

async function checkExistingSuggestion(
  db: any,
  sessionId: string,
  sessionExerciseId: string,
  kind: string,
  cause: string,
  suggestedExerciseId?: string
): Promise<boolean> {
  const query = db
    .from('coach_recommendations')
    .select('id')
    .eq('session_id', sessionId)
    .eq('session_exercise_id', sessionExerciseId)
    .eq('kind', kind)
    .eq('cause', cause)
    .eq('status', 'suggested');

  if (suggestedExerciseId) {
    query.eq('suggested_exercise_id', suggestedExerciseId);
  }

  const { data } = await query.single();
  return !!data;
}

async function createRecommendation(
  db: any,
  userId: string,
  kind: string,
  cause: string,
  sessionExerciseId: string,
  suggestedExerciseId: string | undefined,
  deltaJson: any
): Promise<CoachRecommendation> {
  const { data, error } = await db
    .from('coach_recommendations')
    .insert({
      kind,
      cause,
      status: 'suggested',
      session_exercise_id: sessionExerciseId,
      suggested_exercise_id: suggestedExerciseId,
      delta_json: deltaJson,
      user_id: userId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
