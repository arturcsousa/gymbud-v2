import { useTranslation } from 'react-i18next';
import { ctaHref, PALETTE } from '../theme';
import { motion } from 'framer-motion';

export default function Hero() {
  const { t } = useTranslation(['landing', 'common']);

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        background:
          `radial-gradient(550px 300px at 110% 40%, ${PALETTE.aqua}, transparent 60%),
           linear-gradient(180deg, ${PALETTE.deepTeal}, #063e50 65%, ${PALETTE.deepTeal})`,
      }}
    >
      {/* decorative glow in brand orange */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[380px] w-[700px] rounded-[48%] bg-gradient-to-bl from-[#FF9F1C] to-transparent opacity-50 blur-2xl" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold tracking-tight text-white md:text-5xl"
          >
            {t('landing:hero.title')}
          </motion.h1>
          <p className="mt-4 max-w-xl text-white/80">{t('landing:hero.subtitle')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={ctaHref('hero_primary')}
              className="rounded-lg bg-white px-5 py-3 font-semibold text-[#043747]"
            >
              {t('common:cta.start_free')}
            </a>
            <a
              href="#how"
              className="rounded-lg border border-white/30 px-5 py-3 font-semibold text-white hover:border-white/60"
            >
              {t('common:cta.see_how')}
            </a>
          </div>
        </div>

        {/* Right visual block approximating the orange slice */}
        <div className="relative h-72 md:h-96">
          <div className="absolute inset-0 rounded-3xl bg-[#FF9F1C] opacity-90" />
          <div className="absolute -left-10 top-10 h-16 w-16 rounded-full bg-[#18C7B6] opacity-80 blur-sm" />
          <div className="absolute -right-8 bottom-14 h-24 w-24 rounded-full bg-[#0C8F93] opacity-70 blur-sm" />
        </div>
      </div>
    </section>
  );
}
