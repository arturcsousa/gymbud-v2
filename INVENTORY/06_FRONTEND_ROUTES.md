# Frontend Routes (Marketing vs App)

## Marketing Site (gymbud.ai)
- `/` – Landing (hero, how, different, programs, progress, pricing, faq, final cta)
- `/how-it-works` – Long-form explainer (optional deep-dive)
- `/programs` – Goals & splits (optional deep-dive)
- `/pricing` – Plan grid + FAQs subset
- `/faq` – Full FAQ list

## App Entrypoint
- Production app lives at `app.gymbud.ai`
- Marketing links point to `https://app.gymbud.ai` for auth/onboarding
- Local dev placeholder route: `/app/*` for internal previews

## Router
- SPA via `wouter`
- SEO handled by marketing pages; app routes are separate subdomain in prod
