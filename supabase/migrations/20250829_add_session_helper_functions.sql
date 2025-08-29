-- Migration: Add helper functions for session-get-or-create Edge Function
-- Date: 2025-08-29

BEGIN;

-- Function to deterministically pick exercises for a session
-- Uses MD5 hash for stable ordering based on user_id + session_date
CREATE OR REPLACE FUNCTION app2.fn_pick_exercises(
  p_user_id uuid,
  p_session_date text, -- ISO date string (YYYY-MM-DD)
  p_equipment text[] DEFAULT NULL,
  p_n integer DEFAULT 6
) RETURNS TABLE(exercise_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT el.id
  FROM preserve.exercise_library el
  WHERE 
    -- Equipment filter (if provided)
    (p_equipment IS NULL OR el.equipment && p_equipment)
    -- Exclude assessment-only exercises for regular sessions
    AND NOT EXISTS (
      SELECT 1 FROM preserve.exercise_variants ev 
      WHERE ev.exercise_id = el.id 
      AND ev.is_assessment_default = true
    )
  ORDER BY 
    -- Deterministic ordering using MD5 hash
    md5(el.id::text || p_user_id::text || p_session_date),
    el.complexity_level ASC,
    el.name ASC,
    el.id ASC
  LIMIT p_n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get rest seconds from user's active plan
CREATE OR REPLACE FUNCTION app2.fn_pick_rest_sec(
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  v_rest_sec integer;
BEGIN
  -- Get rest_sec from user's active plan seed
  SELECT COALESCE(
    (seed->>'rest_sec')::integer,
    90 -- Default fallback
  ) INTO v_rest_sec
  FROM app2.plans
  WHERE user_id = p_user_id 
    AND status = 'active'
  LIMIT 1;
  
  -- Return fallback if no active plan found
  RETURN COALESCE(v_rest_sec, 90);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's timezone from profile
CREATE OR REPLACE FUNCTION app2.fn_user_tz(
  p_user_id uuid
) RETURNS text AS $$
DECLARE
  v_timezone text;
BEGIN
  -- Get timezone from user's profile
  SELECT timezone INTO v_timezone
  FROM app2.profiles
  WHERE user_id = p_user_id;
  
  -- Return fallback if no timezone found
  RETURN COALESCE(v_timezone, 'America/New_York');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get plan seed (active or explicit plan)
CREATE OR REPLACE FUNCTION app2.fn_plan_seed(
  p_user_id uuid,
  p_plan_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_seed jsonb;
BEGIN
  IF p_plan_id IS NOT NULL THEN
    -- Get specific plan seed
    SELECT seed INTO v_seed
    FROM app2.plans
    WHERE id = p_plan_id AND user_id = p_user_id;
  ELSE
    -- Get active plan seed
    SELECT seed INTO v_seed
    FROM app2.plans
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
  END IF;
  
  -- Return empty object if no plan found
  RETURN COALESCE(v_seed, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count user's completed sessions
CREATE OR REPLACE FUNCTION app2.fn_user_completed_sessions_count(
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM app2.sessions
  WHERE user_id = p_user_id AND status = 'completed';
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to build prescription with progressive overload
CREATE OR REPLACE FUNCTION app2.fn_build_prescription(
  p_user_id uuid,
  p_exercise_id uuid,
  p_seed jsonb DEFAULT '{}',
  p_default_sets integer DEFAULT 3,
  p_default_reps integer DEFAULT 10,
  p_default_rest integer DEFAULT 90,
  p_session_index integer DEFAULT 1
) RETURNS jsonb AS $$
DECLARE
  v_prescription jsonb;
  v_last_weight numeric;
  v_last_reps integer;
  v_progression_needed boolean := false;
  v_deload_cycle integer;
  v_is_deload boolean := false;
BEGIN
  -- Check if this is a deload session (every 12 sessions by default)
  v_deload_cycle := COALESCE((p_seed->>'deload_every')::integer, 12);
  v_is_deload := (p_session_index > 1 AND (p_session_index - 1) % v_deload_cycle = 0);
  
  -- Get most recent performance for this exercise
  SELECT 
    ls.weight_kg,
    ls.reps
  INTO v_last_weight, v_last_reps
  FROM app2.logged_sets ls
  JOIN app2.session_exercises se ON ls.session_exercise_id = se.id
  JOIN app2.sessions s ON se.session_id = s.id
  WHERE s.user_id = p_user_id 
    AND se.exercise_id = p_exercise_id
    AND s.status = 'completed'
    AND ls.voided = false
  ORDER BY ls.created_at DESC
  LIMIT 1;
  
  -- Determine if progression is needed (hit target reps in last session)
  IF v_last_reps IS NOT NULL AND v_last_reps >= p_default_reps THEN
    v_progression_needed := true;
  END IF;
  
  -- Build base prescription from seed or defaults
  v_prescription := jsonb_build_object(
    'sets', COALESCE((p_seed->>'sets')::integer, p_default_sets),
    'reps', COALESCE((p_seed->>'reps')::integer, p_default_reps),
    'rest_sec', COALESCE((p_seed->>'rest_sec')::integer, p_default_rest),
    'stage', 'work'
  );
  
  -- Apply progressive overload if needed and not deload
  IF v_progression_needed AND NOT v_is_deload AND v_last_weight IS NOT NULL THEN
    -- Small weight progression (2.5kg default)
    v_prescription := v_prescription || jsonb_build_object(
      'weight_kg', v_last_weight + COALESCE((p_seed->>'progression_step')::numeric, 2.5)
    );
  ELSIF v_last_weight IS NOT NULL THEN
    -- Keep same weight
    v_prescription := v_prescription || jsonb_build_object('weight_kg', v_last_weight);
  END IF;
  
  -- Apply deload reduction if needed
  IF v_is_deload THEN
    v_prescription := v_prescription || jsonb_build_object(
      'rpe', GREATEST(5, COALESCE((p_seed->>'rpe')::integer, 7) - 2)
    );
  ELSE
    -- Normal RPE
    v_prescription := v_prescription || jsonb_build_object(
      'rpe', COALESCE((p_seed->>'rpe')::integer, 7)
    );
  END IF;
  
  -- Add tempo if specified in seed
  IF p_seed ? 'tempo' THEN
    v_prescription := v_prescription || jsonb_build_object('tempo', p_seed->>'tempo');
  END IF;
  
  RETURN v_prescription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION app2.fn_pick_exercises TO authenticated;
GRANT EXECUTE ON FUNCTION app2.fn_pick_rest_sec TO authenticated;
GRANT EXECUTE ON FUNCTION app2.fn_user_tz TO authenticated;
GRANT EXECUTE ON FUNCTION app2.fn_plan_seed TO authenticated;
GRANT EXECUTE ON FUNCTION app2.fn_user_completed_sessions_count TO authenticated;
GRANT EXECUTE ON FUNCTION app2.fn_build_prescription TO authenticated;

COMMIT;
