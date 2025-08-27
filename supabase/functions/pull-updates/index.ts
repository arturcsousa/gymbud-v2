import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "auth_missing" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // IMPORTANT: run under the *end-user* JWT so RLS applies.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Verify auth and get user ID
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "auth_invalid" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: PullRequest = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
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
      .eq("user_id", userData.user.id)
      .gt("updated_at", since)
      .order("updated_at", { ascending: true });

    if (sessionsError) {
      return new Response(JSON.stringify({ error: "db_error", detail: sessionsError.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
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
      .eq("sessions.user_id", userData.user.id)
      .gt("updated_at", since)
      .order("updated_at", { ascending: true });

    if (sessionExercisesError) {
      return new Response(JSON.stringify({ error: "db_error", detail: sessionExercisesError.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    // Fetch logged_sets created since last pull (insert-only, use created_at)
    // Uses idx_logged_sets_sx_updated_at and cascade join to user
    const { data: loggedSets, error: loggedSetsError } = await supabase
      .schema("app2")
      .from("logged_sets")
      .select(`
        *,
        session_exercises!inner(
          sessions!inner(user_id)
        )
      `)
      .eq("session_exercises.sessions.user_id", userData.user.id)
      .gt("created_at", since)
      .order("created_at", { ascending: true });

    if (loggedSetsError) {
      return new Response(JSON.stringify({ error: "db_error", detail: loggedSetsError.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
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

    return new Response(JSON.stringify(response), {
      headers: { "content-type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error in pull-updates:", error);
    return new Response(JSON.stringify({ error: "server_unavailable", detail: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
