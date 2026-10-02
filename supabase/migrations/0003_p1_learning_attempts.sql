-- 0003 (P1 slice 1): per-unit learning progress and every answer a student submits.
-- Content (modules, units, items) lives as JSON in the repo (D16); the DB only stores
-- what the student did, keyed by the content's stable text IDs.
-- Clients may only SELECT (RLS); all writes go through server actions with service_role.

create type public.attempt_mode as enum ('faded', 'practice', 'exit', 'review');

-- One row per (student, unit): gates the worked-example → self-solve sequence (§3.5).
create table public.unit_progress (
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  worked_viewed_at timestamptz,
  faded_done_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (student_id, unit_id)
);

-- Every graded answer. Logged in full so mastery (D15) and a later FSRS upgrade (D14)
-- can be recomputed from raw data.
create table public.attempts (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  item_id text not null check (item_id ~ '^[a-z0-9-]+$'),
  mode public.attempt_mode not null,
  answer text not null check (length(answer) <= 200),
  correct boolean not null,
  error_code text check (error_code ~ '^E(0[1-9]|1[0-5])$'),
  duration_ms integer check (duration_ms >= 0),
  exit_run uuid, -- groups the answers of one exit-test submission
  created_at timestamptz not null default now()
);
create index attempts_student_unit_time on public.attempts (student_id, unit_id, created_at desc);

alter table public.unit_progress enable row level security;
alter table public.attempts enable row level security;

create policy unit_progress_select on public.unit_progress
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or public.is_active_tutor_of(student_id)
    or public.is_self_student(student_id)
  );

create policy attempts_select on public.attempts
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or public.is_active_tutor_of(student_id)
    or public.is_self_student(student_id)
  );

revoke all on public.unit_progress, public.attempts from anon, authenticated;
grant select on public.unit_progress, public.attempts to authenticated;
-- Lesson from 0002: new tables are not auto-granted to service_role on Supabase.
grant select, insert, update, delete on public.unit_progress, public.attempts to service_role;
grant usage on type public.attempt_mode to authenticated, service_role;
