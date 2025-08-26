import { useTranslation } from 'react-i18next';

export default function Progress() {
  const { t } = useTranslation(['landing', 'common']);
  return (
    <section id="progress" className="bg-[#042d3a]">
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('progress.title')}</h2>
        <p className="mt-2 text-white/80">{t('progress.subtitle')}</p>
        <div className="mt-8 grid grid-cols-1 items-center gap-8 md:grid-cols-[380px,1fr]">
          {/* mocked app phone frame */}
          <div className="relative h-[520px] w-[260px] self-center justify-self-center rounded-[36px] bg-black/70 p-4 ring-1 ring-white/10">
            <div className="h-full rounded-2xl bg-gradient-to-b from-white/5 to-white/10 p-4">
              <div className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white/80">Bench Press: 225 lbs</div>
              <div className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white/80">Squat: 315 lbs</div>
              <div className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white/80">Deadlift: 405 lbs</div>
            </div>
          </div>
          <ul className="grid gap-4 text-white/85">
            <li>• {t('progress.metrics.prs')}</li>
            <li>• {t('progress.metrics.volume')}</li>
            <li>• {t('progress.metrics.streaks')}</li>
            <li>• {t('progress.metrics.rest')}</li>
            <li>• {t('progress.metrics.history')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
