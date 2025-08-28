import { db } from '@/db/gymbud-db';

export type SessionListItem = {
  id: string;
  date: string;           // ISO day (YYYY-MM-DD)
  started_at?: string;
  completed_at?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalSets: number;
  totalVolumeKg: number;
  durationMin?: number;
  exerciseCount: number;
};

export async function selectSessionsIndex(): Promise<SessionListItem[]> {
  const sessions = await db.sessions.toArray(); // already user-scoped in sync
  const sx = await db.session_exercises.toArray();
  const sets = await db.logged_sets.filter(s => !s.voided).toArray();

  const sxBySession = new Map<string, string[]>();
  for (const row of sx) {
    const arr = sxBySession.get(row.session_id) ?? [];
    arr.push(row.id);
    sxBySession.set(row.session_id, arr);
  }

  const setsBySx = new Map<string, typeof sets>();
  for (const s of sets) {
    const arr = setsBySx.get(s.session_exercise_id) ?? [];
    arr.push(s);
    setsBySx.set(s.session_exercise_id, arr);
  }

  return sessions.map(s => {
    const sxIds = sxBySession.get(s.id) ?? [];
    let totalSets = 0;
    let totalVolumeKg = 0;
    for (const sxId of sxIds) {
      const arr = setsBySx.get(sxId) ?? [];
      totalSets += arr.length;
      for (const a of arr) totalVolumeKg += (a.weight_kg ?? 0) * (a.reps ?? 0);
    }
    const start = s.started_at ? new Date(s.started_at) : undefined;
    const end   = s.completed_at ? new Date(s.completed_at) : undefined;
    const dur   = start && end ? Math.max(1, Math.round((+end - +start) / 60000)) : undefined;

    const dateISO = new Date(s.completed_at ?? s.started_at ?? s.created_at ?? Date.now())
      .toISOString().slice(0,10);

    return {
      id: s.id,
      date: dateISO,
      started_at: s.started_at ?? undefined,
      completed_at: s.completed_at ?? undefined,
      status: s.status as SessionListItem['status'],
      totalSets,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      durationMin: dur,
      exerciseCount: sxIds.length,
    };
  }).sort((a,b) => (b.completed_at ?? b.started_at ?? b.date).localeCompare(a.completed_at ?? a.started_at ?? a.date));
}
