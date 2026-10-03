-- 0006 (P1 slice 3): tutor "Ghi buổi dạy" (§2.7, D2, D3, D8).
-- A teaching session = one lesson a tutor gave one student on one date, plus the level
-- (M0–M4) the tutor proposes for each knowledge unit taught in it. The system level at the
-- moment of the proposal is snapshotted so the parent can later see what the tutor saw (D8).
-- Clients may only SELECT (RLS); writes go through the server action with service_role.

create table public.teaching_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete restrict, -- history stays with this tutor (D3)
  taught_on date not null,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (id, student_id, tutor_id) -- target of the proposals' composite FK
);
create index teaching_sessions_student_day on public.teaching_sessions (student_id, taught_on desc);
create index teaching_sessions_tutor_time on public.teaching_sessions (tutor_id, created_at desc);

-- One row per unit ticked in a session. student_id/tutor_id are repeated (and pinned to the
-- session by the composite FK) so RLS and the parent's "latest proposal per unit" stay simple.
create table public.tutor_proposals (
  session_id uuid not null,
  student_id uuid not null,
  tutor_id uuid not null,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  level smallint not null check (level between 0 and 4),
  system_level smallint not null check (system_level between 0 and 4), -- snapshot when proposed
  answers integer not null check (answers >= 0),                       -- snapshot: answers behind system_level
  created_at timestamptz not null default now(),
  primary key (session_id, unit_id),
  foreign key (session_id, student_id, tutor_id)
    references public.teaching_sessions (id, student_id, tutor_id) on delete cascade
);
create index tutor_proposals_student_unit_time on public.tutor_proposals (student_id, unit_id, created_at desc);

alter table public.teaching_sessions enable row level security;
alter table public.tutor_proposals enable row level security;

-- Parents see every session of their child; a tutor sees only their OWN sessions, and only
-- while still actively assigned (a previous tutor's history is not shown to the next one, D3).
-- Students do not read these tables.
create policy teaching_sessions_select on public.teaching_sessions
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or (tutor_id = (select auth.uid()) and public.is_active_tutor_of(student_id))
  );

create policy tutor_proposals_select on public.tutor_proposals
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or (tutor_id = (select auth.uid()) and public.is_active_tutor_of(student_id))
  );

revoke all on public.teaching_sessions, public.tutor_proposals from anon, authenticated;
grant select on public.teaching_sessions, public.tutor_proposals to authenticated;
grant select, insert, update, delete on public.teaching_sessions, public.tutor_proposals to service_role;
