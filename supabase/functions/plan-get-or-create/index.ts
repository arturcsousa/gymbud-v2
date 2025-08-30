// supabase/functions/plan-get-or-create/index.ts
// Minimal test version to isolate crash issue

import { requireUser } from '../_shared/auth.ts';
import { CORS_HEADERS } from '../_shared/http.ts';

Deno.serve(async (req) => {
  console.log('=== FUNCTION START ===');
  
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      console.log('Handling OPTIONS');
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      console.log('Invalid method');
      return new Response(JSON.stringify({ 
        ok: false, 
        error: { code: 'method_not_allowed', message: 'POST required' } 
      }), { 
        status: 405, 
        headers: CORS_HEADERS 
      });
    }

    console.log('Starting auth...');
    const authResult = await requireUser(req);
    const user = authResult.user;
    const supabase = authResult.supabase;
    console.log('Auth success:', user.id);

    console.log('Parsing body...');
    const body = await req.json();
    console.log('Body received:', JSON.stringify(body, null, 2));

    // Simple success response for testing
    return new Response(JSON.stringify({
      ok: true,
      data: { plan_id: 'test-123', status: 'active' }
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: { code: 'internal', message: error.message }
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
});
