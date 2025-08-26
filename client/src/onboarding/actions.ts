// client/src/onboarding/actions.ts
import { supabase } from "@/lib/supabase";

export async function finalizeOnboarding(planSeed?: unknown, navigate?: (path: string) => void) {
  // Create a default plan seed if none provided
  const defaultSeed = {
    goals: ["general_fitness"],
    experience_level: "new",
    frequency_days_per_week: 3,
    schedule_days: ["monday", "wednesday", "friday"],
    session_duration_min: 45,
    environment: "professional_gym",
    coaching_tone: "supportive"
  };

  // Ensure the user has an ACTIVE plan using our EF
  const { error } = await supabase.functions.invoke("plan-get-or-create", {
    body: { seed: planSeed || defaultSeed },
  });

  if (error) {
    // Surface a friendly message later (Phase A.5: error mapping)
    throw new Error(error.message || "Failed to activate plan");
  }

  // Jump straight into today's session if navigate function provided
  if (navigate) {
    navigate("/app/session/today");
  }
}
