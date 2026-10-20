-- 0011 (audit fix H1, 20/10/2026): the server decides the questions of a review run.
-- Before: the browser made up the run id and finishReview scored whatever answers the run had,
-- so a run with 1 of 6 questions answered could pass. Now the first answer of a review creates
-- the run here with its planned questions; only planned questions are accepted, each once, and the
-- run is scored only when every planned question has an answer. One open run per student.
-- Additive only: existing tables are untouched (old browser-made runs are simply never scored).

create table public.review_runs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  -- Planned questions in the order asked, each "<unit_id>/<item_id>".
  items text[] not null check (cardinality(items) between 1 and 40),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create unique index review_runs_one_open on public.review_runs (student_id) where finished_at is null;

comment on column public.attempts.exit_run is 'Groups the answers of one exit-test run, or the review_runs.id of a review';

alter table public.review_runs enable row level security;

create policy review_runs_select on public.review_runs
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

revoke all on public.review_runs from anon, authenticated;
grant select on public.review_runs to authenticated;
grant select, insert, update, delete on public.review_runs to service_role;
