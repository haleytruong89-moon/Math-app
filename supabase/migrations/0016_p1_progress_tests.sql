-- Kiểm tra tiến bộ (progress tests), 08/11/2026 — docs/superpowers/specs/2026-11-08-ke-hoach-8-5-design.md.
-- Progress tests share the thi thử tables: `kind` tells them apart, papers 1–20 are KT1–KT20, a part the student has not
-- learnt yet can be "chưa học" (skipped, left out of the score), and in-app tests (slice A2) store the answers and are
-- graded by the server (no grader). RLS policies are unchanged: they only look at student_id and graded_at.
-- Apply once with the "Áp dụng SQL" button (backup first). Idempotent where it can be.

alter table public.mock_exams add column if not exists kind text not null default 'mock';
alter table public.mock_exams add column if not exists answers jsonb;
alter table public.mock_scores add column if not exists skipped boolean not null default false;

-- Drop the 0015 checks/unique that assume thi thử only, found by definition (their names were generated).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.mock_exams'::regclass
      and (
        (contype = 'c' and pg_get_constraintdef(oid) like '%paper >= 57%')
        or (contype = 'c' and pg_get_constraintdef(oid) like '%graded_by%')
        or (contype = 'u' and pg_get_constraintdef(oid) = 'UNIQUE (student_id, paper)')
      )
  loop
    execute format('alter table public.mock_exams drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.mock_exams drop constraint if exists mock_exams_kind_check;
alter table public.mock_exams add constraint mock_exams_kind_check check (kind in ('mock', 'progress'));
alter table public.mock_exams drop constraint if exists mock_exams_paper_kind_check;
alter table public.mock_exams add constraint mock_exams_paper_kind_check
  check ((kind = 'mock' and paper between 57 and 68) or (kind = 'progress' and paper between 1 and 20));
alter table public.mock_exams drop constraint if exists mock_exams_student_kind_paper_key;
alter table public.mock_exams add constraint mock_exams_student_kind_paper_key unique (student_id, kind, paper);
-- Graded ⇔ a grader, except progress tests graded by the server (in-app).
alter table public.mock_exams drop constraint if exists mock_exams_graded_check;
alter table public.mock_exams add constraint mock_exams_graded_check
  check ((graded_at is null and graded_by is null) or (graded_at is not null and (graded_by is not null or kind = 'progress')));

alter table public.mock_scores drop constraint if exists mock_scores_skipped_check;
alter table public.mock_scores add constraint mock_scores_skipped_check check (not skipped or points = 0);
