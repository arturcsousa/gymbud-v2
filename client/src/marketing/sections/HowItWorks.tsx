import { useTranslation } from 'react-i18next';
import { User, Calendar, TrendingUp } from 'lucide-react';
import { PALETTE } from '../theme';

export default function HowItWorks() {
  const { t } = useTranslation(['landing', 'common']);
  
  const features = [
    { 
      icon: <User className="h-6 w-6" />, 
      title: t('landing:how.steps.assess.title'), 
      subtitle: t('landing:how.steps.assess.desc') 
    },
    { 
      icon: <Calendar className="h-6 w-6" />, 
      title: t('landing:how.steps.generate.title'), 
      subtitle: t('landing:how.steps.generate.desc') 
    },
    { 
      icon: <TrendingUp className="h-6 w-6" />, 
      title: t('landing:how.steps.train.title'), 
      subtitle: t('landing:how.steps.train.desc') 
    },
  ];

  return (
    <section 
      id="how" 
      className="py-20"
      style={{ background: PALETTE.deepTeal }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-white">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
              {t('landing:how.title')}
            </h2>
            <h3 className="text-2xl lg:text-3xl font-bold mb-12" style={{ color: PALETTE.aqua }}>
              Como Funciona
            </h3>
            
            <div className="space-y-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: PALETTE.aqua }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                    <p className="text-white/80 leading-relaxed">{feature.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Person image placeholder with curved background */}
          <div className="relative">
            {/* Curved orange background */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: `linear-gradient(135deg, ${PALETTE.aqua} 0%, ${PALETTE.orange} 100%)`,
                transform: 'rotate(-5deg)',
              }}
            />
            
            {/* Person image placeholder */}
            <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 flex items-center justify-center h-96">
              <span className="text-white/60 text-center text-lg">
                Fitness Person<br />Image Placeholder
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
