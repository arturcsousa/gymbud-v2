import { useTranslation } from 'react-i18next';
import { CheckCircle, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ctaHref, PALETTE } from '../theme';

type Feature = { icon: JSX.Element; titleKey: string; descKey: string; accent: string };

export default function WhyDifferent() {
  const { t } = useTranslation(['landing', 'common']);

  const features: Feature[] = [
    { icon: <CheckCircle className="h-6 w-6" />, titleKey: 'landing:different.items.deterministic.title', descKey: 'landing:different.items.deterministic.desc', accent: PALETTE.aqua },
    { icon: <Activity className="h-6 w-6" />, titleKey: 'landing:different.items.coach.title', descKey: 'landing:different.items.coach.desc', accent: PALETTE.teal },
    { icon: <Clock className="h-6 w-6" />, titleKey: 'landing:different.items.rest.title', descKey: 'landing:different.items.rest.desc', accent: PALETTE.orange },
  ];

  return (
    <section
      id="why"
      className="relative overflow-hidden"
      style={{
        background:
          `radial-gradient(1200px 500px at 10% -10%, ${PALETTE.teal}22, transparent 60%),
           radial-gradient(1000px 600px at 90% 110%, ${PALETTE.orange}22, transparent 60%),
           linear-gradient(180deg, ${PALETTE.deepTeal}, #073a4a 70%, #052b39 100%)`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {t('landing:different.title')}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.titleKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative"
            >
              <div 
                className="rounded-2xl p-6 md:p-7"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: `0 0 24px -6px ${f.accent}`
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      boxShadow: `0 0 24px ${f.accent}, inset 0 0 12px ${f.accent}`,
                      background: `${f.accent}22`, 
                      color: f.accent,
                    }}
                    aria-hidden
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{t(f.titleKey)}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/70">{t(f.descKey)}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 mt-4 pt-4">
                  <a
                    href={ctaHref('why', { feature: f.titleKey })}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:text-white"
                    style={{ background: `linear-gradient(180deg, ${f.accent}33, transparent)`, boxShadow: `0 0 12px -2px ${f.accent}55` }}
                  >
                    {t('common:cta.see_how')}
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
