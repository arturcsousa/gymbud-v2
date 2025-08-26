import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Faq() {
  const { t } = useTranslation('faq');
  const [open, setOpen] = useState<number | null>(null);
  
  const items = [
    { q: t('items.diff.question'), a: t('items.diff.answer') },
    { q: t('items.busy_gym.question'), a: t('items.busy_gym.answer') },
    { q: t('items.injuries.question'), a: t('items.injuries.answer') },
    { q: t('items.data.question'), a: t('items.data.answer') },
    { q: t('items.accuracy.question'), a: t('items.accuracy.answer') },
    { q: t('items.ptbr.question'), a: t('items.ptbr.answer') },
  ];

  return (
    <section id="faq" className="bg-[#042d3a]">
      <div className="mx-auto max-w-4xl px-6 py-16 text-white">
        <h2 className="text-3xl font-extrabold tracking-tight">{t('title')}</h2>
        <div className="mt-8 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl glass ring-faint">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-left"
              >
                <span className="font-semibold">{item.q}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="border-t border-white/10 px-6 pb-6 pt-4">
                  <p className="text-white/80">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
