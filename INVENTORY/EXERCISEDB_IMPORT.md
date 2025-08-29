# ExerciseDB Import — Runbook (August 29, 2025)

## Purpose
Integrate a large open-source exercise dataset (≈1,500 items) including GIF media into GymBud, for use by the deterministic engine and the app (library, generators, session runner).

## Scope
- Dataset is processed **offline** in a separate repo (windsurf).
- GymBud receives final artifacts only: CSVs + GIFs.
- No direct dependency on the dataset repo at runtime.

## Artifacts (from windsurf)
- `out/exlib.csv` — base exercises
- `out/exlib_i18n_en.csv` — EN localization
- `out/exlib_i18n_ptbr.csv` — PT-BR localization (optional; source currently EN-only)
- `out/gif_manifest.csv` — (external_id, gif_rel_path)
- `dist_media/gif/*.gif` — GIF files, named by external_id

## Storage
- Bucket: `exercise-media` (public)
- Path: `gif/<external_id>.gif`
- Public URL prefix:
  `https://lrcrmmquuwphxispctgq.supabase.co/storage/v1/object/public/exercise-media/`

## Database — Targets
- `preserve.exercise_library`
  - columns used: name, name_lc (generated), category, equipment text[], primary_muscles text[], secondary_muscles text[], gif_url text, axes jsonb, source text, external_id text (unique)
- `preserve.exercise_library_i18n`
  - columns used: exercise_id, locale, name, instructions_bulleted text[], cues text[]
- (optional) `preserve.exercise_media`
  - columns: id, exercise_id (FK), media_type ('gif'|'image'|'video'), url, sort_order, created_at

## Staging (ops)
- `preserve._exlib_stage` (strings-to-arrays and json casting)
- `preserve._i18n_stage`
- `preserve._gif_stage`

## One-time schema updates
```sql
alter table preserve.exercise_library
  add column if not exists secondary_muscles text[],
  add column if not exists external_id text,
  add column if not exists gif_url text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='ux_exlib_external') then
    alter table preserve.exercise_library
      add constraint ux_exlib_external unique (external_id);
  end if;
end$$;
```

### Optional media table:
```sql
create table if not exists preserve.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references preserve.exercise_library(id) on delete cascade,
  media_type text not null check (media_type in ('gif','image','video')),
  url text not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (exercise_id, url)
);
```

## Import flow (dashboard)
1. Upload GIFs to exercise-media/gif/.
2. Import CSVs into stage tables.
3. Merge stage → targets:
   - Phase A (update by name_lc+category)
   - Phase B (insert new; omit name_lc; on conflict (name_lc) do nothing)
4. Upsert EN i18n; backfill PT-BR later
5. Insert exercise_media (optional) and/or set gif_url

## Post-import backfills (pending)
- description text, patterns text[], goal_effectiveness jsonb on preserve.exercise_library
- PT-BR i18n rows from EN + glossary-driven translation pass

## Deterministic engine notes
- Use patterns + equipment + primary_muscles for candidate selection.
- Keep exercise_variants table to encode curated substitutions across equipment/planes.
