import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueOp = 'insert' | 'update' | 'delete';
type Mutation = {
  id: string;
  entity: string;     // 'app2.sessions'
  op: QueueOp;        // 'update' only in this step
  payload: any;       // { id, status?, started_at?, completed_at?, notes?, updated_at? }
};

// Valid status transitions
const VALID_TRANSITIONS = {
  'pending': ['active', 'cancelled'],
  'active': ['completed', 'cancelled'],
  'completed': [], // terminal state
  'cancelled': []  // terminal state
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
    if (m.entity !== "app2.sessions" || m.op !== "update") {
      results.push({ id: m.id, status: "skipped", code: "unsupported" });
      continue;
    }

    const p = m.payload || {};
    
    // Build update object with only allowed fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (p.status !== undefined) updateData.status = p.status;
    if (p.started_at !== undefined) updateData.started_at = p.started_at;
    if (p.completed_at !== undefined) updateData.completed_at = p.completed_at;
    if (p.notes !== undefined) updateData.notes = p.notes;

    const sessionId = p.id ?? m.id;
    if (!sessionId) {
      results.push({ id: m.id, status: "error", code: "invalid_payload" });
      continue;
    }

    // If status is being updated, validate transition
    if (p.status) {
      // First get current status
      const { data: currentSession, error: fetchError } = await supabase
        .schema("app2")
        .from("sessions")
        .select("status")
        .eq("id", sessionId)
        .single();

      if (fetchError) {
        results.push({ id: m.id, status: "error", code: fetchError.code ?? "db_error", message: fetchError.message });
        continue;
      }

      const currentStatus = currentSession?.status;
      const newStatus = p.status;

      // Validate transition
      if (currentStatus && currentStatus !== newStatus) {
        const validNextStates = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || [];
        if (!validNextStates.includes(newStatus)) {
          results.push({ id: m.id, status: "error", code: "invalid_payload" });
          continue;
        }
      }
    }

    const { error } = await supabase
      .schema("app2")
      .from("sessions")
      .update(updateData)
      .eq("id", sessionId);

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
