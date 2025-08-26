import { useTranslation } from 'react-i18next';
import { ClipboardList, Dumbbell, LineChart } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useTranslation('landing');
  const items = [
    { icon: <ClipboardList className="h-5 w-5" />, title: t('how.steps.assess.title'), desc: t('how.steps.assess.desc') },
    { icon: <Dumbbell className="h-5 w-5" />, title: t('how.steps.generate.title'), desc: t('how.steps.generate.desc') },
    { icon: <LineChart className="h-5 w-5" />, title: t('how.steps.train.title'), desc: t('how.steps.train.desc') },
  ];
  return (
    <section id="how" className="bg-[#0d5568]">
      <div className="mx-auto max-w-7xl px-6 py-16 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('how.title')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                {it.icon}
              </div>
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-white/80">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
