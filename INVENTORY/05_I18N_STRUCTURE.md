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
├── index.ts
└── locales/
    ├── en/
    │   ├── common.json
    │   ├── landing.json
    │   ├── faq.json
    │   ├── app.json
    │   ├── auth.json
    │   ├── onboarding.json
    │   ├── assessment.json
    │   ├── plan.json
    │   ├── session.json
    │   ├── coach.json
    │   ├── progress.json
    │   ├── pricing.json
    │   ├── errors.json
    │   └── validation.json
    └── pt-BR/
        ├── common.json
        ├── landing.json
        ├── faq.json
        ├── app.json
        ├── auth.json
        ├── onboarding.json
        ├── assessment.json
        ├── plan.json
        ├── session.json
        ├── coach.json
        ├── progress.json
        ├── pricing.json
        ├── errors.json
        └── validation.json
```

## Conventions
- `keySeparator: false` – flat keys inside each namespace  
- `fallbackLng: 'en'`  
- Interpolation: `escapeValue: false`  
- Detector: navigator, localStorage, htmlTag  
- All new UI strings must be added under the appropriate namespace in **both** languages.
