import { useTranslation } from 'react-i18next';
import { PALETTE } from '../theme';

export default function UspTicker() {
  const { t } = useTranslation('landing');
  return (
    <div
      className="w-full"
      style={{
        background: `linear-gradient(90deg, ${PALETTE.teal}, ${PALETTE.aqua} 40%, ${PALETTE.orange})`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-2 text-center text-sm font-medium text-white">
        {t('hero.usp_ticker')}
      </div>
    </div>
  );
}
