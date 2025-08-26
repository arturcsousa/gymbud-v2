import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueOp = 'insert' | 'update' | 'delete';
type Mutation = {
  id: string;
  entity: string;     // 'app2.logged_sets'
  op: QueueOp;        // 'insert' only in this step
  payload: any;       // { id?, session_exercise_id, set_number, reps?, weight?, rpe?, notes? }
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
    if (m.entity !== "app2.logged_sets" || m.op !== "insert") {
      results.push({ id: m.id, status: "skipped", code: "unsupported" });
      continue;
    }

    const p = m.payload || {};
    const row = {
      id: p.id ?? m.id, // idempotency via primary key 'id'
      session_exercise_id: p.session_exercise_id,
      set_number: p.set_number,
      reps: p.reps ?? null,
      weight: p.weight ?? null,
      rpe: p.rpe ?? null,
      notes: p.notes ?? null,
    };

    if (!row.session_exercise_id || typeof row.set_number !== "number") {
      results.push({ id: m.id, status: "error", code: "invalid_payload" });
      continue;
    }

    const { error } = await supabase
      .schema("app2")
      .from("logged_sets")
      .upsert([row], { onConflict: "id", ignoreDuplicates: true });

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
