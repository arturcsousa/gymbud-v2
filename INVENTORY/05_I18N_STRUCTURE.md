# GymBud v2 - i18n Structure

## Overview
Bilingual internationalization setup using `react-i18next` with English (EN) as default and Portuguese Brazil (PT-BR) as secondary language. **Complete translation coverage achieved** for all app pages and components.

## Configuration
- **Library**: `react-i18next` + `i18next-browser-languagedetector`
- **Languages**: EN (default), PT-BR
- **Detection**: localStorage → navigator → htmlTag fallback
- **Persistence**: Automatic localStorage caching with immediate HTML attribute updates
- **Namespaces**: 21 total (common, landing, faq, app, auth, onboarding, assessment, plan, session, coach, progress, pricing, errors, validation, settings, stats, badges, sync)
- **Settings**: `keySeparator: '.'`, `nsSeparator: ':'`, `returnNull: false`, `escapeValue: false`

## Recent Updates (2025-08-28 14:09)
- **Stats Page Translation Fix**: Resolved PT-BR stats.json structure mismatch by moving nested keys to root level
- **Translation Coverage**: Added missing translation keys for stats page in both EN and PT-BR languages
- **Key Structure Alignment**: Fixed PT-BR stats translations to match EN format for proper i18next namespace resolution
- **Complete Stats Coverage**: Both languages now have full translation coverage for metrics, charts, sharing, and UI elements
- **TypeScript Compilation Fixes**: Resolved all TypeScript errors in onboarding components
- **Type Safety**: Fixed GoalsPage.tsx and ProfilePage.tsx type mismatches for OnboardingState interface
- **Form Data Casting**: Proper type casting for days_per_week and confidence values to match expected union types
- **Password Reset System**: Added comprehensive password reset i18n keys to auth namespace
- **Reset Flow Coverage**: Complete EN/PT-BR translations for dual-state password reset (request + update modes)
- **Security Features**: Localized error messages for invalid tokens, rate limiting, and validation failures
- **Navigation Keys**: Added goToApp key to common namespace for post-reset routing
- **Component Integration**: Enhanced ProfilePage and ReviewPage with proper export declarations
- **Form Validation**: Improved onboarding form type safety with proper Zod schema integration
- **UI Components**: Added Radix UI Slider component with full i18n support for confidence ratings
- **Auth OTP Flow**: Added comprehensive email verification keys for 6-digit OTP system with resend functionality

## File Structure
```
client/src/i18n/
├── index.ts                    # Main i18n configuration
├── locales/
│   ├── en/                     # English translations (COMPLETE)
│   │   ├── common.json         # Navigation, CTAs, language labels, UI strings
│   │   ├── landing.json        # Marketing page content
│   │   ├── faq.json           # FAQ questions and answers
│   │   ├── app.json           # App navigation, home, history, library, session, settings, sync
│   │   ├── auth.json          # Authentication flows (signin, signup, reset)
│   │   ├── session.json       # Workout logging interface
│   │   ├── history.json       # Workout history and detail views
│   │   ├── library.json       # Exercise database browsing
│   │   ├── settings.json      # Account management, data export
│   │   ├── errors.json        # Error messages
│   │   ├── stats.json         # Progress tracking and analytics interface
│   │   ├── badges.json        # Streak achievement system
│   │   ├── onboarding.json    # Onboarding process
│   │   └── [5 other namespaces].json
│   └── pt-BR/                  # Portuguese Brazil translations (COMPLETE)
│       ├── common.json
│       ├── landing.json
│       ├── faq.json
│       ├── app.json           # Fully translated with Brazilian Portuguese conventions
│       └── [mirror structure]
```

## Complete Translation Coverage

