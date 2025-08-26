import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const APP_URL =
  (import.meta as any).env?.NEXT_PUBLIC_SITE_URL ||
  (import.meta as any).env?.VITE_SITE_URL ||
  'https://app.gymbud.ai';

export default function NavBar() {
  const { t } = useTranslation(['common']);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-black/30 border-b border-black/5 dark:border-white/5">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/"><span aria-label={t('logo_aria')} className="font-bold text-xl cursor-pointer">GymBud</span></Link>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#how" className="hover:opacity-80">{t('nav.how_it_works')}</a>
          <a href="#why" className="hover:opacity-80">{t('nav.why_different')}</a>
          <a href="#programs" className="hover:opacity-80">{t('nav.programs')}</a>
          <a href="#pricing" className="hover:opacity-80">{t('nav.pricing')}</a>
          <a href="#faq" className="hover:opacity-80">{t('nav.faq')}</a>
          <a href={APP_URL} className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium shadow hover:bg-indigo-500">
            {t('cta.start_free')}
          </a>
          <LanguageSwitcher />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <a href={APP_URL} className="rounded-lg bg-indigo-600 px-3 py-2 text-white font-medium shadow hover:bg-indigo-500">
            {t('cta.start_free')}
          </a>
        </div>
      </nav>
    </header>
  );
}
