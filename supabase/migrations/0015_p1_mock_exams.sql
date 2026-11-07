-- 0015 (S9, 07/11/2026): Thi thử — mock exams on Đề 57–68. Design: docs/superpowers/specs/2026-11-06-thi-thu-design.md §4.
-- The student sits the paper on paper; the app keeps the schedule, the start/finish times and the tutor's points per part.
-- The score sheet (parts, max points, answers, KUs) lives in git (content/thi-thu.json), so "points ≤ max" and
-- "every part scored" are checked by the server action. RLS on; reads by policy; writes only by the server (service_role).

create table public.mock_exams (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  paper smallint not null check (paper between 57 and 68),
  scheduled_on date not null,
  started_at timestamptz,
  finished_at timestamptz,
  graded_by uuid references public.profiles (id),
  graded_at timestamptz,
  total numeric(4,2) check (total between 0 and 10),
  comment text check (char_length(comment) <= 500),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (student_id, paper),
  check (finished_at is null or started_at is not null),
  check ((graded_at is null) = (graded_by is null)),
  check ((graded_at is null) = (total is null))
);
create index mock_exams_student on public.mock_exams (student_id, scheduled_on);

create table public.mock_scores (
  exam_id bigint not null references public.mock_exams (id) on delete cascade,
  part text not null check (part ~ '^[1-5](\.[1-9][a-c]?)?$'),
  points numeric(3,2) not null check (points >= 0 and points <= 4 and points * 4 = floor(points * 4)),
  error_code text check (error_code ~ '^E\d{2}$'),
  note text check (char_length(note) <= 300),
  primary key (exam_id, part)
);

alter table public.mock_exams enable row level security;
alter table public.mock_scores enable row level security;

-- Adults of the student read everything; the student reads her own exams, and her points only once graded.
create policy mock_exams_select on public.mock_exams for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

create policy mock_scores_select on public.mock_scores for select to authenticated
  using (exists (
    select 1 from public.mock_exams e
    where e.id = exam_id
      and (public.is_parent_of(e.student_id) or public.is_active_tutor_of(e.student_id)
           or (public.is_self_student(e.student_id) and e.graded_at is not null))
  ));

revoke all on public.mock_exams, public.mock_scores from anon, authenticated;
grant select on public.mock_exams, public.mock_scores to authenticated;
grant select, insert, update, delete on public.mock_exams, public.mock_scores to service_role;
