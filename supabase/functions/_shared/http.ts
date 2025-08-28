// Minimal HTTP helpers + CORS
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

export function err(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return json(status, { ok: false, error: { code, message, details } });
}

export function options(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  return null;
}
