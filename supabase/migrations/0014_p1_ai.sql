-- 0014 (S8, 22/10/2026): AI. Design: docs/superpowers/specs/2026-10-22-s8-ai-design.md §4.
-- S8a uses ai_settings, ai_usage, ai_reports; S8b uses ai_messages, ai_eval_cases, ai_eval_results and
-- attempts.hint_level = 4 (the student asked AI before answering). One file so the parent applies SQL once.
-- Every table: RLS on; reads by policy; writes only by the server (service_role).

alter table public.attempts drop constraint attempts_hint_level_check;
alter table public.attempts add constraint attempts_hint_level_check check (hint_level between 0 and 4);

create table public.ai_settings (
  id smallint primary key default 1 check (id = 1),
  staff_enabled boolean not null default true,
  staff_model text not null default 'claude-haiku-5-5' check (staff_model ~ '^claude-[a-z0-9-]+$'),
  student_enabled boolean not null default false,
  student_model text not null default 'claude-haiku-5-5' check (student_model ~ '^claude-[a-z0-9-]+$'),
  student_prompt_version text check (student_prompt_version ~ '^[0-9a-f]{12}$'),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  check (not student_enabled or student_prompt_version is not null)
);
insert into public.ai_settings (id) values (1);

create table public.ai_usage (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('weekly', 'brief', 'student', 'eval')),
  student_id uuid references public.students (id) on delete set null,
  model text not null check (model ~ '^claude-[a-z0-9-]+$'),
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  cost_micros integer not null check (cost_micros >= 0),
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  created_at timestamptz not null default now()
);
create index ai_usage_month on public.ai_usage (month, id);

create table public.ai_reports (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('weekly', 'brief')),
  student_id uuid not null references public.students (id) on delete cascade,
  tutor_id uuid references public.profiles (id),
  period text not null check (char_length(period) between 10 and 120),
  facts jsonb not null,
  ai jsonb,
  comment_status text not null check (comment_status in ('ok', 'failed', 'off', 'none')),
  model text check (model ~ '^claude-[a-z0-9-]+$'),
  created_at timestamptz not null default now(),
  unique (kind, student_id, period),
  check ((kind = 'brief') = (tutor_id is not null)),
  check ((comment_status = 'ok') = (ai is not null))
);
create index ai_reports_student on public.ai_reports (student_id, kind, created_at desc);

create table public.ai_messages (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  item_id text not null check (item_id ~ '^[a-z0-9-]+$'),
  mode text not null check (mode in ('practice', 'review', 'worked')),
  thread uuid not null,
  role text not null check (role in ('student', 'ai', 'fallback')),
  content text not null check (char_length(content) between 1 and 2000),
  guard jsonb,
  flag text check (flag in ('student', 'guard')),
  flagged_at timestamptz,
  model text check (model ~ '^claude-[a-z0-9-]+$'),
  day date not null,
  created_at timestamptz not null default now(),
  check ((flag is null) = (flagged_at is null))
);
create index ai_messages_student_day on public.ai_messages (student_id, day);
create index ai_messages_thread on public.ai_messages (thread, created_at);

create table public.ai_eval_cases (
  id bigint generated always as identity primary key,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  item_id text not null check (item_id ~ '^[a-z0-9-]+$'),
  mode text not null check (mode in ('practice', 'review', 'worked')),
  stage text not null check (stage in ('before', 'after')),
  answer text check (char_length(answer) <= 200),
  error_code text check (error_code ~ '^E\d{2}$'),
  question text not null check (char_length(question) between 1 and 300),
  archived boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.ai_eval_results (
  id bigint generated always as identity primary key,
  case_id bigint not null references public.ai_eval_cases (id) on delete cascade,
  model text not null check (model ~ '^claude-[a-z0-9-]+$'),
  prompt_version text not null check (prompt_version ~ '^[0-9a-f]{12}$'),
  output text not null check (char_length(output) <= 2000),
  guard jsonb,
  scores smallint[] check (scores is null or (cardinality(scores) = 6 and 0 <= all (scores) and 2 >= all (scores))),
  math_wrong boolean,
  scored_by uuid references public.profiles (id),
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  unique (case_id, model, prompt_version),
  check ((scores is null) = (scored_at is null)),
  check ((scores is null) = (math_wrong is null))
);

alter table public.ai_settings enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_reports enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_eval_cases enable row level security;
alter table public.ai_eval_results enable row level security;

create policy ai_settings_select on public.ai_settings for select to authenticated using (public.current_app_role() = 'parent');
create policy ai_usage_select on public.ai_usage for select to authenticated using (public.current_app_role() = 'parent');
create policy ai_eval_cases_select on public.ai_eval_cases for select to authenticated using (public.current_app_role() = 'parent');
create policy ai_eval_results_select on public.ai_eval_results for select to authenticated using (public.current_app_role() = 'parent');

create policy ai_reports_select on public.ai_reports for select to authenticated
  using (public.is_parent_of(student_id)
         or (kind = 'brief' and tutor_id = (select auth.uid()) and public.is_active_tutor_of(student_id)));

create policy ai_messages_select on public.ai_messages for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

revoke all on public.ai_settings, public.ai_usage, public.ai_reports, public.ai_messages, public.ai_eval_cases, public.ai_eval_results from anon, authenticated;
grant select on public.ai_settings, public.ai_usage, public.ai_reports, public.ai_messages, public.ai_eval_cases, public.ai_eval_results to authenticated;
grant select, insert, update, delete on public.ai_settings, public.ai_usage, public.ai_reports, public.ai_messages, public.ai_eval_cases, public.ai_eval_results to service_role;
