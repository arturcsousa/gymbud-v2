import { useTranslation } from 'react-i18next';
import { Dumbbell, Flame, Activity } from 'lucide-react';
import { PALETTE } from '../theme';

export default function Programs() {
  const { t } = useTranslation(['landing', 'common']);
  const items = [
    { icon: <Dumbbell />, title: t('landing:programs.muscle.title'),    desc: t('landing:programs.muscle.desc'),    color: PALETTE.aqua },
    { icon: <Flame />,    title: t('landing:programs.weight.title'),    desc: t('landing:programs.weight.desc'),    color: PALETTE.orange },
    { icon: <Activity />, title: t('landing:programs.endurance.title'), desc: t('landing:programs.endurance.desc'), color: PALETTE.teal },
  ];
  return (
    <section id="programs" className="bg-[#063e50]">
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('landing:programs.title')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <div 
              key={i} 
              className="p-[1px] rounded-2xl"
              style={{
                background: `linear-gradient(180deg, transparent, ${it.color} 60%)`,
              }}
            >
              <article 
                className="rounded-2xl p-6 glass ring-faint text-white h-full"
                style={{ boxShadow: `0 0 24px -10px ${it.color}aa` }}
              >
                <div
                  className="neon-icon mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ color: it.color, background: `${it.color}22`, boxShadow: `0 0 18px ${it.color}88` }}
                >
                  <div className="h-5 w-5">{it.icon}</div>
                </div>
                <h3 className="font-semibold">{it.title}</h3>
                <p className="mt-1 text-sm text-white/80">{it.desc}</p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
