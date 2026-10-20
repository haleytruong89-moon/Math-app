-- 0013 (S11, T9, 20/10/2026): homework from the tutor's "Giao bài" tab.
-- items = practice item ids of unit_id the student does in the app (null = whole unit, or paper homework);
-- answers are graded on the server and recorded as practice (they count toward mastery, unlike paper homework).
-- session_id becomes optional: homework can be given without logging a session. With session_id null the
-- composite FK to teaching_sessions is not checked (MATCH SIMPLE); tutor_id/student_id stay required.
-- RLS unchanged (0007): parent, the tutor who gave it while assigned, the student.

create function public.homework_items_ok(unit text, l text[]) returns boolean
  language sql immutable set search_path = ''
  as $$ select l is null or (unit is not null and cardinality(l) between 1 and 20
         and (select bool_and(x ~ ('^' || unit || '-[a-z0-9-]+$')) from unnest(l) as x)) $$;

alter table public.homework alter column session_id drop not null;
alter table public.homework add column items text[] check (public.homework_items_ok(unit_id, items));

revoke all on function public.homework_items_ok(text, text[]) from public;
grant execute on function public.homework_items_ok(text, text[]) to authenticated, service_role;
