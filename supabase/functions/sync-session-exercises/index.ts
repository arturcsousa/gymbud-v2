import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueOp = 'insert' | 'update' | 'delete';
type Mutation = {
  id: string;
  entity: string;     // 'app2.session_exercises'
  op: QueueOp;        // 'insert' or 'update'
  payload: any;       // { id, session_id, order_index, exercise_name?, exercise_id?, variant_id?, prescription?, updated_at? }
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
    if (m.entity !== "app2.session_exercises" || (m.op !== "insert" && m.op !== "update")) {
      results.push({ id: m.id, status: "skipped", code: "unsupported" });
      continue;
    }

    const p = m.payload || {};
    const sessionExerciseId = p.id ?? m.id;
    
    if (!sessionExerciseId) {
      results.push({ id: m.id, status: "error", code: "invalid_payload" });
      continue;
    }

    // Build row data with allowed fields
    const rowData: any = {
      id: sessionExerciseId,
      updated_at: new Date().toISOString()
    };

    // Required fields for insert
    if (m.op === "insert") {
      if (!p.session_id || typeof p.order_index !== "number") {
        results.push({ id: m.id, status: "error", code: "invalid_payload" });
        continue;
      }
      rowData.session_id = p.session_id;
      rowData.order_index = p.order_index;
    }

    // Optional fields for both insert and update
    if (p.session_id !== undefined) rowData.session_id = p.session_id;
    if (p.order_index !== undefined) rowData.order_index = p.order_index;
    if (p.exercise_name !== undefined) rowData.exercise_name = p.exercise_name;
    if (p.exercise_id !== undefined) rowData.exercise_id = p.exercise_id;
    if (p.variant_id !== undefined) rowData.variant_id = p.variant_id;
    if (p.prescription !== undefined) rowData.prescription = p.prescription;

    // Validate foreign key ownership via RLS
    if (rowData.session_id) {
      const { data: sessionCheck, error: sessionError } = await supabase
        .schema("app2")
        .from("sessions")
        .select("id")
        .eq("id", rowData.session_id)
        .single();

      if (sessionError || !sessionCheck) {
        results.push({ id: m.id, status: "error", code: "rls_denied" });
        continue;
      }
    }

    const { error } = await supabase
      .schema("app2")
      .from("session_exercises")
      .upsert([rowData], { onConflict: "id", ignoreDuplicates: false });

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
