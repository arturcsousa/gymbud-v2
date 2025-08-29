import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Types
export interface CoachRecommendation {
  id: string;
  kind: 'substitute' | 'tweak_prescription' | 'skip_with_alternative' | 'deload';
  cause: string;
  status: 'suggested' | 'applied' | 'dismissed';
  session_exercise_id: string;
  suggested_exercise_id?: string;
  delta_json: {
    type: string;
    from_exercise_id?: string;
    to_exercise_id?: string;
    rationale: string;
    confidence: number;
    fields?: Record<string, any>;
  };
  created_at: string;
  applied_at?: string;
}

export interface CoachConstraints {
  no_equipment?: string[];
  time_limit_min?: number;
  pain_flags?: string[];
  fatigue?: 'low' | 'medium' | 'high';
}

export interface SuggestRequest {
  session_id: string;
  language?: 'en' | 'pt-BR';
  constraints?: CoachConstraints;
}

export interface ApplyResult {
  rec_id: string;
  session_exercise_changes: Array<{
    id: string;
    field: string;
    old_value: any;
    new_value: any;
  }>;
}

// Hook to fetch coach suggestions for a session
export function useCoachSuggestions(sessionId: string, filters?: { status?: string }) {
  return useQuery({
    queryKey: ['coach-suggestions', sessionId, filters],
    queryFn: async (): Promise<CoachRecommendation[]> => {
      let query = supabase
        .from('coach_recommendations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!sessionId
  });
}

// Hook to generate new suggestions
export function useSuggest() {
  const { i18n, t } = useTranslation('coach');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SuggestRequest): Promise<{ items: CoachRecommendation[] }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required');
      }

      const payload = {
        ...request,
        language: request.language || i18n.language as 'en' | 'pt-BR'
      };

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to generate suggestions');
      }

      return response.json();
    },
    onMutate: () => {
      toast.loading(t('toasts.suggesting'));
    },
    onSuccess: (data, variables) => {
      toast.dismiss();
      if (data.items.length > 0) {
        toast.success(t('toasts.suggestionsReady'));
      }
      
      // Invalidate suggestions cache
      queryClient.invalidateQueries({ 
        queryKey: ['coach-suggestions', variables.session_id] 
      });
      
      // Track telemetry
      trackCoachEvent('coach_suggest_succeeded', {
        session_id: variables.session_id,
        suggestions_count: data.items.length,
        constraints: variables.constraints
      });
    },
    onError: (error, variables) => {
      toast.dismiss();
      toast.error(t('toasts.error'));
      
      // Track telemetry
      trackCoachEvent('coach_suggest_failed', {
        session_id: variables.session_id,
        error: error.message,
        constraints: variables.constraints
      });
    }
  });
}

// Hook to apply a recommendation
export function useApplyRecommendation() {
  const { t } = useTranslation('coach');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string): Promise<{ applied: ApplyResult }> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ recommendation_id: recommendationId })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to apply recommendation');
      }

      return response.json();
    },
    onSuccess: (data, recommendationId) => {
      toast.success(t('toasts.applied'));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['coach-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['session-data'] });
      queryClient.invalidateQueries({ queryKey: ['session-exercises'] });
      
      // Track telemetry
      trackCoachEvent('coach_apply_succeeded', {
        recommendation_id: recommendationId,
        changes_count: data.applied.session_exercise_changes.length
      });

      // Announce to screen readers
      announceToScreenReader(t('a11y.applied'));
    },
    onError: (error, recommendationId) => {
      toast.error(t('toasts.error'));
      
      // Track telemetry
      trackCoachEvent('coach_apply_failed', {
        recommendation_id: recommendationId,
        error: error.message
      });
    }
  });
}

// Hook to dismiss a recommendation
export function useDismissRecommendation() {
  const { t } = useTranslation('coach');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendationId: string): Promise<void> => {
      const { error } = await supabase
        .from('coach_recommendations')
        .update({ 
          status: 'dismissed',
          applied_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;
    },
    onSuccess: (_, recommendationId) => {
      toast.success(t('toasts.dismissed'));
      
      // Invalidate suggestions cache
      queryClient.invalidateQueries({ queryKey: ['coach-suggestions'] });
      
      // Track telemetry
      trackCoachEvent('coach_dismissed', {
        recommendation_id: recommendationId
      });

      // Announce to screen readers
      announceToScreenReader(t('a11y.dismissed'));
    },
    onError: (error, recommendationId) => {
      toast.error(t('toasts.error'));
      
      // Track telemetry
      trackCoachEvent('coach_dismiss_failed', {
        recommendation_id: recommendationId,
        error: error.message
      });
    }
  });
}

// Utility functions
function trackCoachEvent(event: string, properties: Record<string, any>) {
  // Integration with existing telemetry system
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      custom_properties: properties,
      timestamp: new Date().toISOString()
    });
  }
  
  // Console log for development
  if (import.meta.env.DEV) {
    console.log(`[Coach Telemetry] ${event}:`, properties);
  }
}

function announceToScreenReader(message: string) {
  if (typeof document === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Combined hook for easier usage
export function useCoach(sessionId: string) {
  const suggestions = useCoachSuggestions(sessionId, { status: 'suggested' });
  const suggest = useSuggest();
  const apply = useApplyRecommendation();
  const dismiss = useDismissRecommendation();

  return {
    suggestions: suggestions.data || [],
    isLoading: suggestions.isLoading,
    error: suggestions.error,
    suggest: suggest.mutate,
    isSuggesting: suggest.isPending,
    apply: apply.mutate,
    isApplying: apply.isPending,
    dismiss: dismiss.mutate,
    isDismissing: dismiss.isPending,
    refetch: suggestions.refetch
  };
}
