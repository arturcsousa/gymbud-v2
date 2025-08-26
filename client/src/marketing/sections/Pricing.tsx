import { useTranslation } from 'react-i18next';
import { ctaHref } from '../theme';

export default function Pricing() {
  const { t } = useTranslation(['landing', 'common']);
  const plans = [
    { name: 'Basic',   price: '19', ribbon: '',                         popular: false },
    { name: 'Pro',     price: '29', ribbon: 'Most Popular', popular: true },
    { name: 'Premium', price: '49', ribbon: '',                         popular: false },
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
              {p.ribbon ? (
                <div 
                  className="mb-3 w-fit rounded-full px-3 py-1 text-xs text-white/85"
                  style={{
                    background: 'linear-gradient(135deg, #18C7B6, #0C8F93)',
                    boxShadow: '0 0 12px #18C7B6aa'
                  }}
                >
                  {p.ribbon}
                </div>
              ) : null}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 text-3xl font-extrabold text-white">
                ${p.price}<span className="text-base font-medium text-white/70">/month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                <li>• AI-powered training plans</li>
                <li>• Progress tracking & analytics</li>
                <li>• 24/7 customer support</li>
              </ul>
              <a
                href={ctaHref('pricing', { plan: p.name as string })}
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
