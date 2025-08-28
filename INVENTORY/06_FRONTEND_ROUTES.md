# GymBud v2 - Frontend Routes & Architecture

## Overview
Progressive Web Application (PWA) built with Vite + React using `wouter` for client-side routing with offline-first capabilities and comprehensive sync engine.

## Recent Updates (2025-08-28 16:14)
- **Settings Store Implementation**: Complete settings persistence system with offline-first architecture
  - **SettingsProvider**: React context providing app-wide settings access via `useSettings()` hook
  - **Offline Cache**: Dexie `settings` table with single-row KV storage for immediate persistence
  - **Cloud Sync**: Supabase Auth user_metadata integration with reconciliation logic on boot/signin
  - **Auto-Save**: Settings changes immediately persist locally + background cloud sync with toast notifications
  - **Side Effects**: Automatic i18n language switching, units context for Session/Stats components
- **SettingsPage Enhancement**: Replaced manual save workflow with real-time auto-save settings
  - **Select Components**: Proper shadcn/ui Select dropdowns for language and units selection
  - **Notifications Toggle**: Opt-in preference for future notifications milestone (no permission request yet)
  - **Sync Indicators**: Visual feedback when settings are syncing to cloud with "Saved" confirmations
  - **Error Handling**: Toast notifications for cloud sync failures with graceful offline fallbacks

## Previous Updates (2025-08-28 15:51)
- **Telemetry System Integration**: Added comprehensive sync event tracking with developer UI
- **Settings Page Enhancement**: Added developer mode toggle and sync events log component
  - `SyncEventsLog` component displays last 10 sync events with real-time updates
  - Developer mode toggle to show/hide debug information using `useLiveQuery` from Dexie
  - Enhanced settings translations for sync event UI (EN/PT-BR)
- **Sync Queue Telemetry**: Integrated telemetry tracking into sync operations
  - Success/failure tracking with item counts and error codes
  - Maintains existing `addSyncEvent` system alongside new typed telemetry
- **Set Void Tracking**: Enhanced undo functionality with comprehensive telemetry
  - `set_void_started` when user taps undo button
  - `set_void_confirmed` when server acknowledges void operation
  - Covers both E1 (pending removal) and E2 (durable void) scenarios
- **Type-Safe Telemetry**: Added `TelemetryEventType` union with IndexedDB integration
  - Automatic storage of sync/void events in `sync_events` table
  - Backward compatibility with existing class-based telemetry system

## Route Structure

### Marketing Routes (/)
- **`/`** - Landing page with all marketing sections
- **`/how-it-works`** - Scrolls to How It Works section
- **`/programs`** - Scrolls to Programs section  
- **`/pricing`** - Scrolls to Pricing section
- **`/faq`** - Scrolls to FAQ section

### App Routes (/app/*)
- **`/app/auth/:mode?`** - Authentication (signin, signup, reset)
- **`/app/auth/verify`** - **Email OTP verification with 6-digit code input, resend functionality, and 60s cooldown**
  - **UI Components**: Six individual digit inputs with auto-focus progression, resend button with countdown timer
  - **Flow Integration**: Auto-redirect from signup success and unconfirmed signin attempts
  - **Rate Limiting**: Maximum 5 resend attempts per session with 60-second cooldown between requests
  - **Email Management**: Change email functionality and email validation with query parameter support
  - **Auto-Resend**: Automatic OTP resend on page mount for fresh verification codes
  - **Telemetry**: Comprehensive tracking (otp_sent, verify_attempted, verify_succeeded/failed)
  - **i18n**: Complete EN/PT-BR localization including dynamic countdown messages
- **`/app/auth/reset`** - **Password reset with request and update flows**
  - **UI Components**: Request form with email input, update form with password and confirm password inputs
  - **Token Detection**: Automatic mode switching based on URL parameters from Supabase email links
  - **Security Integration**: Rate limiting, cooldown timers, and comprehensive error handling
