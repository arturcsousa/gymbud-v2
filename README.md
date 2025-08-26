# GymBud — Project Inventory Index

This folder is the **single source of truth** for codegen and architecture decisions.  
Everything here is normalized to match the live system.

## Quick Links
- [`01_REPO_RUNTIME.md`](./01_REPO_RUNTIME.md)
- [`02_ENV_TARGETS.md`](./02_ENV_TARGETS.md)
- [`03_DB_SCHEMA.sql`](./03_DB_SCHEMA.sql)
- [`03_DB_NOTES.md`](./03_DB_NOTES.md)
- (coming next) `04_API_SURFACE.md`, `05_TYPES_SCHEMAS.md`, …

## Database CSV Catalog (authoritative extracts)
- [`manifest.csv`](./manifest.csv)
- [`db_tables.csv`](./db_tables.csv)
- [`db_columns.csv`](./db_columns.csv)
- [`db_constraints_pk_uniq.csv`](./db_constraints_pk_uniq.csv)
- [`db_foreign_keys.csv`](./db_foreign_keys.csv)
- [`db_indexes.csv`](./db_indexes.csv)
- [`db_checks.csv`](./db_checks.csv)
- [`db_rls_policies.csv`](./db_rls_policies.csv)
- [`db_rls_tables.csv`](./db_rls_tables.csv)
- [`db_triggers.csv`](./db_triggers.csv)
- [`db_functions.csv`](./db_functions.csv)
- [`db_views.csv`](./db_views.csv)
- [`db_matviews.csv`](./db_matviews.csv)
- [`db_enums.csv`](./db_enums.csv)
- [`db_sequences.csv`](./db_sequences.csv)
- [`db_table_comments.csv`](./db_table_comments.csv)
- [`db_reference_candidates.csv`](./db_reference_candidates.csv)

### Regeneration
Run the provided Supabase SQL blocks in the SQL Editor and **Download as CSV** for each result.  
Update files in place; keep `manifest.csv` current.

### Trust Order
1. Migrations (`supabase/migrations/*`)
2. Schema dump (`03_DB_SCHEMA.sql`)
3. CSV snapshots (this catalog)


GymBud v2 — App Overview
🎯 Project Vision

GymBud is an AI-powered, offline-first personal training app built for consumers (B2C only).
It combines:

Deterministic Training Engine v2 — reproducible, goal-based training plans with warm-up integration.

AI Coaching Layer — tool-first assistant for substitutions, prescription adjustments, and form cues.

Offline-first PWA — installable app with session logging that syncs automatically when online.

Core Promise: Personal training that’s actually personal, reproducible, and available everywhere.

🏗️ Architecture at a Glance

Frontend: Vite + React 18, wouter router, Tailwind + shadcn/ui, TanStack Query v5.

Backend: Supabase (Postgres + RLS policies), Edge Functions (training engine + AI coach tools).

Storage: IndexedDB for offline-first state, mutation queue for sync.

i18n: English + Portuguese (Brazil) via react-i18next.

Deployment:

Marketing site → gymbud.ai

App (PWA) → app.gymbud.ai (Vercel SPA, with service worker).

🔑 End-to-End User Flow

Landing Page (gymbud.ai)

Product pitch, features, pricing, FAQ.

CTA → signup on app.

Fully localized EN/PT-BR.

Authentication (Step 1 of onboarding if new)

Email/password, reset password, magic link optional.

Supabase Auth with local persistence.

Onboarding (12-step Wizard)
Comprehensive user profile capture (stored locally + synced):

Authentication (if not already signed in)

Profile Info (name, DOB, gender)

Physical Metrics (height, weight, optional RHR/body fat)

Fitness Goals (stamina, hypertrophy, toning, weight loss)

Experience Level (+ years away if returning)

Training Frequency (days per week)

Weekly Schedule (select specific days)

Session Duration preference

Training Environment (gym, home, bodyweight)

Coaching Tone preference (supportive, kind, sassy, drill sergeant, funny)

Consent & Legal (health disclaimer, terms, optional marketing)

Summary & Review

✅ Output: OnboardingData object → seeds app2.plans.

Initial Assessment

Lightweight session to capture baseline capacity.

Once completed → assessment_required=false and first plan activated.

Daily Training Flow

Home (Today): Streaks, last workout summary, “Start Today’s Session”.

Session Runner:

Warm-up block (general cardio + movement prep + ramp sets).

Ordered list of exercises with prescriptions.

Log sets (offline capable).

Rest timer, AI coach chat.

Finish session → marks completed.

Post-Session Summary: Volume, PRs, compliance, notes.

History & Analytics

Session list by date.

Session detail with logged sets.

Charts: weekly volume, e1RM progression, compliance.

Exercise Library

Search/browse preserve.exercise_library.

Filters: body region, equipment.

Localized exercise names.

AI Coach

Inline chat during session.

Tools:

find_substitutes

apply_substitution

adjust_prescription

log_set

Deterministic reranker + optional LLM boost.

Audit log of all AI actions.

Settings

Profile (name, locale).

Training preferences (regenerate plan).

Data export.

Delete account.

Notifications

Daily reminders, streak nudges, weekly digest.

Supabase cron → email/push (future integration).

🧩 Deterministic Engine v2

Inputs: OnboardingData + session history
Process:

Score & rank variants deterministically.

Stable sort: score → complexity → name → id.

Day seed = user_id + dateISO + session_kind.

Warm-up integration:

General Warm-up (cardio 4–7 min)

Movement Prep drills (pattern-specific)

Ramp-up sets for first 1–2 compounds

Prescriptions per goal: hypertrophy, endurance, strength, rehab.

Outputs:

app2.sessions

app2.session_exercises

DoD: Same user/date always gets the same session.

🧠 AI Coach Infrastructure

Edge Functions only; no direct DB writes from LLM.

Tools = deterministic actions (substitution, adjustment, logging).

Reranker: deterministic base + LLM boost (0–3).

Prompts: SYSTEM_COACH (tool-first), SYSTEM_FORM (safe cues), substitution rubric.

Audited in app2.coach_audit.

📦 Offline-First PWA

Service Worker: precache shell, stale-while-revalidate for GETs, queue for mutations.

IndexedDB: profiles, plans, sessions, session_exercises, logged_sets, mutation_queue.

Sync Engine: replay queue on reconnect, background + manual sync.

Conflict Resolution: Last-Write-Wins (with UI affordance to resolve conflicts).

UX: Global offline indicator, “Offline Mode: changes will sync later”.

✅ Definition of Done (B2C Only)

Installable PWA (app.gymbud.ai).

EN/PT-BR fully localized.

Auth + Onboarding Wizard (12 steps).

Assessment → Plan → Daily Sessions (with warm-up).

Deterministic Engine v2 running.

AI coach tool calls with audit trail.

Offline logging and sync.

History & analytics, exercise library.

Self-service settings.

Notifications (basic cron).

RLS airtight.