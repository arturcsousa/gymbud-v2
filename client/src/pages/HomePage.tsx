import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const HomePage: React.FC = () => {
  const { t } = useTranslation(['common', 'landing']);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with language switcher */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-xl">GymBud</div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero section demonstrating i18n */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('landing:hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('landing:hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              {t('common:cta.start_free')}
            </button>
            <button className="border border-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50">
              {t('common:cta.see_how')}
            </button>
          </div>
        </div>

        {/* USP ticker */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            {t('landing:hero.usp_ticker')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
