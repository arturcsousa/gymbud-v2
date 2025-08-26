import { useTranslation } from 'react-i18next';
import { Dumbbell, Flame, Activity } from 'lucide-react';
import { PALETTE } from '../theme';

const CARD = 'rounded-2xl p-6 glass ring-faint text-white';

export default function Programs() {
  const { t } = useTranslation('landing');
  const items = [
    { icon: <Dumbbell />, title: t('programs.muscle.title'),    desc: t('programs.muscle.desc'),    color: PALETTE.aqua },
    { icon: <Flame />,    title: t('programs.weight.title'),    desc: t('programs.weight.desc'),    color: PALETTE.orange },
    { icon: <Activity />, title: t('programs.endurance.title'), desc: t('programs.endurance.desc'), color: PALETTE.teal },
  ];
  return (
    <section id="programs" className="bg-[#063e50]">
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('programs.title')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <article key={i} className={CARD} style={{ boxShadow: `0 0 24px -10px ${it.color}aa` }}>
              <div
                className="neon-icon mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{ color: it.color, background: `${it.color}22`, boxShadow: `0 0 18px ${it.color}88` }}
              >
                <div className="h-5 w-5">{it.icon}</div>
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-white/80">{it.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
