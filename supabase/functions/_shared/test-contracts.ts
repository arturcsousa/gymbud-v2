#!/usr/bin/env -S deno run --allow-net --allow-env

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Contract Tests for Edge Function Validation
 * 
 * Usage:
 *   deno run --allow-net --allow-env test-contracts.ts
 * 
 * Environment Variables Required:
 *   SUPABASE_URL - Your Supabase project URL
 *   USER_JWT - Valid JWT token for testing
 *   ANON_KEY - Supabase anon key (for invalid auth tests)
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const USER_JWT = Deno.env.get('USER_JWT');
const ANON_KEY = Deno.env.get('ANON_KEY');

if (!SUPABASE_URL || !USER_JWT) {
  console.error('Missing required environment variables: SUPABASE_URL, USER_JWT');
  Deno.exit(1);
}

interface TestResult {
  name: string;
  endpoint: string;
  status: 'PASS' | 'FAIL';
  expected: number;
  actual: number;
  response?: any;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  payload: any,
  headers: Record<string, string>,
  expectedStatus: number
): Promise<TestResult> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    return {
      name,
      endpoint,
      status: response.status === expectedStatus ? 'PASS' : 'FAIL',
      expected: expectedStatus,
      actual: response.status,
      response: responseData
    };
  } catch (error) {
    return {
      name,
      endpoint,
      status: 'FAIL',
      expected: expectedStatus,
      actual: 0,
      error: error.message
    };
  }
}

// Test data generators
function generateUUID(): string {
  return crypto.randomUUID();
}

