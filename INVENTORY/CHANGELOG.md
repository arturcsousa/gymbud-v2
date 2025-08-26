# CHANGELOG

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
