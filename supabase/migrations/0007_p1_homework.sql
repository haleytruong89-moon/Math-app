-- 0007 (S3b part B): homework a tutor gives in a session (spec 2026-10-05, T1–T4).
-- Done on paper and corrected by the tutor next session; never graded, never counted in
-- mastery or the weekly goal. Task sheets/photos are Google Drive links (no file storage).
-- Clients may only SELECT (RLS); writes go through server actions with service_role.

create function public.homework_links_ok(l text[]) returns boolean
  language sql immutable set search_path = ''
  as $$ select coalesce(bool_and(x is not null and x ~ '^https://[^[:space:]]+$' and char_length(x) <= 500), true) from unnest(l) as x $$;

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  student_id uuid not null,
  tutor_id uuid not null,
  unit_id text check (unit_id ~ '^[a-z0-9-]+$'), -- null = "Khác"
  task text not null check (char_length(task) between 1 and 300),
  links text[] not null default '{}' check (cardinality(links) <= 3 and public.homework_links_ok(links)),
  due_on date not null,
  done_at timestamptz,     -- the student said "Con làm xong rồi"
  reviewed_at timestamptz, -- the tutor marked it corrected
  review_note text check (char_length(review_note) <= 300),
  created_at timestamptz not null default now(),
  check (review_note is null or reviewed_at is not null),
  foreign key (session_id, student_id, tutor_id)
    references public.teaching_sessions (id, student_id, tutor_id) on delete cascade
);
create index homework_student_open on public.homework (student_id, reviewed_at, due_on);

alter table public.homework enable row level security;

-- Parent: all homework of their child. Tutor: only homework they gave, while still actively
-- assigned (D3). Student: their own homework, whoever gave it.
create policy homework_select on public.homework
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or (tutor_id = (select auth.uid()) and public.is_active_tutor_of(student_id))
    or public.is_self_student(student_id)
  );

revoke all on public.homework from anon, authenticated;
grant select on public.homework to authenticated;
grant select, insert, update, delete on public.homework to service_role;
revoke all on function public.homework_links_ok(text[]) from public;
grant execute on function public.homework_links_ok(text[]) to authenticated, service_role;
