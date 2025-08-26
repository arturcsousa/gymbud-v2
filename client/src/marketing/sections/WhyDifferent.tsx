import { useTranslation } from 'react-i18next';
import { CheckCircle, Activity, Clock, Zap, Shield, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { PALETTE } from '../theme';

export default function WhyDifferent() {
  const { t } = useTranslation(['landing', 'common']);

  const features = [
    { 
      icon: <CheckCircle className="h-6 w-6" />, 
      titleKey: 'different.items.deterministic.title', 
      descKey: 'different.items.deterministic.desc',
      color: PALETTE.aqua
    },
    { 
      icon: <Activity className="h-6 w-6" />, 
      titleKey: 'different.items.coach.title', 
      descKey: 'different.items.coach.desc',
      color: PALETTE.teal
    },
    { 
      icon: <Clock className="h-6 w-6" />, 
      titleKey: 'different.items.rest.title', 
      descKey: 'different.items.rest.desc',
      color: PALETTE.orange
    },
    { 
      icon: <Zap className="h-6 w-6" />, 
      titleKey: 'different.items.constraints.title', 
      descKey: 'different.items.constraints.desc',
      color: PALETTE.aqua
    },
    { 
      icon: <Shield className="h-6 w-6" />, 
      titleKey: 'different.items.runner.title', 
      descKey: 'different.items.runner.desc',
      color: PALETTE.teal
    },
    { 
      icon: <Database className="h-6 w-6" />, 
      titleKey: 'different.items.data.title', 
      descKey: 'different.items.data.desc',
      color: PALETTE.orange
    },
  ];

  return (
    <section
      id="why"
      className="py-20 relative"
      style={{ 
        background: `linear-gradient(180deg, ${PALETTE.teal} 0%, ${PALETTE.deepTeal} 100%)` 
      }}
    >
      {/* Decorative wave separator */}
      <div 
        className="absolute top-0 left-0 w-full h-20"
        style={{
          background: PALETTE.deepTeal,
          clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 100%)'
        }}
      />
      
      <div className="mx-auto max-w-7xl px-6 pt-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {t('different.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.aqua }}>
            {t('different.subtitle')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ 
                  backgroundColor: feature.color,
                  boxShadow: `0 4px 20px ${feature.color}40`
                }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
