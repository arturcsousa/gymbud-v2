import { db, type ConflictRecord } from '@/db/gymbud-db';

export async function upsertConflict(partial: Omit<ConflictRecord, 'first_seen_at'|'updated_at'>) {
  const now = Date.now();
  const existing = await db.conflicts.get(partial.id);
  const rec: ConflictRecord = existing
    ? { ...existing, ...partial, updated_at: now }
    : { ...partial, first_seen_at: now, updated_at: now };
  await db.conflicts.put(rec);
  return rec;
}

export async function deleteConflict(id: string) {
  await db.conflicts.delete(id);
}

export async function clearConflicts() {
  await db.conflicts.clear();
}
