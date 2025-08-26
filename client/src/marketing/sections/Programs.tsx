import { useTranslation } from 'react-i18next';

export default function Programs() {
  const { t } = useTranslation('landing');
  const goals = ['hypertrophy','strength','fat_loss','endurance','return'];
  return (
    <section id="programs" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('programs.title')}</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => (
          <div key={g} className="rounded-2xl border border-black/10 p-5 bg-white/70 dark:bg-white/5 backdrop-blur">
            <div className="font-semibold capitalize">{t(`programs.goals.${g}`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
