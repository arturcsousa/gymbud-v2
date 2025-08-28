export type ErrorCode = 
  | 'auth_missing' 
  | 'rls_denied' 
  | 'invalid_payload' 
  | 'network_offline' 
  | 'rate_limited' 
  | 'server_unavailable' 
  | 'timeout' 
  | 'unknown'

export interface MappedError {
  code: ErrorCode
}

export function mapEdgeError(err: unknown): MappedError {
  // Network offline detection
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { code: 'network_offline' }
  }

  // TypeError: Failed to fetch (network error)
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return { code: 'network_offline' }
  }

  // HTTP Response errors
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as any).status
    
    if (status === 401) return { code: 'auth_missing' }
    if (status === 403) return { code: 'rls_denied' }
    if (status === 400 || status === 422) return { code: 'invalid_payload' }
    if (status === 429) return { code: 'rate_limited' }
    if (status >= 500) return { code: 'server_unavailable' }
  }

  // Supabase error objects
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as any).message?.toLowerCase() || ''
    
    if (message.includes('jwt') || message.includes('unauthorized')) {
      return { code: 'auth_missing' }
    }
    if (message.includes('rls') || message.includes('policy')) {
      return { code: 'rls_denied' }
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return { code: 'invalid_payload' }
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return { code: 'rate_limited' }
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return { code: 'timeout' }
    }
    if (message.includes('server') || message.includes('internal')) {
      return { code: 'server_unavailable' }
    }
  }

  // Edge Function JSON error format { error: { code, message } }
  if (err && typeof err === 'object' && 'error' in err) {
    const errorObj = (err as any).error
    if (errorObj && typeof errorObj === 'object' && 'code' in errorObj) {
      const code = errorObj.code?.toLowerCase() || ''
      
      if (code.includes('auth') || code.includes('unauthorized')) {
        return { code: 'auth_missing' }
      }
      if (code.includes('rls') || code.includes('forbidden')) {
        return { code: 'rls_denied' }
      }
      if (code.includes('validation') || code.includes('invalid')) {
        return { code: 'invalid_payload' }
      }
      if (code.includes('rate')) {
        return { code: 'rate_limited' }
      }
      if (code.includes('timeout')) {
        return { code: 'timeout' }
      }
      if (code.includes('server') || code.includes('internal')) {
        return { code: 'server_unavailable' }
      }
    }
  }

  // Default fallback
  return { code: 'unknown' }
}

// User-friendly error labels for Dead-Letter Queue UI
export const errorLabels: Record<ErrorCode, string> = {
  auth_missing: 'Authentication required',
  rls_denied: 'Permission denied (RLS)',
  invalid_payload: 'Invalid data',
  network_offline: 'No internet',
  server_unavailable: 'Server unavailable',
  timeout: 'Request timed out',
  rate_limited: 'Too many requests',
  unknown: 'Unknown error',
}
