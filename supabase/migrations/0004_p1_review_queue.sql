-- 0004 (P1 slice 2): spaced review per D14 — D+1, D+7, D+21; wrong → back to D+1;
-- correct and rated "easy" → next interval ×1.5. Mastery itself is computed from
-- `attempts` in code (D15), so only the schedule and its history are stored here.

comment on column public.attempts.exit_run is 'Groups the answers of one exit-test run or one review run';

-- One row per (student, unit) once the unit first reaches M3.
create table public.review_queue (
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  stage smallint not null check (stage between 1 and 3), -- next review: 1 = D+1, 2 = D+7, 3 = D+21
  due_on date,                                             -- null once stage 3 has been passed
  completed_at timestamptz,                                -- stage 3 passed → M4
  updated_at timestamptz not null default now(),
  primary key (student_id, unit_id),
  check ((due_on is null) = (completed_at is not null))
);

-- Every finished review of a unit, kept in full for a later FSRS upgrade (D14).
create table public.review_log (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  run_id uuid not null,
  stage smallint not null check (stage between 1 and 3),
  correct smallint not null check (correct >= 0),
  total smallint not null check (total > 0 and correct <= total),
  passed boolean not null,
  rating text check (rating in ('easy', 'normal')),
  due_on date not null,       -- when this review was due
  next_due_on date,           -- null when this pass completed stage 3
  created_at timestamptz not null default now(),
  unique (run_id, unit_id)
);
create index review_log_student_time on public.review_log (student_id, created_at desc);

alter table public.review_queue enable row level security;
alter table public.review_log enable row level security;

create policy review_queue_select on public.review_queue
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

create policy review_log_select on public.review_log
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

revoke all on public.review_queue, public.review_log from anon, authenticated;
grant select on public.review_queue, public.review_log to authenticated;
grant select, insert, update, delete on public.review_queue, public.review_log to service_role;
