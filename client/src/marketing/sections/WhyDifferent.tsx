import { useTranslation } from 'react-i18next';
import { CheckCircle, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const PALETTE = {
  deepTeal: '#005870',
  teal: '#0C8F93',
  aqua: '#18C7B6',
  orange: '#FF9F1C',
  paleOrange: '#FFBF69',
};

type Feature = {
  icon: JSX.Element;
  titleKey: string;      // i18n keys from landing.why.*
  descKey: string;
  accent: string;        // border/glow color
};

export default function WhyDifferent() {
  const { t } = useTranslation('landing');

  const features: Feature[] = [
    {
      icon: <CheckCircle className="h-6 w-6" />,
      titleKey: 'different.items.deterministic.title',
      descKey: 'different.items.deterministic.desc',
      accent: PALETTE.aqua,
    },
    {
      icon: <Activity className="h-6 w-6" />,
      titleKey: 'different.items.coach.title',
      descKey: 'different.items.coach.desc',
      accent: PALETTE.teal,
    },
    {
      icon: <Clock className="h-6 w-6" />,
      titleKey: 'different.items.rest.title',
      descKey: 'different.items.rest.desc',
      accent: PALETTE.orange,
    },
  ];

  return (
    <section
      id="why"
      className="relative overflow-hidden"
      aria-labelledby="why-heading"
      style={{
        background:
          `radial-gradient(1200px 500px at 10% -10%, ${PALETTE.teal}22, transparent 60%),
           radial-gradient(1000px 600px at 90% 110%, ${PALETTE.orange}22, transparent 60%),
           linear-gradient(180deg, ${PALETTE.deepTeal}, #073a4a 70%, #052b39 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `${PALETTE.aqua}55` }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `${PALETTE.orange}44` }}
      />

      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="why-heading"
            className="text-3xl font-extrabold tracking-tight text-white md:text-4xl"
          >
            {t('different.title')}
          </h2>
          <p className="mt-3 text-white/70 md:text-lg">
            {t('different.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.titleKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="relative rounded-2xl p-[1px]"
              style={{
                // thin neon edge behind the translucent card
                background: `linear-gradient(180deg, ${f.accent}, transparent 60%)`,
                boxShadow: `0 0 24px -6px ${f.accent}66`,
              }}
            >
              <div className="rounded-2xl bg-white/5 backdrop-blur-md ring-1 ring-white/10">
                <div className="flex items-start gap-3 p-6 md:p-7">
                  <div
                    className="neon-icon flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      boxShadow: `0 0 18px ${f.accent}99, inset 0 0 12px ${f.accent}55`,
                      background: `${f.accent}22`,
                      color: f.accent,
                    }}
                    aria-hidden
                  >
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {t(f.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-white/70">
                      {t(f.descKey)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-white/10 px-6 py-4 md:px-7">
                  <button
                    className="rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition hover:text-white"
                    style={{
                      background: `linear-gradient(180deg, ${f.accent}33, transparent)`,
                      boxShadow: `0 0 12px -2px ${f.accent}55`,
                    }}
                    onClick={() => {
                      // marketing CTA → app subdomain with UTM (keeps our routing contract)
                      const target =
                        (import.meta as any).env.VITE_SITE_URL || 'https://app.gymbud.ai';
                      window.location.href = `${target}/?utm_source=marketing&utm_section=why&feature=${encodeURIComponent(
                        f.titleKey,
                      )}`;
                    }}
                  >
                    {t('common:cta.learn_more')}
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
