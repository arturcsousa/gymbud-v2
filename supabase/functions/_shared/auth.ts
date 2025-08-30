import "@supabase/functions-js";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export function getClient(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  const supabase = createClient(url, anon, { 
    global: { 
      headers: { 
        Authorization: `Bearer ${token}` 
      } 
    } 
  });
  
  return { supabase, token };
}

export async function requireUser(
  req: Request, 
  options: { allowServiceRole?: boolean } = {}
): Promise<{ user: any; supabase: any }> {
  const { supabase } = getClient(req);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }
    
    return { user, supabase };
  } catch (e) {
    throw new Error('Authentication failed');
  }
}

export function extractUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  if (!token) return null;
  
  try {
    // Basic JWT payload extraction (without verification - Supabase handles that)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}
