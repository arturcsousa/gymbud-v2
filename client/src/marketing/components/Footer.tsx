import { useTranslation } from 'react-i18next';

export default function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation('common');
  return (
    <footer className="border-t border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="font-semibold">GymBud</div>
          <div className="flex flex-wrap gap-4 opacity-80">
            <a href="#how">{t('nav.how_it_works')}</a>
            <a href="#why">{t('nav.why_different')}</a>
            <a href="#programs">{t('nav.programs')}</a>
            <a href="#pricing">{t('nav.pricing')}</a>
            <a href="#faq">{t('nav.faq')}</a>
          </div>
        </div>
        <div className="mt-6 opacity-60">© {year} GymBud.ai — All rights reserved.</div>
      </div>
    </footer>
  );
}
