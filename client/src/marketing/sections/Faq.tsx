import { useTranslation } from 'react-i18next';

const IDS = ['diff','busy_gym','injuries','data','accuracy','ptbr'];

export default function Faq() {
  const { t } = useTranslation('faq');
  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('title')}</h2>
      <div className="mt-8 divide-y divide-black/10 dark:divide-white/10 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur">
        {IDS.map((id) => (
          <div key={id} className="p-6">
            <div className="font-semibold">{t(`items.${id}.q`)}</div>
            <div className="mt-2 text-sm text-muted-foreground">{t(`items.${id}.a`)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
