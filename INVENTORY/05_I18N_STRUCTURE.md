# GymBud v2 - i18n Structure

## Overview
Bilingual internationalization setup using `react-i18next` with English (EN) as default and Portuguese Brazil (PT-BR) as secondary language.

## Configuration
- **Library**: `react-i18next` + `i18next-browser-languagedetector`
- **Languages**: EN (default), PT-BR
- **Detection**: localStorage → navigator → htmlTag fallback
- **Namespaces**: 14 total (common, landing, faq, app, auth, onboarding, assessment, plan, session, coach, progress, pricing, errors, validation)
- **Settings**: `keySeparator: '.'`, `nsSeparator: ':'`, `returnNull: false`, `escapeValue: false`

## File Structure
```
client/src/i18n/
├── index.ts                    # Main i18n configuration
├── locales/
│   ├── en/                     # English translations
│   │   ├── common.json         # Navigation, CTAs, language labels
│   │   ├── landing.json        # Marketing page content
│   │   ├── faq.json           # FAQ questions and answers
│   │   ├── auth.json          # Authentication flows
│   │   └── [11 other namespaces].json
│   └── pt-BR/                  # Portuguese Brazil translations
│       ├── common.json
│       ├── landing.json
│       ├── faq.json
│       └── [mirror structure]
```

## Key Translation Structures

### Common Namespace (`common.json`)
```json
{
  "nav": {
    "how_it_works": "How it Works",
    "why_different": "Why We're Different",
    "programs": "Programs",
    "pricing": "Pricing",
    "faq": "FAQ",
    "sign_in": "Sign In"
  },
  "cta": {
    "start_free": "Start Free",
    "see_how": "See How It Works",
    "learn_more": "Learn More"
  },
  "lang": {
    "en": "English",
    "ptbr": "Português (BR)"
  }
}
```

### Landing Namespace (`landing.json`)
```json
{
  "hero": {
    "title": "Personal training that's actually personal",
    "subtitle": "The only AI fitness app with a deterministic engine + adaptive coach..."
  },
  "how": {
    "title": "How it Works",
    "steps": {
      "assess": { "title": "Assess", "desc": "Tell us your goals..." },
      "generate": { "title": "Generate", "desc": "Get a deterministic plan..." }
    }
  },
  "different": {
    "title": "Why We're Different",
    "items": {
      "deterministic": { "title": "Deterministic Engine", "desc": "No roulette..." },
      "coach": { "title": "Adaptive Coach", "desc": "Ask the coach to swap..." }
    }
  },
  "programs": {
    "title": "Programs & Goals",
    "muscle": { "title": "Muscle Building", "desc": "Build muscle size..." },
    "weight": { "title": "Weight Loss", "desc": "Burn fat while keeping..." },
    "endurance": { "title": "Endurance", "desc": "Boost stamina..." }
  },
  "progress": {
    "title": "Proof of Progress",
    "subtitle": "Track every rep, set, and weight automatically"
  },
  "pricing": {
    "title": "Pricing",
    "subtitle": "Choose the plan that fits your goals"
  },
  "final_cta": {
    "title": "Ready to train smarter?",
    "subtitle": "Join thousands who've transformed their training with GymBud"
  }
}
```

### FAQ Namespace (`faq.json`)
```json
{
  "title": "FAQ",
  "items": {
    "free": { "question": "Is GymBud really free to try?", "answer": "Yes! Start with our free tier..." },
    "beginner": { "question": "I'm a complete beginner. Can I use GymBud?", "answer": "Absolutely..." },
    "equipment": { "question": "What if my gym doesn't have certain equipment?", "answer": "The coach can instantly swap..." }
  }
}
```

## Usage Patterns

### Component Usage
```tsx
import { useTranslation } from 'react-i18next';

// Single namespace
const { t } = useTranslation('common');
const title = t('nav.pricing');

// Multiple namespaces
const { t } = useTranslation(['common', 'landing']);
const cta = t('common:cta.start_free');
const hero = t('landing:hero.title');

// With namespace prefix
const title = t('landing:hero.title');
```

### HTML Integration
- Automatic `lang` and `dir` attribute synchronization
- RTL language detection for Arabic, Farsi, Hebrew, Urdu
- Language change event listener updates document attributes

### Language Switching
- `LanguageSwitcher` component with Globe icon dropdown
- Persistence via localStorage
- Immediate UI updates on language change

## Conventions
- **Keys**: Use dot notation (e.g., `hero.title`, `nav.pricing`)
- **Namespaces**: Lowercase, descriptive (common, landing, faq, etc.)
- **Structure**: Nested objects for logical grouping
- **Consistency**: Mirror EN structure exactly in PT-BR files
- **Fallback**: Missing PT-BR keys fall back to EN automatically

## Development Notes
- All marketing components use proper namespace prefixes
- Translation keys aligned with actual locale file structure
- FAQ uses `question`/`answer` pattern for consistency
- CTA buttons centralized in `common:cta.*` namespace
