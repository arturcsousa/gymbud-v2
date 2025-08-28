// Validated, RLS-aware insert into app2.logged_sets
import { z } from "npm:zod@3.23.8";
import { CORS_HEADERS, json, err, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { parseJson } from "../_shared/validate.ts";

const LoggedSetItem = z.object({
  session_exercise_id: z.string().uuid(),
  reps: z.number().int().min(0).max(500),
  weight: z.number().min(0).max(2000),
  rpe: z.number().min(0).max(10).optional(),
  notes: z.string().max(2000).optional(),
  created_at: z.string().datetime().optional(),
});
const BodySchema = z.object({ items: z.array(LoggedSetItem).min(1).max(200) });

Deno.serve(async (req) => {
  // CORS preflight
  const pre = options(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return err(405, "METHOD_NOT_ALLOWED", "Use POST");
  }

  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;
  const { supabase, userId } = authed;

  const parsed = await parseJson(req, BodySchema);
  // parseJson returns Response on error
  // @ts-ignore
  if (parsed.error) return parsed.error;
  // @ts-ignore
  const { items } = parsed.data as z.infer<typeof BodySchema>;

  // Attach user_id server-side; RLS ensures session_exercise belongs to user
  const rows = items.map((i) => ({
    session_exercise_id: i.session_exercise_id,
    reps: i.reps,
    weight: i.weight,
    rpe: i.rpe ?? null,
    notes: i.notes ?? null,
    created_at: i.created_at ?? null,
    user_id: userId, // if column exists; if not, RLS still checks via session->session_exercise join
  }));

  const { data, error } = await supabase
    .schema("app2")
    .from("logged_sets")
    .insert(rows)
    .select();

  if (error) {
    // Map common failure modes
    const msg = (error as any).message || "Insert failed";
    const code = (error as any).code || "EF_DB_ERROR";
    // RLS/permission denied → 403; constraint → 409; otherwise 400
    if (/violates row-level security|permission denied/i.test(msg)) {
      return err(403, "RLS_DENIED", msg);
    }
    if (code === "23505") { // unique_violation
      return err(409, "CONFLICT", msg);
    }
    return err(400, code, msg, error);
  }

  return new Response(
    JSON.stringify({ ok: true, inserted: data?.length ?? 0, items: data ?? [] }),
    { status: 201, headers: CORS_HEADERS },
  );
});
