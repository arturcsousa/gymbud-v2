import { useTranslation } from 'react-i18next';

export default function UspTicker() {
  const { t } = useTranslation(['landing', 'common']);
  return (
    <div className="bg-gradient-to-r from-[#18C7B6] to-[#0C8F93] py-2 text-center text-sm text-white">
      {t('landing:hero.usp_ticker')}
    </div>
  );
}
