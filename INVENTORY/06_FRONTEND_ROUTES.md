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
AppShell.tsx (Main app wrapper)
├── TanStack Query Client (with persistence)
├── Supabase Auth Provider
├── Sync Engine Integration
├── Offline Indicator
├── Conflict Banner
├── AuthGuard (route protection)
├── AppHeader (navigation + user menu)
└── Route Components
    ├── AuthPage.tsx (signin/signup/reset flows)
    ├── OnboardingPage.tsx (12-step wizard for profile setup)
    ├── HomePage.tsx (dashboard with session summary)
    ├── SessionPage.tsx (session runner with workout logging and timer)
    ├── HistoryPage.tsx (workout history listing)
    ├── HistoryDetailPage.tsx (session detail view)
    ├── LibraryPage.tsx (exercise database)
    ├── SettingsPage.tsx (account management)
    └── NotFoundPage.tsx (404 fallback)
```

### PWA Infrastructure
- **Service Worker**: VitePWA plugin with Workbox caching strategies
- **Manifest**: `/public/manifest.webmanifest` with app metadata and shortcuts
- **IndexedDB**: Dexie-based offline data layer with versioned schema
- **Sync Engine**: Queue-based mutation replay with conflict resolution
- **Update Handling**: Service worker update prompts in main.tsx

### Offline-First Data Flow
```
User Action → IndexedDB (immediate) → Mutation Queue → Sync Engine → Supabase
                     ↓
              UI Updates (optimistic)
```

### Authentication Flow
- **Supabase Auth**: JWT-based authentication with session persistence
- **Offline Tolerance**: Auth state cached in IndexedDB for offline access
- **Route Protection**: AuthGuard component redirects unauthenticated users
- **Session Management**: Automatic token refresh and logout handling

## Data Layer Architecture

### IndexedDB Schema (Dexie)
```typescript
// Database tables with versioned schema
profiles: { id, user_id, name, email, created_at, updated_at }
plans: { id, user_id, name, description, created_at, updated_at }
sessions: { id, user_id, plan_id, status, started_at, completed_at, notes }
session_exercises: { id, session_id, exercise_name, order_index }
logged_sets: { id, session_exercise_id, set_number, reps, weight, rpe, notes }
mutation_queue: { id, table_name, operation, data, user_id, created_at }
```

### Sync Engine Features
- **Queue Management**: FIFO mutation replay with retry logic
- **Conflict Resolution**: Last-write-wins with server precedence
- **Network Awareness**: Automatic sync on connectivity changes
- **Background Sync**: Service worker background sync registration
- **Error Handling**: Exponential backoff and auth error detection

## UX Components

### Offline Indicators
- **OfflineIndicator**: Network status, sync progress, pending mutations
- **ConflictBanner**: Data conflict resolution UI with merge options
- **AppHeader**: Navigation with user menu and sign out

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
