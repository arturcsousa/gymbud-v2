import { z } from "npm:zod@3.23.8";
import { err } from "./http.ts";

export type Schema<T> = z.ZodType<T>;

// Generic guards
export const zUUID = z.string().uuid();
export const zISO = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T/));
export const zNullable = <T extends z.ZodTypeAny>(t: T) => t.nullable().optional();

// Domain entities (align with existing database schema)
export const zLoggedSet = z.object({
  id: zUUID,
  session_id: zUUID,
  session_exercise_id: zUUID,
  set_number: z.number().int().min(1).max(100),
  reps: z.number().int().min(0).max(200),
  weight_kg: z.number().min(0).max(2000).optional(),
  rpe: z.number().min(0).max(10).optional(),
  voided: z.boolean().optional(),
  client_rev: z.string().min(1),         // idempotency token from client
  created_at: zNullable(zISO),
  updated_at: zNullable(zISO)
});

export const zSession = z.object({
  id: zUUID,
  baseline: z.boolean().optional(),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
  started_at: zNullable(zISO),
  completed_at: zNullable(zISO),
  client_rev: z.string().min(1),
  created_at: zNullable(zISO),
  updated_at: zNullable(zISO)
});

export const zSessionExercise = z.object({
  id: zUUID,
  session_id: zUUID,
  exercise_id: zUUID.optional(),         // if present
  exercise_name: z.string().min(1).optional(),
  order_index: z.number().int().min(0).max(500).optional(),
  client_rev: z.string().min(1),
  created_at: zNullable(zISO),
  updated_at: zNullable(zISO)
});

// Batch wrapper for all sync operations
export const zBatch = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ 
    items: z.array(schema).min(1).max(500), 
    override: z.boolean().optional() 
  });

// Common validation helpers
export function validateJson(body: unknown): { success: false; error: string } | { success: true; data: unknown } {
  if (body === null || body === undefined) {
    return { success: false, error: 'Request body is required' };
  }
  
  if (typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }
  
  return { success: true, data: body };
}

export function validateMethod(req: Request, allowedMethods: string[]): { success: boolean; error?: string } {
  if (!allowedMethods.includes(req.method)) {
    return { 
      success: false, 
      error: `Method ${req.method} not allowed. Expected: ${allowedMethods.join(', ')}` 
    };
  }
  
  return { success: true };
}

export async function parseJson<T>(req: Request, schema: Schema<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: err(400, "BAD_JSON", "Request body must be valid JSON") } as const;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: err(422, "VALIDATION_FAILED", "Payload validation failed", parsed.error.format()),
    } as const;
  }
  return { data: parsed.data } as const;
}

// Type exports for use in endpoints
export type LoggedSetInput = z.infer<typeof zLoggedSet>;
export type SessionInput = z.infer<typeof zSession>;
export type SessionExerciseInput = z.infer<typeof zSessionExercise>;
export type BatchInput<T> = z.infer<ReturnType<typeof zBatch<z.ZodType<T>>>>;
