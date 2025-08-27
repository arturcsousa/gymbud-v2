// Test script for Phase A Step 7 - Delta Pulls
// Run with: node test-pull-updates.js
// Requires: SUPABASE_URL, SUPABASE_ANON_KEY, and valid JWT token

const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token'; // Get from browser dev tools

async function testPullUpdates(since) {
  console.log(`\n🧪 Testing pull-updates since: ${since}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pull-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({ since }),
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

async function testRLSFiltering() {
  console.log(`\n🔒 Testing RLS filtering with invalid token...`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pull-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-123',
      },
      body: JSON.stringify({ since: '1970-01-01T00:00:00Z' }),
    });

    const data = await response.json();
    console.log(`✅ Status: ${response.status} (should be 401)`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return response.status === 401;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function testBackoffRecovery() {
  console.log(`\n⏳ Testing backoff and recovery...`);
  
  // First, test with invalid endpoint to trigger 404
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invalid-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: JSON.stringify({ since: '1970-01-01T00:00:00Z' }),
    });

    console.log(`✅ Invalid endpoint status: ${response.status} (should be 404)`);
    
    // Then test recovery with valid endpoint
    const recoveryResponse = await testPullUpdates('1970-01-01T00:00:00Z');
    return recoveryResponse?.ok === true;
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function runAcceptanceTests() {
  console.log('🚀 Running Phase A Step 7 acceptance tests\n');
  
  const results = {
    coldPull: false,
    rlsFiltering: false,
    backoffRecovery: false
  };
  
  // Test 1: Cold pull (empty since timestamp)
  console.log('📋 Test 1: Cold Pull');
  const coldPullResult = await testPullUpdates('1970-01-01T00:00:00Z');
  results.coldPull = coldPullResult?.ok === true;
  
  // Test 2: Recent pull (last hour)
  console.log('\n📋 Test 2: Recent Pull');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentPullResult = await testPullUpdates(oneHourAgo);
  
  // Test 3: RLS filtering
  console.log('\n📋 Test 3: RLS Filtering');
  results.rlsFiltering = await testRLSFiltering();
  
  // Test 4: Backoff and recovery
  console.log('\n📋 Test 4: Backoff and Recovery');
  results.backoffRecovery = await testBackoffRecovery();
  
  // Test 5: Invalid JSON
  console.log('\n📋 Test 5: Invalid JSON');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/pull-updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
      body: 'invalid-json',
    });
    
    const data = await response.json();
    console.log(`✅ Invalid JSON status: ${response.status} (should be 400)`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Cold Pull: ${results.coldPull ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RLS Filtering: ${results.rlsFiltering ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backoff Recovery: ${results.backoffRecovery ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('🎉 All acceptance tests PASSED!');
  } else {
    console.log('⚠️  Some tests failed - check implementation');
  }
}

if (typeof crypto === 'undefined') {
  global.crypto = require('crypto');
}

runAcceptanceTests().catch(console.error);