- **`/app/onboarding`** - 12-step onboarding wizard for profile setup and plan generation
- **`/app/home`** - Dashboard with today's session and recent activity
- **`/app/session/:id?`** - **Session runner with comprehensive set-by-set workout logging interface**
  - **UI Components**: Header progress bar, exercise focus card, set logging strip, hero rest timer
  - **Data Integration**: useSessionData hook with offline-first session management via v_session_exercises_enriched
  - **Set Logging**: Real-time logging with reps, weight, RPE (1-10 scale), automatic queue sync via sync-logged-sets
  - **Rest Timer**: Prescribed vs actual time tracking, skip/add 30s controls, visual countdown with completion alerts
  - **Exercise Navigation**: Previous/Next exercise flow with upcoming exercise preview, finish workout functionality
  - **Session Management**: Automatic status transitions (pending→active→completed) with timestamps
  - **Telemetry**: Comprehensive event logging (set_logged, session_started, rest_started, exercise_advanced)
  - **Offline-First**: Immediate IndexedDB storage with background sync to Supabase via mutation queue
- **`/app/history`** - Workout history listing with search/filters
- **`/app/history/:id`** - Detailed view of completed session
- **`/app/*`** - Catch-all 404 page

### Onboarding Routes (/app/onboarding/*)
- **`/app/onboarding/biometrics`** — Step 1: identity & biometrics (first/last name, height, weight, BF%, RHR, birthdate)
- **`/app/onboarding/goals`** — Step 2: goal + coach tone (auto), schedule (days/week + windows), environment (auto equipment; home_basic picker)
- **`/app/onboarding/profile`** — Step 3: experience, confidence sliders, constraints, warm-up/mobility, rest preference, intensity style
- **`/app/onboarding/review`** — Step 4: review + create plan (calls plan-get-or-create EF)

## Component Architecture

### App Shell Structure
```
AppShell.tsx (Main app wrapper with GradientLayout)
├── TanStack Query Client (with persistence disabled for build compatibility)
├── SettingsProvider (app-wide settings context with offline cache + cloud sync)
├── Supabase Auth Provider
├── Sync Engine Integration
├── Offline Indicator
├── Conflict Banner
├── AuthGuard (route protection)
└── Route Components (all using AuthPage-style design with geometric teal gradients)
    ├── AuthPage.tsx (glassmorphic form with gradient background) - named export ✓
    ├── OnboardingPage.tsx (12-step wizard for profile setup)
    ├── HomePage.tsx (single centered card with session summary, no scrolling) - named export ✓
    ├── SessionPage.tsx (single card session runner with timer, fits one screen) - named export ✓
    ├── HistoryPage.tsx (single card workout history with stats, no scrolling) - named export ✓
    ├── HistoryDetailPage.tsx (session detail view) - named export
    ├── StatsPage.tsx (training analytics with charts, streaks, and social sharing) - named export
    ├── SettingsPage.tsx (auto-save settings with real-time sync, fits one screen) - named export ✓
    └── NotFoundPage.tsx (404 fallback) - named export
```

### Component Export Pattern
All page components now use dual export structure:
```typescript
// Component definition
function ComponentName() { /* ... */ }

// Dual exports for maximum compatibility
export { ComponentName as default }  // Default export
export { ComponentName }             // Named export for AppShell
```

### Auth Flow Implementation (Email OTP)
- **AuthPage**: Enhanced with password confirmation for signup mode and unconfirmed user detection
  - **Signup Flow**: Email + password + confirm password → redirect to /app/auth/verify with email parameter
  - **Signin Flow**: Detects unconfirmed users (email_confirmed_at missing) → redirect to verify page
  - **Password Validation**: Real-time password matching with disabled submit until passwords match
  - **Mode Switching**: Clear form state when switching between signin/signup modes
  - **Telemetry**: Track signup attempts, successes, failures, and unconfirmed redirects
- **VerifyPage**: Complete OTP verification interface with comprehensive UX
  - **6-Digit Input**: Individual digit inputs with paste support, auto-focus, and backspace navigation
  - **Resend Logic**: 60-second cooldown with visual countdown, maximum 5 attempts per session
  - **Auto-Submit**: Automatic verification when all 6 digits are entered
  - **Email Flexibility**: Support for email parameter, query string, or manual entry
  - **Error Handling**: Clear invalid/expired code messages with input reset and focus
  - **Success Routing**: Automatic redirect based on user plan status (home vs onboarding)

## Type Safety Improvements
- **SessionPage**: Renamed `Set` interface to `WorkoutSet` to avoid collision with built-in JavaScript Set type
- **Type Indexing**: Fixed `updateSet` function to use `keyof WorkoutSet` for proper type safety
- **Legacy Function Removal**: Eliminated `handleSetComplete` and `handleSetChange` functions that used unsafe string indexing
- **Import Alignment**: All AppShell imports now match component exports exactly

