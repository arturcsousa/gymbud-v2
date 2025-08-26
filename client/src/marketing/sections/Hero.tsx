import { useTranslation } from 'react-i18next';
import { ctaHref, PALETTE } from '../theme';
import { motion } from 'framer-motion';

export default function Hero() {
  const { t } = useTranslation(['landing', 'common']);

  return (
    <section
      id="hero"
      className="relative overflow-hidden min-h-screen"
      style={{
        background: PALETTE.deepTeal,
      }}
    >
      {/* Curved gradient background similar to design */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${PALETTE.deepTeal} 0%, ${PALETTE.teal} 50%, ${PALETTE.aqua} 100%)`,
        }}
      />
      
      {/* Orange curved section */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, ${PALETTE.aqua} 0%, ${PALETTE.orange} 70%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20 min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div className="text-white z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6"
            >
              {t('hero.title')}
            </motion.h1>
            <p className="text-xl text-white/90 mb-8 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-wrap gap-4">
              <a
                href={ctaHref('hero_primary')}
                className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: PALETTE.aqua,
                  boxShadow: `0 4px 20px ${PALETTE.aqua}40`,
                }}
              >
                {t('common:cta.start_free')}
              </a>
              <a
                href="#how"
                className="px-8 py-4 rounded-full border-2 font-semibold text-white transition-all hover:scale-105"
                style={{
                  borderColor: PALETTE.orange,
                  color: PALETTE.orange,
                }}
              >
                {t('common:cta.see_how')}
              </a>
            </div>
          </div>

          {/* Right side - placeholder for person image */}
          <div className="relative z-10 flex justify-center lg:justify-end">
            <div className="w-80 h-96 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="text-white/60 text-center">
                Hero Image<br />Placeholder
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
