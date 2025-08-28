import { useEffect, useState } from 'react';
import { selectSessionDetail } from '@/db/selectors/historyDetail';
import { pullUpdates } from '@/sync/queue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { track } from '@/lib/telemetry';

export function useHistoryDetail(sessionId: string) {
  const [data, setData] = useState<Awaited<ReturnType<typeof selectSessionDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const online = useOnlineStatus();

  useEffect(() => { track({ type: 'history_detail_viewed' as any, set_id: sessionId }); }, [sessionId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const base = await selectSessionDetail(sessionId);
      if (!alive) return;
      setData(base);
      setLoading(false);
      if (online) pullUpdates().catch(()=>{});
    })();
    return () => { alive = false; };
  }, [sessionId, online]);

  return { data, loading };
}
