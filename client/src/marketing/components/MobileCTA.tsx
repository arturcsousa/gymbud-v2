import { useTranslation } from 'react-i18next';
import { ctaHref } from '../theme';

export default function MobileCTA() {
  const { t } = useTranslation('common');
  return (
    <a
      href={ctaHref('mobile_cta')}
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#043747] shadow-lg md:hidden"
    >
      {t('cta.start_free')}
    </a>
  );
}
