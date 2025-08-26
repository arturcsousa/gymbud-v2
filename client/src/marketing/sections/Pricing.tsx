import { useTranslation } from 'react-i18next';
import { ctaHref } from '../theme';

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
    <section id="pricing" className="bg-[#063e50]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-white">
          <h2 className="text-3xl font-extrabold tracking-tight">{t('landing:pricing.title')}</h2>
          <p className="mt-2 text-white/80">{t('landing:pricing.subtitle')}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <article 
              key={i} 
              className={`rounded-2xl p-6 flex flex-col text-white ${
                p.popular ? 'ring-2 ring-white/50' : 'ring-1 ring-white/15'
              }`}
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {p.popular ? (
                <div 
                  className="mb-3 w-fit rounded-full px-3 py-1 text-xs text-white/85"
                  style={{
                    background: 'linear-gradient(135deg, #18C7B6, #0C8F93)',
                    boxShadow: '0 0 12px #18C7B6aa'
                  }}
                >
                  {t('landing:pricing.most_popular')}
                </div>
              ) : null}
              <h3 className="text-lg font-semibold">{t(p.nameKey)}</h3>
              <div className="mt-2 text-3xl font-extrabold text-white">
                {t(p.priceKey)}
              </div>
              <p className="mt-4 text-sm text-white/80">{t(p.descKey)}</p>
              <a
                href={ctaHref('pricing', { plan: t(p.nameKey) })}
                className="mt-6 rounded-lg bg-white px-4 py-2 text-center font-semibold text-[#043747]"
              >
                {t('common:cta.start_free')}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
