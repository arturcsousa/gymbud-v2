import { db } from '@/db/gymbud-db';

export type HistoryExerciseRow = {
  id: string;
  name?: string;                // if you have localized name on sx row or join later
  sets: { set_number?: number; reps?: number; weight_kg?: number; rpe?: number }[];
  volumeKg: number;
};

export async function selectSessionDetail(sessionId: string) {
  const session = await db.sessions.get(sessionId);
  const sx = await db.session_exercises.where('session_id').equals(sessionId).toArray();
  const sets = await db.logged_sets
    .filter(s => s.session_id === sessionId && !s.voided)
    .toArray();

  const bySx = new Map<string, HistoryExerciseRow>();
  for (const row of sx) {
    bySx.set(row.id, { id: row.id, name: (row as any).exercise_name, sets: [], volumeKg: 0 });
  }
  for (const s of sets) {
    const bucket = bySx.get(s.session_exercise_id);
    if (!bucket) continue;
    bucket.sets.push({ set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg, rpe: s.rpe });
    bucket.volumeKg += (s.weight_kg ?? 0) * (s.reps ?? 0);
  }
  const exercises = Array.from(bySx.values())
    .map(e => ({ ...e, volumeKg: Math.round(e.volumeKg * 10) / 10 }))
    .sort((a,b) => b.volumeKg - a.volumeKg);

  return {
    session,
    exercises,
    totals: {
      sets: sets.length,
      volumeKg: exercises.reduce((t,e) => t + e.volumeKg, 0),
    }
  };
}
