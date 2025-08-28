import { useEffect, useMemo, useState } from 'react';
import { selectSessionsIndex, SessionListItem } from '@/db/selectors/history';
import { pullUpdates } from '@/sync/queue'; // existing
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { track } from '@/lib/telemetry';

export function useHistory(query: { text?: string; status?: 'completed'|'active'|'pending'|'all'; from?: string; to?: string } = {}) {
  const [items, setItems] = useState<SessionListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const online = useOnlineStatus();

  useEffect(() => { track({ type: 'history_list_viewed' as any }); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const base = await selectSessionsIndex();
      if (!alive) return;
      setItems(base);
      setLoading(false);
      // opportunistic refine pull
      if (online) pullUpdates().catch(() => {});
    })();
    return () => { alive = false; };
  }, [online]);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = (query.text ?? '').trim().toLowerCase();
    const s = (query.status ?? 'all');
    const from = query.from ? new Date(query.from) : null;
    const to   = query.to   ? new Date(query.to)   : null;

    return items.filter(it => {
      if (s !== 'all' && it.status !== s) return false;
      if (from && new Date(it.date) < from) return false;
      if (to && new Date(it.date) > to) return false;
      if (!q) return true;
      // lightweight local search: match date or exercise count/sets
      return it.date.includes(q);
    });
  }, [items, query.text, query.status, query.from, query.to]);

  return { items: filtered, loading };
}
