// Quick test script for Phase A Step 6 sync endpoints
// Run with: node test-sync-endpoints.js
// Requires: SUPABASE_URL, SUPABASE_ANON_KEY, and valid JWT token

const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token'; // Get from browser dev tools

async function testEndpoint(endpoint, mutations) {
  console.log(`\n🧪 Testing ${endpoint}...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing Phase A Step 6 sync endpoints\n');
  
  // Generate test UUIDs
  const sessionId = crypto.randomUUID();
  const sessionExerciseId = crypto.randomUUID();
  const auditId = crypto.randomUUID();
  
  // Test 1: sync-sessions (update status)
  await testEndpoint('sync-sessions', [{
    id: crypto.randomUUID(),
    entity: 'app2.sessions',
    op: 'update',
    payload: {
      id: sessionId,
      status: 'active',
      started_at: new Date().toISOString(),
      notes: 'Test session update'
    }
  }]);

  // Test 2: sync-session-exercises (insert)
  await testEndpoint('sync-session-exercises', [{
    id: sessionExerciseId,
    entity: 'app2.session_exercises',
    op: 'insert',
    payload: {
      id: sessionExerciseId,
      session_id: sessionId,
      order_index: 1,
      exercise_name: 'Test Exercise',
      prescription: { sets: 3, reps: 10 }
    }
  }]);

  // Test 3: sync-coach-audit (insert)
  await testEndpoint('sync-coach-audit', [{
    id: auditId,
    entity: 'app2.coach_audit',
    op: 'insert',
    payload: {
      id: auditId,
      tool: 'find_substitutes',
      args_json: { exercise: 'Test Exercise', reason: 'equipment' },
      args_hash: 'test-hash-123',
      explain: 'Test audit entry',
      session_exercise_id: sessionExerciseId
    }
  }]);

  // Test 4: Invalid transition (should fail)
  console.log('\n🧪 Testing invalid status transition...');
  await testEndpoint('sync-sessions', [{
    id: crypto.randomUUID(),
    entity: 'app2.sessions',
    op: 'update',
    payload: {
      id: sessionId,
      status: 'pending' // Invalid: active -> pending
    }
  }]);

  console.log('\n✨ Tests completed!');
}

if (typeof crypto === 'undefined') {
  global.crypto = require('crypto');
}

runTests().catch(console.error);
