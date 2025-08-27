# DB Notes — Exercise Catalog, Localization & Triggers (August 27, 2025)

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
Reused as-is:
- **preserve.exercise_library** (uuid id, name, description, category, equipment[], video_url, patterns[], primary_muscles[], goal_effectiveness jsonb, complexity_level, name_lc generated)
- **preserve.exercise_library_i18n** (PK: exercise_id + locale; name, description, cues[], contraindications[]; search_tsv generated)
- **preserve.exercise_variants** (uuid id; exercise_id → exercise_library(id); modality enum; environments enum[]; equipment[]; is_assessment_default; tags[]; etc.)
- **preserve.exercise_variant_i18n** (PK: variant_id + locale; name, notes; search_tsv generated)

## Localization Seeds
- Inserted **en** and **pt-BR** rows where missing in both i18n tables, using base columns as fallback.
- Neutral safety copy used where base/i18n values were null.

## Locale-aware Views (app2.*)
- **app2.v_exercise_library_localized**  
  - Uses GUC `app.locale` (handled inside RPCs)  
  - Fallback chain: requested locale → `en` → base
- **app2.v_exercise_variants_localized**  
  - Same locale handling and fallback

## RPCs (client-simple)
- **app2.rpc_get_exercise_library(lang text default 'en') → setof v_exercise_library_localized**
- **app2.rpc_get_exercise_variants(lang text default 'en') → setof v_exercise_variants_localized**
- **app2.rpc_get_exercise_by_id(p_exercise_id uuid, lang text default 'en') → v_exercise_library_localized row**
- **app2.rpc_get_variants_for_exercise(p_exercise_id uuid, lang text default 'en') → setof v_exercise_variants_localized**
- **app2.rpc_search_exercises(q text, lang text default 'en', p_category text default null, p_equipment text[] default null) → setof v_exercise_library_localized**  
  - Uses i18n `search_tsv` + trigram on `name` with optional category/equipment filters.

## Index posture
- Present: GIN(trgm) on i18n.name; GIN on i18n.search_tsv.  
- Optional (added if needed): btree on `exercise_library.category`; GIN on `exercise_library.equipment`.

## updated_at Trigger Policy
- Safe function `_bu_set_updated_at` that only sets `updated_at` on UPDATE when column exists.
- **Attached on**: `app2.sessions`, `app2.session_exercises`, `app2.exercise_instructions`, `app2.profiles`, `app2.plans`.
- **Not attached on**: `app2.logged_sets` (append-only, watermark = `created_at`), all `preserve.*` catalog tables.

## Client/EF expectations
- EF pull-updates watermark uses `updated_at` on `sessions` & `session_exercises`.
- FE reads must go through the RPCs above to get locale-aware fields with fallback.
