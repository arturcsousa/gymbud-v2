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

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-white z-10">
            {/* Logo */}
            <div className="flex justify-center lg:justify-start mb-8">
              <img 
                src="/images/gymbud-wh.png" 
                alt="GymBud Logo" 
                className="h-16 w-auto"
              />
            </div>
            
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
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 hover:scale-105"
                style={{ 
                  backgroundColor: PALETTE.aqua, 
                  color: PALETTE.deepTeal 
                }}
              >
                {t('common:cta.start_free')}
              </a>
              <button
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full border-2 transition-all duration-200 hover:scale-105"
                style={{ 
                  borderColor: PALETTE.orange, 
                  color: PALETTE.orange 
                }}
              >
                {t('common:cta.see_how')}
              </button>
            </div>
          </div>

          {/* Right side - Hero Image */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <img 
                src="/images/hero-image.png" 
                alt="GymBud App Preview" 
                className="w-full h-auto max-w-lg mx-auto rounded-2xl shadow-2xl"
              />
              {/* Decorative glow effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
                style={{ backgroundColor: PALETTE.aqua }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
