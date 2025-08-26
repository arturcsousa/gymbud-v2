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
│   │   ├── common.json         # Navigation, CTAs, language labels, UI strings
│   │   ├── landing.json        # Marketing page content
│   │   ├── faq.json           # FAQ questions and answers
│   │   ├── app.json           # App navigation, sync status, conflicts
│   │   ├── auth.json          # Authentication flows (signin, signup, reset)
│   │   ├── session.json       # Workout logging interface
│   │   ├── history.json       # Workout history and detail views
│   │   ├── library.json       # Exercise database browsing
│   │   ├── settings.json      # Account management, data export
│   │   └── [5 other namespaces].json
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
    "home": "Home",
    "howItWorks": "How It Works",
    "programs": "Programs",
    "pricing": "Pricing",
    "faq": "FAQ",
    "signIn": "Sign In",
    "getStarted": "Get Started"
  },
  "cta": {
    "primary": "Start Your Journey",
    "secondary": "Learn More",
    "getStarted": "Get Started",
    "signUp": "Sign Up Free",
    "tryFree": "Try Free"
  },
  "languages": {
    "en": "English",
    "pt-BR": "Português (Brasil)"
  },
  "loading": "Loading...",
  "error": "Error",
  "success": "Success",
  "cancel": "Cancel",
  "save": "Save",
  "delete": "Delete",
  "edit": "Edit"
}
```

### App Namespace (`app.json`)
```json
{
  "nav": {
    "home": "Home",
    "session": "Session",
    "history": "History",
    "library": "Library",
    "settings": "Settings"
  },
  "sync": {
    "online": "Online",
    "offline": "Offline",
    "syncing": "Syncing...",
    "lastSync": "Last sync: {{time}}",
    "pendingChanges": "{{count}} pending changes",
    "syncNow": "Sync Now",
    "syncError": "Sync failed"
  },
  "conflicts": {
    "title": "Data Conflict",
    "message": "Your local changes conflict with server data",
    "keepLocal": "Keep Local",
    "useServer": "Use Server",
    "merge": "Merge",
    "dismiss": "Dismiss"
  },
  "sessionStatus": {
    "active": "Active",
    "completed": "Completed",
    "paused": "Paused"
  }
}
```

### Authentication Namespace (`auth.json`)
```json
{
  "signin": {
    "title": "Sign in to your account",
    "submit": "Sign In",
    "noAccount": "Don't have an account?",
    "link": "Sign up"
  },
  "signup": {
    "title": "Create your account",
    "submit": "Sign Up",
    "hasAccount": "Already have an account?",
    "link": "Sign in",
    "checkEmail": "Check your email for a confirmation link"
  },
  "reset": {
    "title": "Reset your password",
    "submit": "Send Reset Email",
    "link": "Forgot password?",
    "emailSent": "Password reset email sent"
  },
  "fields": {
    "email": "Email",
    "password": "Password"
  },
  "errors": {
    "generic": "An error occurred. Please try again.",
    "emailRequired": "Email is required"
  }
}
```

### Session Namespace (`session.json`)
```json
{
  "workout": "Workout",
  "timer": {
    "title": "Workout Timer"
  },
  "exercises": {
    "title": "Exercises",
    "add": "Add Exercise",
    "empty": "No exercises added yet. Add your first exercise to get started!"
  },
  "set": {
    "add": "Add Set",
    "setNumber": "Set",
    "reps": "Reps",
    "weight": "Weight",
    "rpe": "RPE",
    "notes": "Notes"
  },
  "actions": {
    "save": "Save Progress",
    "complete": "Complete Session"
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
