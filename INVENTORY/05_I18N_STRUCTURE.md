# i18n Structure (EN, PT-BR)

**Stack:** i18next, react-i18next, i18next-browser-languagedetector

## Languages
- `en` (default)
- `pt-BR`

## Namespaces (by JSON file)
- Marketing: `landing`, `faq`
- Shared UI: `common`
- App (future-proofed): `app`, `auth`, `onboarding`, `assessment`, `plan`, `session`, `coach`, `progress`, `pricing`, `errors`, `validation`

## File Layout

```
client/src/i18n/
├── index.ts                    # Bootstrap config + HTML lang/dir sync
└── locales/
    ├── en/
    │   ├── common.json         # Navigation, CTA, language labels
    │   ├── landing.json        # Hero, features, pricing, CTA sections
    │   ├── faq.json           # Common questions and answers
    │   ├── app.json           # Placeholder for app UI strings
    │   ├── auth.json          # Placeholder for login/signup/OTP
    │   ├── onboarding.json    # Placeholder for onboarding wizard
    │   ├── assessment.json    # Placeholder for baseline assessments
    │   ├── plan.json          # Placeholder for plan pages
    │   ├── session.json       # Placeholder for session runner UI
    │   ├── coach.json         # Placeholder for coach prompts
    │   ├── progress.json      # Placeholder for charts/metrics
    │   ├── pricing.json       # Placeholder for app pricing
    │   ├── errors.json        # Placeholder for error messages
    │   └── validation.json    # Placeholder for form validation
    └── pt-BR/
        ├── common.json         # Portuguese navigation, CTA, labels
        ├── landing.json        # Portuguese hero, features, pricing
        ├── faq.json           # Portuguese FAQ content
        ├── app.json           # Placeholder for Portuguese app UI
        ├── auth.json          # Placeholder for Portuguese auth
        ├── onboarding.json    # Placeholder for Portuguese onboarding
        ├── assessment.json    # Placeholder for Portuguese assessment
        ├── plan.json          # Placeholder for Portuguese plan
        ├── session.json       # Placeholder for Portuguese session
        ├── coach.json         # Placeholder for Portuguese coach
        ├── progress.json      # Placeholder for Portuguese progress
        ├── pricing.json       # Placeholder for Portuguese pricing
        ├── errors.json        # Placeholder for Portuguese errors
        └── validation.json    # Placeholder for Portuguese validation
```

## Configuration
- `keySeparator: false` – flat keys inside each namespace  
- `fallbackLng: 'en'`  
- `supportedLngs: ['en', 'pt-BR']`
- Interpolation: `escapeValue: false`  
- Detection order: localStorage → navigator → htmlTag
- Language persistence: localStorage
- Lazy loading: All resources imported at build time

## HTML Integration
- **Dynamic lang attribute:** `<html lang>` updates on language change
- **RTL support:** `<html dir>` set to 'rtl' for Arabic, Farsi, Hebrew, Urdu
- **Default fallback:** `lang="en" dir="ltr"` in index.html
- **Event handling:** `languageChanged` listener syncs DOM attributes

## Usage Patterns
```typescript
// Single namespace
const { t } = useTranslation('landing');
t('hero.title')

// Multiple namespaces
const { t } = useTranslation(['common', 'landing']);
t('common:nav.home')
t('landing:hero.title')
```

## Language Switching
- **Component:** `LanguageSwitcher.tsx` with Globe icon dropdown
- **Persistence:** Selection saved to localStorage
- **Integration:** Embedded in NavBar component
- **Accessibility:** Proper ARIA labels and screen reader support

## Content Status
- **Complete:** common, landing, faq namespaces with full EN/PT-BR content
- **Placeholders:** All app-related namespaces ready for future implementation
- **Marketing ready:** All marketing site strings translated and implemented

## Conventions
- All new UI strings must be added under the appropriate namespace in **both** languages
- Use semantic keys (e.g., `hero.title` not `text1`)
- Keep keys flat within namespaces (no nested objects)
- Maintain consistent terminology across languages
