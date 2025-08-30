import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireUser, getClient } from '../_shared/auth.ts';
import { ok, fail, jsonResponse } from '../_shared/http.ts';

interface PullRequest {
  since?: string; // ISO8601 timestamp
}

interface PullResponse {
  ok: boolean;
  since: string;
  until: string;
  counts: {
    sessions: number;
    session_exercises: number;
    logged_sets: number;
  };
  data: {
    sessions: any[];
    session_exercises: any[];
    logged_sets: any[];
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(fail('method_not_allowed', 'POST required'), 405);
  }

  // Auth validation
  const { user, supabase } = await requireUser(req);

  let body: PullRequest = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse(fail('invalid_json', 'Invalid JSON'), 400);
  }

  const since = body.since || "1970-01-01T00:00:00Z";
  const until = new Date().toISOString();

  try {
    // Fetch sessions updated since last pull
    // Uses idx_sessions_user_updated_at with user_id as left-most column
    const { data: sessions, error: sessionsError } = await supabase
      .schema("app2")
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .gt("updated_at", since)
      .order("updated_at", { ascending: true });

    if (sessionsError) {
      return jsonResponse(fail('db_error', sessionsError.message), 500);
    }

    // Fetch session_exercises updated since last pull
    // Uses idx_session_exercises_session_updated_at via JOIN to sessions
    const { data: sessionExercises, error: sessionExercisesError } = await supabase
      .schema("app2")
      .from("session_exercises")
      .select(`
        *,
        sessions!inner(user_id)
      `)
      .eq("sessions.user_id", user.id)
      .gt("updated_at", since)
      .order("updated_at", { ascending: true });

    if (sessionExercisesError) {
      return jsonResponse(fail('db_error', sessionExercisesError.message), 500);
    }

    // Fetch logged_sets created since last pull (insert-only, use created_at)
    // Uses idx_logged_sets_sx_created_at and cascade join to user
    const { data: loggedSets, error: loggedSetsError } = await supabase
      .schema("app2")
      .from("logged_sets")
      .select(`
        *,
        session_exercises!inner(
          sessions!inner(user_id)
        )
      `)
      .eq("session_exercises.sessions.user_id", user.id)
      .gt("created_at", since)
      .order("created_at", { ascending: true });

    if (loggedSetsError) {
      return jsonResponse(fail('db_error', loggedSetsError.message), 500);
    }

    const response: PullResponse = {
      ok: true,
      since,
      until,
      counts: {
        sessions: sessions?.length || 0,
        session_exercises: sessionExercises?.length || 0,
        logged_sets: loggedSets?.length || 0,
      },
      data: {
        sessions: sessions || [],
        session_exercises: sessionExercises?.map(se => {
          // Remove nested sessions object from response
          const { sessions: _, ...cleanSe } = se;
          return cleanSe;
        }) || [],
        logged_sets: loggedSets?.map(ls => {
          // Remove nested session_exercises object from response
          const { session_exercises: _, ...cleanLs } = ls;
          return cleanLs;
        }) || [],
      },
    };

    return jsonResponse(ok(response), 200);

  } catch (error) {
    console.error("Unexpected error in pull-updates:", error);
    return jsonResponse(fail('server_unavailable', error.message), 500);
  }
});
