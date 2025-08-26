import React from 'react';
import { useTranslation } from 'react-i18next';

const FAQPage: React.FC = () => {
  const { t } = useTranslation(['common', 'faq']);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">
          {t('faq:title')}
        </h1>
        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(t('faq:items', { returnObjects: true }) as Record<string, { q: string; a: string }>).map(([key, item]) => (
            <div key={key} className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
