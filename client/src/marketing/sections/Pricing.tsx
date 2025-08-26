import { useTranslation } from 'react-i18next';
import { ctaHref, PALETTE } from '../theme';

export default function Pricing() {
  const { t } = useTranslation(['landing', 'common']);
  const plans = [
    { 
      nameKey: 'landing:pricing.plans.free.title', 
      descKey: 'landing:pricing.plans.free.desc',
      priceKey: 'landing:pricing.plans.free.price',
      popular: false 
    },
    { 
      nameKey: 'landing:pricing.plans.pro.title', 
      descKey: 'landing:pricing.plans.pro.desc',
      priceKey: 'landing:pricing.plans.pro.price',
      popular: true 
    },
    { 
      nameKey: 'landing:pricing.plans.annual.title', 
      descKey: 'landing:pricing.plans.annual.desc',
      priceKey: 'landing:pricing.plans.annual.price',
      popular: false 
    },
  ];
  return (
    <section id="pricing" style={{ background: PALETTE.deepTeal }} className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('landing:pricing.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.orange }}>
            Preços Simples e Transparentes
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div 
              key={i} 
              className={`rounded-2xl p-8 text-center bg-white relative ${
                p.popular ? 'transform scale-105' : ''
              }`}
            >
              {p.popular && (
                <div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: PALETTE.aqua }}
                >
                  {t('landing:pricing.most_popular')}
                </div>
              )}
              <h3 className="text-2xl font-bold mb-4" style={{ color: PALETTE.deepTeal }}>
                {t(p.nameKey)}
              </h3>
              <div className="mb-6">
                <div className="text-4xl font-extrabold" style={{ color: PALETTE.deepTeal }}>
                  {t(p.priceKey).split(' ')[0]}
                </div>
                <div className="text-gray-600">
                  {t(p.priceKey).split(' ').slice(1).join(' ')}
                </div>
              </div>
              <p className="text-gray-700 mb-8 text-sm leading-relaxed">
                {t(p.descKey)}
              </p>
              <a
                href={ctaHref('pricing', { plan: t(p.nameKey) })}
                className="block w-full py-3 px-6 rounded-full font-semibold text-white transition-all hover:scale-105"
                style={{ backgroundColor: PALETTE.deepTeal }}
              >
                {t('common:cta.start_free')}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