### **App Namespace (`app.json`) - FULLY UPDATED**
```json
{
  "nav": {
    "home": "Home",
    "session": "Session", 
    "history": "History",
    "library": "Library",
    "settings": "Settings"
  },
  "home": {
    "welcome": "Welcome back",
    "subtitle": "Ready for today's workout?",
    "todaysPlan": "Today's Plan",
    "startWorkout": "Start Workout",
    "viewHistory": "View History",
    "quickStats": {
      "title": "Quick Stats",
      "workoutsThisWeek": "Workouts this week",
      "currentStreak": "Current streak",
      "totalWorkouts": "Total workouts"
    },
    "nextSession": {
      "title": "Next Session",
      "exercises": "exercises",
      "estimatedTime": "Estimated time",
      "minutes": "min"
    }
  },
  "history": {
    "stats": "Workout Stats",
    "totalWorkouts": "Total Workouts",
    "avgDuration": "Avg Duration",
    "totalExercises": "Total Exercises",
    "totalSets": "Total Sets",
    "exercises": "exercises",
    "sets": "sets",
    "noSessions": "No workout sessions yet",
    "startFirst": "Start Your First Workout",
    "status": {
      "completed": "Completed",
      "in_progress": "In Progress",
      "planned": "Planned"
    }
  },
  "library": {
    "searchPlaceholder": "Search exercises...",
    "categories": "Categories",
    "exercisesFound": "exercises found",
    "noResults": "No exercises found",
    "clearFilters": "Clear Filters",
    "bodyweight": "Bodyweight",
    "category": {
      "all": "All",
      "chest": "Chest",
      "back": "Back",
      "shoulders": "Shoulders",
      "arms": "Arms",
      "legs": "Legs",
      "core": "Core",
      "cardio": "Cardio"
    },
    "difficulty": {
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced"
    },
    "muscle": {
      "chest": "Chest",
      "triceps": "Triceps",
      "shoulders": "Shoulders",
      "lats": "Lats",
      "rhomboids": "Rhomboids",
      "biceps": "Biceps",
      "quadriceps": "Quadriceps",
      "glutes": "Glutes",
      "hamstrings": "Hamstrings",
      "deltoids": "Deltoids",
      "abs": "Abs",
      "core": "Core",
      "erector spinae": "Erector Spinae"
    },
    "equipment": {
      "barbell": "Barbell",
      "bench": "Bench",
      "pull-up bar": "Pull-up Bar",
      "squat rack": "Squat Rack",
      "dumbbells": "Dumbbells"
    }
  },
  "session": {
    "workout": "Workout",
    "completed": "Completed",
    "inProgress": "In Progress",
    "planned": "Planned",
    "loading": "Loading session...",
    "exercise": "Exercise",
    "complete": "complete",
    "workoutTime": "Workout Time",
    "sets": "sets",
    "reps": "reps",
    "set": "Set",
    "pending": "Pending",
    "weight": "Weight",
    "undo": "Undo",
    "markComplete": "Mark Complete",
    "exerciseList": "Exercise List",
    "current": "Current",
    "upcoming": "Upcoming",
    "nextExercise": "Next Exercise",
    "finish": "Finish Workout",
    "previous": "Previous",
    "pause": "Pause",
    "header": {
      "exercise_progress": "Exercise Progress",
      "workout_time": "Workout Time"
    },
    "exercise_card": {
      "instructions": "Instructions",
      "tips": "Tips",
      "warmup": "Warmup",
      "work_set": "Work Set"
    },
    "exercise_card_target": {
      "reps": "Target Reps",
      "reps_exact": "Target Reps (Exact)",
      "rest_time": "Rest Time"
    },
    "set_logging": {
      "reps": "Reps",
      "weight": "Weight",
      "effort": "Effort",
      "log_set": "Log Set",
      "undo_last": "Undo Last Set"
    },
    "set_logging_status": {
      "set_number": "Set Number",
      "completed": "Completed",
      "pending": "Pending"
    },
    "effort_levels": {
      "1": "Very Easy",
      "2": "Easy",
      "3": "Leve",
      "4": "Moderate",
      "5": "Um Pouco Difícil",
      "6": "Difícil",
      "7": "Muito Difícil",
      "8": "Extremamente Difícil",
      "9": "Máximo",
      "10": "Máximo Absoluto"
    },
    "rest_timer": {
      "rest_time": "Rest Time",
      "time_remaining": "Time Remaining",
      "rest_complete": "Rest Complete",
      "skip_rest": "Skip Rest",
      "add_30s": "Add 30s",
      "actual_rest": "Actual Rest"
    },
    "upcoming": {
      "next_exercise": "Next Exercise",
      "sets_remaining": "Sets Remaining"
    },
    "navigation": {
      "previous_exercise": "Previous Exercise",
      "next_exercise": "Next Exercise",
      "finish_workout": "Finish Workout",
      "pause_workout": "Pause Workout"
    },
    "completion": {
      "workout_complete": "Workout Complete",
      "great_job": "Great Job!",
      "total_time": "Total Time",
      "sets_completed": "Sets Completed",
      "view_summary": "View Summary"
    },
    "errors": {
      "session_not_found": "Session Not Found",
      "failed_to_load": "Failed to Load",
      "failed_to_log_set": "Failed to Log Set",
      "failed_to_update_session": "Failed to Update Session"
    },
    "accessibility": {
      "rest_timer_announcement": "Rest Timer Announcement",
      "set_logged_announcement": "Set Logged Announcement",
      "exercise_changed_announcement": "Exercise Changed Announcement"
    },
    "set": {
      "undoDurable": "Undo (after sync)",
      "undone": "Undone"
    },
    "toasts": {
      "undoQueued": "Undo queued—will retry when online.",
      "undoFailed": "Can't undo this set."
    },
    "accessibility": {
      "setLogged": "Set logged successfully",
      "restStarted": "Rest timer started for {{seconds}} seconds", 
      "restCompleted": "Rest time completed",
      "exerciseChanged": "Now on {{exerciseName}}",
      "undoReturnToSet": "Undo: returning to set {{setNumber}}"
    }
  },
  "settings": {
    "about": "About",
    "version": "Version",
    "checkForUpdates": "Check for updates",
    "checkingForUpdates": "Checking for updates...",
    "installApp": "Install app",
    "appInstalled": "App installed",
    "installNotAvailable": "Install not available",
    "save": "Save",
    "account": "Account",
    "email": "Email",
    "emailReadonly": "Email cannot be changed",
    "preferences": "Preferences",
    "language": "Language",
    "units": "Units",
    "imperial": "Imperial",
    "metric": "Metric",
    "notifications": "Notifications",
    "notificationsDesc": "Receive workout reminders and updates",
    "darkMode": "Dark Mode",
    "darkModeDesc": "Use dark theme (coming soon)",
    "data": "Data",
    "exportData": "Export Data",
    "dangerZone": "Danger Zone",
    "deleteAccount": "Delete Account",
    "sync": {
      "title": "Sync",
      "status": "Status",
      "syncNow": "Sync Now",
      "recentEvents": "Recent Events",
      "success": "success",
      "failure": "failure",
      "items": "items",
      "noEvents": "No sync events yet"
    }
  },
  "sync": {
    "offline": "You're offline",
    "online": "Back online",
    "syncing": "Syncing...",
    "syncNow": "Sync Now",
    "pendingChanges": "pending changes",
    "conflicts": "Data conflicts detected",
    "never": "Never",
    "justNow": "Just now",
    "minutesAgo": "{{count}} min ago",
    "minutesAgo_plural": "{{count}} mins ago",
    "hoursAgo": "{{count}} hour ago",
    "hoursAgo_plural": "{{count}} hours ago",
    "daysAgo": "{{count}} day ago",
    "daysAgo_plural": "{{count}} days ago",
    "lastSync": "Last sync",
    "pending": "{{count}} pending change",
    "pending_plural": "{{count}} pending changes"
  }
}
```

