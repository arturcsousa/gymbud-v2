import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useHistory } from '@/hooks/useHistory';
import { useSettings } from '@/providers/SettingsProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

function kgToLb(n: number) {
  return Math.round(n * 2.20462262185 * 10) / 10;
}

function ListSkeleton() {
  return (
    <ul className="animate-pulse space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="p-3 rounded-lg bg-white/5 h-14" />
      ))}
    </ul>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-8 text-white/80">
      <div className="text-lg font-semibold mb-1">{t('history.emptyTitle')}</div>
      <div className="text-sm">{t('history.emptyBody')}</div>
      <Link href="/">
        <a className="inline-block mt-4 px-4 py-2 rounded-xl bg-teal-500/90 hover:bg-teal-400 text-black font-semibold">
          {t('history.startWorkout')}
        </a>
      </Link>
    </div>
  );
}

function HistoryPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'all'|'completed'|'active'|'pending'>('all');

  const { items, loading } = useHistory({ text, status });

  const unitLabel = settings?.units === 'imperial' ? 'lb' : 'kg';
  const fmtNum = (n: number) => new Intl.NumberFormat().format(n);
  const fmtDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const rows = useMemo(() => {
    if (!items) return [];
    return items.map(s => {
      const vol = settings?.units === 'imperial' ? kgToLb(s.totalVolumeKg) : s.totalVolumeKg;
      const dateLabel = fmtDate(s.date);
      return { ...s, vol, dateLabel };
    });
  }, [items, settings?.units]);

  return (
    <div className="p-4 pb-20">
      <Card className="bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('history.search')!}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('history.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.filters.all')}</SelectItem>
                <SelectItem value="completed">{t('history.filters.completed')}</SelectItem>
                <SelectItem value="active">{t('history.filters.active')}</SelectItem>
                <SelectItem value="pending">{t('history.filters.pending')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-xl divide-y divide-white/10 ring-1 ring-white/10">
            {loading && <ListSkeleton />}
            {!loading && rows.length === 0 && <EmptyState />}
            {!loading && rows.length > 0 && (
              <ul className="bg-white/5">
                {rows.map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/history/${s.id}`}>
                      <a className="block p-3 hover:bg-white/5 focus:bg-white/5 focus:outline-none">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">
                              {s.dateLabel}
                              {s.status !== 'completed' && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/10">
                                  {t(`history.status_${s.status}`)}
                                </span>
                              )}
                            </div>
                            <div className="text-white/70 text-sm">
                              {t('history.exercises', { count: s.exerciseCount })} · {t('history.sets', { count: s.totalSets })}
                              {s.durationMin ? <> · {t('history.duration', { minutes: s.durationMin })}</> : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-white/60">{t('history.totalVolume')}</div>
                            <div className="text-white font-semibold">{fmtNum(s.vol)} {unitLabel}</div>
                          </div>
                        </div>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HistoryPage;
