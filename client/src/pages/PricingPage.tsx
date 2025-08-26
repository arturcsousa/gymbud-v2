import React from 'react';
import { useTranslation } from 'react-i18next';

const PricingPage: React.FC = () => {
  const { t } = useTranslation(['common', 'landing']);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          {t('common:nav.pricing')}
        </h1>
        <p className="text-center text-gray-600">
          Page content will be implemented with full landing UI
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
