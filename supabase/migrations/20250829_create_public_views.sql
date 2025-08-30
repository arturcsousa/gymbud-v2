-- Migration: Create SECURITY DEFINER functions for Edge Function access to app2 tables
-- Date: 2025-08-29

BEGIN;

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.app2_profiles;
DROP VIEW IF EXISTS public.app2_plans;
DROP VIEW IF EXISTS public.app2_sessions;
DROP VIEW IF EXISTS public.app2_session_exercises;
DROP VIEW IF EXISTS public.app2_logged_sets;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.ef_upsert_profile CASCADE;
DROP FUNCTION IF EXISTS public.ef_get_active_plan CASCADE;
DROP FUNCTION IF EXISTS public.ef_get_draft_plan CASCADE;
DROP FUNCTION IF EXISTS public.ef_promote_draft CASCADE;
DROP FUNCTION IF EXISTS public.ef_create_plan CASCADE;

-- Create SECURITY DEFINER functions that bypass RLS for Edge Functions

-- Function to upsert profile with correct column names
CREATE OR REPLACE FUNCTION public.ef_upsert_profile(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_height_cm numeric DEFAULT NULL,
  p_weight_kg numeric DEFAULT NULL,
  p_body_fat_pct numeric DEFAULT NULL,
  p_resting_hr integer DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_updated_at timestamptz DEFAULT now()
) RETURNS void AS $$
BEGIN
  INSERT INTO app2.profiles (
    user_id, first_name, last_name, height_cm, weight_kg, 
    body_fat_pct, resting_hr, date_of_birth, updated_at
  )
  VALUES (
    p_user_id, p_first_name, p_last_name, p_height_cm, p_weight_kg,
    p_body_fat_pct, p_resting_hr, p_date_of_birth, p_updated_at
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    first_name = p_first_name,
    last_name = p_last_name,
    height_cm = COALESCE(p_height_cm, app2.profiles.height_cm),
    weight_kg = COALESCE(p_weight_kg, app2.profiles.weight_kg),
    body_fat_pct = COALESCE(p_body_fat_pct, app2.profiles.body_fat_pct),
    resting_hr = COALESCE(p_resting_hr, app2.profiles.resting_hr),
    date_of_birth = COALESCE(p_date_of_birth, app2.profiles.date_of_birth),
    updated_at = p_updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active plan
CREATE OR REPLACE FUNCTION public.ef_get_active_plan(p_user_id uuid)
RETURNS TABLE(id uuid, status text) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.status::text
  FROM app2.plans p
  WHERE p.user_id = p_user_id AND p.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get draft plan
CREATE OR REPLACE FUNCTION public.ef_get_draft_plan(p_user_id uuid)
RETURNS TABLE(id uuid, status text, seed jsonb) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.status::text, p.seed
  FROM app2.plans p
  WHERE p.user_id = p_user_id AND p.status = 'draft'
  ORDER BY p.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote draft to active
CREATE OR REPLACE FUNCTION public.ef_promote_draft(
  p_plan_id uuid,
  p_seed jsonb,
  p_updated_at timestamptz DEFAULT now()
) RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  UPDATE app2.plans 
  SET status = 'active', seed = p_seed, updated_at = p_updated_at
  WHERE app2.plans.id = p_plan_id
  RETURNING app2.plans.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new plan
CREATE OR REPLACE FUNCTION public.ef_create_plan(
  p_user_id uuid,
  p_seed jsonb,
  p_goals text[],
  p_experience_level text,
  p_years_away integer,
  p_frequency_days_per_week integer,
  p_schedule_days text[],
  p_session_duration_min integer,
  p_environment text,
  p_coaching_tone text,
  p_height_cm integer,
  p_weight_kg numeric,
  p_resting_hr integer,
  p_body_fat_pct numeric,
  p_locale text,
  p_baseline_completed boolean
) RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO app2.plans (
    user_id, status, seed, goals, experience_level, years_away,
    frequency_days_per_week, schedule_days, session_duration_min,
    environment, coaching_tone, height_cm, weight_kg, resting_hr,
    body_fat_pct, locale, baseline_completed
  ) VALUES (
    p_user_id, 'active', p_seed, p_goals, p_experience_level::app2.experience_level_enum,
    p_years_away, p_frequency_days_per_week, p_schedule_days, p_session_duration_min,
    p_environment::app2.environment_enum, p_coaching_tone::app2.coaching_tone_enum,
    p_height_cm, p_weight_kg, p_resting_hr, p_body_fat_pct, p_locale, p_baseline_completed
  )
  RETURNING app2.plans.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.ef_upsert_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.ef_get_active_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.ef_get_draft_plan TO authenticated;
GRANT EXECUTE ON FUNCTION public.ef_promote_draft TO authenticated;
GRANT EXECUTE ON FUNCTION public.ef_create_plan TO authenticated;

COMMIT;