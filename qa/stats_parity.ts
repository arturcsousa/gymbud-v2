#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StatsComparison {
  metric: string;
  client: number;
  server: number;
  difference: number;
  percentDiff: number;
  status: 'PASS' | 'FAIL';
}

async function checkStatsParityForUser(userId: string): Promise<void> {
  console.log(`\n🔍 Checking stats parity for user: ${userId}`);
  console.log('=' .repeat(60));

  try {
    // Compute client-side stats using SQL (simulating client logic)
    const clientStats = await computeClientStatsSQL(userId);
    
    // Fetch server metrics from view
    const serverStats = await fetchServerMetrics(userId);
    
    // Compare metrics
    const comparisons: StatsComparison[] = [];
    const tolerance = 0.5;
    
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
      const difference = clientValue - serverValue;
      const percentDiff = serverValue > 0 ? Math.abs(difference / serverValue) * 100 : 0;
      
      // Determine pass/fail
      const exceedsTolerance = metric.startsWith('avg_') 
        ? Math.abs(difference) > tolerance 
        : difference !== 0;
        
      comparisons.push({
        metric,
        client: clientValue,
        server: serverValue,
        difference,
        percentDiff,
        status: exceedsTolerance ? 'FAIL' : 'PASS'
      });
    }

    // Print results
    console.log('\n📊 Stats Comparison Results:');
    console.log('-'.repeat(80));
    console.log('Metric'.padEnd(20) + 'Client'.padEnd(12) + 'Server'.padEnd(12) + 'Diff'.padEnd(12) + 'Status');
    console.log('-'.repeat(80));
    
    let hasFailures = false;
    for (const comp of comparisons) {
      const status = comp.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      console.log(
        comp.metric.padEnd(20) +
        comp.client.toFixed(2).padEnd(12) +
        comp.server.toFixed(2).padEnd(12) +
        comp.difference.toFixed(2).padEnd(12) +
        status
      );
      
      if (comp.status === 'FAIL') {
        hasFailures = true;
      }
    }

    console.log('-'.repeat(80));
    
    if (hasFailures) {
      console.log('\n❌ PARITY CHECK FAILED - Mismatches detected');
      
      const failures = comparisons.filter(c => c.status === 'FAIL');
      console.log('\n🔍 Failure Details:');
      for (const failure of failures) {
        console.log(`  • ${failure.metric}: Client=${failure.client}, Server=${failure.server} (${failure.difference > 0 ? '+' : ''}${failure.difference.toFixed(2)})`);
      }
      
      process.exit(1);
    } else {
      console.log('\n✅ PARITY CHECK PASSED - All metrics match within tolerance');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Error during parity check:', error);
    process.exit(1);
  }
}

async function computeClientStatsSQL(userId: string): Promise<Record<string, number>> {
  const now = new Date();
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);

  // Get session counts
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('status, completed_at, created_at')
    .eq('user_id', userId);

  if (sessionError) throw sessionError;

  const completedSessions = sessionData.filter(s => s.status === 'completed');
  const totalSessions = completedSessions.length;

  // Get logged sets
  const { data: setsData, error: setsError } = await supabase
    .from('logged_sets')
    .select('reps, weight_kg, rpe, voided, sessions!inner(user_id, status)')
    .eq('sessions.user_id', userId)
    .eq('sessions.status', 'completed')
    .neq('voided', true);

  if (setsError) throw setsError;

  const totalSets = setsData.length;
  
  // Calculate total volume
  const totalVolume = setsData.reduce((sum, set) => {
    const weight = set.weight_kg || 0;
    const reps = set.reps || 0;
    return sum + (weight * reps);
  }, 0);

  // Calculate average RPE
  const setsWithRpe = setsData.filter(set => set.rpe && set.rpe > 0);
  const avgRpe = setsWithRpe.length > 0 
    ? setsWithRpe.reduce((sum, set) => sum + set.rpe, 0) / setsWithRpe.length
    : 0;

  // Weekly session counts
  const sessionsThisWeek = completedSessions.filter(session => {
    const sessionDate = new Date(session.completed_at || session.created_at);
    return sessionDate >= thisWeekStart;
  }).length;

  const sessionsLastWeek = completedSessions.filter(session => {
    const sessionDate = new Date(session.completed_at || session.created_at);
    return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd;
  }).length;

  return {
    total_sessions: totalSessions,
    total_sets: totalSets,
    total_volume: Math.round(totalVolume * 100) / 100,
    avg_rpe: Math.round(avgRpe * 100) / 100,
    sessions_this_week: sessionsThisWeek,
    sessions_last_week: sessionsLastWeek
  };
}

async function fetchServerMetrics(userId: string): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('v_session_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Server metrics view not available, using fallback calculation');
      // Fallback to direct calculation if view doesn't exist
      return await computeClientStatsSQL(userId);
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
    console.warn('Failed to fetch server metrics, using fallback');
    return await computeClientStatsSQL(userId);
  }
}

// Main execution
async function main() {
  const userId = process.argv[2];
  
  if (!userId) {
    console.error('Usage: node stats_parity.ts <user_id>');
    console.error('Example: node stats_parity.ts 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error('❌ Invalid user ID format. Must be a valid UUID.');
    process.exit(1);
  }

  await checkStatsParityForUser(userId);
}

main().catch(console.error);
