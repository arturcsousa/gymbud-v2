import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireUser, getClient } from '../_shared/auth.ts';
import { ok, fail, jsonResponse } from '../_shared/http.ts';

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

  // Auth validation
  const { user, error: authErr } = await requireUser(req);
  if (!user) {
    const code = authErr === 'auth_invalid' ? 'auth_invalid' : 'auth_missing';
    return jsonResponse(fail(code, 'Authentication required'), 401);
  }

  // Get authenticated Supabase client
  const { supabase } = getClient(req);

  // IMPORTANT: scope to the app2 schema
  const db = supabase.schema('app2');

  let body: { mutations?: Mutation[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(fail("invalid_json", "Invalid JSON"), 400);
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
      const { data: sessionExerciseCheck, error: sessionExerciseError } = await db
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
    const { error } = await db
      .from("coach_audit")
      .upsert([rowData], { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      results.push({ id: m.id, status: "error", code: error.code ?? "db_error", message: error.message });
    } else {
      results.push({ id: m.id, status: "ok" });
    }
  }

  return jsonResponse(ok(results));
});