## Design System Components
- **Geometric Teal Gradient Background**: Consistent across all app pages using `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`
- **Diagonal Clipped Sections**: Subtle lighter teal curved sections with `clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)'`
- **Single Centered Card Layout**: All pages use `max-w-md` centered cards that fit on one screen without scrolling
- **Glass Morphism Cards**: Semi-transparent cards with `bg-white/10 backdrop-blur-xl` and `shadow-2xl ring-1 ring-white/20`
- **BottomNav Integration**: Consistent bottom navigation bar with `fixed bottom-0 z-50` positioning and `pb-20` page padding to prevent overlap
- **Compact UI Elements**: Streamlined components designed to fit single-screen constraint with efficient space usage
- **Interactive Elements**: Toggle switches, category buttons, search inputs with consistent teal gradient active states

## PWA Infrastructure
- **Service Worker**: Precaches app shell, stale-while-revalidate for API calls
- **Manifest**: Installable PWA with shortcuts for session start and history, version-based cache busting for icons
- **Update System**: Toast notifications for app updates with version information and manual update checks
- **Install Prompts**: `beforeinstallprompt` listener with dismissible banner and Settings integration
- **Version Management**: Build-time version injection from git SHA or timestamp with display in Settings
- **Offline Ready**: Toast notification when app is ready for offline use
- **Dynamic Import**: PWA register module loaded conditionally to prevent development build errors
- **Type Declarations**: Custom TypeScript definitions in `src/types/pwa.d.ts` for virtual:pwa-register module
- **Cross-platform**: Works on desktop and mobile with native app-like experience

## Toast Notification System
- **Library**: Sonner with custom styling (rounded-2xl, top-center positioning, 4s duration)
- **PWA Integration**: Update available, offline ready notifications
- **Sync Feedback**: Success/failure toasts for data synchronization with detailed messages
- **i18n Support**: All toast messages fully localized in EN + PT-BR
- **Provider**: Global Toasts provider wrapping entire app for consistent styling

## Offline-First Data Flow
User Action → IndexedDB (immediate) → Mutation Queue → Sync Engine → Supabase
                     ↓                                      ↓
              UI Updates (optimistic)              Delta Pulls (bidirectional)

## Sync Engine Architecture (Phase A Complete)
- **Push Mutations**: Queue-based replay system with idempotency and backoff
  - Entities: logged_sets, sessions, session_exercises, coach_audit
  - Push: sync-logged-sets, sync-sessions, sync-session-exercises, sync-coach-audit
  - Pull: pull-updates (delta reads)
- **Pull Updates**: Delta reads with watermark tracking and safe merge
  - Edge Function: pull-updates with RLS enforcement
  - Watermark: logged_sets uses created_at as the delta watermark (append-only)
  - Triggers: app start, post-flush, manual sync
  - Conflict Resolution: Skip merge if local mutations pending
- **Cross-tab Coordination**: BroadcastChannel for sync events
- **Error Handling**: Structured error codes with user-friendly messages
- **Telemetry**: sync_events logging for debugging and analytics

## UX Components

### Offline Indicators
- **OfflineBanner**: Global offline status banner with manual sync trigger using `useOnlineStatus` hook
- **OfflineIndicator**: Fixed bottom-right network status indicator with retry button
- **ConflictBanner**: Data conflict resolution UI with placeholder for future conflict handling
- **AppHeader**: Navigation with user menu, sign out, and responsive design

### Utility Hooks
- **useOnlineStatus**: Custom hook for real-time network connectivity detection using browser online/offline events
- **useHistory**: Offline-first history data with background sync and local filtering
- **useHistoryDetail**: Individual session details with telemetry integration

### Form Patterns
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Validation**: Client-side validation with server-side confirmation
- **Loading States**: Skeleton loaders and progress indicators

## SEO & Meta Tags

### HTML Head Structure
- **Title**: Dynamic based on route
- **Meta Description**: Marketing-focused description
- **Open Graph**: Social media sharing optimization
- **Twitter Cards**: Twitter-specific meta tags
- **JSON-LD**: Structured data for search engines
- **Canonical**: Self-referencing canonical URLs

