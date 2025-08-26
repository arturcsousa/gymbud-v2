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

## Views
- `v_session_exercises_enriched`: flattens `prescription` into typed fields and marks `is_warmup`.
- `v_session_metrics`: per-session totals (sets & volume) and warm-up counts.

## RLS
All tables are user-owned (scoped by `auth.uid()`); child tables derive access from parent via EXISTS joins.
