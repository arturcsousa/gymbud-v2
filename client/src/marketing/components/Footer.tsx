import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation(['common', 'landing']);
  return (
    <footer className="bg-[#042d3a]">
      <div className="mx-auto max-w-7xl px-6 py-10 text-white/70">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img 
              src="/images/gymbud-wh.png" 
              alt="GymBud Logo" 
              className="h-8 w-auto"
            />
            <p>&#169; {new Date().getFullYear()} GymBud</p>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-6">
            <a href="/pricing" className="hover:text-white transition-colors">{t('common:nav.pricing')}</a>
            <a href="/faq" className="hover:text-white transition-colors">{t('common:nav.faq')}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
