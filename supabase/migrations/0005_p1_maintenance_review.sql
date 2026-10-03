-- 0005: maintenance reviews after D+21 (parent decision 03/10/2026, Q5).
-- stage 4 = maintenance, every 60 days until the exam. A unit always has a next due
-- date now; completed_at marks "passed D+21" (M4) and is cleared if a review fails.

alter table public.review_queue drop constraint if exists review_queue_check;
alter table public.review_queue drop constraint if exists review_queue_stage_check;
alter table public.review_queue
  add constraint review_queue_stage_check check (stage between 1 and 4),
  add constraint review_queue_due_set check (due_on is not null),
  add constraint review_queue_completed_is_maintenance check ((completed_at is not null) = (stage = 4));
comment on column public.review_queue.stage is 'Next review: 1 = D+1, 2 = D+7, 3 = D+21, 4 = maintenance every 60 days';
comment on column public.review_queue.completed_at is 'When D+21 was passed (M4); cleared when a later review fails';

alter table public.review_log drop constraint if exists review_log_stage_check;
alter table public.review_log add constraint review_log_stage_check check (stage between 1 and 4);
