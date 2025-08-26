import { useTranslation } from 'react-i18next';

export default function Progress() {
  const { t } = useTranslation('landing');
  const keys = ['prs','volume','streaks','rest','history'];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('progress.title')}</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {keys.map(k => (
          <div key={k} className="rounded-2xl border border-black/10 p-5 bg-white/70 dark:bg-white/5 backdrop-blur">
            <div className="font-medium">{t(`progress.metrics.${k}`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
