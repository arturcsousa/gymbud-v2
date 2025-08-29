import { supabase } from '@/lib/supabase';

export type ExerciseMeta = {
  id: string;
  name: string;
  description?: string;
  category: string;
  equipment: string[];
  patterns: string[];
  primary_muscles: string[];
  complexity_level: number;
  video_url?: string;
};

export type ExerciseVariant = {
  id: string;
  exercise_id: string;
  name: string;
  modality: string;
  environments: string[];
  equipment: string[];
  is_assessment_default: boolean;
  tags: string[];
  notes?: string;
};

/**
 * Get exercise by ID with localization
 */
export async function getExerciseById(
  exerciseId: string, 
  lang: 'en' | 'pt-BR' = 'en'
): Promise<ExerciseMeta | null> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_exercise_by_id', {
      p_exercise_id: exerciseId,
      lang
    });

    if (error) {
      console.error('Failed to get exercise by ID:', error);
      return null;
    }

    return data ? {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      equipment: data.equipment || [],
      patterns: data.patterns || [],
      primary_muscles: data.primary_muscles || [],
      complexity_level: data.complexity_level || 1,
      video_url: data.video_url
    } : null;
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return null;
  }
}

/**
 * Get variants for a specific exercise
 */
export async function getVariantsForExercise(
  exerciseId: string,
  lang: 'en' | 'pt-BR' = 'en'
): Promise<ExerciseVariant[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_variants_for_exercise', {
      p_exercise_id: exerciseId,
      lang
    });

    if (error) {
      console.error('Failed to get variants:', error);
      return [];
    }

    return (data || []).map((variant: any) => ({
      id: variant.id,
      exercise_id: variant.exercise_id,
      name: variant.name,
      modality: variant.modality,
      environments: variant.environments || [],
      equipment: variant.equipment || [],
      is_assessment_default: variant.is_assessment_default || false,
      tags: variant.tags || [],
      notes: variant.notes
    }));
  } catch (error) {
    console.error('Error fetching variants:', error);
    return [];
  }
}

/**
 * Search exercises with filters
 */
export async function searchExercises(
  query: string,
  lang: 'en' | 'pt-BR' = 'en',
  category?: string,
  equipment?: string[]
): Promise<ExerciseMeta[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_search_exercises', {
      q: query,
      lang,
      p_category: category || null,
      p_equipment: equipment || null
    });

    if (error) {
      console.error('Failed to search exercises:', error);
      return [];
    }

    return (data || []).map((exercise: any) => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      category: exercise.category,
      equipment: exercise.equipment || [],
      patterns: exercise.patterns || [],
      primary_muscles: exercise.primary_muscles || [],
      complexity_level: exercise.complexity_level || 1,
      video_url: exercise.video_url
    }));
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
}

export type CompatibilityConstraints = {
  availableEquipment?: string[];
  excludedExercises?: string[];
  maxComplexityDelta?: number;
  userInjuries?: string[];
  preferredModalities?: string[];
};

/**
 * Get compatible substitutions for an exercise with deterministic ordering
 */
export async function getCompatibleSubs(
  original: ExerciseMeta,
  lang: 'en' | 'pt-BR' = 'en',
  constraints: CompatibilityConstraints = {}
): Promise<ExerciseMeta[]> {
  try {
    // Search for exercises in the same category
    const candidates = await searchExercises('', lang, original.category);
    
    // Filter out the original exercise
    const filtered = candidates.filter(ex => ex.id !== original.id);
    
    // Apply compatibility filtering
    const compatible = filtered.filter(candidate => 
      isCompatibleExercise(original, candidate, constraints)
    );
    
    // Deterministic sort: pattern match > primary muscle match > complexity > name > id
    const sorted = compatible.sort((a, b) => {
      // 1. Pattern compatibility (higher score = better match)
      const aPatternScore = getPatternCompatibilityScore(original, a);
      const bPatternScore = getPatternCompatibilityScore(original, b);
      if (aPatternScore !== bPatternScore) {
        return bPatternScore - aPatternScore;
      }
      
      // 2. Primary muscle overlap (more overlap = better)
      const aMuscleScore = getMuscleCompatibilityScore(original, a);
      const bMuscleScore = getMuscleCompatibilityScore(original, b);
      if (aMuscleScore !== bMuscleScore) {
        return bMuscleScore - aMuscleScore;
      }
      
      // 3. Complexity difference (smaller difference = better)
      const aComplexityDiff = Math.abs(original.complexity_level - a.complexity_level);
      const bComplexityDiff = Math.abs(original.complexity_level - b.complexity_level);
      if (aComplexityDiff !== bComplexityDiff) {
        return aComplexityDiff - bComplexityDiff;
      }
      
      // 4. Alphabetical by name
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) {
        return nameCompare;
      }
      
      // 5. Finally by ID for absolute determinism
      return a.id.localeCompare(b.id);
    });
    
    // Return top 6 matches
    return sorted.slice(0, 6);
  } catch (error) {
    console.error('Error getting compatible substitutions:', error);
    return [];
  }
}

function isCompatibleExercise(
  original: ExerciseMeta,
  candidate: ExerciseMeta,
  constraints: CompatibilityConstraints
): boolean {
  // Must be same category
  if (original.category !== candidate.category) {
    return false;
  }
  
  // Check complexity delta
  const maxDelta = constraints.maxComplexityDelta ?? 1;
  if (Math.abs(original.complexity_level - candidate.complexity_level) > maxDelta) {
    return false;
  }
  
  // Check equipment availability
  if (constraints.availableEquipment) {
    const hasRequiredEquipment = candidate.equipment.every(eq => 
      constraints.availableEquipment!.includes(eq)
    );
    if (!hasRequiredEquipment) {
      return false;
    }
  }
  
  // Check exclusions
  if (constraints.excludedExercises?.includes(candidate.id)) {
    return false;
  }
  
  // Must have at least one overlapping primary muscle
  const hasMusclOverlap = original.primary_muscles.some(muscle =>
    candidate.primary_muscles.includes(muscle)
  );
  if (!hasMusclOverlap) {
    return false;
  }
  
  return true;
}

function getPatternCompatibilityScore(original: ExerciseMeta, candidate: ExerciseMeta): number {
  const overlap = original.patterns.filter(pattern => 
    candidate.patterns.includes(pattern)
  ).length;
  
  const totalPatterns = Math.max(original.patterns.length, candidate.patterns.length);
  return totalPatterns > 0 ? overlap / totalPatterns : 0;
}

function getMuscleCompatibilityScore(original: ExerciseMeta, candidate: ExerciseMeta): number {
  const overlap = original.primary_muscles.filter(muscle => 
    candidate.primary_muscles.includes(muscle)
  ).length;
  
  const totalMuscles = Math.max(original.primary_muscles.length, candidate.primary_muscles.length);
  return totalMuscles > 0 ? overlap / totalMuscles : 0;
}
