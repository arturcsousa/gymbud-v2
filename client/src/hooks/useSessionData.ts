import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/db/gymbud-db';
import { supabase } from '@/lib/supabase';
import { enqueueLoggedSet, enqueueSessionUpdate } from '@/sync/queue';

interface SessionExercise {
  session_exercise_id: string;
  session_id: string;
  user_id: string;
  session_date: string;
  plan_id: string | null;
  order_index: number;
  exercise_name: string;
  variant_id: string | null;
  pattern: string | null;
  prescription: {
    stage: 'warmup' | 'work';
    sets: number;
    reps?: number | number[];
    rest_sec: number;
    weight?: number;
    tempo?: string;
    rir?: number;
    percent_1rm?: number;
    duration_sec?: number;
    ramp?: any;
  };
  stage: 'warmup' | 'work';
  rest_sec: number;
  sets: number;
  reps_scalar: number | null;
  reps_array_json: number[] | null;
  is_warmup: boolean;
  session_status: 'pending' | 'active' | 'completed' | 'cancelled';
}

interface LoggedSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  duration_sec: number | null;
  notes: string | null;
  meta: any;
  created_at: string;
}

interface SessionData {
  id: string;
  user_id: string;
  plan_id: string | null;
  session_date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export function useSessionData(sessionId?: string) {
  const [offlineData, setOfflineData] = useState<{
    session: SessionData | null;
    exercises: SessionExercise[];
    loggedSets: LoggedSet[];
  }>({ session: null, exercises: [], loggedSets: [] });
  
  const queryClient = useQueryClient();

  // Load offline data from Dexie
  useEffect(() => {
    if (!sessionId) return;

    const loadOfflineData = async () => {
      try {
        // Load session
        const session = await db.sessions.get(sessionId);
        if (!session) return;

        // Load session exercises
        const exercises = await db.session_exercises
          .where('session_id')
          .equals(sessionId)
          .sortBy('order_index');

        // Load logged sets for all exercises
        const exerciseIds = exercises.map(e => e.id);
        const loggedSets = await db.logged_sets
          .where('session_exercise_id')
          .anyOf(exerciseIds)
          .toArray();

        setOfflineData({
          session: session as SessionData,
          exercises: exercises as SessionExercise[],
          loggedSets: loggedSets as LoggedSet[],
        });
      } catch (error) {
        console.error('Failed to load offline session data:', error);
      }
    };

    loadOfflineData();
  }, [sessionId]);

  // Query online data from Supabase
  const { data: onlineData, isLoading, error } = useQuery({
    queryKey: ['session-data', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      // Load session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Load exercises from enriched view
      const { data: exercises, error: exercisesError } = await supabase
        .from('v_session_exercises_enriched')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');

      if (exercisesError) throw exercisesError;

      // Load logged sets
      const exerciseIds = exercises.map(e => e.session_exercise_id);
      const { data: loggedSets, error: setsError } = await supabase
        .from('logged_sets')
        .select('*')
        .in('session_exercise_id', exerciseIds)
        .order('set_number');

      if (setsError) throw setsError;

      return {
        session: session as SessionData,
        exercises: exercises as SessionExercise[],
        loggedSets: loggedSets as LoggedSet[],
      };
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  // Log set mutation
  const logSetMutation = useMutation({
    mutationFn: async (params: {
      sessionExerciseId: string;
      setNumber: number;
      reps?: number;
      weight?: number;
      rpe?: number;
      durationSec?: number;
      notes?: string;
    }) => {
      const setId = crypto.randomUUID();
      const loggedSet: LoggedSet = {
        id: setId,
        session_exercise_id: params.sessionExerciseId,
        set_number: params.setNumber,
        reps: params.reps || null,
        weight: params.weight || null,
        rpe: params.rpe || null,
        duration_sec: params.durationSec || null,
        notes: params.notes || null,
        meta: {},
        created_at: new Date().toISOString(),
      };

      // Store offline first
      await db.logged_sets.put(loggedSet);
      
      // Enqueue for sync
      await enqueueLoggedSet({
        id: setId,
        session_exercise_id: params.sessionExerciseId,
        set_number: params.setNumber,
        reps: params.reps,
        weight: params.weight,
        rpe: params.rpe,
        duration_sec: params.durationSec,
        notes: params.notes,
      });

      // Add telemetry event
      await db.sync_events.add({
        ts: Date.now(),
        kind: 'set_logged',
        items: 1,
        meta: {
          exercise_id: params.sessionExerciseId,
          set_number: params.setNumber,
          reps: params.reps,
          weight: params.weight,
          rpe: params.rpe
        }
      });

      return loggedSet;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['session-data', sessionId] });
      // Reload offline data
      if (sessionId) {
        const loadOfflineData = async () => {
          const exerciseIds = offlineData.exercises.map(e => e.session_exercise_id);
          const loggedSets = await db.logged_sets
            .where('session_exercise_id')
            .anyOf(exerciseIds)
            .toArray();
          setOfflineData(prev => ({ ...prev, loggedSets: loggedSets as LoggedSet[] }));
        };
        loadOfflineData();
      }
    },
  });

  // Update session status mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (params: {
      status: 'pending' | 'active' | 'completed' | 'cancelled';
      startedAt?: string;
      completedAt?: string;
      notes?: string;
    }) => {
      if (!sessionId) throw new Error('No session ID');

      const updates = {
        status: params.status,
        started_at: params.startedAt || null,
        completed_at: params.completedAt || null,
        notes: params.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Update offline first
      await db.sessions.update(sessionId, updates);
      
      // Enqueue for sync
      await enqueueSessionUpdate({
        id: sessionId,
        ...updates,
      });

      // Add telemetry event
      await db.sync_events.add({
        ts: Date.now(),
        kind: params.status === 'active' ? 'session_started' : 
              params.status === 'completed' ? 'session_completed' : 
              params.status === 'cancelled' ? 'session_cancelled' : 'session_updated',
        items: 1,
        meta: {
          session_id: sessionId,
          status: params.status,
          duration_sec: params.completedAt && params.startedAt 
            ? Math.floor((new Date(params.completedAt).getTime() - new Date(params.startedAt).getTime()) / 1000)
            : null
        }
      });

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-data', sessionId] });
      // Reload offline session data
      if (sessionId) {
        const loadOfflineData = async () => {
          const session = await db.sessions.get(sessionId);
          if (session) {
            setOfflineData(prev => ({ ...prev, session: session as SessionData }));
          }
        };
        loadOfflineData();
      }
    },
  });

  // Helper function to log rest timer events
  const logRestEvent = async (eventType: 'rest_started' | 'rest_completed' | 'rest_skipped', data: {
    prescribed_sec: number;
    actual_sec?: number;
    exercise_id: string;
  }) => {
    await db.sync_events.add({
      ts: Date.now(),
      kind: eventType,
      items: 1,
      meta: data
    });
  };

  // Helper function to log exercise navigation events
  const logExerciseEvent = async (eventType: 'exercise_advanced' | 'exercise_previous', data: {
    from_exercise_id?: string;
    to_exercise_id: string;
    exercise_index: number;
  }) => {
    await db.sync_events.add({
      ts: Date.now(),
      kind: eventType,
      items: 1,
      meta: data
    });
  };

  // Computed data
  const data = useMemo(() => {
    return onlineData || offlineData;
  }, [onlineData, offlineData]);

  const currentExercise = useMemo(() => {
    if (!data.exercises.length) return null;
    // Find first exercise without completed sets matching prescription
    return data.exercises.find(exercise => {
      const exerciseSets = data.loggedSets.filter(
        set => set.session_exercise_id === exercise.session_exercise_id
      );
      return exerciseSets.length < exercise.sets;
    }) || data.exercises[0];
  }, [data.exercises, data.loggedSets]);

  const currentExerciseIndex = useMemo(() => {
    if (!currentExercise || !data.exercises.length) return 0;
    return data.exercises.findIndex(
      ex => ex.session_exercise_id === currentExercise.session_exercise_id
    );
  }, [currentExercise, data.exercises]);

  const getExerciseSets = (exerciseId: string) => {
    return data.loggedSets.filter(
      set => set.session_exercise_id === exerciseId
    ).sort((a, b) => a.set_number - b.set_number);
  };

  const getNextSetNumber = (exerciseId: string) => {
    const sets = getExerciseSets(exerciseId);
    return sets.length + 1;
  };

  return {
    session: data.session,
    exercises: data.exercises,
    loggedSets: data.loggedSets,
    currentExercise,
    currentExerciseIndex,
    isLoading: isLoading && !offlineData.session,
    error,
    isOffline: !onlineData && !!offlineData.session,
    
    // Actions
    logSet: logSetMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    getExerciseSets,
    getNextSetNumber,
    
    // Telemetry helpers
    logRestEvent,
    logExerciseEvent,
    
    // Loading states
    isLoggingSet: logSetMutation.isPending,
    isUpdatingSession: updateSessionMutation.isPending,
  };
}