### Sitemap & Robots
- **`/public/sitemap.xml`**: Static sitemap with marketing routes
- **`/public/robots.txt`**: Search engine directives

## Deployment Configuration

### Vercel Setup (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Environment Variables
- **`VITE_APP_URL`**: App subdomain URL for CTAs
- **`VITE_SITE_URL`**: Marketing site URL (fallback)

## Internationalization Integration
- **Route Persistence**: Language selection persists across navigation
- **Content**: All text content via `react-i18next` namespaces
- **Fallback**: EN content for missing PT-BR translations
- **HTML Attributes**: Automatic `lang` and `dir` synchronization

## Performance Optimizations
- **Code Splitting**: Lazy loading for future app routes
- **Image Optimization**: Responsive images and proper formats
- **Bundle Size**: Tree-shaking and minimal dependencies
- **Caching**: Static asset caching via Vercel

## Development Workflow
- **Hot Reload**: Vite development server with instant updates
- **Type Safety**: Full TypeScript coverage with proper environment variable declarations
- **Linting**: ESLint + Prettier for code consistency
- **Build**: Production-ready builds via `pnpm build` with TypeScript compilation
- **Component Library**: Complete shadcn/ui integration with Radix UI primitives

## Component Library (shadcn/ui)
- **Input**: Text input with proper styling and focus states
- **Badge**: Variant-based badges (default, secondary, destructive, outline)
- **Card**: Complete card system (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- **Label**: Accessible form labels with Radix UI integration
- **Textarea**: Multi-line text input with consistent styling
- **Switch**: Toggle switches for settings and preferences
- **Alert**: Alert messages with title and description variants
- **Button**: Already implemented with multiple variants and sizes
- **Dropdown Menu**: Navigation and action menus

## TypeScript Configuration
- **Environment Variables**: Proper `import.meta.env` declarations in `vite-env.d.ts`
- **Strict Mode**: Full type checking with no implicit any
- **Event Handlers**: Proper `React.ChangeEvent<T>` type annotations
- **Component Props**: Interface definitions for all custom components
- **Service Worker**: Type assertions for experimental APIs

## Future Considerations
- **App Integration**: Seamless handoff to app.gymbud.ai
- **Analytics**: User behavior tracking integration
- **A/B Testing**: Component-level testing capabilities
- **CMS Integration**: Content management for marketing copy

## App Routes (`/app/*`)

### Main Navigation
- **`/`** - HomePage (dashboard with today's plan, quick stats, next session preview)
- **`/session/:id`** - SessionPage (workout execution with timer, set logging, exercise progression)
- **`/history`** - HistoryPage (past sessions list with filters and search)
- **`/history/:id`** - HistoryDetailPage (individual session review with metrics)
- **`/stats`** - StatsPage (progress analytics with charts, streaks, and social sharing)
  - **Data Sources**: useSessionMetrics (Dexie + v_session_metrics), useProfileData (profiles + weight_logs)
  - **Offline-First**: Immediate IndexedDB data with background Supabase sync
  - **Features**: Real-time charts, social sharing, streak calculation, empty states
- **`/settings`** - SettingsPage (account, preferences, sync status, data management)
  - **Layout**: AuthPage-style geometric teal gradient background with single centered card
  - **Settings Persistence**: Real-time auto-save with SettingsProvider context integration
    - **Language Selection**: Select dropdown with immediate i18n switching (English/Português)
    - **Units Selection**: Metric/Imperial toggle with context availability for Session/Stats
    - **Notifications**: Opt-in toggle for future notifications milestone (stores preference only)
    - **Auto-Save**: No manual save button - changes persist immediately with "Saved" toast confirmations
    - **Cloud Sync**: Background synchronization to Supabase Auth user_metadata with error handling
  - **Developer Mode**: Toggle to show/hide sync events log and conflict resolution for debugging
    - **SyncEventsLog Component**: Real-time display of last 10 sync events with timestamps
    - **Event Types**: Shows sync_success, sync_failure, set_void_started, set_void_confirmed events
    - **Live Updates**: Uses `useLiveQuery` for real-time event monitoring from IndexedDB
  - **Sync Integration**: Live pending mutations count and sync status display with manual sync trigger
  - **Dead-Letter Queue Panel**: Failed sync mutations management (developer mode only)
    - Real-time failed mutations list with entity/operation details
    - Error classification with human-readable labels and attempt counts
    - Individual retry/delete actions for specific mutations
    - Bulk operations: "Retry all" and "Delete all" failed mutations
    - Contextual error display with timestamps and failure reasons
  - **Conflicts Panel**: Sync conflict resolution interface (developer mode only)
    - Real-time conflicts list with entity details and field-level diff tables
    - Visual conflict badges and timestamp display for conflict age tracking
    - Resolution actions: "Keep mine (override)" and "Keep server" with automatic cleanup
    - Responsive design with mobile-friendly button layout and proper accessibility
    - Comprehensive telemetry tracking for conflict resolution outcomes
  - **Glass Morphism**: Semi-transparent card with backdrop blur effect
  - **Bottom Padding**: `pb-20` to prevent BottomNav overlap
  - **BottomNav**: Integrated with Settings tab active state

### Debug Tools (Settings → Developer Mode)
- **Sync Events Log** - Real-time sync operation history
- **Dead-Letter Queue Panel** - Failed sync mutations management
  - Failed mutations browser with error details
  - Manual retry capabilities for individual or bulk operations
  - Mutation deletion for unrecoverable failures
  - Comprehensive error classification and user-friendly labels
- **Conflicts Panel** - Sync conflict resolution interface
  - Real-time conflicts detection and display with field-level diffs
  - User-driven resolution with "Keep mine" (override) and "Keep server" options
  - Automatic conflict cleanup and telemetry tracking for resolution outcomes
  - Visual indicators for conflict age and decision requirements

### Onboarding System
- **OnboardingWizard** - 12-step guided setup process
  - Profile information (name, age, gender, biometrics)
  - Fitness goals and experience level
  - Schedule preferences and equipment availability
  - Workout and diet preferences
  - Progress tracking setup and motivation factors
  - Account finalization and plan generation

### Specialized Components
- **Chart Components** - Reusable analytics charts (TrainingDaysBar, VolumeSetsCombo, WeightProgression)
- **StatsShareCard** - Social sharing with PNG export functionality
- **LanguageSwitcher** - Global language toggle with persistence

## Navigation Patterns

### Bottom Navigation
- **Home** (`/app`) - Dashboard and today's plan
- **Session** (`/app/session`) - Active workout runner
- **History** (`/app/history`) - Past workout sessions
- **Stats** (`/app/stats`) - Progress analytics and charts
- **Settings** (`/app/settings`) - Account and app preferences

### Authentication Flow
1. **Landing** → **AuthPage** (signin/signup)
2. **Signup** → **VerifyPage** (email confirmation)
3. **Verification Success** → **OnboardingWizard** (new users) or **HomePage** (existing)
4. **Password Reset** → **ResetPasswordPage** → **AuthPage**

### Onboarding Flow
1. **Profile Setup** (4 steps) → **Plan Generation** → **HomePage**
2. Automatic plan creation via `plan-get-or-create` Edge Function
3. Seamless transition to active training plans

## Developer Features

### Debug Tools (Settings → Developer Mode)
- **Sync Events Log** - Real-time sync operation history
- **Dead-Letter Queue Panel** - Failed sync mutations management
  - Failed mutations browser with error details
  - Manual retry capabilities for individual or bulk operations
  - Mutation deletion for unrecoverable failures
  - Comprehensive error classification and user-friendly labels
- **Conflicts Panel** - Sync conflict resolution interface
  - Real-time conflicts detection and display with field-level diffs
  - User-driven resolution with "Keep mine" (override) and "Keep server" options
  - Automatic conflict cleanup and telemetry tracking for resolution outcomes
  - Visual indicators for conflict age and decision requirements

### Telemetry Integration
- Comprehensive event tracking for sync operations, authentication flows, and user interactions
- Privacy-safe logging with domain-only tracking and no PII exposure
- Real-time debugging capabilities for offline-first sync system

## i18n Coverage
- **Complete EN/PT-BR localization** for all routes and components
- **Namespace structure**: 14 translation files per language
- **Context-aware translations** including developer UI strings
- **Cultural adaptation** for Brazilian Portuguese conventions

## PWA Features
- **Offline-first architecture** with IndexedDB storage
- **Service Worker** with precaching and stale-while-revalidate strategies
- **Installable app** with proper manifest and icon configuration
- **Background sync** with mutation queue and conflict resolution
