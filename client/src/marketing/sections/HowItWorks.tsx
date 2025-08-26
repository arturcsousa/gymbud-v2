import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ClipboardList, Cog, PlayCircle, LineChart } from 'lucide-react';

const items = [
  { key: 'assess', Icon: ClipboardList },
  { key: 'generate', Icon: Cog },
  { key: 'train', Icon: PlayCircle },
  { key: 'progress', Icon: LineChart },
];

export default function HowItWorks() {
  const { t } = useTranslation('landing');
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl sm:text-4xl font-bold">{t('how.title')}</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ key, Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-black/10 p-6 shadow-sm bg-white/70 dark:bg-white/5 backdrop-blur"
          >
            <Icon className="h-6 w-6 opacity-70" />
            <h3 className="mt-4 font-semibold">{t(`how.steps.${key}.title`)}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t(`how.steps.${key}.desc`)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
