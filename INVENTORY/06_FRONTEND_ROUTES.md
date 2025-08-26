# GymBud v2 - Frontend Routes & Architecture

## Overview
Single Page Application (SPA) built with Vite + React using `wouter` for client-side routing with anchor scrolling for marketing sections.

## Route Structure

### Marketing Routes (/)
- **`/`** - Landing page with all marketing sections
- **`/how-it-works`** - Scrolls to How It Works section
- **`/programs`** - Scrolls to Programs section  
- **`/pricing`** - Scrolls to Pricing section
- **`/faq`** - Scrolls to FAQ section

### App Routes (Future)
- **`/app/*`** - Placeholder for app.gymbud.ai integration

## Component Architecture

### Landing Page Structure
```
Landing.tsx (Main orchestrator)
├── NavBar.tsx (Sticky header with navigation)
├── UspTicker.tsx (Scrolling benefits ticker)
├── Hero.tsx (Main hero section)
├── HowItWorks.tsx (3-step process)
├── WhyDifferent.tsx (Feature differentiators)  
├── Programs.tsx (Training programs)
├── Progress.tsx (Progress tracking demo)
├── Pricing.tsx (Pricing plans)
├── Faq.tsx (Accordion FAQ)
├── FinalCta.tsx (Final call-to-action)
├── Footer.tsx (Simple footer)
└── MobileCTA.tsx (Sticky mobile CTA)
```

### Design System
- **Theme**: Centralized in `client/src/marketing/theme.ts`
- **Colors**: Dark-teal glassmorphic with neon accents (aqua, teal, orange)
- **Effects**: Glass cards with backdrop blur, neon glows, gradient backgrounds
- **Typography**: Extrabold headings, clean body text
- **Responsive**: Mobile-first with sticky elements

### Anchor Scrolling Implementation
```tsx
// Landing.tsx - Anchor scrolling logic
useEffect(() => {
  if (location === '/how-it-works') {
    document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
  }
  // ... other routes
}, [location]);
```

### Navigation Links
- **Internal**: Anchor links (`#how`, `#programs`, etc.)
- **External**: App CTAs via `ctaHref()` with UTM parameters
- **Language**: Toggle between EN/PT-BR with persistence

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
- **Type Safety**: Full TypeScript coverage
- **Linting**: ESLint + Prettier for code consistency
- **Build**: Production-ready builds via `pnpm build`

## Future Considerations
- **App Integration**: Seamless handoff to app.gymbud.ai
- **Analytics**: User behavior tracking integration
- **A/B Testing**: Component-level testing capabilities
- **CMS Integration**: Content management for marketing copy
