-- 0010 (S6b): pre-written hints H1–H3 (AI2). The highest hint a student opened before answering
-- a practice item; an answer after H2+ doesn't count as right first time for M2 (src/lib/learning/rules.ts).
-- Only adds a column with a default: existing rows read as 0 (no hint). attempts keeps its RLS
-- (read: parent / active tutor / the student; writes through server actions with service_role).

alter table public.attempts
  add column hint_level smallint not null default 0 check (hint_level between 0 and 3);
