import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueOp = 'insert' | 'update' | 'delete';
type Mutation = {
  id: string;
  entity: string;     // 'app2.coach_audit'
  op: QueueOp;        // 'insert' only
  payload: any;       // { id, tool, args_json, args_hash?, explain?, session_exercise_id?, created_at? }
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // IMPORTANT: run under the *end-user* JWT so RLS applies.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  let body: { mutations?: Mutation[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const mutations = body.mutations ?? [];
  const results: Array<{ id: string; status: string; code?: string; message?: string }> = [];

  for (const m of mutations) {
    if (m.entity !== "app2.coach_audit" || m.op !== "insert") {
      results.push({ id: m.id, status: "skipped", code: "unsupported" });
      continue;
    }

    const p = m.payload || {};
    const auditId = p.id ?? m.id;
    
    if (!auditId || !p.tool || !p.args_json) {
      results.push({ id: m.id, status: "error", code: "invalid_payload" });
      continue;
    }

    // Build row data with allowed fields
    const rowData: any = {
      id: auditId,
      tool: p.tool,
      args_json: p.args_json,
      created_at: p.created_at || new Date().toISOString()
    };

    // Optional fields
    if (p.args_hash !== undefined) rowData.args_hash = p.args_hash;
    if (p.explain !== undefined) rowData.explain = p.explain;
    if (p.session_exercise_id !== undefined) rowData.session_exercise_id = p.session_exercise_id;

    // Validate foreign key ownership via RLS if session_exercise_id is provided
    if (rowData.session_exercise_id) {
      const { data: sessionExerciseCheck, error: sessionExerciseError } = await supabase
        .schema("app2")
        .from("session_exercises")
        .select("id")
        .eq("id", rowData.session_exercise_id)
        .single();

      if (sessionExerciseError || !sessionExerciseCheck) {
        results.push({ id: m.id, status: "error", code: "rls_denied" });
        continue;
      }
    }

    // Insert-only with idempotency via ON CONFLICT DO NOTHING
    const { error } = await supabase
      .schema("app2")
      .from("coach_audit")
      .upsert([rowData], { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      results.push({ id: m.id, status: "error", code: error.code ?? "db_error", message: error.message });
    } else {
      results.push({ id: m.id, status: "ok" });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "content-type": "application/json" },
  });
});
