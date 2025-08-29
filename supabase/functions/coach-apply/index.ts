import { z } from "npm:zod@3.23.8";
import { requireUser, getClient } from "../_shared/auth.ts";
import { parseJson, zUUID } from "../_shared/validate.ts";
import { ok, err, cors } from "../_shared/http.ts";

// Request schema
const zCoachApplyRequest = z.object({
  recommendation_id: zUUID
});

type CoachApplyRequest = z.infer<typeof zCoachApplyRequest>;

interface ApplyResult {
  rec_id: string;
  session_exercise_changes: Array<{
    id: string;
    field: string;
    old_value: any;
    new_value: any;
  }>;
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
  const { data: payload, error: parseError } = await parseJson(req, zCoachApplyRequest);
  if (parseError) return cors(parseError);

  try {
    const { supabase } = getClient(req);
    const result = await applyRecommendation(supabase, user.id, payload.recommendation_id);
    
    return cors(ok({ applied: result }));
  } catch (error) {
    console.error('Coach apply error:', error);
    if (error.message === 'Recommendation not found or access denied') {
      return cors(err(404, 'NOT_FOUND', 'Recommendation not found or access denied'));
    }
    if (error.message === 'Recommendation already applied') {
      // Return success for idempotency
      const existingResult = await getExistingApplyResult(getClient(req).supabase, payload.recommendation_id);
      return cors(ok({ applied: existingResult }));
    }
    return cors(err(500, 'INTERNAL_ERROR', 'Failed to apply recommendation'));
  }
});

async function applyRecommendation(
  supabase: any,
  userId: string,
  recommendationId: string
): Promise<ApplyResult> {
  // Fetch recommendation with RLS enforcement
  const { data: recommendation, error: recError } = await supabase
    .from('coach_recommendations')
    .select(`
      *,
      session_exercises!inner (
        *,
        sessions!inner (
          user_id
        )
      )
    `)
    .eq('id', recommendationId)
    .eq('session_exercises.sessions.user_id', userId)
    .eq('status', 'suggested')
    .single();

  if (recError || !recommendation) {
    // Check if already applied for idempotency
    const { data: appliedRec } = await supabase
      .from('coach_recommendations')
      .select('*')
      .eq('id', recommendationId)
      .eq('status', 'applied')
      .single();
    
    if (appliedRec) {
      throw new Error('Recommendation already applied');
    }
    
    throw new Error('Recommendation not found or access denied');
  }

  const sessionExercise = recommendation.session_exercises;
  const deltaJson = recommendation.delta_json;
  const changes: ApplyResult['session_exercise_changes'] = [];

  // Begin transaction-like operations
  let updateData: Record<string, any> = {};

  // Apply changes based on recommendation kind
  switch (recommendation.kind) {
    case 'substitute':
      if (deltaJson.to_exercise_id) {
        changes.push({
          id: sessionExercise.id,
          field: 'exercise_id',
          old_value: sessionExercise.exercise_id,
          new_value: deltaJson.to_exercise_id
        });
        updateData.exercise_id = deltaJson.to_exercise_id;
      }
      break;

    case 'tweak_prescription':
    case 'deload':
      if (deltaJson.fields) {
        for (const [field, newValue] of Object.entries(deltaJson.fields)) {
          if (sessionExercise[field] !== newValue) {
            changes.push({
              id: sessionExercise.id,
              field,
              old_value: sessionExercise[field],
              new_value: newValue
            });
            updateData[field] = newValue;
          }
        }
      }
      break;

    case 'skip_with_alternative':
      // Mark as skipped and potentially add alternative
      changes.push({
        id: sessionExercise.id,
        field: 'status',
        old_value: sessionExercise.status || 'active',
        new_value: 'skipped'
      });
      updateData.status = 'skipped';
      break;

    default:
      throw new Error(`Unknown recommendation kind: ${recommendation.kind}`);
  }

  // Update session_exercises if there are changes
  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('session_exercises')
      .update(updateData)
      .eq('id', sessionExercise.id);

    if (updateError) {
      throw new Error(`Failed to update session exercise: ${updateError.message}`);
    }
  }

  // Mark recommendation as applied
  const { error: recUpdateError } = await supabase
    .from('coach_recommendations')
    .update({
      status: 'applied',
      applied_at: new Date().toISOString()
    })
    .eq('id', recommendationId);

  if (recUpdateError) {
    throw new Error(`Failed to update recommendation status: ${recUpdateError.message}`);
  }

  // Insert audit log
  const auditMeta = {
    rec_id: recommendationId,
    kind: recommendation.kind,
    delta: deltaJson,
    model_version: 'v1-heuristic',
    session_exercise_id: sessionExercise.id,
    changes: changes
  };

  const { error: auditError } = await supabase
    .from('coach_audit')
    .insert({
      event: 'coach_apply',
      user_id: userId,
      meta: auditMeta,
      created_at: new Date().toISOString()
    });

  if (auditError) {
    console.error('Failed to insert audit log:', auditError);
    // Don't fail the operation for audit logging issues
  }

  return {
    rec_id: recommendationId,
    session_exercise_changes: changes
  };
}

async function getExistingApplyResult(
  supabase: any,
  recommendationId: string
): Promise<ApplyResult> {
  // Try to reconstruct result from audit log
  const { data: auditLog } = await supabase
    .from('coach_audit')
    .select('meta')
    .eq('event', 'coach_apply')
    .eq('meta->>rec_id', recommendationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (auditLog?.meta) {
    return {
      rec_id: recommendationId,
      session_exercise_changes: auditLog.meta.changes || []
    };
  }

  // Fallback: return minimal result
  return {
    rec_id: recommendationId,
    session_exercise_changes: []
  };
}
