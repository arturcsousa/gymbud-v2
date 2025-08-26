# CHANGELOG

## January 26, 2025 14:05 ET
**Completed** Database schema rebuild and documentation
- **DB Schema**: Created complete `INVENTORY/03_DB_SCHEMA.sql` with app2 tables, views, RLS policies, and comments
- **DB Documentation**: Added `INVENTORY/03_DB_NOTES.md` with table-by-table descriptions and architectural notes
- **Schema Execution**: Core app2 schema rebuilt directly in Supabase production database
- **RLS Security**: All tables secured with user-scoped Row Level Security policies
- **Views Added**: `v_session_exercises_enriched` and `v_session_metrics` for UI data consumption
- Context: Fresh database foundation ready for offline-first PWA with deterministic training engine
- Migrations: **IMPORTANT** - Regenerate CSV catalog files from Supabase to sync inventory documentation

## January 26, 2025 13:57 ET
**Fixed** TypeScript build errors and completed shadcn/ui component library
- **shadcn/ui Components**: Created missing UI components (Input, Badge, Card, Label, Textarea, Switch, Alert) with proper Radix UI integration
- **Environment Variables**: Added `vite-env.d.ts` with TypeScript declarations for `import.meta.env` access
- **Component Fixes**: Fixed LanguageSwitcher exports and translation key usage (`languages.en` vs `lang.en`)
- **Page Components**: Updated SessionPage, SettingsPage, LibraryPage with proper TypeScript types and event handlers
- **Sync Engine**: Fixed environment variable access and type assertions for service worker sync API
- **Dependencies**: Added missing Radix UI packages (@radix-ui/react-label, @radix-ui/react-switch) to package.json
- **Import Cleanup**: Removed unused imports and variables, added proper React.ChangeEvent type annotations
- Context: All TypeScript compilation errors resolved, PWA ready for development and testing
- Migrations: Run `npm install` to install new Radix UI dependencies

## January 26, 2025 13:20 ET
**Completed** GymBud Offline-First PWA Implementation
- **PWA Infrastructure**: Added VitePWA plugin with manifest, service worker registration, and update handling
- **IndexedDB Layer**: Implemented Dexie-based offline data layer with versioned schema for profiles, plans, sessions, exercises, and mutation queue
- **Sync Engine**: Built comprehensive sync system with queue replay, conflict resolution, exponential backoff, and network status management
- **Authentication**: Integrated Supabase auth with offline tolerance and session persistence
- **App Shell**: Created routing wrapper with TanStack Query persistence and offline-aware network modes
- **Core Pages**: Implemented Home, Session, History, Library, Settings, Auth, and NotFound pages with offline support
- **UX Components**: Added OfflineIndicator, ConflictBanner, AppHeader, AuthGuard with sync status and conflict resolution
- **i18n Integration**: Added complete app-specific translation keys for auth, session, history, library, settings namespaces
- **Service Worker**: Added PWA service worker registration with update prompts in main.tsx
- Context: Full offline-first PWA ready for production deployment with comprehensive sync capabilities
- Migrations: Environment variables for Supabase URL/key, PWA version, and sync interval required

## August 26, 2025 12:00 ET
**Redesigned** WhyDifferent and Programs sections to remove orange backgrounds.
- Updated: `WhyDifferent.tsx` - changed from orange background to deep teal with glassmorphic cards
- Updated: `Programs.tsx` - changed from orange background to gradient teal with white cards and colored borders
- Added: Proper translation key usage for all 6 features in WhyDifferent section
- Added: Decorative gradient elements and improved hover animations
- Context: Better visual hierarchy and readability while maintaining design cohesion
- Migrations: N/A (design improvements only)