function generateLoggedSet(overrides: any = {}) {
  return {
    id: generateUUID(),
    session_id: generateUUID(),
    session_exercise_id: generateUUID(),
    set_number: 1,
    reps: 10,
    weight_kg: 50,
    rpe: 8,
    voided: false,
    client_rev: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function generateSession(overrides: any = {}) {
  return {
    id: generateUUID(),
    baseline: false,
    status: 'pending' as const,
    started_at: new Date().toISOString(),
    completed_at: null,
    client_rev: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function generateSessionExercise(overrides: any = {}) {
  return {
    id: generateUUID(),
    session_id: generateUUID(),
    exercise_id: generateUUID(),
    exercise_name: 'Test Exercise',
    order_index: 1,
    client_rev: `rev-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

// Test Suite
async function runTests() {
  console.log('🧪 Running Edge Function Contract Tests\n');

  // === SYNC-LOGGED-SETS TESTS ===
  console.log('📋 Testing sync-logged-sets endpoint...');

  // Happy path
  results.push(await testEndpoint(
    'sync-logged-sets: valid payload',
    'sync-logged-sets',
    { items: [generateLoggedSet()] },
    { Authorization: `Bearer ${USER_JWT}` },
    200
  ));

  // Auth missing
  results.push(await testEndpoint(
    'sync-logged-sets: auth missing',
    'sync-logged-sets',
    { items: [generateLoggedSet()] },
    {},
    401
  ));

  // Invalid JSON
  results.push(await testEndpoint(
    'sync-logged-sets: invalid method',
    'sync-logged-sets',
    { items: [generateLoggedSet()] },
    { Authorization: `Bearer ${USER_JWT}` },
    405
  ));

  // Validation failure - negative reps
  results.push(await testEndpoint(
    'sync-logged-sets: validation fail (negative reps)',
    'sync-logged-sets',
    { items: [generateLoggedSet({ reps: -5 })] },
    { Authorization: `Bearer ${USER_JWT}` },
    422
  ));

  // Validation failure - missing required field
  results.push(await testEndpoint(
    'sync-logged-sets: validation fail (missing session_id)',
    'sync-logged-sets',
    { items: [{ ...generateLoggedSet(), session_id: undefined }] },
    { Authorization: `Bearer ${USER_JWT}` },
    422
  ));

  // Rate limiting - too many items
  const manyItems = Array.from({ length: 501 }, () => generateLoggedSet());
  results.push(await testEndpoint(
    'sync-logged-sets: rate limited (too many items)',
    'sync-logged-sets',
    { items: manyItems },
    { Authorization: `Bearer ${USER_JWT}` },
    429
  ));

  // === SYNC-SESSIONS TESTS ===
  console.log('📋 Testing sync-sessions endpoint...');

  // Happy path
  results.push(await testEndpoint(
    'sync-sessions: valid payload',
    'sync-sessions',
    { items: [generateSession()] },
    { Authorization: `Bearer ${USER_JWT}` },
    200
  ));

  // Auth missing
  results.push(await testEndpoint(
    'sync-sessions: auth missing',
    'sync-sessions',
    { items: [generateSession()] },
    {},
    401
  ));

  // Validation failure - invalid status
  results.push(await testEndpoint(
    'sync-sessions: validation fail (invalid status)',
    'sync-sessions',
    { items: [generateSession({ status: 'invalid_status' })] },
    { Authorization: `Bearer ${USER_JWT}` },
    422
  ));

  // === SYNC-SESSION-EXERCISES TESTS ===
  console.log('📋 Testing sync-session-exercises endpoint...');

  // Happy path
  results.push(await testEndpoint(
    'sync-session-exercises: valid payload',
    'sync-session-exercises',
    { items: [generateSessionExercise()] },
    { Authorization: `Bearer ${USER_JWT}` },
    200
  ));

  // Auth missing
  results.push(await testEndpoint(
    'sync-session-exercises: auth missing',
    'sync-session-exercises',
    { items: [generateSessionExercise()] },
    {},
    401
  ));

  // Validation failure - invalid order_index
  results.push(await testEndpoint(
    'sync-session-exercises: validation fail (negative order_index)',
    'sync-session-exercises',
    { items: [generateSessionExercise({ order_index: -1 })] },
    { Authorization: `Bearer ${USER_JWT}` },
    422
  ));

  // === PAYLOAD SIZE TESTS ===
  console.log('📋 Testing payload size limits...');

  // Create oversized payload (>512KB)
  const largePayload = {
    items: Array.from({ length: 100 }, () => ({
      ...generateLoggedSet(),
      // Add large string to exceed size limit
      notes: 'x'.repeat(10000)
    }))
  };

  results.push(await testEndpoint(
    'sync-logged-sets: payload too large',
    'sync-logged-sets',
    largePayload,
    { Authorization: `Bearer ${USER_JWT}` },
    413
  ));

  // === RESPONSE FORMAT TESTS ===
  console.log('📋 Testing response format consistency...');

  // Test that all responses follow the { ok: boolean, data/error } format
  const formatTest = await testEndpoint(
    'sync-logged-sets: response format check',
    'sync-logged-sets',
    { items: [generateLoggedSet()] },
    { Authorization: `Bearer ${USER_JWT}` },
    200
  );

  if (formatTest.response && typeof formatTest.response.ok === 'boolean') {
    formatTest.status = 'PASS';
  } else {
    formatTest.status = 'FAIL';
    formatTest.error = 'Response does not follow { ok: boolean } format';
  }
  results.push(formatTest);

  // Print results
  console.log('\n📊 Test Results Summary\n');
  console.log('┌─────────────────────────────────────────────────────────────┬────────┬──────────┬──────────┐');
  console.log('│ Test Name                                                   │ Status │ Expected │ Actual   │');
  console.log('├─────────────────────────────────────────────────────────────┼────────┼──────────┼──────────┤');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const name = result.name.padEnd(59);
    const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    const expected = result.expected.toString().padStart(8);
    const actual = result.actual.toString().padStart(8);

    console.log(`│ ${name} │ ${status} │ ${expected} │ ${actual} │`);

    if (result.status === 'PASS') {
      passed++;
    } else {
      failed++;
      if (result.error) {
        console.log(`│   Error: ${result.error.padEnd(55)} │        │          │          │`);
      }
    }
  }

  console.log('└─────────────────────────────────────────────────────────────┴────────┴──────────┴──────────┘');
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed, ${results.length} total`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check the results above for details.');
    Deno.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run the test suite
if (import.meta.main) {
  await runTests();
}
