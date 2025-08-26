import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Brain, Wand2, Timer, Dumbbell, MousePointer, Database } from 'lucide-react';

const features = [
  { key: 'deterministic', Icon: Brain },
  { key: 'coach', Icon: Wand2 },
  { key: 'rest', Icon: Timer },
  { key: 'constraints', Icon: Dumbbell },
  { key: 'runner', Icon: MousePointer },
  { key: 'data', Icon: Database },
];

export default function WhyDifferent() {
  const { t } = useTranslation('landing');
  return (
    <section id="why" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('different.title')}</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ key, Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-black/10 p-6 shadow-sm bg-white/70 dark:bg-white/5 backdrop-blur"
          >
            <Icon className="h-6 w-6 opacity-70" />
            <h3 className="mt-4 font-semibold">{t(`different.items.${key}.title`)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t(`different.items.${key}.desc`)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
