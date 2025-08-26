# Frontend Routes (Marketing vs App)

## Marketing Site (gymbud.ai)
**Single Page Application** - All routes render the same `Landing` component with smooth scroll anchors

### Routes
- `/` – Landing page with all sections
- `/how-it-works` – Renders Landing (scrolls to #how anchor)
- `/programs` – Renders Landing (scrolls to #programs anchor)
- `/pricing` – Renders Landing (scrolls to #pricing anchor)
- `/faq` – Renders Landing (scrolls to #faq anchor)

### Landing Sections
1. **UspTicker** - Gradient banner with key value prop
2. **NavBar** - Sticky header with navigation, language switcher, app CTA
3. **Hero** - Animated hero with primary CTAs
4. **HowItWorks** - 3-step process explanation
5. **WhyDifferent** - 6 feature cards with icons
6. **Programs** - Training goal categories
7. **Progress** - Metrics and tracking features
8. **Pricing** - 3-tier pricing with CTAs to app
9. **Faq** - Expandable FAQ items
10. **FinalCta** - Bottom conversion section
11. **Footer** - Links and copyright
12. **Mobile CTA** - Sticky bottom button (mobile only)

## App Entrypoint
- **Production:** `app.gymbud.ai` (separate subdomain)
- **Development:** Local placeholder at `/app/*`
- **CTA Links:** All marketing CTAs point to app URL with query params
- **Environment:** Uses `VITE_SITE_URL` or `NEXT_PUBLIC_SITE_URL` env vars

## Technical Implementation

### Router
- **Library:** `wouter` for client-side routing
- **Strategy:** SPA with single Landing component
- **Fallback:** All routes → Landing component
- **SEO:** Server-side rendering not needed (marketing content in component)

### Deployment (Vercel)
- **Rewrites:** `/((?!api/).*)` → `/index.html` for SPA routing
- **Build:** `client/dist` output directory
- **Framework:** Auto-detected as Vite
- **Environment:** `VITE_SITE_URL` set in Vercel dashboard

### Navigation Behavior
- **Internal:** Smooth scroll to section anchors within Landing
- **External:** Links to app subdomain for authentication/onboarding
- **Language:** Persistent across route changes via localStorage
- **Mobile:** Responsive navigation with hamburger menu

### SEO & Social
- **Meta Tags:** Complete Open Graph and Twitter Card support
- **Structured Data:** JSON-LD schema for SoftwareApplication
- **Sitemap:** All marketing routes included with priorities
- **Robots:** Marketing routes allowed, `/app/` disallowed

## Future Considerations
- Marketing routes could be expanded to dedicated pages if needed
- App routes will be handled by separate app.gymbud.ai deployment
- Language-specific URLs could be added (e.g., `/pt-br/pricing`)
- A/B testing could be implemented at the route level
