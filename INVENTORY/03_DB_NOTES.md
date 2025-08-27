# DB Notes — app2 schema (GymBud v2)

## Profiles (`app2.profiles`)
One row per user (FK to `auth.users`). Stores identity + anthropometrics + flags.
- Key cols: `user_id (PK)`, `height_cm`, `weight_kg`, `assessment_required`.

## Plans (`app2.plans`)
Plan seed + normalized knobs that drive session generation.
- Uniqueness: at most one `status='active'` per user (`idx_plans_user_active`).
- `seed` holds the exact onboarding PlanSeed JSON for determinism.

## Sessions (`app2.sessions`)
One per user/day; unique `(user_id, session_date)`.
- Status: `pending|active|completed|cancelled`.

## Session Exercises (`app2.session_exercises`)
Ordered rows per session. Warm-up rows carry `variant_id=NULL` and `prescription.stage='warmup'`.
- Ordering uses `order_index` (0..N).
- Work rows include `{sets, reps, rest_sec, ramp?}` in `prescription`.

## Logged Sets (`app2.logged_sets`)
Captures per-set data (offline first; queue replays to insert here).
- `set_number` is 0..N within the exercise.
- `meta` can tag `{ "is_warmup": true }` when needed.

## Coach Audit (`app2.coach_audit`)
Audit trail for AI tool calls (`tool`, `args_json`, `args_hash`, `explain`).

## Preserve Catalog (source of truth)
We are reusing the preserved library:
- preserve.exercise_library (PK id uuid; name, description, category, equipment[], video_url, patterns[], primary_muscles[], goal_effectiveness jsonb, complexity_level int, name_lc generated)
- preserve.exercise_library_i18n (PK (exercise_id, locale); name, description, cues[], contraindications[], search_tsv generated)
- preserve.exercise_variants (PK id uuid; exercise_id → exercise_library(id); modality modality_enum; environments environment_enum[]; equipment[]; is_assessment_default bool; created_at; tags[]; exercise_name; category; variant_name_lc generated)
- preserve.exercise_variant_i18n (PK (variant_id, locale); name, notes, search_tsv generated)

RLS is enabled on preserve.* (read-only for app roles; editor via content/admin as configured).

## Enrichment (August 27, 2025)
We seeded missing locales:
- EN + pt-BR for all rows in exercise_library_i18n and exercise_variant_i18n.
- EN defaults leverage base table where possible; neutral safe copy otherwise.
- pt-BR defaults mirror EN where available, else base, else neutral.

## Locale-aware Views (app2)
- **app2.v_exercise_library_localized**  
  Locale via GUC `app.locale` (supports 'en', 'pt-BR'; default 'en').  
  Columns: exercise_id, name, description, cues[], contraindications[], plus passthrough fields (category, equipment[], video_url, patterns[], primary_muscles[], goal_effectiveness, complexity_level, name_lc).

- **app2.v_exercise_variants_localized**  
  Locale via `app.locale` with same fallback chain.  
  Columns: variant_id, exercise_id, modality, environments[], equipment[], is_assessment_default, created_at, tags[], exercise_name, category, variant_name_lc, name, notes.

## Locale RPCs for Exercise Catalog (August 27, 2025)

**Views (pre-existing in app2):**
- `v_exercise_library_localized`
- `v_exercise_variants_localized`

**New RPCs:**
- `app2.rpc_get_exercise_by_id(p_exercise_id uuid, lang text default 'en')`
  - Returns a single row from `v_exercise_library_localized`.
  - Sets `app.locale` internally; RLS remains enforced.

- `app2.rpc_get_variants_for_exercise(p_exercise_id uuid, lang text default 'en')`
  - Returns `setof v_exercise_variants_localized` for the given exercise.
  - Ordered by localized `name`.

- `app2.rpc_search_exercises(q text, lang text default 'en', p_category text default null, p_equipment text[] default null)`
  - Locale-aware search across i18n `search_tsv` + trigram `name`.
  - Optional filters: `category`, `equipment[]` (overlaps).
  - Returns `setof v_exercise_library_localized`.

**Indexes (optional but recommended for filters):**
- `idx_exlib_category` on `preserve.exercise_library(category)`
- `idx_exlib_equipment_gin` on `preserve.exercise_library using gin (equipment)`

## Views
- `v_session_exercises_enriched`: flattens `prescription` into typed fields and marks `is_warmup`.
- `v_session_metrics`: per-session totals (sets & volume) and warm-up counts.

## RLS
All tables are user-owned (scoped by `auth.uid()`); child tables derive access from parent via EXISTS joins.
