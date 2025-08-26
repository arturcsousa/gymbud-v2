import { useTranslation } from 'react-i18next';
import { ctaHref, PALETTE } from '../theme';

export default function FinalCta() {
  const { t } = useTranslation(['landing', 'common']);
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PALETTE.deepTeal}, ${PALETTE.teal} 50%, ${PALETTE.aqua})`,
      }}
    >
      <div className="mx-auto max-w-4xl px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {t('landing:final_cta.title')}
        </h2>
        <p className="mt-4 text-lg text-white/90">{t('landing:final_cta.subtitle')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href={ctaHref('final_cta')}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-[#043747] shadow-lg hover:bg-white/95"
          >
            {t('common:cta.start_free')}
          </a>
          <a
            href="#how"
            className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:border-white/60 hover:bg-white/10"
          >
            {t('common:cta.see_how')}
          </a>
        </div>
      </div>
    </section>
  );
}
