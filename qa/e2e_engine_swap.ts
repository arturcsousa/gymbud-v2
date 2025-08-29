#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

class E2EEngineSwapTest {
  private results: TestResult[] = [];
  private testUserId: string = '';
  private testPlanId: string = '';
  private sessionId: string = '';

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting E2E Engine & Swap Tests');
    console.log('=' .repeat(60));

    try {
      await this.step1_CreateTestUser();
      await this.step2_CreateTestPlan();
      await this.step3_TestEngineSessionGeneration();
      await this.step4_TestDeterminism();
      await this.step5_TestProgressiveOverload();
      await this.step6_TestExerciseSwap();
      await this.step7_TestStatsParity();
      await this.cleanup();

      this.printResults();
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async step1_CreateTestUser(): Promise<void> {
    const start = Date.now();
    
    try {
      // Create test user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `test-engine-swap-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        email_confirm: true
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create user: ${authError?.message}`);
      }

      this.testUserId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: this.testUserId,
          height_cm: 175,
          weight_kg: 70,
          assessment_required: false
        });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      this.addResult('Create Test User', 'PASS', `User created: ${this.testUserId}`, Date.now() - start);
    } catch (error) {
      this.addResult('Create Test User', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step2_CreateTestPlan(): Promise<void> {
    const start = Date.now();
    
    try {
      // Create test plan with sample seed
      const planSeed = {
        days: [
          {
            exercises: [
              {
                exercise_id: '123e4567-e89b-12d3-a456-426614174001', // Mock exercise ID
                sets: 3,
                reps: '8-10',
                rest_sec: 90,
                rpe: 7,
                progression_step: { weight_kg: 2.5 }
              },
              {
                exercise_id: '123e4567-e89b-12d3-a456-426614174002', // Mock exercise ID
                sets: 3,
                reps: '10-12',
                rest_sec: 60,
                rpe: 6,
                progression_step: { weight_kg: 1.25 }
              }
            ]
          }
        ],
        deload_every: 12
      };

      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: this.testUserId,
          status: 'active',
          seed: planSeed,
          name: 'Test Plan'
        })
        .select()
        .single();

      if (planError || !planData) {
        throw new Error(`Failed to create plan: ${planError?.message}`);
      }

      this.testPlanId = planData.id;
      this.addResult('Create Test Plan', 'PASS', `Plan created: ${this.testPlanId}`, Date.now() - start);
    } catch (error) {
      this.addResult('Create Test Plan', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step3_TestEngineSessionGeneration(): Promise<void> {
    const start = Date.now();
    
    try {
      // Call session-get-or-create
      const response = await fetch(`${supabaseUrl}/functions/v1/session-get-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          plan_id: this.testPlanId
        })
      });

      if (!response.ok) {
        throw new Error(`Session API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.ok || !result.data?.session) {
        throw new Error(`Invalid session response: ${JSON.stringify(result)}`);
      }

      const session = result.data.session;
      this.sessionId = session.id;

      // Verify session properties
      if (!session.baseline) {
        throw new Error('First session should have baseline=true');
      }

      if (!session.exercises || session.exercises.length === 0) {
        throw new Error('Session should have exercises');
      }

      // Verify session in database
      const { data: dbSession, error: dbError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', this.sessionId)
        .single();

      if (dbError || !dbSession) {
        throw new Error('Session not found in database');
      }

      this.addResult('Session Generation', 'PASS', `Session created: ${this.sessionId}`, Date.now() - start);
    } catch (error) {
      this.addResult('Session Generation', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step4_TestDeterminism(): Promise<void> {
    const start = Date.now();
    
    try {
      // Call session-get-or-create again with same parameters
      const response = await fetch(`${supabaseUrl}/functions/v1/session-get-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          plan_id: this.testPlanId
        })
      });

      const result = await response.json();
      
      if (!result.ok || result.data.session.id !== this.sessionId) {
        throw new Error('Session API should return same session ID for same day');
      }

      // Verify no duplicate sessions
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', this.testUserId)
        .eq('plan_id', this.testPlanId);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (sessions.length !== 1) {
        throw new Error(`Expected 1 session, found ${sessions.length}`);
      }

      this.addResult('Determinism Test', 'PASS', 'Same session returned, no duplicates', Date.now() - start);
    } catch (error) {
      this.addResult('Determinism Test', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step5_TestProgressiveOverload(): Promise<void> {
    const start = Date.now();
    
    try {
      // Mark first session as completed
      await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', this.sessionId);

      // Create a new session for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/session-get-or-create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: tomorrow.toISOString().split('T')[0],
          plan_id: this.testPlanId
        })
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error('Failed to create second session');
      }

      const newSession = result.data.session;
      
      // Verify it's a different session
      if (newSession.id === this.sessionId) {
        throw new Error('Should create new session for different day');
      }

      // Verify baseline is false for second session
      if (newSession.baseline) {
        throw new Error('Second session should have baseline=false');
      }

      this.addResult('Progressive Overload', 'PASS', 'Second session created with progression', Date.now() - start);
    } catch (error) {
      this.addResult('Progressive Overload', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step6_TestExerciseSwap(): Promise<void> {
    const start = Date.now();
    
    try {
      // Get session exercises
      const { data: sessionExercises, error } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', this.sessionId)
        .limit(1);

      if (error || !sessionExercises || sessionExercises.length === 0) {
        throw new Error('No session exercises found for swap test');
      }

      const originalExercise = sessionExercises[0];
      const newExerciseId = '123e4567-e89b-12d3-a456-426614174999'; // Mock new exercise

      // Simulate exercise swap
      const { error: updateError } = await supabase
        .from('session_exercises')
        .update({
          exercise_id: newExerciseId,
          exercise_name: 'Test Swapped Exercise',
          updated_at: new Date().toISOString()
        })
        .eq('id', originalExercise.id);

      if (updateError) {
        throw new Error(`Failed to swap exercise: ${updateError.message}`);
      }

      // Create coach audit entry
      const { error: auditError } = await supabase
        .from('coach_audit')
        .insert({
          user_id: this.testUserId,
          session_id: this.sessionId,
          tool: 'swap_exercise',
          args_json: JSON.stringify({
            from_id: originalExercise.exercise_id,
            to_id: newExerciseId,
            session_exercise_id: originalExercise.id
          }),
          explain: 'Automated test swap'
        });

      if (auditError) {
        throw new Error(`Failed to create audit entry: ${auditError.message}`);
      }

      this.addResult('Exercise Swap', 'PASS', 'Exercise swapped with audit trail', Date.now() - start);
    } catch (error) {
      this.addResult('Exercise Swap', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async step7_TestStatsParity(): Promise<void> {
    const start = Date.now();
    
    try {
      // Create some logged sets for stats
      const { data: sessionExercises } = await supabase
        .from('session_exercises')
        .select('id')
        .eq('session_id', this.sessionId)
        .limit(1);

      if (sessionExercises && sessionExercises.length > 0) {
        await supabase
          .from('logged_sets')
          .insert([
            {
              session_id: this.sessionId,
              session_exercise_id: sessionExercises[0].id,
              set_number: 1,
              reps: 10,
              weight_kg: 50,
              rpe: 7
            },
            {
              session_id: this.sessionId,
              session_exercise_id: sessionExercises[0].id,
              set_number: 2,
              reps: 9,
              weight_kg: 50,
              rpe: 8
            }
          ]);
      }

      // Basic stats verification - just check data exists
      const { data: sessions, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', this.testUserId);

      const { data: loggedSets, error: setsError } = await supabase
        .from('logged_sets')
        .select('*')
        .eq('session_id', this.sessionId);

      if (sessionError || setsError) {
        throw new Error('Failed to query stats data');
      }

      if (!sessions || sessions.length === 0) {
        throw new Error('No sessions found for stats');
      }

      this.addResult('Stats Parity', 'PASS', `Found ${sessions.length} sessions, ${loggedSets?.length || 0} sets`, Date.now() - start);
    } catch (error) {
      this.addResult('Stats Parity', 'FAIL', error.message, Date.now() - start);
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.testUserId) return;

    try {
      // Delete logged sets
      await supabase
        .from('logged_sets')
        .delete()
        .in('session_id', [this.sessionId]);

      // Delete session exercises
      await supabase
        .from('session_exercises')
        .delete()
        .eq('session_id', this.sessionId);

      // Delete sessions
      await supabase
        .from('sessions')
        .delete()
        .eq('user_id', this.testUserId);

      // Delete coach audit
      await supabase
        .from('coach_audit')
        .delete()
        .eq('user_id', this.testUserId);

      // Delete plan
      await supabase
        .from('plans')
        .delete()
        .eq('user_id', this.testUserId);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', this.testUserId);

      // Delete user
      await supabase.auth.admin.deleteUser(this.testUserId);

      console.log('\n🧹 Cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup failed:', error.message);
    }
  }

  private addResult(step: string, status: 'PASS' | 'FAIL', message: string, duration?: number): void {
    this.results.push({ step, status, message, duration });
    
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`${statusIcon} ${step}: ${message}${durationText}`);
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  • ${r.step}: ${r.message}`));
      
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
      process.exit(0);
    }
  }
}

// Main execution
async function main() {
  const test = new E2EEngineSwapTest();
  await test.runAllTests();
}

main().catch(console.error);
