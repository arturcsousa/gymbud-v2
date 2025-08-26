import { useTranslation } from 'react-i18next';

const APP_URL =
  (import.meta as any).env?.NEXT_PUBLIC_SITE_URL ||
  (import.meta as any).env?.VITE_SITE_URL ||
  'https://app.gymbud.ai';

const plans: Array<'free' | 'pro' | 'annual'> = ['free','pro','annual'];

export default function Pricing() {
  const { t } = useTranslation('landing');
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('pricing.title')}</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p} className="rounded-2xl border border-black/10 p-6 shadow-sm bg-white/70 dark:bg-white/5 backdrop-blur flex flex-col">
            <div className="text-lg font-semibold">{t(`pricing.plans.${p}.title`)}</div>
            <div className="mt-2 text-sm text-muted-foreground">{t(`pricing.plans.${p}.desc`)}</div>
            <div className="mt-6 text-2xl font-extrabold">{t(`pricing.plans.${p}.price`)}</div>
            <a href={`${APP_URL}?plan=${p}`} className="mt-6 rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold text-center hover:bg-indigo-500">
              {t('final_cta.primary')}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
