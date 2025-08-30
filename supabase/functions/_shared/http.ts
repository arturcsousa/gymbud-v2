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
  | 'invalid_seed'
  | 'payload_too_large'
  | 'rate_limited'
  | 'version_conflict'
  | 'conflict_promote_failed'
  | 'rls_denied'
  | 'not_found'
  | 'method_not_allowed'
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

// Function overloads
export function err(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response;
export function err(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): Response;
// Implementation
export function err(
  statusOrCode: number | ApiErrorCode,
  codeOrMessage: string,
  messageOrDetails?: string | unknown,
  details?: unknown
): Response {
  if (typeof statusOrCode === 'number') {
    // First overload: err(status, code, message, details?)
    const status = statusOrCode;
    const code = codeOrMessage;
    const message = messageOrDetails as string;
    return json(status, { ok: false, error: { code, message, details } });
  } else {
    // Second overload: err(code, message, details?)
    const code = statusOrCode;
    const message = codeOrMessage;
    const errorDetails = messageOrDetails;
    return new Response(JSON.stringify({ 
      ok: false, 
      error: { code, message, details: errorDetails } 
    }), { 
      status: getStatusCode(code), 
      headers: CORS_HEADERS 
    });
  }
}

export function toHttpError(error: unknown): Response {
  if (error instanceof Error) {
    return err('internal', error.message);
  }
  return err('internal', 'Unknown error occurred');
}

function getStatusCode(code: ApiErrorCode): number {
  switch (code) {
    case 'auth_missing':
    case 'auth_invalid':
      return 401;
    case 'invalid_payload':
      return 400;
    case 'payload_too_large':
      return 413;
    case 'rate_limited':
      return 429;
    case 'version_conflict':
    case 'conflict_promote_failed':
      return 409;
    case 'rls_denied':
      return 403;
    case 'not_found':
      return 404;
    case 'method_not_allowed':
      return 405;
    case 'internal':
    default:
      return 500;
  }
}

export function options(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  return null;
}
