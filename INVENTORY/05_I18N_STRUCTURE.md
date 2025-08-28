# GymBud v2 - i18n Structure

## Overview
Complete internationalization setup for GymBud v2 with English (default) and Portuguese (Brazil) support.

## Configuration
- **Library**: react-i18next + i18next + i18next-browser-languagedetector
- **Languages**: EN (default), PT-BR
- **Detection**: localStorage → navigator → htmlTag fallback
- **Settings**: keySeparator: false, returnNull: false, escapeValue: false

## Namespace Structure

### Core Namespaces
- **common**: Navigation, CTAs, language labels, universal UI elements
- **landing**: Marketing page content (hero, features, pricing, FAQ)
- **app**: Main application UI (navigation, sync, auth, general actions)
- **auth**: Authentication flows (signin, signup, verification, password reset)

### Feature Namespaces
- **onboarding**: 12-step wizard (profile, goals, experience, schedule, equipment, preferences, workout, diet, progress, motivation, account, final)
- **assessment**: Baseline assessment and capacity testing
- **plan**: Training plan management and display
- **session**: Workout session runner and logging
- **coach**: AI coaching interactions and suggestions
- **progress**: Analytics, stats, and progress tracking
- **pricing**: Subscription and billing content
- **settings**: User preferences, sync management, account settings
- **errors**: Error messages and validation feedback
- **validation**: Form validation messages

### Specialized Namespaces
- **faq**: Frequently asked questions
- **stats**: Analytics page content and chart labels
- **badges**: Achievement and streak badge system
- **sync**: Sync status, events, and failure management

## Key Translation Areas

### Settings Namespace Extensions
Recent additions for sync failure management:
```json
{
  "sync": {
    "deadLetterQueue": "Dead-Letter Queue / Fila de erros",
    "noFailed": "No failed syncs 🎉 / Sem falhas de sincronização 🎉",
    "retry": "Retry / Tentar novamente",
    "retryAll": "Retry all / Tentar todos", 
    "delete": "Delete / Excluir",
    "deleteAll": "Delete all / Excluir todos",
    "lastTried": "Last tried: / Última tentativa:"
  }
}
```

### Authentication Flow
Complete coverage for signup, signin, email verification, and password reset flows with contextual messaging and error handling.

### Onboarding Wizard
All 12 steps fully localized with explanatory text, form labels, validation messages, and progress indicators.

### Session Runner
Comprehensive workout session translations including:
- Exercise navigation and instructions
- Set logging (reps, weight, RPE scales)
- Rest timer controls and announcements
- Effort level descriptions (1-10 RPE scale)
- Accessibility announcements

### Analytics & Progress
Stats page with chart labels, sharing functionality, streak badges, and progress metrics in both languages.

## File Structure
```
client/src/i18n/
├── index.ts (configuration)
├── locales/
│   ├── en/
│   │   ├── common.json
│   │   ├── landing.json
│   │   ├── app.json
│   │   ├── auth.json
│   │   ├── onboarding.json
│   │   ├── assessment.json
│   │   ├── plan.json
│   │   ├── session.json
│   │   ├── coach.json
│   │   ├── progress.json
│   │   ├── settings.json (enhanced with sync failure UI)
│   │   ├── pricing.json
│   │   ├── errors.json
│   │   ├── validation.json
│   │   ├── faq.json
│   │   ├── stats.json
│   │   ├── badges.json
│   │   └── sync.json
│   └── pt-BR/
│       └── [same structure as en/]
```

## Usage Patterns
- Multiple namespace loading: `useTranslation(['common', 'app', 'settings'])`
- Interpolation: `t('sync.lastTried') + ' ' + timestamp`
- Pluralization: `t('app:sync.pending', { count: pendingMutationsCount })`
- Contextual keys: `t('settings:sync.deadLetterQueue')` for developer UI

## Quality Assurance
- All user-facing strings localized in both EN and PT-BR
- Consistent terminology across namespaces
- Cultural adaptation for Brazilian Portuguese
- Technical terms appropriately translated or preserved
- Developer UI strings included for debugging tools
