import { ctaHref } from '../theme';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Globe } from 'lucide-react';

export default function NavBar() {
  const { t, i18n } = useTranslation(['common', 'landing']);
  const nav = [
    { href: '/how-it-works', label: t('common:nav.how_it_works') },
    { href: '/programs', label: t('common:nav.programs') },
    { href: '/pricing', label: t('common:nav.pricing') },
    { href: '/faq', label: t('common:nav.faq') },
  ];

  const switchLang = () => i18n.changeLanguage(i18n.language === 'pt-BR' ? 'en' : 'pt-BR');

  return (
    <header className="sticky top-0 z-40 bg-[#043747]/80 backdrop-blur supports-[backdrop-filter]:bg-[#043747]/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-white">
          <span className="text-xl font-extrabold tracking-tight">GymBud</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="text-white/80 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:border-white/40"
            onClick={switchLang}
            aria-label="Switch language"
            title="Switch language"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language}</span>
          </button>
          <a
            href={ctaHref('nav')}
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#043747]"
          >
            {t('common:cta.start_free')}
          </a>
        </div>
      </div>
    </header>
  );
}
