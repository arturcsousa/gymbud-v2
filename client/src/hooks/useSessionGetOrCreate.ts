import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type SessionGetOrCreateOptions = {
  date?: string;
  lang?: "en" | "pt-BR";
  n?: number;
  equipment?: string[];
  plan_id?: string | null;
};

type SessionResponse = {
  session: {
    id: string;
    user_id: string;
    session_date: string;
    status: string;
    baseline?: boolean;
  };
  exercises: Array<{
    id: string;
    exercise_id: string;
    order_index: number;
    prescription: {
      sets: number;
      reps: number;
      rest_sec: number;
      stage: string;
      rpe?: number;
      tempo?: string | null;
      weight_kg?: number;
    };
  }>;
};

export function useSessionGetOrCreate() {
  return useMutation({
    mutationFn: async (opts: SessionGetOrCreateOptions = {}): Promise<SessionResponse> => {
      // Get current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required");
      }

      // Call the Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/session-get-or-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(opts),
      });

      const json = await response.json();
      
      if (!response.ok || json?.ok === false) {
        const errorMessage = json?.error?.message ?? `HTTP ${response.status}: Failed to get/create session`;
        throw new Error(errorMessage);
      }

      return json.data;
    },
  });
}
