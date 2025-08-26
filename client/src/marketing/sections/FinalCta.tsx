import { useTranslation } from 'react-i18next';
import { ctaHref, PALETTE } from '../theme';

export default function FinalCta() {
  const { t } = useTranslation(['landing', 'common']);
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #042d3a, #005870 50%, #0C8F93)`,
      }}
    >
      {/* Aqua glow blob behind CTA */}
      <div 
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${PALETTE.aqua}44, transparent 70%)`,
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6 py-20 text-center text-white">
        <div className="text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 text-white">
            {t('final_cta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t('final_cta.subtitle')}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={ctaHref('final_primary')}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: PALETTE.aqua, 
                color: PALETTE.deepTeal 
              }}
            >
              {t('common:cta.start_free')}
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full border-2 transition-all duration-200 hover:scale-105"
              style={{ 
                borderColor: PALETTE.orange, 
                color: PALETTE.orange 
              }}
            >
              {t('common:cta.see_pricing')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
