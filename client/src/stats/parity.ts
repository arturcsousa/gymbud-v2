import { db } from '@/db/gymbud-db';
import { supabase } from '@/lib/supabase';

export interface StatsDiff {
  metric: string;
  client: number;
  server: number;
  difference: number;
  percentDiff: number;
}

export interface StatsParityResult {
  ok: boolean;
  diffs: StatsDiff[];
  lastChecked: string;
}

/**
 * Compare client-side computed stats with server metrics
 */
export async function checkStatsParity(): Promise<StatsParityResult> {
  try {
    const [clientStats, serverStats] = await Promise.all([
      computeClientStats(),
      fetchServerStats()
    ]);

    const diffs: StatsDiff[] = [];
    const tolerance = 0.5; // Allow 0.5 difference for averages

    // Compare each metric
    const metricsToCompare = [
      'total_sessions',
      'total_sets',
      'total_volume',
      'avg_rpe',
      'sessions_this_week',
      'sessions_last_week'
    ];

    for (const metric of metricsToCompare) {
      const clientValue = clientStats[metric] || 0;
      const serverValue = serverStats[metric] || 0;
      const difference = Math.abs(clientValue - serverValue);
      const percentDiff = serverValue > 0 ? (difference / serverValue) * 100 : 0;

      // Check if difference exceeds tolerance
      const exceedsTolerance = metric.startsWith('avg_') 
        ? difference > tolerance 
        : difference > 0; // Counts must match exactly

      if (exceedsTolerance) {
        diffs.push({
          metric,
          client: clientValue,
          server: serverValue,
          difference,
          percentDiff
        });
      }
    }

    return {
      ok: diffs.length === 0,
      diffs: diffs.slice(0, 10), // Limit to top 10 diffs
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
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);

  // Get all sessions
  const sessions = await db.sessions.toArray();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Get all logged sets (non-voided)
  const loggedSets = await db.logged_sets.where('voided').equals(false).or('voided').equals(undefined).toArray();

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
    total_volume: Math.round(totalVolume * 100) / 100, // Round to 2 decimals
    avg_rpe: Math.round(avgRpe * 100) / 100,
    sessions_this_week: sessionsThisWeek,
    sessions_last_week: sessionsLastWeek
  };
}

/**
 * Fetch stats from server metrics view
 */
async function fetchServerStats(): Promise<Record<string, number>> {
  try {
    // Fetch from server metrics view (assuming it exists)
    const { data, error } = await supabase
      .from('v_session_metrics')
      .select('*')
      .single();

    if (error) {
      console.warn('Server metrics view not available:', error);
      return {};
    }

    return {
      total_sessions: data.total_sessions || 0,
      total_sets: data.total_sets || 0,
      total_volume: data.total_volume || 0,
      avg_rpe: data.avg_rpe || 0,
      sessions_this_week: data.sessions_this_week || 0,
      sessions_last_week: data.sessions_last_week || 0
    };

  } catch (error) {
    console.error('Failed to fetch server stats:', error);
    return {};
  }
}

/**
 * React hook for stats parity checking
 */
export function useStatsParity() {
  const [result, setResult] = useState<StatsParityResult>({
    ok: true,
    diffs: [],
    lastChecked: ''
  });
  
  const [isChecking, setIsChecking] = useState(false);

  const checkParity = async () => {
    setIsChecking(true);
    try {
      const parityResult = await checkStatsParity();
      setResult(parityResult);
      
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
      setIsChecking(false);
    }
  };

  return {
    result,
    isChecking,
    checkParity
  };
}

// Import useState for the hook
import { useState } from 'react';
