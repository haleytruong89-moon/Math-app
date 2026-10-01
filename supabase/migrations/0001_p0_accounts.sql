-- =====================================================================
-- 0001_p0_accounts.sql — P0: accounts, roles, assignments (App Toán)
--
-- Scope: who can log in and who can see which student. Learning tables
-- (modules, units, items, attempts, mastery, review_queue, ...) come in P1.
--
-- Security model (PJ_APP_TOAN §3.2, §3.10):
--   * RLS is enabled on EVERY table. Default = deny.
--   * Clients get SELECT policies only. All account writes (create/lock
--     users, assign tutors) go through server actions that verify the caller
--     is a parent, then use the service_role key server-side.
--   * Role is read from auth app_metadata (only settable with service_role),
--     never from user_metadata (which users can edit themselves).
-- =====================================================================

-- ---------- Types ----------------------------------------------------
create type public.app_role as enum ('parent', 'tutor', 'student');

-- ---------- Tables ---------------------------------------------------

-- One row per auth user.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.app_role not null,
  display_name  text not null check (char_length(display_name) between 1 and 80),
  is_active     boolean not null default true,   -- false = locked (D3)
  created_at    timestamptz not null default now(),
  locked_at     timestamptz
);

-- A learner. Exists independently of a login so data survives account changes.
-- Designed multi-student from day one (D11): Nguyên now, An later.
create table public.students (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(full_name) between 1 and 80),
  grade         smallint not null check (grade between 1 and 12),
  profile_id    uuid unique references public.profiles (id) on delete set null,
  consent_at    timestamptz,                     -- D18: set when the student agrees
  created_at    timestamptz not null default now()
);

-- Which parent(s) manage which student.
create table public.parent_students (
  parent_id     uuid not null references public.profiles (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  primary key (parent_id, student_id)
);

-- Which tutor teaches which student. Ending an assignment keeps history (D3).
create table public.tutor_assignments (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references public.profiles (id) on delete restrict,
  student_id    uuid not null references public.students (id) on delete cascade,
  subject       text not null default 'toan',
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  check (ended_at is null or ended_at >= started_at)
);
create unique index tutor_assignments_one_active
  on public.tutor_assignments (tutor_id, student_id, subject)
  where ended_at is null;
create index tutor_assignments_student on public.tutor_assignments (student_id);

-- Keep-alive for Supabase free tier (D19). Written only by the cron job.
create table public.heartbeat (
  id            smallint primary key default 1 check (id = 1),
  last_ping_at  timestamptz not null default now()
);

-- ---------- Helper functions (security definer, fixed search_path) ---
-- Used inside policies; security definer avoids RLS recursion on profiles.

create function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active
$$;

create function public.is_parent_of(target_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.parent_students ps
    join public.profiles p on p.id = ps.parent_id
    where ps.parent_id = (select auth.uid())
      and ps.student_id = target_student
      and p.is_active
  )
$$;

create function public.is_active_tutor_of(target_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tutor_assignments ta
    join public.profiles p on p.id = ta.tutor_id
    where ta.tutor_id = (select auth.uid())
      and ta.student_id = target_student
      and ta.ended_at is null
      and p.is_active
  )
$$;

create function public.is_self_student(target_student uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.students s
    join public.profiles p on p.id = s.profile_id
    where s.id = target_student
      and s.profile_id = (select auth.uid())
      and p.is_active
  )
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_parent_of(uuid) from public;
revoke all on function public.is_active_tutor_of(uuid) from public;
revoke all on function public.is_self_student(uuid) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_parent_of(uuid) to authenticated;
grant execute on function public.is_active_tutor_of(uuid) to authenticated;
grant execute on function public.is_self_student(uuid) to authenticated;

-- ---------- Profile auto-creation ------------------------------------
-- When the server creates an auth user it sets app_metadata.role and
-- user_metadata.display_name; this trigger mirrors them into profiles.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r text := new.raw_app_meta_data ->> 'role';
begin
  if r is null then
    return new;  -- e.g. the first parent created in the dashboard; see seed note
  end if;
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    r::public.app_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ---------------------------------------
alter table public.profiles          enable row level security;
alter table public.students          enable row level security;
alter table public.parent_students   enable row level security;
alter table public.tutor_assignments enable row level security;
alter table public.heartbeat         enable row level security;  -- no policies: service_role only

-- profiles: everyone sees their own row; active parents see everyone
-- (single household — parent is the account admin).
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_parent on public.profiles
  for select to authenticated
  using ((select public.current_app_role()) = 'parent');

-- students: parent of, active tutor of, or the student themself.
create policy students_select on public.students
  for select to authenticated
  using (
    public.is_parent_of(id)
    or public.is_active_tutor_of(id)
    or public.is_self_student(id)
  );

-- parent_students: a parent sees their own links.
create policy parent_students_select on public.parent_students
  for select to authenticated
  using (parent_id = (select auth.uid()) and (select public.current_app_role()) = 'parent');

-- tutor_assignments: the tutor sees their own; parents see their students'.
create policy tutor_assignments_select on public.tutor_assignments
  for select to authenticated
  using (
    (tutor_id = (select auth.uid()) and (select public.current_app_role()) = 'tutor')
    or public.is_parent_of(student_id)
  );

-- No INSERT/UPDATE/DELETE policies on purpose: writes go through the server.

-- ---------- Grants ---------------------------------------------------
revoke all on public.profiles, public.students, public.parent_students,
              public.tutor_assignments, public.heartbeat from anon;
grant select on public.profiles, public.students, public.parent_students,
                public.tutor_assignments to authenticated;
revoke insert, update, delete on public.profiles, public.students, public.parent_students,
              public.tutor_assignments, public.heartbeat from authenticated;
