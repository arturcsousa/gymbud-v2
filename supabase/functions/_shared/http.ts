// Minimal HTTP helpers + CORS
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

export type ApiErrorCode =
  | 'auth_missing'
  | 'auth_invalid'
  | 'invalid_payload'
  | 'payload_too_large'
  | 'rate_limited'
  | 'version_conflict'
  | 'rls_denied'
  | 'not_found'
  | 'internal';

export type ApiError = { 
  code: ApiErrorCode; 
  message: string; 
  details?: unknown 
};

export type ApiOk<T> = { 
  ok: true; 
  data: T 
};

export type ApiFail = { 
  ok: false; 
  error: ApiError 
};

export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function ok<T>(data: T): ApiOk<T> { 
  return { ok: true, data }; 
}

export function fail(code: ApiErrorCode, message: string, details?: unknown): ApiFail {
  return { ok: false, error: { code, message, details } };
}

export function byteSize(obj: unknown): number {
  try { 
    return new Blob([JSON.stringify(obj)]).size; 
  } catch { 
    return Infinity; 
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

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
