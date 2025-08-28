import { z } from "npm:zod@3.23.8";
import { err } from "./http.ts";

export type Schema<T> = z.ZodType<T>;

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
