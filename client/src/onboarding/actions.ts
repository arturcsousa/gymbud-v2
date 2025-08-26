// client/src/onboarding/actions.ts
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export async function finalizeOnboarding(planSeed: unknown) {
  const [, navigate] = useLocation();
  
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

  // Straight to the session route (your session page can show a "preparing..." state
  // until session-get-or-create is wired in Phase D)
  navigate("/app/session/today");
}
