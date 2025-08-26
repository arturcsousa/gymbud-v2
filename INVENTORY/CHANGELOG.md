# CHANGELOG

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
