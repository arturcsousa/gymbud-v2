import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import i18n from "@/i18n";

// Shapes returned by the RPCs (keep loose; typed by usage)
export type ExerciseI18n = {
  exercise_id: string;
  locale: string;
  name: string;
  description: string | null;
  instructions_bulleted: string[] | null;
  cues: string[] | null;
  contraindications: string[] | null;
  category: string | null;
  equipment: string[] | null;
  movement_pattern: string | null;
  rank?: number | null;
};

const lang = () => i18n.language || "en";

export function useExercise(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ["exercise", exerciseId, lang()],
    enabled: !!exerciseId,
    queryFn: async (): Promise<ExerciseI18n | null> => {
      if (!exerciseId) return null;
      const { data, error } = await supabase
        .rpc("rpc_get_exercise_by_id", { p_exercise_id: exerciseId, lang: lang() });
      if (error) throw error;
      // rpc returns a single row (table function) or null
      if (!data || (Array.isArray(data) && data.length === 0)) return null;
      // Supabase may wrap as array; normalize:
      const row = Array.isArray(data) ? data[0] : data;
      return row as ExerciseI18n;
    },
  });
}

export function useExerciseSearch(params: {
  q: string;
  category?: string | null;
  equipment?: string[] | null;
}) {
  const { q, category = null, equipment = null } = params;
  return useQuery({
    queryKey: ["exercise-search", q, category, equipment, lang()],
    enabled: (q?.length ?? 0) > 0,
    queryFn: async (): Promise<ExerciseI18n[]> => {
      const { data, error } = await supabase.rpc("rpc_search_exercises", {
        q,
        lang: lang(),
        p_category: category,
        p_equipment: equipment,
      });
      if (error) throw error;
      return (data ?? []) as ExerciseI18n[];
    },
  });
}
