-- 0009 (S6a): curriculum engine — manual unlocks (LT2) and test-out state (LT4).
-- A KU opens when every prerequisite reaches M3, or when the parent unlocks it by hand.
-- Test-out: the exit test taken directly, once per KU; its run id is kept so a failed run
-- can be left out of mastery. Clients may only SELECT (RLS); writes go through server actions.

create table public.unit_unlocks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  unlocked_by uuid not null references public.profiles (id) on delete cascade, -- the parent
  unlocked_at timestamptz not null default now(),
  unique (student_id, unit_id)
);

alter table public.unit_unlocks enable row level security;
create policy unit_unlocks_select on public.unit_unlocks
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));
revoke all on public.unit_unlocks from anon, authenticated;
grant select on public.unit_unlocks to authenticated;
grant select, insert, update, delete on public.unit_unlocks to service_role;

alter table public.unit_progress
  add column testout_run uuid,          -- attempts.exit_run of the test-out attempt
  add column testout_at timestamptz,
  add constraint unit_progress_testout_pair check ((testout_run is null) = (testout_at is null));
