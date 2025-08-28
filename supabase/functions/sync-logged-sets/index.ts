import { ok, fail, byteSize, jsonResponse } from '../_shared/http.ts';
import { requireUser, getClient } from '../_shared/auth.ts';
import { z, ZodError } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { zBatch, zLoggedSet } from '../_shared/validate.ts';

const MAX_BYTES = 512 * 1024;
const MAX_ITEMS = 200;
const REQUEST_TIMEOUT = 8000;

Deno.serve(async (req) => {
  const start = Date.now();
  
  // Method validation
  if (req.method !== 'POST') {
    return jsonResponse(fail('invalid_payload', 'POST required'), 405);
  }
  
  // Auth validation
  const { user, error: authErr } = await requireUser(req);
  if (!user) {
    const code = authErr === 'auth_invalid' ? 'auth_invalid' : 'auth_missing';
    return jsonResponse(fail(code, 'Authentication required'), 401);
  }

  // Parse JSON body
  let body: unknown;
  try { 
    body = await req.json(); 
  } catch { 
    return jsonResponse(fail('invalid_payload', 'Invalid JSON'), 400); 
  }
  
  // Payload size check
  if (byteSize(body) > MAX_BYTES) {
    return jsonResponse(fail('payload_too_large', 'Payload too large'), 413);
  }

  // Schema validation
  const schema = zBatch(zLoggedSet);
  let parsed: z.infer<typeof schema>;
  try { 
    parsed = schema.parse(body); 
  } catch (e) {
    const ze = e as ZodError;
    return jsonResponse(fail('invalid_payload', 'Validation failed', ze.flatten()), 422);
  }

  // Rate limiting
  if (parsed.items.length > MAX_ITEMS) {
    return jsonResponse(fail('rate_limited', 'Too many items'), 429);
  }

  const { supabase } = getClient(req);

  // Process items with idempotency and RLS-friendly writes
  const results: Array<{ 
    id: string; 
    status: 'ok' | 'conflict' | 'denied' | 'error'; 
    reason?: string 
  }> = [];

  for (const item of parsed.items) {
    // Timeout check
    if (Date.now() - start > REQUEST_TIMEOUT) {
      results.push({ id: item.id, status: 'error', reason: 'timeout' });
      continue;
    }

    try {
      // Use RPC for idempotent upsert with server-side user_id binding
      const { error } = await supabase.rpc('upsert_logged_set_v1', {
        p_id: item.id,
        p_session_id: item.session_id,
        p_session_exercise_id: item.session_exercise_id,
        p_set_number: item.set_number,
        p_reps: item.reps,
        p_weight_kg: item.weight_kg ?? null,
        p_rpe: item.rpe ?? null,
        p_voided: item.voided ?? false,
        p_client_rev: item.client_rev,
        p_override: parsed.override ?? false
      });

      if (error) {
        // Map common error cases
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('conflict') || msg.includes('client_rev')) {
          results.push({ id: item.id, status: 'conflict', reason: 'version_conflict' });
          continue;
        }
        if (msg.includes('rls') || msg.includes('permission') || msg.includes('denied')) {
          results.push({ id: item.id, status: 'denied', reason: 'rls_denied' });
          continue;
        }
        results.push({ id: item.id, status: 'error', reason: 'internal' });
        continue;
      }

      results.push({ id: item.id, status: 'ok' });
    } catch {
      results.push({ id: item.id, status: 'error', reason: 'internal' });
    }
  }

  // Server-side telemetry (non-blocking)
  queueMicrotask(() => {
    try {
      const stats = results.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Log to console for now (could be PostHog/Sentry later)
      console.log('sync_logged_sets_completed', {
        user_id: user.id,
        total_items: parsed.items.length,
        duration_ms: Date.now() - start,
        stats
      });
    } catch {
      // Ignore telemetry errors
    }
  });

  return jsonResponse(ok({ results }));
});