### **Auth Namespace (`auth.json`) - FULLY UPDATED WITH OTP VERIFICATION AND PASSWORD RESET**
```json
{
  "welcome": {
    "title": "Welcome to GymBud",
    "subtitle": "Create your account or sign in to continue."
  },
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
  "signInTitle": "Sign in to GymBud",
  "createAccountTitle": "Create your GymBud account",
  "email": "Email address",
  "password": "Password",
  "confirmPassword": "Confirm password",
  "createAccount": "Create Account",
  "signIn": "Sign In",
  "haveAccount": "Already have an account? Sign in",
  "needAccount": "Don't have an account? Sign up",
  "forgotPassword": "Forgot password?",
  "passwordMismatch": "Passwords do not match",
  "verify": {
    "title": "Verify your email",
    "enterEmail": "Enter your email address to receive a verification code",
    "instruction": "Enter the 6-digit code sent to",
    "sendCode": "Send Code",
    "enterComplete": "Please enter the complete 6-digit code",
    "invalidCode": "Invalid or expired code",
    "resend": "Resend code",
    "resendIn": "Resend in {{seconds}}s",
    "tooManyResends": "Too many resend attempts. Please try again later.",
    "changeEmail": "Change email address"
  },
  "passwordReset": {
    "title": "Reset your password",
    "enterEmail": "Enter your email address to receive a password reset link",
    "instruction": "Enter the email address associated with your account",
    "sendLink": "Send Link",
    "enterComplete": "Please enter the complete password reset link",
    "invalidLink": "Invalid or expired link",
    "reset": "Reset Password",
    "resetIn": "Reset in {{seconds}}s",
    "tooManyResets": "Too many reset attempts. Please try again later.",
    "changePassword": "Change password"
  }
}
```

