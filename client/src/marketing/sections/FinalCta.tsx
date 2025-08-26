import { useTranslation } from 'react-i18next';

const APP_URL =
  (import.meta as any).env?.NEXT_PUBLIC_SITE_URL ||
  (import.meta as any).env?.VITE_SITE_URL ||
  'https://app.gymbud.ai';

export default function FinalCta() {
  const { t } = useTranslation('landing');
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(99,102,241,0.20),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">{t('final_cta.title')}</h2>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={APP_URL} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-500">
            {t('final_cta.primary')}
          </a>
          <a href="#how" className="rounded-xl border border-black/10 px-6 py-3 font-semibold hover:bg-black/5 dark:hover:bg-white/5">
            {t('final_cta.secondary')}
          </a>
        </div>
      </div>
    </section>
  );
}
