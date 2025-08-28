import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, fail, byteSize, jsonResponse } from '../_shared/http.ts';
import { requireUser, getClient } from '../_shared/auth.ts';
import { z, ZodError } from 'https://deno.land/x/zod@v3.23.8/mod.ts';
import { zBatch, zSessionExercise } from '../_shared/validate.ts';

type QueueOp = 'insert' | 'update' | 'delete';
type Mutation = {
  id: string;
  entity: string;     // 'app2.session_exercises'
  op: QueueOp;        // 'insert' or 'update'
  payload: any;       // { id, session_id, order_index, exercise_name?, exercise_id?, variant_id?, prescription?, updated_at? }
};

const MAX_BYTES = 512 * 1024;
const MAX_ITEMS = 200;
const REQUEST_TIMEOUT = 8000;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const start = Date.now();
  
  // Auth validation
  const { user, error: authErr } = await requireUser(req);
  if (!user) {
    const code = authErr === 'auth_invalid' ? 'auth_invalid' : 'auth_missing';
    return jsonResponse(fail(code, 'Authentication required'), 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // IMPORTANT: run under the *end-user* JWT so RLS applies.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

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
  const schema = zBatch(zSessionExercise);
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
      const { error } = await supabase.rpc('upsert_session_exercise_v1', {
        p_id: item.id,
        p_session_id: item.session_id,
        p_exercise_id: item.exercise_id ?? null,
        p_exercise_name: item.exercise_name ?? null,
        p_order_index: item.order_index ?? null,
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
      console.log('sync_session_exercises_completed', {
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
