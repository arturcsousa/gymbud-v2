// client/src/lib/plan/ensureActivePlan.ts
import { supabase } from "@/lib/supabase";

export async function ensureActivePlan(seedIfNeeded?: unknown) {
  // Query for an active plan
  const { data: active, error: activeErr } = await supabase
    .from("app2_plans") // if you expose a view; otherwise use RPC or an EF to list
    .select("id, status")
    .eq("status", "active")
    .maybeSingle();

  // If you don't have a public view for plans, skip the select and just invoke EF.
  if (activeErr || !active) {
    await supabase.functions.invoke("plan-get-or-create", {
      body: seedIfNeeded ? { seed: seedIfNeeded } : {},
    });
  }
}