## August 26, 2025 11:52 ET
**Redesigned** landing page to match provided design with exact color palette.
- Updated: Color palette to use exact design colors (#005870, #0C8F93, #18C7B6, #FF9F1C)
- Redesigned: `Hero.tsx` with curved gradient background, proper button styling, and full-height layout
- Redesigned: `HowItWorks.tsx` with person image placeholder on right and feature list on left
- Redesigned: `WhyDifferent.tsx` with orange background and colorful program cards layout
- Redesigned: `Programs.tsx` with carousel-style card layout and navigation arrows
- Redesigned: `Pricing.tsx` with simple white cards on teal background matching design
- Fixed: Removed unused PALETTE import from Hero.tsx to resolve TypeScript build error
- Context: Complete visual redesign to match provided mockup, maintaining all translation functionality
- Migrations: N/A (design changes only)

## August 26, 2025 11:46 ET
**Fixed** translation key issues across all marketing components.
- Fixed: `Progress.tsx` - replaced hardcoded English text with `landing:progress.metrics.*` keys
- Fixed: `Pricing.tsx` - replaced hardcoded plan data with `landing:pricing.plans.*` keys and added `most_popular` key
- Fixed: `WhyDifferent.tsx` - now displays all 6 features from locale files instead of just 3
- Fixed: `HowItWorks.tsx` - added missing progress step, now shows all 4 steps with proper grid layout
- Updated: Added `most_popular` translation key to both EN and PT-BR locale files
- Context: All components now properly use translation keys, ensuring full EN/PT-BR language support
- Migrations: N/A (translation fixes only)

## August 26, 2025 11:08 ET
**Reorganized** marketing structure with centralized theme utilities and anchor scrolling.
- New: `client/src/marketing/theme.ts` with PALETTE constants and ctaHref utility function
- Updated: `client/src/marketing/Landing.tsx` with anchor scrolling for route-to-section navigation
- New: `client/src/marketing/components/MobileCTA.tsx` using theme utilities and i18n
- Added: `client/src/index.css` glass and ring-faint utility classes for glassmorphic effects
- Updated: PATH_TO_ANCHOR mapping for /how-it-works, /programs, /pricing, /faq routes
- Context: Centralized styling system, improved navigation UX, consistent UTM tracking
- Migrations: Environment variable VITE_APP_URL for app subdomain targeting

## August 26, 2025 10:44 ET
**Redesigned** WhyDifferent section with dark-teal glassmorphic styling and neon accents.
- Updated: `client/src/marketing/sections/WhyDifferent.tsx` with cohesive dark-teal gradient backdrop
- Added: Glass cards with subtle blur, semi-transparent backgrounds, and neon accent borders
- Added: Color palette constants (deepTeal, teal, aqua, orange, paleOrange)
- Added: Decorative gradient blobs and enhanced animations
- Added: Interactive CTA buttons with UTM tracking to app subdomain
- Added: `client/src/index.css` neon-icon utility for hover effects
- Context: Modern glassmorphic design maintains existing i18n keys, improves visual hierarchy
- Migrations: N/A (styling enhancement only)

## August 26, 2025 10:06 ET
**Updated** inventory documentation with current implementation details.
- Updated: `INVENTORY/05_I18N_STRUCTURE.md` with HTML lang/dir sync, usage patterns, content status
- Updated: `INVENTORY/06_FRONTEND_ROUTES.md` with SPA structure, deployment config, SEO details
- Context: Documentation now reflects complete i18n setup, routing implementation, and Vercel deployment
- Migrations: N/A (documentation only)

## August 26, 2025 09:13 ET
**Fixed** TypeScript build errors preventing Vercel deployment.
- Fixed: Removed unused React import from `client/src/App.tsx`
- Fixed: Created missing `client/src/i18n/locales/en/auth.json` file
- Fixed: Replaced non-existent `Click` with `MousePointer` icon in `WhyDifferent.tsx`
- Context: Resolved all TypeScript compilation errors for successful deployment
- Migrations: N/A (build fixes only)

## August 25, 2025 21:20 ET
**Added** Vercel deployment configuration for production hosting.
- New: `vercel.json` with SPA routing, security headers, and build configuration
- Updated: `client/package.json` with vercel-build script and typecheck
- New: `.vercelignore` to exclude development files from deployment
- New: `client/.env.example` with environment variable documentation
- Context: Ready for production deployment on Vercel with proper SPA routing
- Migrations: Set VITE_SITE_URL in Vercel dashboard environment variables

## August 25, 2025 21:18 ET
**Added** HTML lang/dir attribute synchronization with i18n language changes.
- Updated: `client/src/i18n/index.ts` with setHtmlLangAttributes helper function
- Added: RTL language detection for Arabic, Farsi, Hebrew, Urdu prefixes
- Added: Dynamic lang and dir attribute updates on language change events
- Verified: `client/index.html` has default lang="en" attribute
- Context: Improves accessibility and browser behavior for language switching
- Migrations: N/A (frontend-only)

## August 25, 2025 21:15 ET
**Added** SEO optimization for marketing site with meta tags and structured data.
- Updated: `client/index.html` with comprehensive SEO meta tags, Open Graph, Twitter cards
- Added: JSON-LD structured data for SoftwareApplication schema
- New: `client/public/robots.txt` allowing marketing crawling, disallowing /app/
- New: `client/public/sitemap.xml` with all marketing routes and priorities
- Added: color-scheme meta tag for dark mode support
- Context: Improved social sharing and search engine visibility for gymbud.ai
- Migrations: N/A (frontend-only)

## August 25, 2025 21:00 ET
**Added** complete GymBud marketing landing page with animations and i18n.
- New: `client/src/marketing/` directory with Landing.tsx and all components/sections
- New: UspTicker, NavBar, Footer components with sticky header and mobile CTA
- New: Hero, HowItWorks, WhyDifferent, Programs, Progress, Pricing, Faq, FinalCta sections
- Added: framer-motion dependency for smooth animations
- Updated: App.tsx routing to use new Landing component
- Context: Modern, animated single-page marketing site using existing i18n keys
- Migrations: N/A (frontend-only)

## August 25, 2025 20:00 ET
**Added** bilingual i18n scaffolding and documented routes.
- New: `INVENTORY/05_I18N_STRUCTURE.md`
- New: `INVENTORY/06_FRONTEND_ROUTES.md`
- Context: Fresh slate marketing → app split, EN/PT-BR namespaces seeded for landing + future app.
- Migrations: N/A (frontend-only)

## August 26, 2025 11:00 ET
**Completed** marketing component updates.
### Added
- **Theme System**: Created centralized `client/src/marketing/theme.ts` with color palette constants and CTA utility function
- **MobileCTA Component**: Added sticky mobile call-to-action button with consistent styling
- **Landing Component**: Main orchestrator with anchor scrolling functionality for SPA routes
- **Translation Keys**: Added missing keys in `landing.json`, `common.json`, and `faq.json` for component alignment

### Changed
- **All Marketing Sections**: Complete redesign with dark-teal glassmorphic styling and neon accents:
  - `Hero.tsx`: Gradient backgrounds, orange visual elements, proper CTA buttons
  - `HowItWorks.tsx`: Glass cards with backdrop blur and icon styling
  - `WhyDifferent.tsx`: Neon-bordered feature cards with interactive CTAs
  - `Programs.tsx`: Themed program cards with color-coded icons
  - `Progress.tsx`: Mock phone frame with progress visualization
  - `Pricing.tsx`: Glass pricing cards with popular plan highlighting
  - `Faq.tsx`: Accordion-style FAQ with smooth animations
  - `FinalCta.tsx`: Gradient CTA section with dual action buttons
- **Navigation Components**:
  - `NavBar.tsx`: Updated with theme colors and proper navigation links
  - `Footer.tsx`: Simplified footer with consistent styling
  - `UspTicker.tsx`: Theme-aligned ticker component
- **CSS Utilities**: Added `.neon-icon`, `.glass`, and `.ring-faint` classes for glassmorphic effects

### Fixed
- **Translation Alignment**: All components now use correct i18n keys from locale files
- **Icon Imports**: Fixed lucide-react icon import errors across components
- **Type Safety**: Proper TypeScript types for all component props and theme utilities

### Technical
- Consistent use of `PALETTE` constants from theme file
- UTM parameter generation via `ctaHref()` utility
- Responsive design with mobile-first approach
- Smooth anchor scrolling for SPA navigation
- Environment variable integration for app URLs

## [2025-01-26 12:12] - Translation Keys Final Fixes
### Fixed
- **WhyDifferent Section**: Replaced hardcoded Portuguese subtitle "O que nos Torna Diferentes" with translation key `landing:different.subtitle`
- **Programs Section**: Replaced hardcoded Portuguese subtitle "Programas & Objetivos" with translation key `landing:programs.subtitle`  
- **Pricing Section**: Replaced hardcoded Portuguese subtitle "Preços Simples e Transparentes" with translation key `landing:pricing.subtitle`
- **Translation Files**: Added missing subtitle keys to both EN and PT-BR landing.json files for different, programs sections
- **PT-BR Pricing**: Updated pricing subtitle to match existing structure "Escolha o plano que melhor atende às suas necessidades"

### Verified
- **Complete Translation Coverage**: All marketing components now use proper translation keys instead of hardcoded text
- **Language Picker**: Confirmed working correctly in navbar for EN/PT-BR switching
- **FAQ Component**: Verified proper translation key usage for all FAQ items and title
- **All Sections**: Hero, HowItWorks, WhyDifferent, Programs, Progress, Pricing, FinalCta, and NavBar all use translation keys

### Technical Details
- All hardcoded Portuguese text replaced with `t('landing:section.key')` pattern
- Translation keys follow consistent naming convention across all components
- Both EN and PT-BR locale files have complete coverage for all sections
- Language switching persists correctly via localStorage

## [2025-01-26 12:40] - Image Assets Integration & Progress Section Redesign
### Added
- **Image Assets Integration**: Added three image files to `public/images/` directory
  - `gymbud-wh.png`: White logo for branding (169KB)
  - `gymbud.png`: Standard logo variant (1.3MB) 
  - `hero-image.png`: Hero section app preview image (717KB)

### Enhanced
- **Hero Section**: Complete visual upgrade with image integration
  - Added GymBud white logo above main content (h-16 size, responsive positioning)
  - Integrated hero image on right side with Framer Motion animations
  - Added decorative glow effects and proper two-column grid layout
  - Enhanced visual hierarchy: logo → title → subtitle → CTAs
  - Improved responsive design with proper spacing and alignment

- **Footer Component**: Added branding consistency
  - Integrated GymBud white logo next to copyright text (h-8 size)
  - Improved layout with better spacing between logo, copyright, and navigation
  - Added transition effects for navigation link hover states

- **Progress Section**: Complete redesign matching WhyDifferent section quality
  - **Enhanced Phone Mockup**: Improved styling with shadow, glow effects, and realistic screen content
  - **Glassmorphic Metric Cards**: Replaced plain bullet points with 2x3 grid of interactive cards
  - **Better Horizontal Space Usage**: Full utilization of available width with proper content distribution
  - **Color-Coded Icons**: Each metric card features themed icon backgrounds (orange, aqua, teal)
  - **Smooth Animations**: Staggered entrance animations and hover interactions using Framer Motion
  - **CTA Integration**: Added prominent call-to-action card with Zap icon and engaging copy
  - **Decorative Elements**: Background gradient blobs and consistent deep teal styling

### Technical Details
- All images served from `/images/` path for optimal Vite static asset handling
- Responsive image sizing with proper alt attributes for accessibility
- Consistent color palette usage across all enhanced components
- Motion animations with proper viewport detection and performance optimization
- Glassmorphic design patterns with backdrop-blur and semi-transparent backgrounds
