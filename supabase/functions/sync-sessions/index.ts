import { z } from "npm:zod@3.23.8";
import { CORS_HEADERS, err, json, options } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { parseJson } from "../_shared/validate.ts";

const Status = z.enum(["pending", "in_progress", "completed", "void"]);
const UpdateItem = z.object({
  id: z.string().uuid(),
  status: Status,
  completed_at: z.string().datetime().optional(),
  baseline: z.boolean().optional(), // true only when completing baseline
});
const Body = z.object({ items: z.array(UpdateItem).min(1).max(200) });

Deno.serve(async (req) => {
  const pre = options(req);
  if (pre) return pre;
  if (req.method !== "POST") return err(405, "METHOD_NOT_ALLOWED", "Use POST");

  const authed = await requireUser(req);
  if (authed instanceof Response) return authed;
  const { supabase, userId } = authed;

  // Validate body
  // @ts-ignore
  const parsed = await parseJson(req, Body);
  // @ts-ignore
  if (parsed.error) return parsed.error;
  // @ts-ignore
  const { items } = parsed.data as z.infer<typeof Body>;

  // Business rules: only allow baseline=true when status='completed'
  for (const it of items) {
    if (it.baseline === true && it.status !== "completed") {
      return err(422, "VALIDATION_FAILED", "baseline can only be set when status=completed");
    }
  }

  // Apply updates (RLS ensures these rows belong to user)
  const updates = items.map((it) => ({
    id: it.id,
    status: it.status,
    completed_at: it.completed_at ?? (it.status === "completed" ? new Date().toISOString() : null),
    baseline: it.baseline ?? false,
    user_id: userId, // harmless if column ignored; RLS still binds to auth.uid()
  }));

  // Update sessions
  const { data: updated, error: upErr } = await supabase
    .schema("app2")
    .from("sessions")
    .upsert(updates, { onConflict: "id", ignoreDuplicates: false })
    .select();

  if (upErr) {
    const msg = (upErr as any).message || "Update failed";
    if (/row-level security|permission denied/i.test(msg)) return err(403, "RLS_DENIED", msg);
    return err(400, (upErr as any).code || "EF_DB_ERROR", msg, upErr);
  }

  // Handle baseline side-effects (flip profile flag + audit entry) for any completed baseline
  const completedBaselineIds = (updated ?? [])
    .filter((r: any) => r.status === "completed" && r.baseline === true)
    .map((r: any) => r.id as string);

  if (completedBaselineIds.length > 0) {
    // 1) flip profiles.assessment_required = false
    const { error: profErr } = await supabase
      .schema("app2")
      .from("profiles")
      .update({ assessment_required: false })
      .eq("user_id", userId);
    if (profErr) {
      return err(400, (profErr as any).code || "EF_DB_ERROR", "Profile flip failed", profErr);
    }

    // 2) log to coach_audit
    const auditRows = completedBaselineIds.map((sid) => ({
      user_id: userId,
      event: "baseline_completed",
      session_id: sid,
      created_at: new Date().toISOString(),
    }));
    const { error: auditErr } = await supabase
      .schema("app2")
      .from("coach_audit")
      .insert(auditRows);
    if (auditErr) {
      return err(400, (auditErr as any).code || "EF_DB_ERROR", "Audit log failed", auditErr);
    }
  }

  return json(200, { ok: true, updated: updated?.length ?? 0, items: updated ?? [] });
});
