import { createClient } from "npm:@supabase/supabase-js@2";
import { err } from "./http.ts";

export type Authed = {
  supabase: ReturnType<typeof createClient>;
  userId: string;
};

export async function requireUser(req: Request): Promise<Response | Authed> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err(401, "NO_AUTH", "Missing Authorization header");

  const supabase = createClient(supabaseUrl, serviceRole, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    return err(401, "INVALID_TOKEN", "Invalid or expired JWT");
  }
  return { supabase, userId: data.user.id };
}
