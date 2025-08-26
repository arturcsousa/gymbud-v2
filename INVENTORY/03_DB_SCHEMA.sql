-- GymBud v2 — Core Schema (app2)
create schema if not exists app2;

-- ENUMS
do $$ begin create type app2.session_status as enum ('pending','active','completed','cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type app2.experience_level as enum ('new','returning','advanced');            exception when duplicate_object then null; end $$;
do $$ begin create type app2.environment      as enum ('professional_gym','home_gym','bodyweight_only'); exception when duplicate_object then null; end $$;
do $$ begin create type app2.coaching_tone   as enum ('supportive','kind','sassy','drill_sergeant','funny'); exception when duplicate_object then null; end $$;

-- PROFILES
create table if not exists app2.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  date_of_birth date not null,
  gender text,
  locale text not null default 'en',
  height_cm numeric(5,2) not null,
  weight_kg numeric(6,2) not null,
  resting_hr int,
  body_fat_pct numeric(5,2),
  assessment_required boolean not null default true,
  last_assessment_at timestamptz,
  injuries text[] not null default '{}',
  equipment text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PLANS
create table if not exists app2.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app2.profiles(user_id) on delete cascade,
  status text not null default 'draft', -- 'draft'|'active'|'archived'
  goals text[] not null,
  experience_level app2.experience_level not null,
  years_away int,
  frequency_days_per_week int not null check (frequency_days_per_week between 1 and 6),
  schedule_days text[] not null,
  session_duration_min int not null check (session_duration_min >= 0), -- 0 = flexible
  environment app2.environment not null,
  coaching_tone app2.coaching_tone not null,
  height_cm numeric(5,2) not null,
  weight_kg numeric(6,2) not null,
  resting_hr int,
  body_fat_pct numeric(5,2),
  locale text default 'en',
  seed jsonb not null,   -- PlanSeed JSON from onboarding
  started_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_plans_user_active on app2.plans(user_id) where (status='active');

-- SESSIONS
create table if not exists app2.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app2.profiles(user_id) on delete cascade,
  plan_id uuid references app2.plans(id) on delete set null,
  session_date date not null,
  status app2.session_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_sessions_user_date unique (user_id, session_date)
);
create index if not exists idx_sessions_user_date on app2.sessions(user_id, session_date);

-- SESSION_EXERCISES
create table if not exists app2.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references app2.sessions(id) on delete cascade,
  order_index int not null,                 -- fixed (avoid reserved 'order')
  exercise_name text,                       -- used for warm-up/ad-hoc items
  variant_id uuid,                          -- nullable for warm-up rows
  pattern text,
  prescription jsonb not null,              -- {stage:'warmup'|'work', ... , ramp:{...}}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_session_exercises_session_order on app2.session_exercises(session_id, order_index);

-- LOGGED_SETS
create table if not exists app2.logged_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references app2.session_exercises(id) on delete cascade,
  set_number int not null,                  -- aligns with client/Dexie
  reps int,
  weight numeric(6,2),
  rpe numeric(3,1),
  duration_sec int,
  notes text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_logged_sets_exercise_idx on app2.logged_sets(session_exercise_id, set_number);

-- COACH_AUDIT
create table if not exists app2.coach_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app2.profiles(user_id) on delete cascade,
  session_id uuid references app2.sessions(id) on delete set null,
  session_exercise_id uuid references app2.session_exercises(id) on delete set null,
  tool text not null,                        -- 'find_substitutes'|'apply_substitution'|'adjust_prescription'|'log_set'
  args_json jsonb not null,
  args_hash text not null,
  explain text,
  created_at timestamptz not null default now()
);
create index if not exists idx_coach_audit_user_time on app2.coach_audit(user_id, created_at desc);

-- RLS
alter table app2.profiles           enable row level security;
alter table app2.plans              enable row level security;
alter table app2.sessions           enable row level security;
alter table app2.session_exercises  enable row level security;
alter table app2.logged_sets        enable row level security;
alter table app2.coach_audit        enable row level security;

do $$ begin
  create policy "profiles self" on app2.profiles for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "plans self" on app2.plans for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sessions self" on app2.sessions for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "session_exercises self" on app2.session_exercises for all
    using (exists (select 1 from app2.sessions s where s.id = session_id and s.user_id = auth.uid()))
    with check (exists (select 1 from app2.sessions s where s.id = session_id and s.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "logged_sets self" on app2.logged_sets for all
    using (exists (
      select 1 from app2.session_exercises se
      join app2.sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.user_id = auth.uid()
    ))
    with check (exists (
      select 1 from app2.session_exercises se
      join app2.sessions s on s.id = se.session_id
      where se.id = session_exercise_id and s.user_id = auth.uid()
    ));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "coach_audit self" on app2.coach_audit for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- TRIGGERS (updated_at)
create or replace function app2.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ begin create trigger t_plans_touch before update on app2.plans              for each row execute function app2.touch_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger t_sessions_touch before update on app2.sessions        for each row execute function app2.touch_updated_at(); exception when duplicate_object then null; end $$;
do $$ begin create trigger t_session_exercises_touch before update on app2.session_exercises for each row execute function app2.touch_updated_at(); exception when duplicate_object then null; end $$;

-- VIEWS
create or replace view app2.v_session_exercises_enriched as
select
  se.id                           as session_exercise_id,
  se.session_id,
  s.user_id,
  s.session_date,
  p.id                            as plan_id,
  se.order_index,
  coalesce(se.exercise_name, '—') as exercise_name,
  se.variant_id,
  se.pattern,
  se.prescription,
  se.prescription->>'stage'       as stage,                -- 'warmup' | 'work'
  se.prescription->'ramp'         as ramp_json,
  (se.prescription->>'rest_sec')::int        as rest_sec,
  (se.prescription->>'sets')::int            as sets,
  case when jsonb_typeof(se.prescription->'reps')='number'
       then (se.prescription->>'reps')::int else null end as reps_scalar,
  case when jsonb_typeof(se.prescription->'reps')='array'
       then se.prescription->'reps' else null end         as reps_array_json,
  se.prescription->>'tempo'       as tempo,
  (se.prescription->>'rir')::int  as rir,
  (se.prescription->>'percent_1rm')::numeric as percent_1rm,
  (se.prescription->>'duration_sec')::int    as duration_sec,
  (se.prescription->>'stage')='warmup'       as is_warmup,
  s.status as session_status, s.started_at, s.completed_at
from app2.session_exercises se
join app2.sessions s on s.id = se.session_id
left join app2.plans p on p.id = s.plan_id;

create or replace view app2.v_session_metrics as
select
  s.id as session_id, s.user_id, s.session_date,
  count(l.id) as total_sets,
  sum(coalesce(l.reps,0) * coalesce(l.weight,0))::numeric as total_volume,
  sum(case when (se.prescription->>'stage')='warmup' then 1 else 0 end) as warmup_exercise_count
from app2.sessions s
left join app2.session_exercises se on se.session_id = s.id
left join app2.logged_sets l on l.session_exercise_id = se.id
group by s.id, s.user_id, s.session_date;

-- COMMENTS
comment on table  app2.session_exercises is 'Ordered exercise rows for a session. Warm-up rows: variant_id NULL & prescription.stage="warmup".';
comment on column app2.session_exercises.order_index is 'Stable display order within a session (0..N).';
comment on column app2.plans.seed is 'PlanSeed JSON captured from onboarding for reproducibility.';
