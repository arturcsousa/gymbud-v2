import { useState } from 'react';
import { db } from '@/db/gymbud-db';
import { supabase } from '@/lib/supabase';

export interface StatsDiff {
  metric: string;
  client: number;
  server: number;
  difference: number;
}

export interface StatsParityResult {
  ok: boolean;
  diffs: StatsDiff[];
  lastChecked: string;
}

/**
 * Check stats parity between client and server
 */
export async function checkStatsParity(): Promise<StatsParityResult> {
  try {
    const [clientStats, serverStats] = await Promise.all([
      computeClientStats(),
      fetchServerStats()
    ]);

    const diffs: StatsDiff[] = [];
    const tolerance = 0.01; // 1% tolerance for floating point comparisons

    // Compare each metric
    for (const [metric, clientValue] of Object.entries(clientStats)) {
      const serverValue = serverStats[metric] || 0;
      
      if (Math.abs(clientValue - serverValue) > tolerance) {
        diffs.push({
          metric,
          client: clientValue,
          server: serverValue,
          difference: clientValue - serverValue
        });
      }
    }

    return {
      ok: diffs.length === 0,
      diffs,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    console.error('Stats parity check failed:', error);
    return {
      ok: false,
      diffs: [],
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Compute stats from client-side Dexie data
 */
async function computeClientStats(): Promise<Record<string, number>> {
  const now = new Date();
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all sessions
  const sessions = await db.sessions.toArray();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Get all logged sets (non-voided)
  const loggedSets = await db.logged_sets.filter(set => !set.voided).toArray();

  // Calculate metrics
  const totalSessions = completedSessions.length;
  const totalSets = loggedSets.length;
  
  // Total volume (sum of reps * weight for sets with weight)
  const totalVolume = loggedSets.reduce((sum, set) => {
    const weight = set.weight || 0;
    const reps = set.reps || 0;
    return sum + (weight * reps);
  }, 0);

  // Average RPE (only for sets with RPE)
  const setsWithRpe = loggedSets.filter(set => set.rpe && set.rpe > 0);
  const avgRpe = setsWithRpe.length > 0 
    ? setsWithRpe.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRpe.length
    : 0;

  // Sessions this week
  const sessionsThisWeek = completedSessions.filter(session => {
    const sessionDate = new Date(session.completed_at || session.updated_at);
    return sessionDate >= thisWeekStart;
  }).length;

  // Sessions last week
  const sessionsLastWeek = completedSessions.filter(session => {
    const sessionDate = new Date(session.completed_at || session.updated_at);
    return sessionDate >= lastWeekStart && sessionDate < thisWeekStart;
  }).length;

  return {
    total_sessions: totalSessions,
    total_sets: totalSets,
    total_volume: totalVolume,
    avg_rpe: avgRpe,
    sessions_this_week: sessionsThisWeek,
    sessions_last_week: sessionsLastWeek
  };
}

/**
 * Fetch server stats from v_session_metrics view
 */
async function fetchServerStats(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('v_session_metrics')
      .select('*')
      .single();

    if (error) {
      console.error('Failed to fetch server stats:', error);
      return {};
    }

    return data || {};
  } catch (error) {
    console.error('Failed to fetch server stats:', error);
    return {};
  }
}

/**
 * React hook for stats parity checking
 */
export function useStatsParity() {
  const [data, setData] = useState<StatsParityResult>({
    ok: true,
    diffs: [],
    lastChecked: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const checkParity = async () => {
    setIsLoading(true);
    try {
      const parityResult = await checkStatsParity();
      setData(parityResult);
      
      // Log telemetry if there are mismatches
      if (!parityResult.ok && parityResult.diffs.length > 0) {
        console.log('stats_parity_mismatch', {
          diffs: parityResult.diffs.slice(0, 3), // Top 3 diffs
          total_diffs: parityResult.diffs.length,
          build_sha: import.meta.env.VITE_BUILD_SHA || 'unknown'
        });
      }
    } catch (error) {
      console.error('Parity check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reportMismatch = () => {
    // Log telemetry for parity mismatch reporting
    console.log('stats_parity_mismatch_reported', {
      diffs: data.diffs.slice(0, 3),
      total_diffs: data.diffs.length,
      build_sha: import.meta.env.VITE_BUILD_SHA || 'unknown',
      user_reported: true
    });
  };

  return {
    data,
    isLoading,
    checkParity,
    reportMismatch
  };
}
