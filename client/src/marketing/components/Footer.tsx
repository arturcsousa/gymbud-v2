import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation(['common', 'landing']);
  return (
    <footer className="bg-[#042d3a]">
      <div className="mx-auto max-w-7xl px-6 py-10 text-white/70">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p> {new Date().getFullYear()} GymBud</p>
          <nav className="flex gap-6">
            <a href="/pricing" className="hover:text-white">{t('common:nav.pricing')}</a>
            <a href="/faq" className="hover:text-white">{t('common:nav.faq')}</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