**Portuguese Brazil (`pt-BR/auth.json`)**:
```json
{
  "signInTitle": "Entre no GymBud",
  "createAccountTitle": "Crie sua conta GymBud",
  "email": "Endereço de email",
  "password": "Senha",
  "confirmPassword": "Confirmar senha",
  "createAccount": "Criar Conta",
  "signIn": "Entrar",
  "haveAccount": "Já tem uma conta? Entre",
  "needAccount": "Não tem uma conta? Cadastre-se",
  "forgotPassword": "Esqueceu a senha?",
  "passwordMismatch": "As senhas não coincidem",
  "verify": {
    "title": "Verifique seu email",
    "enterEmail": "Digite seu endereço de email para receber um código de verificação",
    "instruction": "Digite o código de 6 dígitos enviado para",
    "sendCode": "Enviar Código",
    "enterComplete": "Digite o código completo de 6 dígitos",
    "invalidCode": "Código inválido ou expirado",
    "resend": "Reenviar código",
    "resendIn": "Reenviar em {{seconds}}s",
    "tooManyResends": "Muitas tentativas de reenvio. Tente novamente mais tarde.",
    "changeEmail": "Alterar endereço de email"
  },
  "passwordReset": {
    "title": "Redefina sua senha",
    "enterEmail": "Digite seu endereço de email para receber um link de redefinição de senha",
    "instruction": "Digite o endereço de email associado à sua conta",
    "sendLink": "Enviar Link",
    "enterComplete": "Digite o link completo de redefinição de senha",
    "invalidLink": "Link inválido ou expirado",
    "reset": "Redefinir Senha",
    "resetIn": "Redefinir em {{seconds}}s",
    "tooManyResets": "Muitas tentativas de redefinição. Tente novamente mais tarde.",
    "changePassword": "Alterar senha"
  }
}
```

### **OTP Verification Features**:
- **6-Digit Input**: Individual digit inputs with auto-focus progression and paste support
- **Resend Logic**: 60-second cooldown with visual countdown timer and rate limiting (max 5 attempts)
- **Email Management**: Change email functionality and query parameter support
- **Auto-Submit**: Automatic verification when all digits are entered
- **Error Handling**: Clear invalid/expired code messages with input reset
- **Telemetry Integration**: Comprehensive tracking for OTP events (sent, attempted, succeeded, failed)

{{ ... }}
