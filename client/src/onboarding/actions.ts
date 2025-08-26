// client/src/onboarding/actions.ts
import { supabase } from "@/lib/supabase";

export async function finalizeOnboarding(planSeed: unknown) {
  // Ensure active plan (idempotent EF)
  const { error } = await supabase.functions.invoke("plan-get-or-create", {
    body: { seed: planSeed },
  });
  if (error) throw new Error(error.message || "Failed to activate plan");

  // Optional but recommended for instant workout flow:
  // set assessment_required = false, allowed by RLS for own profile
  const { data: user } = await supabase.auth.getUser();
  if (user?.user?.id) {
    await supabase
      .from("profiles")
      .update({ assessment_required: false })
      .eq("user_id", user.user.id);
    // ignore small errors here; not critical for navigation
  }

  // Navigate to session route using window.location for reliability
  window.location.href = "/app/session/today";
}
