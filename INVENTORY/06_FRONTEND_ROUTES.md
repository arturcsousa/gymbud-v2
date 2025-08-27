# GymBud v2 - Frontend Routes & Architecture

## Overview
Progressive Web Application (PWA) built with Vite + React using `wouter` for client-side routing with offline-first capabilities and comprehensive sync engine.

## Recent Updates (2025-08-27 18:05)
- **TypeScript Build Fixes**: Resolved all compilation errors preventing successful builds
- **Onboarding Components**: Enhanced ProfilePage and ReviewPage with proper TypeScript types
- **UI Components**: Added missing Radix UI Slider component for confidence ratings
- **Export Structure**: Fixed duplicate export declarations across onboarding pages
- **Type Safety**: Improved form validation and event handler typing throughout onboarding flow

## Route Structure

### Marketing Routes (/)
- **`/`** - Landing page with all marketing sections
- **`/how-it-works`** - Scrolls to How It Works section
- **`/programs`** - Scrolls to Programs section  
- **`/pricing`** - Scrolls to Pricing section
- **`/faq`** - Scrolls to FAQ section

### App Routes (/app/*)
- **`/app/auth/:mode?`** - Authentication (signin, signup, reset)
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
    ├── SettingsPage.tsx (single card streamlined settings, fits one screen) - named export ✓
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

### Session Runner Implementation (Phase E1 + E2)
- **SessionPage**: Complete rebuild with comprehensive workout logging interface and durable undo
  - **Header**: Exercise progress (X of Y) with workout timer and progress bar
  - **Exercise Card**: Exercise name, prescription details (sets, reps, rest), warmup/work badges, instructions modal
  - **Set Logging Strip**: Single active set with reps/weight/RPE inputs, "Log Set" button, set completion tracking
  - **Durable Undo**: Enhanced "Undo Last Set" functionality with dual behavior
    - **Pending sets**: Remove from queue immediately (E1 behavior)
    - **Synced sets**: Enqueue void mutation, optimistically mark as voided (E2 behavior)
    - Cancels active rest timer when undoing, returns UI to same set number
  - **Rest Timer**: Hero timer with prescribed time countdown, skip/add time controls, actual vs prescribed tracking
  - **Navigation**: Previous/Next exercise, finish workout, pause functionality
  - **Data Flow**: useSessionData hook → IndexedDB → mutation queue → sync-logged-sets Edge Function
  - **Void Support**: All selectors filter out `voided: true` sets from totals and metrics
  - **Error Handling**: Toast notifications for failures with offline fallbacks
  - **i18n**: Complete EN/PT-BR translation coverage including effort levels, accessibility, and undo operations
- **`/app/history`** - Workout history listing with search/filters
- **`/app/history/:id`** - Detailed view of completed session
- **`/app/*`** - Catch-all 404 page

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
- **`/stats`** - StatsPage (progress analytics with charts, social sharing, streak badges)
  - **Data Sources**: useSessionMetrics (Dexie + v_session_metrics), useProfileData (profiles + weight_logs)
  - **Offline-First**: Immediate IndexedDB data with background Supabase sync
  - **Features**: Real-time charts, social sharing, streak calculation, empty states
- **`/settings`** - SettingsPage (account, preferences, sync status, data management)

### Data Integration Architecture

#### StatsPage Real Data Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Dexie (Local) │    │  Supabase Views  │    │   StatsPage     │
│                 │    │                  │    │                 │
│ • sessions      │◄──►│ • v_session_     │◄──►│ • Real metrics  │
│ • logged_sets   │    │   metrics        │    │ • Live charts   │
│ • profiles      │    │ • profiles       │    │ • Offline ready │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Data Hooks
- **useSessionMetrics**: Session analytics with offline-first architecture
  - Queries: `sessions`, `session_exercises`, `logged_sets` from Dexie
  - Server: `v_session_metrics` view from Supabase
  - Calculations: Total sessions, volume, RPE, weekly data, streak
- **useProfileData**: Weight progression with localStorage caching
  - Queries: `profiles.weight_kg`, optional `weight_logs` table
  - Fallback: Single data point from current weight if no history

### `/settings` - SettingsPage
- **Layout**: AuthPage-style geometric teal gradient background with single centered card
- **Sections**: Account (email), Preferences (notifications, language, units), Sync status, About
- **Language Selection**: Dropdown interface using `common:languages.*` keys (English/Português)
- **Language Persistence**: Immediate application via `i18n.changeLanguage()` on settings save
- **Sync Integration**: Live pending mutations count and sync status display
- **Glass Morphism**: Semi-transparent card with backdrop blur effect
- **Bottom Padding**: `pb-20` to prevent BottomNav overlap
- **BottomNav**: Integrated with Settings tab active state
