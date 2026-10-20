-- 0012 (S10, T7–T8, 20/10/2026): content review in the app and tutor priorities.
-- Content stays in git (D16). A verdict per item (latest row wins) and an approve/return action per unit
-- (latest row wins) live here, each with hashes of the content as reviewed, computed by the server:
-- grading_hash = options/order/right option/right value/steps (same key as the H2 lock), content_hash = whole item.
-- item_id '_lesson' = the theory + worked example + faded example block.
-- Reads: reviews → parent and active tutors; approvals → any signed-in user; priorities → parent, active tutor
-- of the student, the student. Writes: server actions with service_role only.

create table public.item_reviews (
  id bigint generated always as identity primary key,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  item_id text not null check (item_id ~ '^([a-z0-9-]+|_lesson)$'),
  verdict text not null check (verdict in ('ok', 'fix')),
  note text check (char_length(note) between 1 and 500),
  grading_hash text not null check (grading_hash ~ '^[0-9a-f]{16}$'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{16}$'),
  reviewer_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check (verdict = 'ok' or note is not null)
);
create index item_reviews_unit_item on public.item_reviews (unit_id, item_id, created_at desc);

create table public.unit_approvals (
  id bigint generated always as identity primary key,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  action text not null check (action in ('approve', 'return')),
  note text check (char_length(note) between 1 and 500),
  actor_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);
create index unit_approvals_unit on public.unit_approvals (unit_id, created_at desc);

create table public.tutor_priorities (
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  position smallint not null check (position between 1 and 20),
  set_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (student_id, unit_id),
  unique (student_id, position)
);

alter table public.item_reviews enable row level security;
alter table public.unit_approvals enable row level security;
alter table public.tutor_priorities enable row level security;

create policy item_reviews_select on public.item_reviews
  for select to authenticated
  using (public.current_app_role() in ('parent', 'tutor')
         and (public.current_app_role() = 'parent'
              or exists (select 1 from public.tutor_assignments a where a.tutor_id = (select auth.uid()) and a.ended_at is null)));

create policy unit_approvals_select on public.unit_approvals
  for select to authenticated
  using (public.current_app_role() is not null);

create policy tutor_priorities_select on public.tutor_priorities
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

revoke all on public.item_reviews, public.unit_approvals, public.tutor_priorities from anon, authenticated;
grant select on public.item_reviews, public.unit_approvals, public.tutor_priorities to authenticated;
grant select, insert, update, delete on public.item_reviews, public.unit_approvals, public.tutor_priorities to service_role;
