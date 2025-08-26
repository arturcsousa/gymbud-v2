import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const APP_URL =
  (import.meta as any).env?.NEXT_PUBLIC_SITE_URL ||
  (import.meta as any).env?.VITE_SITE_URL ||
  'https://app.gymbud.ai';

export default function Hero() {
  const { t } = useTranslation('landing');
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_600px_at_50%_-50%,rgba(99,102,241,0.30),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight"
        >
          {t('hero.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-3"
        >
          <a href={APP_URL} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-500">
            {t('final_cta.primary')}
          </a>
          <a href="#how" className="inline-flex items-center justify-center rounded-xl border border-black/10 px-6 py-3 font-semibold hover:bg-black/5 dark:hover:bg-white/5">
            {t('final_cta.secondary')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
