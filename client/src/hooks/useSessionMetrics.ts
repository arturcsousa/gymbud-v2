import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/db/gymbud-db';
import { supabase } from '@/lib/supabase';

interface SessionMetrics {
  totalSessions: number;
  totalVolume: number;
  avgRPE: number;
  weeklyData: Array<{
    day: string;
    sessions: number;
    volume: number;
    sets: number;
  }>;
  currentStreak: number;
}

export function useSessionMetrics() {
  const [offlineData, setOfflineData] = useState<SessionMetrics | null>(null);

  // Query offline data from Dexie
  useEffect(() => {
    const loadOfflineData = async () => {
      try {
        const sessions = await db.sessions
          .where('status')
          .equals('completed')
          .toArray();

        const sessionIds = sessions.map(s => s.id);
        const sessionExercises = await db.session_exercises
          .where('session_id')
          .anyOf(sessionIds)
          .toArray();

        const sessionExerciseIds = sessionExercises.map(se => se.id);
        const loggedSets = await db.logged_sets
          .where('session_exercise_id')
          .anyOf(sessionExerciseIds)
          .toArray();

        // Calculate metrics from offline data
        const totalSessions = sessions.length;
        const totalVolume = loggedSets.reduce((sum, set) => {
          return sum + ((set.weight || 0) * (set.reps || 0));
        }, 0);
        const avgRPE = loggedSets.length > 0 
          ? loggedSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / loggedSets.length
          : 0;

        // Calculate weekly data (last 7 days)
        const weeklyData = [];
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const daySessions = sessions.filter(s => 
            s.completed_at && s.completed_at.startsWith(dateStr)
          );
          
          const daySessionIds = daySessions.map(s => s.id);
          const dayExercises = sessionExercises.filter(se => 
            daySessionIds.includes(se.session_id)
          );
          const dayExerciseIds = dayExercises.map(se => se.id);
          const daySets = loggedSets.filter(set => 
            dayExerciseIds.includes(set.session_exercise_id)
          );
          
          const dayVolume = daySets.reduce((sum, set) => {
            return sum + ((set.weight || 0) * (set.reps || 0));
          }, 0);

          weeklyData.push({
            day: dayNames[date.getDay()],
            sessions: daySessions.length,
            volume: dayVolume,
            sets: daySets.length,
          });
        }

        // Calculate current streak
        let currentStreak = 0;
        const sortedSessions = sessions
          .filter(s => s.completed_at)
          .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

        if (sortedSessions.length > 0) {
          const sessionDates = new Set(
            sortedSessions.map(s => s.completed_at!.split('T')[0])
          );
          
          const today = new Date();
          for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            if (sessionDates.has(dateStr)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }

        setOfflineData({
          totalSessions,
          totalVolume,
          avgRPE: Math.round(avgRPE * 10) / 10,
          weeklyData,
          currentStreak,
        });
      } catch (error) {
        console.error('Failed to load offline session metrics:', error);
      }
    };

    loadOfflineData();
  }, []);

  // Query online data from Supabase (v_session_metrics view)
  const { data: onlineData, isLoading, error } = useQuery({
    queryKey: ['session-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_session_metrics')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform server data to match our interface
      const totalSessions = data?.length || 0;
      const totalVolume = data?.reduce((sum, row) => sum + (row.total_volume || 0), 0) || 0;
      const avgRPE = data?.length > 0 
        ? data.reduce((sum, row) => sum + (row.avg_rpe || 0), 0) / data.length
        : 0;

      // Calculate weekly data from server data
      const weeklyData = [];
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = data?.filter(row => 
          row.session_date === dateStr
        ) || [];
        
        const dayVolume = dayData.reduce((sum, row) => sum + (row.total_volume || 0), 0);
        const daySets = dayData.reduce((sum, row) => sum + (row.total_sets || 0), 0);

        weeklyData.push({
          day: dayNames[date.getDay()],
          sessions: dayData.length,
          volume: dayVolume,
          sets: daySets,
        });
      }

      // Calculate current streak from server data
      let currentStreak = 0;
      if (data && data.length > 0) {
        const sessionDates = new Set(data.map(row => row.session_date));
        
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (sessionDates.has(dateStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      return {
        totalSessions,
        totalVolume,
        avgRPE: Math.round(avgRPE * 10) / 10,
        weeklyData,
        currentStreak,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Return online data if available, otherwise offline data
  const metrics = useMemo(() => {
    return onlineData || offlineData || {
      totalSessions: 0,
      totalVolume: 0,
      avgRPE: 0,
      weeklyData: [],
      currentStreak: 0,
    };
  }, [onlineData, offlineData]);

  return {
    metrics,
    isLoading: isLoading && !offlineData,
    error,
    isOffline: !onlineData && !!offlineData,
  };
}
