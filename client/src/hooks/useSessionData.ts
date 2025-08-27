import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, SessionRow, SessionExerciseRow, LoggedSetRow, SyncEventRow } from '@/db/gymbud-db';
import { supabase } from '@/lib/supabase';
import { enqueueLoggedSet, enqueueSessionUpdate, enqueueLoggedSetVoid } from '@/sync/queue';
import { toast } from 'sonner';

interface SessionExercise {
  session_exercise_id: string;
  user_id: string;
  session_id: string;
  session_date: string;
  plan_id: string | null;
  exercise_name: string;
  order_index: number;
  sets: number;
  reps: number | null;
  rest_sec: number;
  weight: number | null;
  rpe: number | null;
  notes: string | null;
  is_warmup: boolean;
  updated_at: string;
}

interface LoggedSet {
  id: string;
  session_exercise_id: string;
  set_number: number;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  notes?: string | null;
  voided?: boolean;
  duration_sec?: number | null;
  meta?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface SessionData {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  notes?: string | null;
  session_date: string;
  updated_at: string;
}

// Helper function to convert database rows to app types
function convertSessionRow(row: SessionRow): SessionData {
  return {
    ...row,
    session_date: new Date().toISOString().split('T')[0], // Default to today if missing
    status: row.status === 'draft' ? 'pending' : row.status as 'pending' | 'active' | 'completed' | 'cancelled',
    updated_at: new Date(row.updated_at).toISOString()
  }
}

function convertSessionExerciseRows(rows: SessionExerciseRow[]): SessionExercise[] {
  return rows.map(row => ({
    session_exercise_id: row.id,
    user_id: '', // Will be filled from session data
    session_id: row.session_id,
    session_date: new Date().toISOString().split('T')[0],
    plan_id: null,
    exercise_name: row.exercise_name,
    order_index: row.order_index,
    sets: 3, // Default values - these should come from prescription
    reps: null,
    rest_sec: 90,
    weight: null,
    rpe: null,
    notes: null,
    is_warmup: false,
    updated_at: new Date(row.updated_at).toISOString()
  }))
}

function convertLoggedSetRows(rows: LoggedSetRow[]): LoggedSet[] {
  return rows.map(row => ({
    ...row,
    voided: row.voided || false,
    duration_sec: null,
    meta: null,
    created_at: new Date(row.updated_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  }))
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
          .and(set => !set.voided) // Filter out voided sets
          .toArray();

        setOfflineData({
          session: convertSessionRow(session as SessionRow),
          exercises: convertSessionExerciseRows(exercises as SessionExerciseRow[]),
          loggedSets: convertLoggedSetRows(loggedSets as LoggedSetRow[]),
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
        session: convertSessionRow(session as SessionRow),
        exercises: convertSessionExerciseRows(exercises as SessionExerciseRow[]),
        loggedSets: convertLoggedSetRows(loggedSets as LoggedSetRow[]),
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
      notes?: string;
    }) => {
      const setId = crypto.randomUUID();
      const loggedSet: LoggedSetRow = {
        id: setId,
        session_exercise_id: params.sessionExerciseId,
        set_number: params.setNumber,
        reps: params.reps || null,
        weight: params.weight || null,
        rpe: params.rpe || null,
        notes: params.notes || null,
        voided: false,
        updated_at: Date.now()
      };

      // Store offline first
      await db.logged_sets.add(loggedSet);
      
      // Enqueue for sync
      await enqueueLoggedSet({
        id: setId,
        session_exercise_id: params.sessionExerciseId,
        set_number: params.setNumber,
        reps: params.reps,
        weight: params.weight,
        rpe: params.rpe,
        duration_sec: null,
        notes: params.notes,
      });

      // Add telemetry event
      const telemetryEvent: SyncEventRow = {
        ts: Date.now(),
        kind: 'success',
        code: 'set_logged',
        items: 1
      };
      await db.sync_events.add(telemetryEvent);

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
            .and(set => !set.voided) // Filter out voided sets
            .toArray();
          setOfflineData(prev => ({ ...prev, loggedSets: convertLoggedSetRows(loggedSets as LoggedSetRow[]) }));
        };
        loadOfflineData();
      }
    },
  });

  // Undo last set mutation (durable undo)
  const undoLastSetMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!sessionId) throw new Error('Session ID required');

      // Get the last logged set for this exercise (non-voided)
      const lastSet = await db.logged_sets
        .where('session_exercise_id')
        .equals(exerciseId)
        .and(set => !set.voided)
        .reverse()
        .sortBy('set_number')
        .then(sets => sets[0]);

      if (!lastSet) {
        throw new Error('No sets to undo');
      }

      // Check if this set is still pending in queue (not yet synced)
      const pendingInsert = await db.queue_mutations
        .where(['entity', 'op'])
        .equals(['app2.logged_sets', 'insert'])
        .and(mutation => 
          mutation.payload?.id === lastSet.id && 
          mutation.status === 'queued'
        )
        .first();

      if (pendingInsert) {
        // E1 behavior: Remove pending insert from queue
        await db.queue_mutations.delete(pendingInsert.id);
        await db.logged_sets.delete(lastSet.id);

        // Log telemetry
        const telemetryEvent: SyncEventRow = {
          ts: Date.now(),
          kind: 'success',
          code: 'set_void_requested',
          items: 1
        };
        await db.sync_events.add(telemetryEvent);

        return { type: 'pending_removed', setNumber: lastSet.set_number };
      } else {
        // E2 behavior: Durable undo - enqueue void mutation
        const session = await db.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        // Optimistically mark as voided
        await db.logged_sets.update(lastSet.id, { voided: true });

        // Enqueue void mutation
        await enqueueLoggedSetVoid(lastSet.id, session.user_id);

        // Log telemetry
        const telemetryEvent: SyncEventRow = {
          ts: Date.now(),
          kind: 'success',
          code: 'set_void_requested',
          items: 1
        };
        await db.sync_events.add(telemetryEvent);

        return { type: 'durable_undo', setNumber: lastSet.set_number };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['session-data', sessionId] });
      
      if (result.type === 'pending_removed') {
        toast.success('Set removed');
      } else {
        toast.success('Undo queued—will retry when online');
      }
    },
    onError: (error) => {
      console.error('Failed to undo set:', error);
      toast.error('Can\'t undo this set');
    }
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
        status: params.status === 'pending' ? 'draft' : params.status,
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
      const eventCode = params.status === 'active' ? 'session_started' :
                       params.status === 'completed' ? 'session_completed' :
                       params.status === 'cancelled' ? 'session_cancelled' : 'session_updated';

      const telemetryEvent: SyncEventRow = {
        ts: Date.now(),
        kind: 'success',
        code: eventCode,
        items: 1
      };
      await db.sync_events.add(telemetryEvent);

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-data', sessionId] });
      // Reload offline session data
      if (sessionId) {
        const loadOfflineData = async () => {
          const session = await db.sessions.get(sessionId);
          if (session) {
            setOfflineData(prev => ({ ...prev, session: convertSessionRow(session as SessionRow) }));
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
    const telemetryEvent: SyncEventRow = {
      ts: Date.now(),
      kind: 'success',
      code: eventType,
      items: data.actual_sec || 1
    };
    await db.sync_events.add(telemetryEvent);
  };

  // Helper function to log exercise navigation events
  const logExerciseEvent = async (eventType: 'exercise_advanced' | 'exercise_previous', data: {
    from_exercise_id?: string;
    to_exercise_id: string;
    exercise_index: number;
  }) => {
    const telemetryEvent: SyncEventRow = {
      ts: Date.now(),
      kind: 'success',
      code: eventType,
      items: 1
    };
    await db.sync_events.add(telemetryEvent);
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
    undoLastSet: undoLastSetMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    getExerciseSets,
    getNextSetNumber,
    
    // Telemetry helpers
    logRestEvent,
    logExerciseEvent,
    
    // Loading states
    isLoggingSet: logSetMutation.isPending,
    isUndoingSet: undoLastSetMutation.isPending,
    isUpdatingSession: updateSessionMutation.isPending,
  };
}
