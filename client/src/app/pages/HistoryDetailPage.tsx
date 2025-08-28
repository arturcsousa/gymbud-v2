import { useRoute, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useHistoryDetail } from '@/hooks/useHistoryDetail';
import { useSettings } from '@/providers/SettingsProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function kgToLb(n: number) {
  return Math.round(n * 2.20462262185 * 10) / 10;
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-40 bg-white/10 rounded" />
      <div className="h-24 bg-white/5 rounded" />
      <div className="h-24 bg-white/5 rounded" />
    </div>
  );
}

export default function HistoryDetailPage() {
  const [, params] = useRoute<{ id: string }>('/app/history/:id');
  const sessionId = params?.id!;
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { data, loading } = useHistoryDetail(sessionId);

  const unitLabel = settings?.units === 'imperial' ? 'lb' : 'kg';
  const fmtNum = (n: number) => new Intl.NumberFormat().format(n);

  if (loading || !data) {
    return (
      <div className="p-4 pb-20">
        <Card className="bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
          <CardHeader><CardTitle>{t('history.detail.title')}</CardTitle></CardHeader>
          <CardContent><SectionSkeleton /></CardContent>
        </Card>
      </div>
    );
  }

  const started = data.session?.started_at ? new Date(data.session.started_at) : null;
  const completed = data.session?.completed_at ? new Date(data.session.completed_at) : null;
  const dateLabel = new Date(data.session?.completed_at ?? data.session?.started_at ?? Date.now())
    .toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const volume = settings?.units === 'imperial' ? kgToLb(data.totals.volumeKg) : data.totals.volumeKg;

  return (
    <div className="p-4 pb-20 space-y-4">
      <Link href="/app/history">
        <a className="text-sm text-white/80 hover:underline">&larr; {t('history.backToList')}</a>
      </Link>

      <Card className="bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
        <CardHeader>
          <CardTitle>{t('history.detail.sessionOn', { date: dateLabel })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-white/80">
          <div className="flex flex-wrap gap-4">
            <InfoPill label={t('history.sets_short')} value={String(data.totals.sets)} />
            <InfoPill label={t('history.totalVolume')} value={`${fmtNum(volume)} ${unitLabel}`} />
            {started && completed ? (
              <InfoPill label={t('history.duration_short')}
                value={`${Math.max(1, Math.round((+completed - +started) / 60000))} ${t('history.min')}`} />
            ) : null}
            <InfoPill label={t('history.statusLabel')} value={t(`history.status_${data.session?.status ?? 'completed'}`)} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-xl ring-1 ring-white/20">
        <CardHeader><CardTitle>{t('history.detail.exercises')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.exercises.map((ex) => {
            const exVol = settings?.units === 'imperial' ? kgToLb(ex.volumeKg) : ex.volumeKg;
            return (
              <div key={ex.id} className="p-3 rounded-xl ring-1 ring-white/10 bg-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-white">{ex.name ?? t('history.unknownExercise')}</div>
                    <div className="text-white/70 text-sm">
                      {t('history.sets', { count: ex.sets.length })} · {t('history.totalVolume')} {fmtNum(exVol)} {unitLabel}
                    </div>
                  </div>
                </div>
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ex.sets
                    .sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
                    .map((s, i) => (
                      <li key={i} className="text-sm text-white/85 p-2 rounded-lg bg-white/0 ring-1 ring-white/10">
                        <span className="font-mono mr-2">#{s.set_number ?? i + 1}</span>
                        {s.reps ?? 0}×{fmtNum(settings?.units === 'imperial' ? kgToLb(s.weight_kg ?? 0) : (s.weight_kg ?? 0))} {unitLabel}
                        {typeof s.rpe === 'number' ? <span className="ml-2 text-white/60">RPE {s.rpe}</span> : null}
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href="/app/stats">
          <a><Button variant="secondary">{t('history.viewStats')}</Button></a>
        </Link>
      </div>
    </div>
  );
}

export { HistoryDetailPage };

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 text-sm">
      <span className="text-white/60">{label}: </span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
