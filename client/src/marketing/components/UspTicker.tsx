import { useTranslation } from 'react-i18next';

export default function UspTicker() {
  const { t } = useTranslation('landing');
  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white text-xs sm:text-sm">
      <div className="mx-auto max-w-7xl px-3 py-2 text-center">
        <span className="opacity-90">{t('hero.usp_ticker')}</span>
      </div>
    </div>
  );
}
