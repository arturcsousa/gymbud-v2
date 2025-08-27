# GymBud v2 - Frontend Routes & Architecture

## Overview
Progressive Web Application (PWA) built with Vite + React using `wouter` for client-side routing with offline-first capabilities and comprehensive sync engine.

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
- **`/app/session/:id?`** - Session runner with workout logging interface and timer
- **`/app/history`** - Workout history listing with search/filters
- **`/app/history/:id`** - Detailed view of completed session
- **`/app/library`** - Exercise database with search and categories
- **`/app/settings`** - Account management and preferences
- **`/app/*`** - Catch-all 404 page

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
└── Route Components (all using onboarding-style design)
    ├── AuthPage.tsx (glassmorphic form with gradient background) - named export ✓
    ├── OnboardingPage.tsx (12-step wizard for profile setup)
    ├── HomePage.tsx (dashboard with glassmorphic cards and session summary) - named export ✓
    ├── SessionPage.tsx (session runner with progress bar, timer, and exercise cards) - named export ✓
    ├── HistoryPage.tsx (workout history with stats summary and session cards) - named export ✓
    ├── HistoryDetailPage.tsx (session detail view) - named export
    ├── LibraryPage.tsx (exercise database with search, filters, and interactive cards) - named export ✓
    ├── SettingsPage.tsx (organized sections with toggle switches and preferences) - named export ✓
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

### Type Safety Improvements
- **SessionPage**: Renamed `Set` interface to `WorkoutSet` to avoid collision with built-in JavaScript Set type
- **Type Indexing**: Fixed `updateSet` function to use `keyof WorkoutSet` for proper type safety
- **Legacy Function Removal**: Eliminated `handleSetComplete` and `handleSetChange` functions that used unsafe string indexing
- **Import Alignment**: All AppShell imports now match component exports exactly

