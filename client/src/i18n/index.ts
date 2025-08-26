import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all locale files
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enFaq from './locales/en/faq.json';
import enApp from './locales/en/app.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enAssessment from './locales/en/assessment.json';
import enPlan from './locales/en/plan.json';
import enSession from './locales/en/session.json';
import enCoach from './locales/en/coach.json';
import enProgress from './locales/en/progress.json';
import enPricing from './locales/en/pricing.json';
import enErrors from './locales/en/errors.json';
import enValidation from './locales/en/validation.json';

import ptBRCommon from './locales/pt-BR/common.json';
import ptBRLanding from './locales/pt-BR/landing.json';
import ptBRFaq from './locales/pt-BR/faq.json';
import ptBRApp from './locales/pt-BR/app.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBROnboarding from './locales/pt-BR/onboarding.json';
import ptBRAssessment from './locales/pt-BR/assessment.json';
import ptBRPlan from './locales/pt-BR/plan.json';
import ptBRSession from './locales/pt-BR/session.json';
import ptBRCoach from './locales/pt-BR/coach.json';
import ptBRProgress from './locales/pt-BR/progress.json';
import ptBRPricing from './locales/pt-BR/pricing.json';
import ptBRErrors from './locales/pt-BR/errors.json';
import ptBRValidation from './locales/pt-BR/validation.json';

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    faq: enFaq,
    app: enApp,
    auth: enAuth,
    onboarding: enOnboarding,
    assessment: enAssessment,
    plan: enPlan,
    session: enSession,
    coach: enCoach,
    progress: enProgress,
    pricing: enPricing,
    errors: enErrors,
    validation: enValidation,
  },
  'pt-BR': {
    common: ptBRCommon,
    landing: ptBRLanding,
    faq: ptBRFaq,
    app: ptBRApp,
    auth: ptBRAuth,
    onboarding: ptBROnboarding,
    assessment: ptBRAssessment,
    plan: ptBRPlan,
    session: ptBRSession,
    coach: ptBRCoach,
    progress: ptBRProgress,
    pricing: ptBRPricing,
    errors: ptBRErrors,
    validation: ptBRValidation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en', // default language
    supportedLngs: ['en', 'pt-BR'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    keySeparator: false,
    returnNull: false,
    
    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
