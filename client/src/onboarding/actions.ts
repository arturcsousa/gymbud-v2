// client/src/onboarding/actions.ts
import { supabase } from "@/lib/supabase";
import { navigate } from "wouter/use-location";

export async function finalizeOnboarding(planSeed: unknown) {
  // Ensure the user has an ACTIVE plan using our EF
  const { data, error } = await supabase.functions.invoke("plan-get-or-create", {
    body: { seed: planSeed },
  });

  if (error) {
    // Surface a friendly message later (Phase A.5: error mapping)
    throw new Error(error.message || "Failed to activate plan");
  }

  // Jump straight into today's session. If session-get-or-create isn't live yet,
  // your SessionPage can show a "preparing…" state or Home auto-start shim.
  navigate("/app/session/today");
}