### Design System Components
- **GradientLayout**: Main container with gradient background (#005870 to #0C8F93 to #18C7B6)
- **ContentLayout**: Page wrapper with title, navigation bar, and scrollable content area
- **Glassmorphic Cards**: Semi-transparent cards with backdrop blur and subtle shadows
- **Navigation Bar**: Back/next buttons with gradient styling and smooth transitions
- **Interactive Elements**: Toggle switches, category buttons, search inputs with consistent styling

### PWA Infrastructure
- **Service Worker**: Precaches app shell, stale-while-revalidate for API calls
- **Manifest**: Installable PWA with shortcuts for session start and history
- **Update System**: Toast notifications for app updates with auto-refresh capability
- **Offline Ready**: Toast notification when app is ready for offline use
- **Dynamic Import**: PWA register module loaded conditionally to prevent development build errors
- **Cross-platform**: Works on desktop and mobile with native app-like experience

### Toast Notification System
- **Library**: Sonner with custom styling (rounded-2xl, top-center positioning, 4s duration)
- **PWA Integration**: Update available, offline ready notifications
- **Sync Feedback**: Success/failure toasts for data synchronization with detailed messages
- **i18n Support**: All toast messages fully localized in EN + PT-BR
- **Provider**: Global Toasts provider wrapping entire app for consistent styling

### Offline-First Data Flow
```
User Action → IndexedDB (immediate) → Mutation Queue → Sync Engine → Supabase
                     ↓
              UI Updates (optimistic)
```

### Authentication Flow
- **Route**: `/auth`
- **Component**: `AuthPage`
- **UI**: Supabase Auth UI component (`@supabase/auth-ui-react`) with custom styling
- **Features**:
  - Email/password signup and signin
  - Magic link support
  - Internationalization (EN/PT-BR) with LanguageSwitcher in header
  - Glassmorphic design with gradient background and decorative blobs
  - Custom brand colors (#18C7B6) overriding default Supabase styling
  - Auth state subscription with proper cleanup
- **Post-Auth Flow**:
  1. `onAuthStateChange` detects `SIGNED_IN` event
  2. Calls `finalizeOnboarding()` with default plan seed
  3. Creates/activates plan via `plan-get-or-create` Edge Function
  4. Sets `assessment_required = false` for instant access
  5. Navigates to `/app/session/today` using `window.location.href`

## Technical Implementation
- **Auth State**: Uses `{ data: { subscription } } = supabase.auth.onAuthStateChange(...)`
- **Cleanup**: Proper `subscription.unsubscribe()` in useEffect cleanup
- **Mutex**: `ranRef` prevents duplicate `finalizeOnboarding` calls
- **Error Handling**: Non-blocking profile updates with console logging
- **Navigation**: `window.location.href` for reliable post-auth redirect (avoids React hooks violations)
- **Custom Styling**: Inline CSS overrides for Supabase Auth UI components

## App Routes
- **Route**: `/app/session/today`
- **Purpose**: Main workout session interface
- **Access**: Requires authenticated user with active plan
- **State**: Can show "preparing..." until session data loads

## Navigation Patterns
- **Auth → App**: Automatic redirect after successful authentication
- **Error Recovery**: React hooks error #321 resolved by removing `useLocation` from async functions
- **Reliable Navigation**: Direct `window.location.href` ensures navigation works regardless of React context

## URL Architecture

### Domain Separation
- **gymbud.ai** - Marketing landing page (separate Vercel project)
  - Landing page, pricing, features, blog
  - CTA buttons link to app.gymbud.ai for signup/login
- **app.gymbud.ai** - PWA application (this project)
  - Authentication, onboarding, workout sessions
  - Offline-first Progressive Web App
  - All user data and functionality

### Environment Variables
```bash
# Current project (app.gymbud.ai)
VITE_APP_URL=https://app.gymbud.ai      # This PWA application
VITE_SITE_URL=https://gymbud.ai         # Marketing site (external)
VITE_SUPABASE_URL=https://lrcrmmquuwphxispctgq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...           # Full key in .env.local
```

### Deployment Strategy
- **Marketing Site**: Separate repository deployed to gymbud.ai
- **PWA Application**: This repository deployed to app.gymbud.ai
- **Cross-linking**: Marketing CTAs → app.gymbud.ai, App settings → gymbud.ai

### Domain Detection Logic
```typescript
// App.tsx - Fixed domain routing for Vercel deployments
const isAppDomain = window.location.hostname === 'app.gymbud.ai' || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname.startsWith('gymbud-v2-') ||
                   window.location.hostname.includes('-arturcsousa.vercel.app');
```

### PWA Manifest Configuration
- **Icon Paths**: Fixed to use absolute paths (`/icons/icon-192.png`)
- **Theme Colors**: Updated to GymBud brand colors (#005870)
- **Shortcuts**: Configured for session start and history access
- **Display Mode**: Standalone PWA with portrait orientation

## Data Layer Architecture

### IndexedDB Schema (Dexie)
```typescript
// Database tables with versioned schema (v2)
meta: { key, value, updated_at }
sync_events: { id?, ts, kind: 'success'|'failure', code?, items? }
queue_mutations: { id, entity, op, payload, user_id, idempotency_key, status, retries, next_attempt_at, created_at, updated_at }
sessions: { id, user_id, plan_id, status, started_at, completed_at, notes, updated_at }
session_exercises: { id, session_id, exercise_name, order_index, updated_at }
logged_sets: { id, session_exercise_id, set_number, reps, weight, rpe, notes, updated_at }
```

### Sync Engine Features
- **Queue Management**: FIFO mutation replay with retry logic and exponential backoff
- **Server Integration**: Real Supabase Edge Function calls for app2.logged_sets inserts
- **Error Mapping**: Standardized error codes (auth_missing, rls_denied, invalid_payload, network_offline, rate_limited, server_unavailable, timeout, unknown)
- **Sync Telemetry**: Persistent sync status tracking in meta table with event history capped to last 50
- **Idempotency**: Conflict-free upserts using queue mutation ID as primary key
- **RLS Compliance**: End-user JWT authentication for proper Row Level Security
- **Network Awareness**: Automatic sync on connectivity changes and manual triggers
- **Background Sync**: Service worker background sync registration
- **Error Handling**: Structured response validation with proper error codes and user-friendly messages
- **Cross-tab Coordination**: BroadcastChannel for single-flight sync processing with live query updates

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
