import { ctaHref } from '../theme';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function NavBar() {
  const { t, i18n } = useTranslation(['common', 'landing']);
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#042d3a]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white">GymBud</div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#how" className="text-white/80 hover:text-white">{t('common:nav.how_it_works')}</a>
            <a href="#programs" className="text-white/80 hover:text-white">{t('common:nav.programs')}</a>
            <a href="#pricing" className="text-white/80 hover:text-white">{t('common:nav.pricing')}</a>
            <a href="#faq" className="text-white/80 hover:text-white">{t('common:nav.faq')}</a>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-white/80 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              {i18n.language === 'en' ? 'PT' : 'EN'}
            </button>
            <a
              href={ctaHref('nav')}
              className="rounded-lg bg-white px-4 py-2 font-semibold text-[#043747]"
            >
              {t('common:cta.start_free')}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
