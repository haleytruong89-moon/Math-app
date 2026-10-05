-- 0008 (S4): parent "Tổng quan" — confirmed levels (D8) and the tutor's weekly schedule (Q8).
-- A confirmation is display-only (P2): it never changes reviews or mastery rules. Shown while
-- the system level still equals system_level at the time of confirming.
-- Clients may only SELECT (RLS); writes go through server actions with service_role.

create table public.parent_confirmations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  level smallint not null check (level between 0 and 4),
  system_level smallint not null check (system_level between 0 and 4), -- snapshot when confirmed
  proposal_session_id uuid references public.teaching_sessions (id) on delete set null,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index parent_confirmations_student_unit_time on public.parent_confirmations (student_id, unit_id, created_at desc);

alter table public.parent_confirmations enable row level security;
create policy parent_confirmations_select on public.parent_confirmations
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));
revoke all on public.parent_confirmations from anon, authenticated;
grant select on public.parent_confirmations to authenticated;
grant select, insert, update, delete on public.parent_confirmations to service_role;

-- Weekly teaching days of an assignment: 1 = Monday … 7 = Sunday, no duplicates.
create function public.weekdays_ok(d smallint[]) returns boolean
  language sql immutable set search_path = ''
  as $$ select coalesce(bool_and(x is not null and x between 1 and 7), true) and count(*) = count(distinct x) from unnest(d) as x $$;
revoke all on function public.weekdays_ok(smallint[]) from public;
grant execute on function public.weekdays_ok(smallint[]) to authenticated, service_role;

alter table public.tutor_assignments
  add column weekdays smallint[] not null default '{}' check (public.weekdays_ok(weekdays));
