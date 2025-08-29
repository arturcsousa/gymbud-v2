import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export interface ExerciseDetails {
  exercise_id: string;
  name: string;
  description?: string;
  category: string;
  equipment: string[];
  primary_muscles: string[];
  complexity_level: number;
  video_url?: string;
  patterns: string[];
  goal_effectiveness: Record<string, number>;
  // Locale-aware fields from i18n table
  cues: string[];
  contraindications: string[];
  name_lc: string;
}

/**
 * Hook to fetch exercise details with locale-aware data
 * Uses app2.rpc_get_exercise_by_id with current language
 */
export function useExerciseDetails(exerciseId?: string) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'pt-BR' ? 'pt-BR' : 'en';

  return useQuery({
    queryKey: ['exercise-details', exerciseId, currentLang],
    queryFn: async (): Promise<ExerciseDetails | null> => {
      if (!exerciseId) return null;

      const { data, error } = await supabase.rpc('rpc_get_exercise_by_id', {
        p_exercise_id: exerciseId,
        lang: currentLang
      });

      if (error) {
        console.error('Failed to fetch exercise details:', error);
        throw error;
      }

      if (!data) return null;

      return {
        exercise_id: data.exercise_id,
        name: data.name,
        description: data.description,
        category: data.category,
        equipment: data.equipment || [],
        primary_muscles: data.primary_muscles || [],
        complexity_level: data.complexity_level || 1,
        video_url: data.video_url,
        patterns: data.patterns || [],
        goal_effectiveness: data.goal_effectiveness || {},
        cues: data.cues || [],
        contraindications: data.contraindications || [],
        name_lc: data.name_lc
      };
    },
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2
  });
}
