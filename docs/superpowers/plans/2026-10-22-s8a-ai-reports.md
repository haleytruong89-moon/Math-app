# S8a — AI foundation, weekly report, tutor brief Implementation Plan

> **For agentic workers:** Implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The parent gets a weekly report every Monday morning, and the tutor gets a brief before each session. In both, the numbers come from the database through templates. AI only writes a short comment, and the server cross-checks every number in it. Every AI call is counted against a $10/month cap. This slice also lays the AI foundation (client, spend, guard, settings, one migration) that S8b — the student's AI — builds on.

**Architecture:**
- Pure modules in `src/lib/ai/` (`rules.ts`, `guard.ts`, `messages.ts`, `weekly.ts`, `brief.ts`, `prompts.ts`) are unit-tested with `node --test`.
- Server-only modules wrap them:
  - `client.ts`: one `fetch` to the Messages API, never throws.
  - `usage.ts`: settings, monthly spend, gate, recording.
  - `reports.ts`: loads data, builds facts, generates and stores in `ai_reports`.
- Entry points:
  - a Vercel cron route on Monday;
  - parent pages `/parent/bao-cao` and `/parent/ai`;
  - a button on the tutor's Buổi dạy page.
- Migration **0014** creates every AI table for S8a and S8b.

**Tech Stack:**
- Next.js 16 App Router (read `node_modules/next/dist/docs/` before using a Next API, e.g. route segment config `maxDuration`, `PageProps`, `searchParams`).
- React 19, TypeScript, zod 4, Tailwind v4 tokens.
- Supabase Postgres + RLS.
- Anthropic Messages API over `fetch`: no new dependency.
- `node --test`; Playwright e2e on PGlite (`e2e/run.sh`).

**Spec:** `docs/superpowers/specs/2026-10-22-s8-ai-design.md` (+ `docs/AI_TUTOR.md`, `docs/SPEC.md` §0 rows AI1–AI4 and 22/10 "S8 split").

## Global Constraints

**Repo and process**
- Branch `p1-slice-8` from `main`. Never push `main`. Never merge. Never run SQL on Supabase; never trigger "Áp dụng SQL".
- Migration number **0014** (check `supabase/migrations/` on `main` and open PRs first; `repo-rules.test.ts` enforces uniqueness).
- Before every push: `npm run lint`, `npm test`, `npm run build`, then commit, then `./e2e/run.sh`.

**Secrets**
- `ANTHROPIC_API_KEY` is read only in `src/lib/ai/client.ts` on the server.
- Never log, print, return or commit the key, and never put it in a `NEXT_PUBLIC_` variable.
- Log only the HTTP status or error name of a failed call, never the prompt text.
- `CRON_SECRET` is already used by `/api/cron/ping`; reuse it.

**Language**
- UI text is Vietnamese. Code, comments, commit messages and file names are English.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PW4e38FjjZZA447e8MpMDK
  ```

**AI rules (spec §2)**
- AI text is shown only after its check passes. A failed check regenerates once, then the template is shown without AI text.
- Numbers in AI text ⊂ numbers in the facts sent; integers ≤ 10 are allowed.
- Never send the student's name, school or class; say "con".
- Banned words (D17): `chuỗi`, `xếp hạng`, `hạng nhất`, `bảng vàng`.
- Cap: $10/month over all kinds; warn at ≥ 90 %; pause at ≥ 100 %.
- Default model for reports and briefs: `claude-haiku-5-5`.

**UI**
- Laptop first for the tutor and parent pages. Light theme only. Real `<button>`s.
- No streaks or leaderboards (D17).

---

## File map

| File | Responsibility |
|---|---|
| `supabase/migrations/0014_p1_ai.sql` | all AI tables (S8a + S8b), `hint_level` 0–4, RLS, grants |
| `supabase/tests/rls.test.mjs` | run 0014; RLS and constraint checks |
| `src/lib/ai/rules.ts` | models, prices, `AI_RULES`, `costMicros`, `monthKey`, `budget`, `spendByKind`, `usdLabel` |
| `src/lib/ai/guard.ts` | `numbersIn`, `allowedNumbers`, `unknownNumbers`, `bannedWords`, `jsonPart`, `Check`, `generateChecked` |
| `src/lib/ai/messages.ts` | Messages API request body + response parsing (pure) |
| `src/lib/ai/client.ts` | `callClaude`, `hasAiKey` (server-only; patched in e2e) |
| `src/lib/ai/usage.ts` | `aiSettings`, `monthSpendRows`, `staffAiOff`, `runAi` (server-only) |
| `src/lib/ai/prompts.ts` | `WEEKLY_SYSTEM`, `BRIEF_SYSTEM`, `promptVersion`, `weeklyUser`, `briefUser` |
| `src/lib/ai/weekly.ts` | `reportWeek`, `weeklyFacts`, `checkWeeklyComment` |
| `src/lib/ai/brief.ts` | `briefSince`, `briefFacts`, `checkBrief`, `fallbackPoints` |
| `src/lib/ai/reports.ts` | `buildWeeklyReport`, `buildBrief` (server-only) |
| `src/lib/cron.ts` | `cronAuthorized` (moved from the ping route) |
| `src/app/api/cron/weekly/route.ts` | Monday cron: a report per consented student |
| `vercel.json` | + cron `0 0 * * 1` |
| `src/app/parent/bao-cao/page.tsx` | weekly reports page |
| `src/components/parent/weekly-report.tsx` | `WeeklyReportView` |
| `src/app/parent/ai/page.tsx` | spend, settings, latest calls, prompt texts |
| `src/app/parent/actions.ts` | + `regenerateWeekly`, `saveAiSettings` |
| `src/app/parent/layout.tsx` | nav + "Báo cáo tuần", "AI" |
| `src/components/parent/student-overview.tsx` | link "Báo cáo tuần →" |
| `src/components/tutor/brief-panel.tsx` | `BriefPanel` |
| `src/app/tutor/[studentId]/buoi/page.tsx` | load + show the latest brief |
| `src/app/tutor/actions.ts` | + `createBrief` |
| `package.json` | `test:content` also runs `src/lib/ai/*.test.ts` |
| `e2e/patch/e2e-fake.ts`, `e2e/patch/patch.py`, `e2e/run.sh` | fake Claude, JSON params, two new flows |
| `e2e/report-flow.mjs`, `e2e/brief-flow.mjs` | browser flows |
| docs | `SPEC.md` §0, `DESIGN.md`, `AI_TUTOR.md` §8, `PROGRESS.md`, `HANDOFF.md`, `P1_PLAN.md` |

---

### Task 1: Migration 0014 + RLS tests

**Files:**
- Create: `supabase/migrations/0014_p1_ai.sql`
- Modify: `supabase/tests/rls.test.mjs` (load 0014 after 0013; checks before the "lock the tutor" block, plus two after it)

**Interfaces:**
- Produces tables: `ai_settings`, `ai_usage`, `ai_reports`, `ai_messages`, `ai_eval_cases`, `ai_eval_results`; `attempts.hint_level` 0–4.
- `ai_reports` columns used by later tasks: `kind`, `student_id`, `tutor_id`, `period`, `facts`, `ai`, `comment_status`, `model`, `created_at`.
- `ai_reports` upsert key: `kind,student_id,period`.

- [ ] **Step 1: Write the failing RLS checks**

In `supabase/tests/rls.test.mjs`, add the migration after the 0013 line:

```js
await db.exec(fs.readFileSync(`${repo}/migrations/0014_p1_ai.sql`, 'utf8'));
```

Insert this block **just before** `await db.exec(\`update public.profiles set is_active=false ...\`)`:

```js
// 0014: AI (S8) — settings, spend, reports/briefs, conversations, test set
const q14 = (sql) => db.query(sql).then(()=>'ok', e=>'ERROR '+e.message);
const nguyen14 = `(select id from public.students where full_name='Hạnh Nguyên')`;
const an14 = `(select id from public.students where full_name='Đăng An')`;
const tutor14 = `(select id from auth.users where email='trang@example.com')`;
const parent14 = `(select id from auth.users where email='me@example.com')`;
check('ai settings: one row, student AI off', (await db.query(`select student_enabled, staff_enabled, staff_model from public.ai_settings`)).rows, [{ student_enabled: false, staff_enabled: true, staff_model: 'claude-haiku-5-5' }]);
check('ai settings: no second row', isErr(await q14(`insert into public.ai_settings (id) values (2)`)), true);
check('ai settings: student AI needs a passed prompt version', isErr(await q14(`update public.ai_settings set student_enabled = true`)), true);
check('parent reads ai settings', (await as('me@example.com','select count(*)::int c from public.ai_settings'))[0].c, 1);
check('tutor and student read no ai settings', [(await as('trang@example.com','select count(*)::int c from public.ai_settings'))[0].c, (await as('nguyen@example.com','select count(*)::int c from public.ai_settings'))[0].c], [0, 0]);
check('service_role logs a call', await q14(`insert into public.ai_usage (kind, student_id, model, input_tokens, output_tokens, cost_micros, month) values ('weekly', ${nguyen14}, 'claude-haiku-5-5', 1000, 100, 150, '2026-10')`), 'ok');
check('usage: unknown kind refused', isErr(await q14(`insert into public.ai_usage (kind, model, input_tokens, output_tokens, cost_micros, month) values ('chat', 'claude-haiku-5-5', 1, 1, 1, '2026-10')`)), true);
check('only the parent reads usage', [(await as('me@example.com','select count(*)::int c from public.ai_usage'))[0].c, (await as('trang@example.com','select count(*)::int c from public.ai_usage'))[0].c, (await as('nguyen@example.com','select count(*)::int c from public.ai_usage'))[0].c], [1, 0, 0]);
check('weekly report saved', await q14(`insert into public.ai_reports (kind, student_id, period, facts, comment_status) values ('weekly', ${nguyen14}, '2026-10-19', '{}', 'off')`), 'ok');
check('one weekly report per student and week', isErr(await q14(`insert into public.ai_reports (kind, student_id, period, facts, comment_status) values ('weekly', ${nguyen14}, '2026-10-19', '{}', 'off')`)), true);
check('a brief needs its tutor', isErr(await q14(`insert into public.ai_reports (kind, student_id, period, facts, comment_status) values ('brief', ${nguyen14}, 'x/2026-10-08/2026-10-22', '{}', 'none')`)), true);
check('status ok needs the AI part', isErr(await q14(`insert into public.ai_reports (kind, student_id, period, facts, comment_status) values ('weekly', ${nguyen14}, '2026-10-12', '{}', 'ok')`)), true);
check('brief saved', await q14(`insert into public.ai_reports (kind, student_id, tutor_id, period, facts, ai, comment_status, model) values ('brief', ${nguyen14}, ${tutor14}, 'trang/2026-10-08/2026-10-22', '{}', '{"points":[]}', 'ok', 'claude-haiku-5-5')`), 'ok');
check('parent reads reports and briefs', (await as('me@example.com','select count(*)::int c from public.ai_reports'))[0].c, 2);
check('tutor reads only her briefs', (await as('trang@example.com','select kind from public.ai_reports')), [{ kind: 'brief' }]);
check('student reads no reports', (await as('nguyen@example.com','select count(*)::int c from public.ai_reports'))[0].c, 0);
check('hint level 4 (AI before answering) accepted', await q14(`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, hint_level) values (${nguyen14}, 'htl-1', 'htl-1-p1', 'practice', '1', true, 4)`), 'ok');
check('hint level 5 refused', isErr(await q14(`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, hint_level) values (${nguyen14}, 'htl-1', 'htl-1-p2', 'practice', '1', true, 5)`)), true);
check('ai message saved', await q14(`insert into public.ai_messages (student_id, unit_id, item_id, mode, thread, role, content, day) values (${nguyen14}, 'htl-1', 'htl-1-p1', 'practice', gen_random_uuid(), 'student', 'Con chưa hiểu bước 2', current_date)`), 'ok');
check('ai message: unknown role refused', isErr(await q14(`insert into public.ai_messages (student_id, unit_id, item_id, mode, thread, role, content, day) values (${nguyen14}, 'htl-1', 'htl-1-p1', 'practice', gen_random_uuid(), 'teacher', 'x', current_date)`)), true);
check('ai message: a flag needs its time', isErr(await q14(`insert into public.ai_messages (student_id, unit_id, item_id, mode, thread, role, content, day, flag) values (${nguyen14}, 'htl-1', 'htl-1-p1', 'practice', gen_random_uuid(), 'ai', 'x', current_date, 'student')`)), true);
check('ai messages: student own, parent, tutor; not another student', [(await as('nguyen@example.com','select count(*)::int c from public.ai_messages'))[0].c, (await as('me@example.com','select count(*)::int c from public.ai_messages'))[0].c, (await as('trang@example.com','select count(*)::int c from public.ai_messages'))[0].c, (await as('an@example.com','select count(*)::int c from public.ai_messages'))[0].c], [1, 1, 1, 0]);
check('eval case saved', await q14(`insert into public.ai_eval_cases (unit_id, item_id, mode, stage, answer, error_code, question, created_by) values ('htl-1', 'htl-1-p1', 'practice', 'after', '2', 'E01', 'Con chưa hiểu vì sao sai', ${parent14})`), 'ok');
check('eval result: 6 scores 0–2 or none', [isErr(await q14(`insert into public.ai_eval_results (case_id, model, prompt_version, output, scores, math_wrong, scored_at) values ((select max(id) from public.ai_eval_cases), 'claude-haiku-5-5', '0123456789ab', 'x', '{2,2,2,2,2}', false, now())`)), await q14(`insert into public.ai_eval_results (case_id, model, prompt_version, output) values ((select max(id) from public.ai_eval_cases), 'claude-haiku-5-5', '0123456789ab', 'x')`)], [true, 'ok']);
check('only the parent reads the test set', [(await as('me@example.com','select count(*)::int c from public.ai_eval_results'))[0].c, (await as('trang@example.com','select count(*)::int c from public.ai_eval_cases'))[0].c], [1, 0]);
check('nobody writes AI tables directly', [isErr(await as('me@example.com',`update public.ai_settings set staff_enabled = false`)) || (await db.query(`select staff_enabled from public.ai_settings`)).rows[0].staff_enabled === true, isErr(await as('nguyen@example.com',`insert into public.ai_messages (student_id, unit_id, item_id, mode, thread, role, content, day) values (${nguyen14}, 'htl-1', 'htl-1-p1', 'practice', gen_random_uuid(), 'student', 'x', current_date)`))], [true, true]);
```

Add these **after** the existing "locked tutor …" checks, before the final `console.log`:

```js
check('locked tutor reads no briefs', (await as('trang@example.com','select count(*)::int c from public.ai_reports'))[0].c, 0);
check('locked tutor reads no ai messages', (await as('trang@example.com','select count(*)::int c from public.ai_messages'))[0].c, 0);
```

- [ ] **Step 2: Run to see it fail**

Run: `npm run test:db`
Expected: crash with `ENOENT ... 0014_p1_ai.sql`.

- [ ] **Step 3: Write the migration**

`supabase/migrations/0014_p1_ai.sql`:

```sql
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
```

- [ ] **Step 4: Run the DB tests**

Run: `npm run test:db`
Expected: `ALL PASSED`.

If `attempts_hint_level_check` has a different name, find it with `select conname from pg_constraint where conrelid = 'public.attempts'::regclass` and use that name.

- [ ] **Step 5: Run the full unit tests**

Run: `npm test`
Expected: all pass. `repo-rules.test.ts` accepts 0014 as unique.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0014_p1_ai.sql supabase/tests/rls.test.mjs
git commit -m "feat(S8): migration 0014 — AI settings, spend, reports, conversations, test set; hint level 0–4"
```

---

### Task 2: Pure AI rules and guard

**Files:**
- Create: `src/lib/ai/rules.ts`, `src/lib/ai/guard.ts`
- Test: `src/lib/ai/rules.test.ts`, `src/lib/ai/guard.test.ts`
- Modify: `package.json` (`test:content` glob)

**Interfaces:**
- Produces:
  - `AI_MODELS`, `type AiModel`, `isAiModel(s: unknown): s is AiModel`
  - `PRICES`, `AI_RULES`
  - `costMicros(model, inputTokens, outputTokens): number`
  - `monthKey(today: string): string`
  - `type Budget`, `budget(spentMicros, capUsd?): Budget`
  - `spendByKind(rows): { total: number; calls: number; byKind: Record<string, number> }`
  - `usdLabel(micros): string`
  - `numbersIn(text): string[]`, `allowedNumbers(...sources): Set<string>`, `unknownNumbers(text, allowed, smallMax?): string[]`
  - `bannedWords(text): string[]`, `jsonPart(raw): string`
  - `type Check<T>`, `type Generated<T>`, `generateChecked(gen, check, tries?)`

- [ ] **Step 1: Add the test glob**

In `package.json`, change `test:content` to:

```json
"test:content": "node --test src/lib/content/*.test.ts src/lib/learning/*.test.ts src/lib/accounts/*.test.ts src/lib/ai/*.test.ts",
```

- [ ] **Step 2: Write the failing tests**

`src/lib/ai/rules.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { budget, costMicros, isAiModel, monthKey, spendByKind, usdLabel } from "./rules.ts";

test("cost in micro-dollars, rounded up", () => {
  assert.equal(costMicros("claude-haiku-5-5", 1000, 100), 150); // 1000×0.1 + 100×0.5
  assert.equal(costMicros("claude-sonnet-5-5", 1000, 100), 3000); // 1000×2 + 100×10
  assert.equal(costMicros("claude-haiku-5-5", 3, 1), 1); // 0.8 → 1
});

test("models and month key", () => {
  assert.equal(isAiModel("claude-haiku-5-5"), true);
  assert.equal(isAiModel("gpt-x"), false);
  assert.equal(monthKey("2026-10-22"), "2026-10");
});

test("budget: warn at 90 %, pause at 100 % of $10", () => {
  assert.deepEqual(budget(8_999_999), { spentMicros: 8_999_999, capMicros: 10_000_000, ratio: 0.8999999, warn: false, paused: false });
  assert.equal(budget(9_000_000).warn, true);
  assert.equal(budget(9_000_000).paused, false);
  assert.equal(budget(10_000_000).paused, true);
});

test("spend by kind and labels", () => {
  const s = spendByKind([{ kind: "weekly", cost_micros: 150 }, { kind: "brief", cost_micros: 50 }, { kind: "weekly", cost_micros: 10 }]);
  assert.deepEqual(s, { total: 210, calls: 3, byKind: { weekly: 160, brief: 50 } });
  assert.equal(usdLabel(0), "$0,00");
  assert.equal(usdLabel(210), "< $0,01");
  assert.equal(usdLabel(1_234_567), "$1,23");
});
```

`src/lib/ai/guard.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedNumbers, bannedWords, generateChecked, jsonPart, numbersIn, unknownNumbers, type Check } from "./guard.ts";

test("numbers are read and normalised", () => {
  assert.deepEqual(numbersIn("Con làm 2,50 bài, 007 câu, mốc 8,5 hạn 21/02/2027"), ["2.5", "7", "8.5", "21", "2", "2027"]);
  assert.deepEqual(numbersIn("không có số"), []);
});

test("allowed numbers come from strings and JSON", () => {
  const a = allowedNumbers({ solid: 12, perWeek: 2.5, due: "2027-02-21", title: "Mốc 8,5" }, "lỗi E06");
  for (const n of ["12", "2.5", "2027", "2", "21", "8.5", "6"]) assert.ok(a.has(n), n);
});

test("unknown numbers: not in the data and bigger than 10", () => {
  const a = allowedNumbers({ solid: 12 });
  assert.deepEqual(unknownNumbers("12 bài vững, 3 bài cần chú ý", a), []);
  assert.deepEqual(unknownNumbers("đạt 60% và 12 bài, thêm 15 bài", a), ["60", "15"]);
  assert.deepEqual(unknownNumbers("2,5 bài mỗi tuần", a), ["2.5"]); // decimals are never "small"
});

test("banned words (D17)", () => {
  assert.deepEqual(bannedWords("Con giữ chuỗi 5 ngày"), ["chuỗi"]);
  assert.deepEqual(bannedWords("Con đứng Xếp Hạng nhì"), ["xếp hạng"]);
  assert.deepEqual(bannedWords("Tuần này con học đều"), []);
});

test("JSON part of a reply (code fences, text around)", () => {
  assert.equal(jsonPart('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(jsonPart('Đây: {"a":{"b":2}} xong'), '{"a":{"b":2}}');
  assert.equal(jsonPart("không có"), "");
});

const isShort = (t: string): Check<string> => (t.length <= 5 ? { ok: true, value: t } : { ok: false, reasons: ["dài"] });

test("generateChecked: first passes / second passes / both fail / AI off", async () => {
  const seq = (...xs: (string | null)[]) => {
    let i = 0;
    return async () => {
      const x = xs[i++];
      return x === null ? null : { text: x, model: "claude-haiku-5-5" };
    };
  };
  assert.deepEqual(await generateChecked(seq("ok"), isShort), { status: "ok", value: "ok", model: "claude-haiku-5-5" });
  assert.deepEqual(await generateChecked(seq("quá dài", "ok"), isShort), { status: "ok", value: "ok", model: "claude-haiku-5-5" });
  assert.deepEqual(await generateChecked(seq("quá dài", "vẫn dài"), isShort), { status: "failed", reasons: ["dài"] });
  assert.deepEqual(await generateChecked(seq(null), isShort), { status: "off" });
  assert.deepEqual(await generateChecked(seq("quá dài", null), isShort), { status: "failed", reasons: ["dài"] });
});
```

- [ ] **Step 3: Run to see them fail**

Run: `node --test src/lib/ai/*.test.ts`
Expected: FAIL, `Cannot find module './rules.ts'`.

- [ ] **Step 4: Implement**

`src/lib/ai/rules.ts`:

```ts
// S8 (AI4): models, prices, the monthly cap and spend maths. Pure, so `node --test` covers it.
// Prices are references of 22/10/2026 (spec §3) — check the official pricing page before switching on.

export const AI_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"] as const;
export type AiModel = (typeof AI_MODELS)[number];
export const isAiModel = (s: unknown): s is AiModel => (AI_MODELS as readonly unknown[]).includes(s);

/** USD per million tokens (prompts ≤ 100k tokens). */
export const PRICES: Record<AiModel, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

export const MODEL_LABEL: Record<AiModel, string> = {
  "claude-haiku-5-5": "Claude Haiku 5.5 (rẻ, nhanh)",
  "claude-sonnet-5-5": "Claude Sonnet 5.5 (tốt hơn, đắt hơn ~20 lần)",
};

export const AI_RULES = {
  monthlyCapUsd: 10, // AI4
  warnRatio: 0.9,
  smallNumberMax: 10, // AI_TUTOR §4 layer 3: small integers may appear in AI text
  weeklyCommentMaxChars: 900,
  briefPointMaxChars: 220,
  briefPointsMax: 3,
  timeoutMs: 25_000,
  bannedWords: ["chuỗi", "xếp hạng", "hạng nhất", "bảng vàng"], // D17: no streaks, no leaderboards
} as const;

/** One call's cost in micro-dollars (µ$), rounded up so the cap is never under-counted. */
export function costMicros(model: AiModel, inputTokens: number, outputTokens: number): number {
  const p = PRICES[model];
  return Math.ceil(inputTokens * p.input + outputTokens * p.output);
}

/** Spend is counted per Vietnam-time month: "YYYY-MM" of a YYYY-MM-DD date. */
export function monthKey(today: string): string {
  return today.slice(0, 7);
}

export type Budget = { spentMicros: number; capMicros: number; ratio: number; warn: boolean; paused: boolean };

export function budget(spentMicros: number, capUsd: number = AI_RULES.monthlyCapUsd): Budget {
  const capMicros = Math.round(capUsd * 1_000_000);
  const ratio = capMicros > 0 ? spentMicros / capMicros : 1;
  return { spentMicros, capMicros, ratio, warn: ratio >= AI_RULES.warnRatio, paused: ratio >= 1 };
}

export function spendByKind(rows: { kind: string; cost_micros: number }[]): { total: number; calls: number; byKind: Record<string, number> } {
  const byKind: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + r.cost_micros;
    total += r.cost_micros;
  }
  return { total, calls: rows.length, byKind };
}

/** "$1,23" (Vietnamese decimal comma); below one cent but not zero → "< $0,01". */
export function usdLabel(micros: number): string {
  if (micros > 0 && micros < 10_000) return "< $0,01";
  return `$${(micros / 1_000_000).toFixed(2).replace(".", ",")}`;
}
```

`src/lib/ai/guard.ts`:

```ts
// S8: the server's checks on AI text before anyone sees it (AI_TUTOR.md §4 layer 3, §5). Pure.
import { AI_RULES } from "./rules.ts";

const NUM = /\d+(?:[.,]\d+)?/g;

/** Every number written in a text, normalised: "2,50" → "2.5", "007" → "7". */
export function numbersIn(text: string): string[] {
  return (text.match(NUM) ?? []).map((n) => String(Number(n.replace(",", "."))));
}

/** The numbers any of these values contain (non-strings are read as JSON). */
export function allowedNumbers(...sources: unknown[]): Set<string> {
  const out = new Set<string>();
  for (const s of sources) for (const n of numbersIn(typeof s === "string" ? s : (JSON.stringify(s) ?? ""))) out.add(n);
  return out;
}

/** Numbers in `text` that are neither in `allowed` nor a small integer (≤ smallMax). Each once, in order. */
export function unknownNumbers(text: string, allowed: Set<string>, smallMax: number = AI_RULES.smallNumberMax): string[] {
  return [...new Set(numbersIn(text))].filter((n) => !allowed.has(n) && !(Number.isInteger(Number(n)) && Number(n) <= smallMax));
}

export function bannedWords(text: string): string[] {
  const t = text.toLowerCase();
  return AI_RULES.bannedWords.filter((w) => t.includes(w));
}

/** The JSON object inside a reply (models sometimes add code fences or a sentence): first "{" to last "}". */
export function jsonPart(raw: string): string {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  return a >= 0 && b > a ? raw.slice(a, b + 1) : "";
}

export type Check<T> = { ok: true; value: T } | { ok: false; reasons: string[] };
export type Generated<T> = { status: "ok"; value: T; model: string } | { status: "failed"; reasons: string[] } | { status: "off" };

/**
 * Ask, check, ask once more if the check fails (spec §2). `gen` returns null when AI is off, over budget or the
 * call failed: on the first try that is "off"; after a failed check it stays "failed".
 */
export async function generateChecked<T>(
  gen: () => Promise<{ text: string; model: string } | null>,
  check: (text: string) => Check<T>,
  tries = 2,
): Promise<Generated<T>> {
  let reasons: string[] = [];
  for (let i = 0; i < tries; i++) {
    const r = await gen();
    if (!r) return i === 0 ? { status: "off" } : { status: "failed", reasons };
    const c = check(r.text);
    if (c.ok) return { status: "ok", value: c.value, model: r.model };
    reasons = c.reasons;
  }
  return { status: "failed", reasons };
}
```

- [ ] **Step 5: Run the tests**

Run: `node --test src/lib/ai/*.test.ts`
Expected: PASS (10 tests).

If the `budget(8_999_999)` deep-equal fails on float `ratio`, assert `ratio` with `Math.abs(r.ratio - 0.8999999) < 1e-12` instead.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/ai/rules.ts src/lib/ai/guard.ts src/lib/ai/rules.test.ts src/lib/ai/guard.test.ts
git commit -m "feat(S8): AI rules (prices, cap, spend) and the number guard"
```

---

### Task 3: API client, spend recording, settings + e2e fake

**Files:**
- Create: `src/lib/ai/messages.ts`, `src/lib/ai/messages.test.ts`, `src/lib/ai/client.ts`, `src/lib/ai/usage.ts`
- Modify: `e2e/patch/e2e-fake.ts` (JSON params + `fakeClaude`), `e2e/patch/patch.py`, `e2e/run.sh` (revert list)

**Interfaces:**
- Consumes: `AiModel`, `costMicros`, `monthKey`, `budget`, `AI_RULES` (Task 2).
- Produces:
  - `type AiRequest = { model: AiModel; system: string; user: string; maxTokens: number }`
  - `requestBody(r)`, `parseResponse(json): AiResponse | null`
  - `type AiResponse = { text: string; inputTokens: number; outputTokens: number }`
  - `callClaude(req): Promise<AiResponse | null>`, `hasAiKey(): boolean`
  - `type AiSettings`, `aiSettings(): Promise<AiSettings>`
  - `monthSpendRows(month): Promise<{ kind: string; cost_micros: number }[]>`
  - `type AiOff = "no-key" | "disabled" | "budget"`, `staffAiOff(settings): Promise<AiOff | null>`
  - `type AiKind`, `runAi(kind, studentId, req): Promise<{ text: string; model: AiModel } | null>`

- [ ] **Step 1: Write the failing test**

`src/lib/ai/messages.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTHROPIC_VERSION, parseResponse, requestBody } from "./messages.ts";

test("request body: one user turn, system separate", () => {
  assert.deepEqual(requestBody({ model: "claude-haiku-5-5", system: "S", user: "U", maxTokens: 400 }), {
    model: "claude-haiku-5-5",
    max_tokens: 400,
    system: "S",
    messages: [{ role: "user", content: "U" }],
  });
  assert.equal(ANTHROPIC_VERSION, "2023-06-01");
});

test("response: text blocks joined, usage read; anything else → null", () => {
  const ok = { id: "m", content: [{ type: "text", text: "Xin " }, { type: "text", text: "chào" }], usage: { input_tokens: 12, output_tokens: 3 } };
  assert.deepEqual(parseResponse(ok), { text: "Xin chào", inputTokens: 12, outputTokens: 3 });
  assert.equal(parseResponse({ type: "error", error: { message: "x" } }), null);
  assert.equal(parseResponse(null), null);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node --test src/lib/ai/messages.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `messages.ts`**

```ts
// S8: the Anthropic Messages API request and response, pure (the fetch lives in client.ts).
import { z } from "zod";
import type { AiModel } from "./rules.ts";

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";

export type AiRequest = { model: AiModel; system: string; user: string; maxTokens: number };
export type AiResponse = { text: string; inputTokens: number; outputTokens: number };

export function requestBody(r: AiRequest) {
  return { model: r.model, max_tokens: r.maxTokens, system: r.system, messages: [{ role: "user" as const, content: r.user }] };
}

const Resp = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  usage: z.object({ input_tokens: z.number().int().min(0), output_tokens: z.number().int().min(0) }),
});

export function parseResponse(json: unknown): AiResponse | null {
  const r = Resp.safeParse(json);
  if (!r.success) return null;
  return {
    text: r.data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join(""),
    inputTokens: r.data.usage.input_tokens,
    outputTokens: r.data.usage.output_tokens,
  };
}
```

- [ ] **Step 4: Run the test**

Run: `node --test src/lib/ai/messages.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `client.ts`**

The two exported functions must start with exactly these lines; `patch.py` anchors on them.

```ts
import "server-only";
import { ANTHROPIC_URL, ANTHROPIC_VERSION, parseResponse, requestBody, type AiRequest, type AiResponse } from "./messages";
import { AI_RULES } from "./rules";

// S8: the only place that reads ANTHROPIC_API_KEY (set on Vercel by the parent). Never log the key or the prompt.

export function hasAiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** One Messages API call. Never throws: null on a missing key, an HTTP error, a timeout or an odd response. */
export async function callClaude(req: AiRequest): Promise<AiResponse | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify(requestBody(req)),
      signal: AbortSignal.timeout(AI_RULES.timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("callClaude: HTTP", res.status);
      return null;
    }
    return parseResponse(await res.json());
  } catch (e) {
    console.error("callClaude:", e instanceof Error ? e.name : "error");
    return null;
  }
}
```

- [ ] **Step 6: Implement `usage.ts`**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { vnDate } from "@/lib/learning/rules";
import { callClaude, hasAiKey } from "./client";
import type { AiRequest } from "./messages";
import { budget, costMicros, isAiModel, monthKey, type AiModel } from "./rules";

export type AiKind = "weekly" | "brief" | "student" | "eval";
export type AiOff = "no-key" | "disabled" | "budget";
export type AiSettings = {
  staffEnabled: boolean;
  staffModel: AiModel;
  studentEnabled: boolean;
  studentModel: AiModel;
  studentPromptVersion: string | null;
};

/** The settings row; if it can't be read, AI counts as off (safe side). */
export async function aiSettings(): Promise<AiSettings> {
  const { data, error } = await createAdminClient()
    .from("ai_settings")
    .select("staff_enabled, staff_model, student_enabled, student_model, student_prompt_version")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("aiSettings", error.message);
    return { staffEnabled: false, staffModel: "claude-haiku-5-5", studentEnabled: false, studentModel: "claude-haiku-5-5", studentPromptVersion: null };
  }
  return {
    staffEnabled: !!data.staff_enabled,
    staffModel: isAiModel(data.staff_model) ? data.staff_model : "claude-haiku-5-5",
    studentEnabled: !!data.student_enabled,
    studentModel: isAiModel(data.student_model) ? data.student_model : "claude-haiku-5-5",
    studentPromptVersion: (data.student_prompt_version as string | null) ?? null,
  };
}

/** Every call of a month (paged: the API returns at most 1000 rows per request). */
export async function monthSpendRows(month: string): Promise<{ kind: string; cost_micros: number }[]> {
  const admin = createAdminClient();
  const out: { kind: string; cost_micros: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from("ai_usage").select("kind, cost_micros").eq("month", month).order("id", { ascending: true }).range(from, from + 999);
    if (error) {
      console.error("monthSpendRows", error.message);
      // A spend we can't read must not let AI run past the cap.
      return [{ kind: "unknown", cost_micros: Number.MAX_SAFE_INTEGER }];
    }
    out.push(...((data ?? []) as { kind: string; cost_micros: number }[]));
    if (!data || data.length < 1000) return out;
  }
}

/** Why the adults' AI (weekly report, tutor brief) can't run now; null when it can. */
export async function staffAiOff(settings: AiSettings): Promise<AiOff | null> {
  if (!hasAiKey()) return "no-key";
  if (!settings.staffEnabled) return "disabled";
  const rows = await monthSpendRows(monthKey(vnDate()));
  return budget(rows.reduce((s, r) => s + r.cost_micros, 0)).paused ? "budget" : null;
}

/** Call + record the spend. The caller has checked the gate. null when the call failed. */
export async function runAi(kind: AiKind, studentId: string | null, req: AiRequest): Promise<{ text: string; model: AiModel } | null> {
  const r = await callClaude(req);
  if (!r) return null;
  const { error } = await createAdminClient().from("ai_usage").insert({
    kind,
    student_id: studentId,
    model: req.model,
    input_tokens: r.inputTokens,
    output_tokens: r.outputTokens,
    cost_micros: costMicros(req.model, r.inputTokens, r.outputTokens),
    month: monthKey(vnDate()),
  });
  if (error) console.error("ai_usage insert", error.message);
  return { text: r.text, model: req.model };
}
```

- [ ] **Step 7: Teach the e2e fake about AI and JSON columns**

In `e2e/patch/e2e-fake.ts`:

1. Replace `const lit = (v: unknown) => v;` with:

```ts
// jsonb columns (ai_reports.facts / ai) get plain objects; arrays stay arrays (text[] columns).
const lit = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) ? JSON.stringify(v) : v);
```

2. Append at the end of the file:

```ts
// S8: a scripted stand-in for the Messages API (no network in e2e). Picks its answer from the system prompt.
export async function fakeClaude(req: { system: string; user: string }) {
  let text = "";
  if (req.system.includes("«Nhận xét»")) {
    text = "Tuần này con học khá đều và đã làm bài ôn. Tuần tới nên chữa lại các lỗi tính toán trước khi học bài mới.";
  } else if (req.system.includes("chuẩn bị buổi dạy")) {
    const facts = JSON.parse(req.user.slice(req.user.indexOf("{"))) as { units: { id: string; title: string; wrong: number }[] };
    const units = facts.units.filter((u) => u.wrong > 0).slice(0, 2);
    text = JSON.stringify({ points: units.map((u) => ({ unit: u.id, text: `Chữa lại ${u.title}: cho con làm lại câu sai và nói to từng bước.` })) });
  }
  return { text, inputTokens: 1000, outputTokens: 100 };
}
```

In `e2e/patch/patch.py`, append:

```python
edit('src/lib/ai/client.ts','export function hasAiKey(): boolean {\n',
 'export function hasAiKey(): boolean {\n  if (process.env.E2E_ROLE) return true;\n')
edit('src/lib/ai/client.ts','export async function callClaude(req: AiRequest): Promise<AiResponse | null> {\n',
 'export async function callClaude(req: AiRequest): Promise<AiResponse | null> {\n  if (process.env.E2E_ROLE) { const f = await import("@/lib/e2e-fake"); return f.fakeClaude(req); }\n')
```

In `e2e/run.sh`, add `src/lib/ai/client.ts` to the `git checkout --` line inside `revert()`:

```bash
  git checkout -- src/lib/dal.ts src/lib/supabase/server.ts src/lib/supabase/admin.ts src/lib/ai/client.ts next.config.ts src/lib/content/registry.generated.ts
```

- [ ] **Step 8: Lint, unit tests, build**

Run: `npm run lint && npm test && npm run build`
Expected: no errors. The CI check `! grep -rn "E2E_ROLE\|e2e-fake" src` still passes, because only `patch.py` puts those strings into `src/`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/ai/messages.ts src/lib/ai/messages.test.ts src/lib/ai/client.ts src/lib/ai/usage.ts e2e/patch/e2e-fake.ts e2e/patch/patch.py e2e/run.sh
git commit -m "feat(S8): Messages API client, spend recording and settings; e2e fake Claude"
```

---

### Task 4: Weekly facts and the comment check (pure)

**Files:**
- Create: `src/lib/ai/weekly.ts`
- Test: `src/lib/ai/weekly.test.ts`

**Interfaces:**
- Consumes:
  - `weekSummary`, `type UnitHistory` (`src/lib/learning/overview.ts`)
  - `milestoneProgress`, `lateUnits` (`src/lib/learning/milestones.ts`)
  - `commonErrors` (`src/lib/learning/work.ts`), `errorLabel` (`src/lib/content/errors.ts`)
  - `systemMastery`, `addDays`, `weekStart`, `vnDate`, `RULES`, `type Level` (`src/lib/learning/rules.ts`)
  - `allowedNumbers`, `unknownNumbers`, `bannedWords`, `type Check` (Task 2)
- Produces:
  - `reportWeek(today): { from: string; to: string }`
  - `type WeeklyUnit`, `type WeeklyInput`, `type WeeklyFacts`
  - `weeklyFacts(input): WeeklyFacts`
  - `checkWeeklyComment(text, facts): Check<string>`

- [ ] **Step 1: Write the failing test**

`src/lib/ai/weekly.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Curriculum } from "../content/curriculum.ts";
import type { AttemptRow } from "../learning/rules.ts";
import { checkWeeklyComment, reportWeek, weeklyFacts, type WeeklyUnit } from "./weekly.ts";

const curriculum = Curriculum.parse({
  start: "2026-10-12",
  learnBy: "2026-11-30",
  phases: [
    { n: 1, from: "2026-10-12", to: "2026-10-25" },
    { n: 2, from: "2026-10-26", to: "2026-11-30" },
  ],
  milestones: [{ id: "a", title: "Mốc 8,5", due: "2026-10-25", phases: [1], mustSolid: ["u1"] }],
  modules: [{ id: "m", title: "M", domains: ["A"] }],
  units: [
    { id: "u1", module: "m", title: "Bài một", track: "A", seq: 1, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 1 },
    { id: "u2", module: "m", title: "Bài hai", track: "A", seq: 2, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 1 },
  ],
});

const at = (day: string) => `${day}T03:00:00Z`; // 10:00 in Hà Nội, same day
const a = (p: Partial<AttemptRow> & Pick<AttemptRow, "mode" | "correct" | "created_at">): AttemptRow => ({ item_id: "u1-p1", error_code: null, exit_run: null, ...p });

const u1: WeeklyUnit = {
  id: "u1",
  title: "Bài một",
  shown: 3,
  reviewDueOn: "2026-10-24",
  history: {
    workedViewed: true,
    reviewsCompleted: false,
    attempts: [
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-13") }), // the week before
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-20") }),
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-21") }),
      a({ mode: "practice", correct: false, error_code: "E02", created_at: at("2026-10-21") }),
      ...[1, 2, 3, 4, 5].map((i) => a({ item_id: `u1-x${i}`, mode: "exit", correct: true, exit_run: "r1", created_at: at("2026-10-22") })),
    ],
  },
};
const u2: WeeklyUnit = { id: "u2", title: "Bài hai", shown: 0, reviewDueOn: null, history: { workedViewed: false, reviewsCompleted: false, attempts: [] } };

const input = {
  today: "2026-10-26", // Monday → the report covers 19–25/10
  units: [u1, u2],
  curriculum,
  reviewLog: [{ created_at: at("2026-10-23") }, { created_at: at("2026-10-15") }],
  sessions: [{ taught_on: "2026-10-22" }],
  homework: [{ created_at: at("2026-10-20"), done_at: at("2026-10-21"), reviewed_at: null }],
};

test("report week = the full Monday–Sunday before", () => {
  assert.deepEqual(reportWeek("2026-10-26"), { from: "2026-10-19", to: "2026-10-25" });
  assert.deepEqual(reportWeek("2026-10-29"), { from: "2026-10-19", to: "2026-10-25" });
  assert.deepEqual(reportWeek("2026-11-01"), { from: "2026-10-19", to: "2026-10-25" }); // Sunday
});

test("weekly facts from the database rows", () => {
  const f = weeklyFacts(input);
  assert.equal(f.from, "2026-10-19");
  assert.equal(f.to, "2026-10-25");
  assert.equal(f.exits, 1);
  assert.equal(f.reviews, 1);
  assert.equal(f.sessions, 1);
  assert.deepEqual(f.homework, { given: 1, done: 1, reviewed: 0 });
  assert.deepEqual(f.newSolid, ["Bài một"]);
  assert.equal(f.overdueReviews, 1);
  assert.deepEqual(f.repeatedErrors, [{ code: "E01", label: "E01 — Tính toán sai", count: 2 }]);
  assert.deepEqual(f.milestones, [{ title: "Mốc 8,5", due: "2026-10-25", solid: 1, total: 2, perWeek: 1, late: 1 }]);
  assert.deepEqual(f.late, ["Bài hai"]);
  assert.equal(f.goalDays, 4);
});

test("the AI comment: only the facts' numbers, no banned words, not too long", () => {
  const f = weeklyFacts(input);
  assert.deepEqual(checkWeeklyComment("  Con làm 1 bài kiểm tra và vững thêm Bài một. Lỗi E01 lặp lại 2 lần.  ", f), {
    ok: true,
    value: "Con làm 1 bài kiểm tra và vững thêm Bài một. Lỗi E01 lặp lại 2 lần.",
  });
  const bad = checkWeeklyComment("Con đúng 75% số câu, giữ chuỗi học tốt.", f);
  assert.equal(bad.ok, false);
  assert.match(!bad.ok ? bad.reasons.join(" | ") : "", /75.*chuỗi/);
  assert.equal(checkWeeklyComment("x".repeat(901), f).ok, false);
  assert.equal(checkWeeklyComment("   ", f).ok, false);
});
```

- [ ] **Step 2: Run to see it fail**

Run: `node --test src/lib/ai/weekly.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `weekly.ts`**

```ts
// S8a: the weekly report's facts (spec §5.1). Pure: numbers come only from these rows, AI only comments on them.
import type { Curriculum } from "../content/curriculum.ts";
import { errorLabel } from "../content/errors.ts";
import { lateUnits, milestoneProgress } from "../learning/milestones.ts";
import { weekSummary, type UnitHistory } from "../learning/overview.ts";
import { addDays, RULES, systemMastery, vnDate, weekStart, type AttemptRow, type Level } from "../learning/rules.ts";
import { commonErrors } from "../learning/work.ts";
import { allowedNumbers, bannedWords, unknownNumbers, type Check } from "./guard.ts";
import { AI_RULES } from "./rules.ts";

/** The full Monday–Sunday week before the one `today` falls in. */
export function reportWeek(today: string): { from: string; to: string } {
  const from = addDays(weekStart(today), -7);
  return { from, to: addDays(from, 6) };
}

/** A KU the student can see, with what mastery is computed from and the level shown to the parent. */
export type WeeklyUnit = { id: string; title: string; history: UnitHistory; shown: Level; reviewDueOn: string | null };

export type WeeklyInput = {
  today: string;
  units: WeeklyUnit[];
  curriculum: Curriculum;
  reviewLog: { created_at: string }[];
  sessions: { taught_on: string }[];
  homework: { created_at: string; done_at: string | null; reviewed_at: string | null }[];
};

export type WeeklyFacts = {
  from: string;
  to: string;
  studyDays: number;
  goalDays: number;
  exits: number;
  reviews: number;
  sessions: number;
  homework: { given: number; done: number; reviewed: number };
  /** KUs that reached ≥ M3 (by the system) during the week. */
  newSolid: string[];
  /** Reviews overdue on the day the report is made. */
  overdueReviews: number;
  /** Error codes of the week's wrong answers seen ≥ 2×, top 5. */
  repeatedErrors: { code: string; label: string; count: number }[];
  milestones: { title: string; due: string; solid: number; total: number; perWeek: number; late: number }[];
  /** Late KUs (≤ 10), earliest phase first. */
  late: string[];
};

const levelAt = (h: UnitHistory, day: string): Level =>
  systemMastery({ ...h, attempts: h.attempts.filter((a) => vnDate(a.created_at) <= day) }).level;

export function weeklyFacts(input: WeeklyInput): WeeklyFacts {
  const { from, to } = reportWeek(input.today);
  const attempts = input.units.flatMap((u) => u.history.attempts);
  const s = weekSummary({ attempts, reviewLog: input.reviewLog, sessions: input.sessions, homework: input.homework, today: to });
  const inWeek = (a: AttemptRow) => {
    const d = vnDate(a.created_at);
    return d >= from && d <= to;
  };
  const ms = { levels: new Map(input.units.map((u) => [u.id, u.shown])), withContent: new Set(input.units.map((u) => u.id)), today: input.today };
  return {
    from,
    to,
    studyDays: Math.min(s.studyDays, RULES.weeklyGoalDays),
    goalDays: RULES.weeklyGoalDays,
    exits: s.exits,
    reviews: s.reviews,
    sessions: s.sessions,
    homework: { given: s.homeworkGiven, done: s.homeworkDone, reviewed: s.homeworkReviewed },
    newSolid: input.units.filter((u) => levelAt(u.history, to) >= 3 && levelAt(u.history, addDays(from, -1)) < 3).map((u) => u.title),
    overdueReviews: input.units.filter((u) => u.reviewDueOn !== null && u.reviewDueOn < input.today).length,
    repeatedErrors: commonErrors(attempts.filter(inWeek))
      .slice(0, 5)
      .map((e) => ({ code: e.code, label: errorLabel(e.code) ?? e.code, count: e.count })),
    milestones: milestoneProgress(input.curriculum, ms).map((m) => ({ title: m.title, due: m.due, solid: m.solid, total: m.total, perWeek: m.perWeek, late: m.late.length })),
    late: lateUnits(input.curriculum, ms)
      .slice(0, 10)
      .map((u) => u.title),
  };
}

/** The AI "Nhận xét": plain text, every number from the facts, no banned word, ≤ 900 characters. */
export function checkWeeklyComment(text: string, facts: WeeklyFacts): Check<string> {
  const t = text.trim();
  const reasons: string[] = [];
  if (!t) reasons.push("trống");
  if (t.length > AI_RULES.weeklyCommentMaxChars) reasons.push("quá dài");
  const unknown = unknownNumbers(t, allowedNumbers(facts));
  if (unknown.length) reasons.push(`số không có trong dữ liệu: ${unknown.join(", ")}`);
  const banned = bannedWords(t);
  if (banned.length) reasons.push(`từ không dùng: ${banned.join(", ")}`);
  return reasons.length ? { ok: false, reasons } : { ok: true, value: t };
}
```

- [ ] **Step 4: Run the test**

Run: `node --test src/lib/ai/weekly.test.ts`
Expected: PASS. If `exits` or `newSolid` differ, check the definitions in `rules.ts`:
- `exitReachesM3`: ≥ 80 % right on the latest exit run.
- `lastExitRun`: one run per `exit_run`.
Fix the **test data**, not the rule.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/weekly.ts src/lib/ai/weekly.test.ts
git commit -m "feat(S8a): weekly report facts and the comment check"
```

---

### Task 5: Tutor brief facts, check and fallback (pure) + prompts

**Files:**
- Create: `src/lib/ai/brief.ts`, `src/lib/ai/prompts.ts`
- Test: `src/lib/ai/brief.test.ts`, `src/lib/ai/prompts.test.ts`

**Interfaces:**
- Consumes: `commonErrors`, `errorLabel`, `addDays`, `vnDate`, `type AttemptRow`, `type Level`, guard helpers, `AI_RULES`, `WeeklyFacts` (Task 4).
- Produces:
  - `BRIEF_LOOKBACK_DAYS = 14`, `briefSince(lastSession, today): string`
  - `type BriefUnit`, `type BriefFacts`, `type BriefPoint = { unit: string; text: string }`
  - `briefFacts(input): BriefFacts`
  - `checkBrief(raw, facts): Check<BriefPoint[]>`
  - `fallbackPoints(facts): BriefPoint[]`
  - `WEEKLY_SYSTEM`, `BRIEF_SYSTEM`, `promptVersion(text): string`, `weeklyUser(facts)`, `briefUser(facts)`

- [ ] **Step 1: Write the failing tests**

`src/lib/ai/brief.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AttemptRow } from "../learning/rules.ts";
import { briefFacts, briefSince, checkBrief, fallbackPoints } from "./brief.ts";

const at = (day: string) => `${day}T03:00:00Z`;
const w = (day: string, code: string | null, correct = false): AttemptRow => ({ item_id: "x", mode: "practice", correct, error_code: code, exit_run: null, created_at: at(day) });

const facts = briefFacts({
  since: "2026-10-15",
  today: "2026-10-22",
  units: [
    { id: "c-coban", title: "Căn thức cơ bản", level: 2, attempts: [w("2026-10-10", "E02"), w("2026-10-16", "E02"), w("2026-10-17", "E02"), w("2026-10-17", "E01"), w("2026-10-18", null, true)] },
    { id: "htl-1", title: "Bốn hệ thức lượng: hiểu và nhớ", level: 3, attempts: [w("2026-10-20", "E03"), w("2026-10-20", null, true)] },
    { id: "a-tanso", title: "Tần số", level: 1, attempts: [w("2026-10-01", "E01")] }, // nothing since → left out
  ],
  homework: [{ done_at: null, reviewed_at: null }, { done_at: at("2026-10-21"), reviewed_at: null }, { done_at: at("2026-10-12"), reviewed_at: at("2026-10-13") }],
});

test("since: the tutor's last session, else 14 days back", () => {
  assert.equal(briefSince("2026-10-15", "2026-10-22"), "2026-10-15");
  assert.equal(briefSince(null, "2026-10-22"), "2026-10-08");
});

test("brief facts: KUs answered since, most wrong first, error codes, homework", () => {
  assert.deepEqual(
    facts.units.map((u) => [u.id, u.answers, u.wrong, u.errors.map((e) => `${e.code}×${e.count}`).join(",")]),
    [["c-coban", 4, 3, "E02×2,E01×1"], ["htl-1", 2, 1, "E03×1"]],
  );
  assert.deepEqual(facts.homework, { open: 1, toReview: 1 });
});

test("AI points: JSON, KUs with wrong answers only, numbers from the data, 1–3 points", () => {
  const good = '```json\n{"points":[{"unit":"c-coban","text":"Con sai 3 câu biến đổi (E02): cho làm lại 2 câu đưa thừa số ra ngoài dấu căn."},{"unit":"htl-1","text":"Nhắc lại hệ thức h² = b′c′."}]}\n```';
  const ok = checkBrief(good, facts);
  assert.equal(ok.ok, true);
  assert.equal(ok.ok && ok.value.length, 2);
  const reasons = (raw: string) => {
    const c = checkBrief(raw, facts);
    return c.ok ? "" : c.reasons.join(" | ");
  };
  assert.match(reasons("không phải JSON"), /JSON/);
  assert.match(reasons('{"points":[{"unit":"a-tanso","text":"x"}]}'), /a-tanso/);
  assert.match(reasons('{"points":[{"unit":"c-coban","text":"Con sai 17 câu"}]}'), /17/);
  assert.match(reasons('{"points":[]}'), /1–3/);
  assert.match(reasons(`{"points":[{"unit":"c-coban","text":"${"x".repeat(221)}"}]}`), /dài/);
});

test("fallback points: most wrong first, with the most frequent error", () => {
  assert.deepEqual(fallbackPoints(facts), [
    { unit: "c-coban", text: "Căn thức cơ bản: 3 câu sai, hay gặp E02 — Biến đổi đại số sai." },
    { unit: "htl-1", text: "Bốn hệ thức lượng: hiểu và nhớ: 1 câu sai, hay gặp E03 — Nhớ sai công thức." },
  ]);
});
```

`src/lib/ai/prompts.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { BRIEF_SYSTEM, WEEKLY_SYSTEM, briefUser, promptVersion } from "./prompts.ts";

test("prompt versions: 12 hex, change with the text", () => {
  assert.match(promptVersion(WEEKLY_SYSTEM), /^[0-9a-f]{12}$/);
  assert.notEqual(promptVersion(WEEKLY_SYSTEM), promptVersion(BRIEF_SYSTEM));
});

test("prompts keep the markers the e2e fake relies on, and send no name", () => {
  assert.ok(WEEKLY_SYSTEM.includes("«Nhận xét»"));
  assert.ok(BRIEF_SYSTEM.includes("chuẩn bị buổi dạy"));
  const u = briefUser({ since: "2026-10-15", today: "2026-10-22", units: [], homework: { open: 0, toReview: 0 } });
  assert.ok(u.includes('{"since":"2026-10-15"'));
  assert.ok(!/Nguyên|Hạnh/.test(u));
});
```

- [ ] **Step 2: Run to see them fail**

Run: `node --test src/lib/ai/brief.test.ts src/lib/ai/prompts.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `brief.ts`**

```ts
// S8a: the tutor's pre-session brief (spec §5.2). Pure. AI may only point at KUs that had wrong answers.
import { z } from "zod";
import { errorLabel } from "../content/errors.ts";
import { addDays, vnDate, type AttemptRow, type Level } from "../learning/rules.ts";
import { commonErrors } from "../learning/work.ts";
import { allowedNumbers, bannedWords, jsonPart, unknownNumbers, type Check } from "./guard.ts";
import { AI_RULES } from "./rules.ts";

export const BRIEF_LOOKBACK_DAYS = 14;

/** From this tutor's last logged session (that day included), or 14 days back. */
export function briefSince(lastSession: string | null, today: string): string {
  return lastSession ?? addDays(today, -BRIEF_LOOKBACK_DAYS);
}

export type BriefUnit = { id: string; title: string; level: Level; answers: number; wrong: number; errors: { code: string; label: string; count: number }[] };
export type BriefFacts = { since: string; today: string; units: BriefUnit[]; homework: { open: number; toReview: number } };
export type BriefPoint = { unit: string; text: string };

export type BriefInput = {
  since: string;
  today: string;
  units: { id: string; title: string; level: Level; attempts: AttemptRow[] }[];
  homework: { done_at: string | null; reviewed_at: string | null }[];
};

export function briefFacts(input: BriefInput): BriefFacts {
  const units = input.units
    .map((u) => {
      const recent = u.attempts.filter((a) => a.mode !== "faded" && vnDate(a.created_at) >= input.since);
      const wrong = recent.filter((a) => !a.correct);
      return {
        id: u.id,
        title: u.title,
        level: u.level,
        answers: recent.length,
        wrong: wrong.length,
        errors: commonErrors(wrong, 1)
          .slice(0, 3)
          .map((e) => ({ code: e.code, label: errorLabel(e.code) ?? e.code, count: e.count })),
      };
    })
    .filter((u) => u.answers > 0)
    .sort((a, b) => b.wrong - a.wrong || b.answers - a.answers)
    .slice(0, 8);
  return {
    since: input.since,
    today: input.today,
    units,
    homework: {
      open: input.homework.filter((h) => !h.done_at && !h.reviewed_at).length,
      toReview: input.homework.filter((h) => !!h.done_at && !h.reviewed_at).length,
    },
  };
}

const BriefJson = z.object({ points: z.array(z.object({ unit: z.string(), text: z.string() })) });

export function checkBrief(raw: string, facts: BriefFacts): Check<BriefPoint[]> {
  let points: BriefPoint[];
  try {
    const p = BriefJson.safeParse(JSON.parse(jsonPart(raw)));
    if (!p.success) return { ok: false, reasons: ["JSON sai dạng"] };
    points = p.data.points.map((x) => ({ unit: x.unit, text: x.text.trim() }));
  } catch {
    return { ok: false, reasons: ["không đọc được JSON"] };
  }
  const wrongUnits = new Set(facts.units.filter((u) => u.wrong > 0).map((u) => u.id));
  const allowed = allowedNumbers(facts);
  const reasons: string[] = [];
  if (points.length < 1 || points.length > AI_RULES.briefPointsMax) reasons.push(`cần 1–${AI_RULES.briefPointsMax} điểm`);
  for (const p of points) {
    if (!wrongUnits.has(p.unit)) reasons.push(`bài không có câu sai: ${p.unit}`);
    if (!p.text || p.text.length > AI_RULES.briefPointMaxChars) reasons.push(`điểm trống hoặc quá dài (${p.unit})`);
    const unknown = unknownNumbers(p.text, allowed);
    if (unknown.length) reasons.push(`số không có trong dữ liệu: ${unknown.join(", ")}`);
    const banned = bannedWords(p.text);
    if (banned.length) reasons.push(`từ không dùng: ${banned.join(", ")}`);
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, value: points };
}

/** Shown when AI is off or its points fail the check: always useful, built from the data alone. */
export function fallbackPoints(facts: BriefFacts): BriefPoint[] {
  return facts.units
    .filter((u) => u.wrong > 0)
    .slice(0, AI_RULES.briefPointsMax)
    .map((u) => ({ unit: u.id, text: `${u.title}: ${u.wrong} câu sai${u.errors[0] ? `, hay gặp ${u.errors[0].label}` : ""}.` }));
}
```

- [ ] **Step 4: Implement `prompts.ts`**

```ts
// S8a: system prompts for the adults' AI. The parent reads them on /parent/ai; any change gets a new version.
// Markers used by the e2e fake: «Nhận xét» (weekly), "chuẩn bị buổi dạy" (brief). Keep them.
import { createHash } from "node:crypto";
import type { BriefFacts } from "./brief.ts";
import type { WeeklyFacts } from "./weekly.ts";

export const WEEKLY_SYSTEM = `Bạn viết phần «Nhận xét» trong báo cáo học Toán hằng tuần gửi phụ huynh của một học sinh lớp 9 (gọi là «con»).
Quy tắc:
- Chỉ dựa vào dữ liệu JSON được gửi. Không thêm con số nào không có trong dữ liệu; không tự tính phần trăm, trung bình hay tổng.
- 2–4 câu, tối đa 120 chữ, tiếng Việt tự nhiên, giọng bình tĩnh và cụ thể.
- Câu đầu: điều con làm tốt trong tuần. Các câu giữa: điều cần chú ý nếu có (lỗi lặp lại, bài trễ lịch, bài ôn quá hạn). Câu cuối: một gợi ý cụ thể cho tuần tới.
- Không chẩn đoán tâm lý, không so sánh con với bạn khác, không nói về chuỗi ngày học hay xếp hạng, không hứa hẹn điểm thi.
- Chỉ trả về đoạn nhận xét: không tiêu đề, không gạch đầu dòng, không ký tên.`;

export const BRIEF_SYSTEM = `Bạn giúp gia sư Toán chuẩn bị buổi dạy cho một học sinh lớp 9 (gọi là «con»).
Dữ liệu JSON gồm các bài con đã làm từ buổi trước đến nay: số câu đã làm, số câu sai, mã lỗi hay gặp và bài về nhà.
Trả về đúng một JSON dạng {"points":[{"unit":"<id bài>","text":"<điểm nên chữa>"}]} với 2–3 điểm (1 điểm nếu chỉ có một bài có câu sai).
- Mỗi điểm gắn với một bài có câu sai, dùng đúng id trong dữ liệu; nêu lỗi hay gặp và một cách chữa cụ thể trong buổi tới (làm lại dạng nào, nhắc lại quy tắc nào).
- Mỗi điểm tối đa 220 ký tự, tiếng Việt. Không thêm con số nào không có trong dữ liệu. Không đề xuất mức M.
- Không viết gì ngoài JSON.`;

export function promptVersion(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

export const weeklyUser = (facts: WeeklyFacts) => `Dữ liệu tuần (JSON): ${JSON.stringify(facts)}`;
export const briefUser = (facts: BriefFacts) => `Dữ liệu từ buổi trước (JSON): ${JSON.stringify(facts)}`;
```

- [ ] **Step 5: Run the tests**

Run: `node --test src/lib/ai/*.test.ts`
Expected: PASS.

In the "good" brief test, `h² = b′c′` contains the number 2 (≤ 10, allowed). The number 3 in "sai 3 câu" is in the facts (wrong: 3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/brief.ts src/lib/ai/brief.test.ts src/lib/ai/prompts.ts src/lib/ai/prompts.test.ts
git commit -m "feat(S8a): tutor brief facts, check and fallback; system prompts with versions"
```

---

### Task 6: Building and storing reports (server)

**Files:**
- Create: `src/lib/ai/reports.ts`

**Interfaces:**
- Consumes:
  - `loadStudentState` (`@/lib/learning/state`), `curriculum` (`@/lib/content`)
  - `displayLevel`, `latestByUnit`, `type ConfirmationRow` (`@/lib/learning/overview`)
  - Tasks 2–5
- Produces:
  - `buildWeeklyReport(studentId: string, today?: string): Promise<{ ok: true; period: string } | { ok: false }>`
  - `buildBrief(tutorId: string, studentId: string, today?: string): Promise<{ ok: true; period: string } | { ok: false }>`
  - Weekly rows: `ai_reports` with `kind: "weekly"`, `period = facts.from`, `facts: WeeklyFacts`, `ai: { text } | null`.
  - Brief rows: `kind: "brief"`, `period = "<tutorId>/<since>/<today>"`, `facts: BriefFacts`, `ai: { points: BriefPoint[] } | null`.
  - `comment_status`: `ok` | `failed` | `off` | `none` (`none` = brief with no wrong answers, AI not asked).

- [ ] **Step 1: Implement**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculum } from "@/lib/content";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { vnDate } from "@/lib/learning/rules";
import { loadStudentState } from "@/lib/learning/state";
import { briefFacts, briefSince, checkBrief, type BriefFacts, type BriefPoint } from "./brief";
import { generateChecked, type Check, type Generated } from "./guard";
import { BRIEF_SYSTEM, WEEKLY_SYSTEM, briefUser, weeklyUser } from "./prompts";
import { aiSettings, runAi, staffAiOff } from "./usage";
import { checkWeeklyComment, weeklyFacts, type WeeklyFacts } from "./weekly";

type Status = "ok" | "failed" | "off" | "none";

/** The gate (key, switch, cap), then ask → check → ask once more (spec §2). */
async function staffGenerate<T>(kind: "weekly" | "brief", studentId: string, system: string, user: string, maxTokens: number, check: (t: string) => Check<T>): Promise<Generated<T>> {
  const settings = await aiSettings();
  if (await staffAiOff(settings)) return { status: "off" };
  return generateChecked(() => runAi(kind, studentId, { model: settings.staffModel, system, user, maxTokens }), check);
}

function logFailed(what: string, g: Generated<unknown>) {
  if (g.status === "failed") console.error(`${what}: AI text rejected —`, g.reasons.join(" | "));
}

/** S8a: the previous week's report for one student, made from the database; AI adds a checked comment. Overwrites. */
export async function buildWeeklyReport(studentId: string, today: string = vnDate()): Promise<{ ok: true; period: string } | { ok: false }> {
  const admin = createAdminClient();
  const [state, conf, sessions, reviewLog, homework] = await Promise.all([
    loadStudentState(admin, studentId),
    admin.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", studentId).limit(500),
    admin.from("teaching_sessions").select("taught_on").eq("student_id", studentId).order("taught_on", { ascending: false }).limit(200),
    admin.from("review_log").select("created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(300),
    admin.from("homework").select("created_at, done_at, reviewed_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(200),
  ]);
  for (const r of [conf, sessions, reviewLog, homework])
    if (r.error) {
      console.error("buildWeeklyReport", r.error.message);
      return { ok: false };
    }
  const confs = latestByUnit((conf.data ?? []) as ConfirmationRow[]);
  const facts: WeeklyFacts = weeklyFacts({
    today,
    curriculum: curriculum(),
    units: state.units.map((u) => ({
      id: u.unit.id,
      title: u.unit.title,
      history: u.history,
      shown: displayLevel(u.mastery.level, confs.get(u.unit.id), u.history).level,
      reviewDueOn: u.review?.dueOn ?? null,
    })),
    reviewLog: (reviewLog.data ?? []) as { created_at: string }[],
    sessions: (sessions.data ?? []) as { taught_on: string }[],
    homework: (homework.data ?? []) as { created_at: string; done_at: string | null; reviewed_at: string | null }[],
  });
  const g = await staffGenerate<string>("weekly", studentId, WEEKLY_SYSTEM, weeklyUser(facts), 500, (t) => checkWeeklyComment(t, facts));
  logFailed("weekly", g);
  const { error } = await admin.from("ai_reports").upsert(
    {
      kind: "weekly",
      student_id: studentId,
      tutor_id: null,
      period: facts.from,
      facts,
      ai: g.status === "ok" ? { text: g.value } : null,
      comment_status: g.status as Status,
      model: g.status === "ok" ? g.model : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "kind,student_id,period" },
  );
  if (error) {
    console.error("buildWeeklyReport upsert", error.message);
    return { ok: false };
  }
  return { ok: true, period: facts.from };
}

/** S8a: a brief for this tutor from her last session up to today. AI is asked only when there are wrong answers. */
export async function buildBrief(tutorId: string, studentId: string, today: string = vnDate()): Promise<{ ok: true; period: string } | { ok: false }> {
  const admin = createAdminClient();
  const [state, last, hw] = await Promise.all([
    loadStudentState(admin, studentId, { includeDrafts: true }),
    admin.from("teaching_sessions").select("taught_on").eq("student_id", studentId).eq("tutor_id", tutorId).order("taught_on", { ascending: false }).limit(1),
    admin.from("homework").select("done_at, reviewed_at").eq("student_id", studentId).eq("tutor_id", tutorId).order("created_at", { ascending: false }).limit(200),
  ]);
  if (last.error || hw.error) {
    console.error("buildBrief", (last.error ?? hw.error)!.message);
    return { ok: false };
  }
  const since = briefSince((last.data?.[0]?.taught_on as string | undefined) ?? null, today);
  const facts: BriefFacts = briefFacts({
    since,
    today,
    units: state.units.map((u) => ({ id: u.unit.id, title: u.unit.title, level: u.mastery.level, attempts: u.attempts })),
    homework: (hw.data ?? []) as { done_at: string | null; reviewed_at: string | null }[],
  });
  const g: Generated<BriefPoint[]> | { status: "none" } = facts.units.some((u) => u.wrong > 0)
    ? await staffGenerate<BriefPoint[]>("brief", studentId, BRIEF_SYSTEM, briefUser(facts), 600, (t) => checkBrief(t, facts))
    : { status: "none" };
  if (g.status !== "none") logFailed("brief", g);
  const period = `${tutorId}/${since}/${today}`;
  const { error } = await admin.from("ai_reports").upsert(
    {
      kind: "brief",
      student_id: studentId,
      tutor_id: tutorId,
      period,
      facts,
      ai: g.status === "ok" ? { points: g.value } : null,
      comment_status: g.status as Status,
      model: g.status === "ok" ? g.model : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "kind,student_id,period" },
  );
  if (error) {
    console.error("buildBrief upsert", error.message);
    return { ok: false };
  }
  return { ok: true, period };
}
```

- [ ] **Step 2: Lint and build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/reports.ts
git commit -m "feat(S8a): build and store weekly reports and tutor briefs"
```

---

### Task 7: Monday cron + the parent's report page

**Files:**
- Create: `src/lib/cron.ts`, `src/app/api/cron/weekly/route.ts`, `src/app/parent/bao-cao/page.tsx`, `src/components/parent/weekly-report.tsx`
- Modify: `src/app/api/cron/ping/route.ts` (use `cronAuthorized`), `vercel.json`, `src/app/parent/actions.ts` (+ `regenerateWeekly`), `src/app/parent/layout.tsx` (nav), `src/components/parent/student-overview.tsx` (link)

**Interfaces:**
- Consumes: `buildWeeklyReport` (Task 6), `type WeeklyFacts` (Task 4).
- Produces: `cronAuthorized(request: Request): boolean`; route `GET /api/cron/weekly`; page `/parent/bao-cao?week=YYYY-MM-DD`; `regenerateWeekly(_p, fd)`.

- [ ] **Step 1: Move the cron check**

`src/lib/cron.ts`:

```ts
import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". No secret set → nothing is authorized. */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
```

In `src/app/api/cron/ping/route.ts`:
- delete the local `authorized` function and the `node:crypto` import;
- import `{ cronAuthorized } from "@/lib/cron"`;
- replace `authorized(request)` with `cronAuthorized(request)`.

- [ ] **Step 2: The weekly cron route**

Read `node_modules/next/dist/docs/` for route segment config (`maxDuration`) in this Next version before adding the export.

`src/app/api/cron/weekly/route.ts`:

```ts
import { cronAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWeeklyReport } from "@/lib/ai/reports";

// S8a: Monday 00:00 UTC = 07:00 Hà Nội (vercel.json). The previous week's report for every consented student.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ ok: false }, { status: 401 });
  const { data, error } = await createAdminClient().from("students").select("id, consent_at");
  if (error) {
    console.error("cron weekly", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  let made = 0;
  let failed = 0;
  for (const s of data ?? []) {
    if (!s.consent_at) continue;
    const r = await buildWeeklyReport(s.id as string);
    if (r.ok) made++;
    else failed++;
  }
  return Response.json({ ok: failed === 0, made, failed }, { status: failed ? 500 : 200 });
}
```

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    { "path": "/api/cron/ping", "schedule": "0 1 * * *" },
    { "path": "/api/cron/weekly", "schedule": "0 0 * * 1" }
  ]
}
```

- [ ] **Step 3: The report view**

`src/components/parent/weekly-report.tsx`:

```tsx
import type { WeeklyFacts } from "@/lib/ai/weekly";

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
const dmy = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const num = (n: number) => String(n).replace(".", ",");

export type WeeklyRow = { period: string; facts: WeeklyFacts; ai: { text: string } | null; comment_status: "ok" | "failed" | "off" | "none"; created_at: string };

const STATUS_NOTE: Record<WeeklyRow["comment_status"], string> = {
  ok: "",
  failed: "Tuần này không có nhận xét tự động (máy chủ không xác nhận được số liệu trong câu AI viết).",
  off: "Không có nhận xét tự động: AI đang tắt, chưa có khoá, hết hạn mức tháng này hoặc tạm lỗi.",
  none: "",
};

/** S8a: one weekly report. Numbers come from `facts` (the database); only "Nhận xét" is AI text, checked by the server. */
export function WeeklyReportView({ row }: { row: WeeklyRow }) {
  const f = row.facts;
  return (
    <article className="rounded-xl border border-border bg-surface p-5" data-testid="weekly-report">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          Tuần {dm(f.from)} – {dm(f.to)}
        </h3>
        <span className="font-mono text-xs text-muted">tạo lúc {new Date(row.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
      </header>

      <section className="mt-4 rounded-lg bg-accent-soft p-4" data-testid="weekly-comment">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Nhận xét</p>
        {row.ai ? <p className="mt-1 font-body leading-relaxed">{row.ai.text}</p> : <p className="mt-1 text-sm text-muted">{STATUS_NOTE[row.comment_status]}</p>}
        {row.ai && <p className="mt-2 text-xs text-muted">AI viết, máy chủ đã đối chiếu mọi con số với dữ liệu bên dưới.</p>}
      </section>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3" data-testid="weekly-numbers">
        <Fact label="Buổi học" value={`${f.studyDays}/${f.goalDays}`} />
        <Fact label="Bài kiểm tra đã nộp" value={f.exits} />
        <Fact label="Lượt ôn đã xong" value={f.reviews} testid="weekly-reviews" />
        <Fact label="Buổi dạy đã ghi" value={f.sessions} />
        <Fact label="Bài về nhà (giao / xong / chữa)" value={`${f.homework.given} / ${f.homework.done} / ${f.homework.reviewed}`} />
        <Fact label="Bài ôn quá hạn hôm nay" value={f.overdueReviews} />
      </dl>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <List title="Bài vững thêm (≥ M3)" items={f.newSolid} empty="Chưa có bài nào lên M3 trong tuần." />
        <List
          title="Lỗi lặp lại (≥ 2 lần)"
          items={f.repeatedErrors.map((e) => `${e.label} · ${e.count} lần`)}
          empty="Không có lỗi nào lặp lại."
          testid="weekly-errors"
        />
        <List
          title="Tiến độ tới mốc"
          items={f.milestones.map((m) => `${m.title}: ${m.solid}/${m.total} bài vững · hạn ${dmy(m.due)} · cần ~${num(m.perWeek)} bài/tuần${m.late ? ` · ${m.late} bài trễ` : ""}`)}
          empty="—"
        />
        <List title="Bài trễ lịch" items={f.late} empty="Không có bài trễ lịch." warn />
      </div>
    </article>
  );
}

function Fact({ label, value, testid }: { label: string; value: string | number; testid?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2" data-testid={testid}>
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-base tabular-nums">{value}</dd>
    </div>
  );
}

function List({ title, items, empty, warn = false, testid }: { title: string; items: string[]; empty: string; warn?: boolean; testid?: string }) {
  return (
    <section data-testid={testid}>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      {items.length ? (
        <ul className={`mt-1 list-disc pl-5 text-sm ${warn ? "text-warn" : ""}`}>
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}
```

- [ ] **Step 4: The regenerate action**

Append to `src/app/parent/actions.ts`, and add `import { buildWeeklyReport } from "@/lib/ai/reports";` to the imports (`z`, `requireRole`, `createAdminClient`, `parentOwnsStudent`, `revalidatePath` and `ActionState` are already imported).

```ts
/** S8a: make the previous week's report again (overwrites; also used when the Monday run missed). */
export async function regenerateWeekly(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  if (!studentId.success || !(await parentOwnsStudent(parent.id, studentId.data))) return { error: "Không tìm thấy học sinh." };
  const r = await buildWeeklyReport(studentId.data);
  if (!r.ok) return { error: "Chưa tạo được báo cáo, thử lại sau." };
  revalidatePath("/parent/bao-cao");
  return { ok: "Đã tạo báo cáo tuần trước." };
}
```

- [ ] **Step 5: The page**

`src/app/parent/bao-cao/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { regenerateWeekly } from "@/app/parent/actions";
import { WeeklyReportView, type WeeklyRow } from "@/components/parent/weekly-report";

export const metadata: Metadata = { title: "Báo cáo tuần — App Toán" };

const dm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

// S8a (spec §5.1): reports made on Monday ~07:00 for the previous week; RLS = the parent's own students.
export default async function WeeklyReportsPage(props: PageProps<"/parent/bao-cao">) {
  await requireRole("parent");
  const sp = await props.searchParams;
  const week = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : null;
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name").order("created_at");

  const blocks = await Promise.all(
    (students ?? []).map(async (s) => {
      const { data, error } = await supabase
        .from("ai_reports")
        .select("period, facts, ai, comment_status, created_at")
        .eq("kind", "weekly")
        .eq("student_id", s.id)
        .order("period", { ascending: false })
        .limit(12);
      if (error) console.error("WeeklyReportsPage", error.message);
      const rows = (data ?? []) as WeeklyRow[];
      return { s, rows, shown: rows.find((r) => r.period === week) ?? rows[0] ?? null };
    }),
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Báo cáo tuần</h1>
      <p className="mt-1 text-sm text-muted">App tự tạo sáng thứ Hai (~07:00) cho tuần trước. Số liệu lấy từ dữ liệu học; AI chỉ viết phần nhận xét.</p>
      {blocks.map(({ s, rows, shown }) => (
        <section key={s.id} className="mt-6" aria-label={`Báo cáo của ${s.full_name}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{s.full_name}</h2>
            <ActionForm action={regenerateWeekly} submitLabel="Tạo lại báo cáo tuần trước" variant="quiet" className="flex items-center gap-3">
              <input type="hidden" name="studentId" value={s.id} />
            </ActionForm>
          </div>
          {shown ? (
            <div className="mt-3">
              <WeeklyReportView row={shown} />
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted" data-testid="no-report">
              Chưa có báo cáo nào. Báo cáo đầu tiên sẽ có sáng thứ Hai, hoặc bấm &ldquo;Tạo lại báo cáo tuần trước&rdquo;.
            </p>
          )}
          {rows.length > 1 && (
            <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Các tuần trước">
              {rows.map((r) => (
                <Link
                  key={r.period}
                  href={`/parent/bao-cao?week=${r.period}`}
                  className={`rounded-full border px-3 py-1 ${r.period === shown?.period ? "border-accent text-accent" : "border-border text-muted hover:text-ink"}`}
                >
                  Tuần {dm(r.period)}
                </Link>
              ))}
            </nav>
          )}
        </section>
      ))}
    </>
  );
}
```

- [ ] **Step 6: Nav and overview link**

In `src/app/parent/layout.tsx`, the nav list becomes:

```ts
          { href: "/parent", label: "Tổng quan" },
          { href: "/parent/bao-cao", label: "Báo cáo tuần" },
          { href: "/parent/content", label: "Nội dung" },
          { href: "/parent/accounts", label: "Tài khoản" },
          { href: "/parent/ai", label: "AI" },
```

In `src/components/parent/student-overview.tsx`, replace the student heading line with:

```tsx
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{student.full_name}</h2>
        <Link href="/parent/bao-cao" className="text-sm text-accent hover:underline" data-testid="weekly-link">
          Báo cáo tuần →
        </Link>
      </div>
```

- [ ] **Step 7: Lint and build**

Run: `npm run lint && npm run build`
Expected: no errors. `/parent/bao-cao` and `/api/cron/weekly` appear in the route list.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cron.ts src/app/api/cron vercel.json src/app/parent src/components/parent/weekly-report.tsx src/components/parent/student-overview.tsx
git commit -m "feat(S8a): Monday weekly report cron, report page and regenerate button"
```

---

### Task 8: Tutor brief on Buổi dạy

**Files:**
- Create: `src/components/tutor/brief-panel.tsx`
- Modify: `src/app/tutor/actions.ts` (+ `createBrief`), `src/app/tutor/[studentId]/buoi/page.tsx` (load + render)

**Interfaces:**
- Consumes: `buildBrief` (Task 6), `fallbackPoints`, `type BriefFacts`, `type BriefPoint` (Task 5).
- Produces:
  - `createBrief(_p: ActionState, fd: FormData): Promise<ActionState>`
  - `BriefPanel({ studentId, row })`
  - `type BriefRow = { period: string; facts: BriefFacts; ai: { points: BriefPoint[] } | null; comment_status: "ok" | "failed" | "off" | "none"; created_at: string }`

- [ ] **Step 1: The action**

Append to `src/app/tutor/actions.ts`, and import `buildBrief` from `@/lib/ai/reports`:

```ts
/** S8a: the pre-session brief (spec §5.2), stored; the tutor must be actively assigned. */
export async function createBrief(_p: ActionState, fd: FormData): Promise<ActionState> {
  const tutor = await requireRole("tutor");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  if (!studentId.success) return { error: "Không tìm thấy học sinh." };
  if (!(await activeAssignment(createAdminClient(), tutor.id, studentId.data))) return { error: NOT_ASSIGNED };
  const r = await buildBrief(tutor.id, studentId.data);
  if (!r.ok) return { error: "Chưa tạo được tóm tắt, thử lại sau." };
  revalidatePath(`/tutor/${studentId.data}/buoi`);
  return { ok: "Đã tạo tóm tắt." };
}
```

- [ ] **Step 2: The panel**

`src/components/tutor/brief-panel.tsx`:

```tsx
import { ActionForm } from "@/components/action-form";
import { createBrief } from "@/app/tutor/actions";
import { fallbackPoints, type BriefFacts, type BriefPoint } from "@/lib/ai/brief";

export type BriefRow = { period: string; facts: BriefFacts; ai: { points: BriefPoint[] } | null; comment_status: "ok" | "failed" | "off" | "none"; created_at: string };

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

/** S8a: "Tóm tắt trước buổi dạy" — facts from the database; "Nên chữa" by AI (checked) or built from the data. */
export function BriefPanel({ studentId, row }: { studentId: string; row: BriefRow | null }) {
  const f = row?.facts;
  const points = row ? (row.ai?.points ?? fallbackPoints(row.facts)) : [];
  const title = new Map((f?.units ?? []).map((u) => [u.id, u.title]));
  return (
    <section className="rounded-xl border border-border bg-surface p-4" data-testid="brief" aria-label="Tóm tắt trước buổi dạy">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Tóm tắt trước buổi dạy</h2>
        <ActionForm action={createBrief} submitLabel={row ? "Tạo lại tóm tắt" : "Tạo tóm tắt trước buổi dạy"} variant={row ? "quiet" : "primary"} className="flex items-center gap-3">
          <input type="hidden" name="studentId" value={studentId} />
        </ActionForm>
      </div>
      {!row && <p className="mt-2 text-sm text-muted">Bấm để xem con đã làm gì từ buổi trước và 2–3 điểm nên chữa.</p>}
      {f && (
        <>
          <p className="mt-2 font-mono text-xs text-muted">
            Từ {dm(f.since)} đến {dm(f.today)} · bài về nhà: {f.homework.open} chưa làm, {f.homework.toReview} chờ chữa
          </p>
          {f.units.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {f.units.map((u) => (
                <li key={u.id}>
                  <b>{u.title}</b>{" "}
                  <span className="font-mono text-xs text-muted">
                    · M{u.level} · {u.answers} câu, sai {u.wrong}
                    {u.errors.length ? ` · ${u.errors.map((e) => `${e.code}×${e.count}`).join(", ")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Từ buổi trước đến nay con chưa làm câu nào trong app.</p>
          )}
          {points.length > 0 && (
            <div className="mt-3 rounded-lg bg-accent-soft p-3">
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Nên chữa</p>
              <ol className="mt-1 list-decimal pl-5 text-sm">
                {points.map((p, i) => (
                  <li key={i} data-testid="brief-point">
                    <span className="text-muted">{title.get(p.unit)}:</span> {p.text}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted">{row?.ai ? "AI viết, máy chủ đã đối chiếu với dữ liệu." : "Tự động từ dữ liệu (không dùng AI)."}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Load and render on Buổi dạy**

In `src/app/tutor/[studentId]/buoi/page.tsx`:

- add to the `Promise.all` (fourth entry; destructure as `brief`):

```ts
    supabase.from("ai_reports").select("period, facts, ai, comment_status, created_at").eq("kind", "brief").eq("student_id", student.id).eq("tutor_id", tutor.id).order("created_at", { ascending: false }).limit(1),
```

- import `{ BriefPanel, type BriefRow } from "@/components/tutor/brief-panel"`;
- render `<BriefPanel studentId={student.id} row={((brief.data ?? [])[0] as BriefRow | undefined) ?? null} />` directly above the session form (`<SessionShort …/>`), wrapped in `<div className="mb-6">…</div>`.

- [ ] **Step 4: Lint and build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/tutor/brief-panel.tsx src/app/tutor/actions.ts "src/app/tutor/[studentId]/buoi/page.tsx"
git commit -m "feat(S8a): tutor pre-session brief on Buổi dạy"
```

---

### Task 9: The parent's AI page (spend, switch, model, prompts)

**Files:**
- Create: `src/app/parent/ai/page.tsx`
- Modify: `src/app/parent/actions.ts` (+ `saveAiSettings`)

**Interfaces:**
- Consumes: `budget`, `spendByKind`, `usdLabel`, `AI_MODELS`, `MODEL_LABEL`, `isAiModel`, `AI_RULES` (Task 2); `hasAiKey` (Task 3); `monthSpendRows` (Task 3); `WEEKLY_SYSTEM`, `BRIEF_SYSTEM`, `promptVersion` (Task 5).
- Produces: `saveAiSettings(_p, fd): Promise<ActionState>`; page `/parent/ai`.

- [ ] **Step 1: The action**

Append to `src/app/parent/actions.ts`, and import `isAiModel` from `@/lib/ai/rules`:

```ts
/** S8a: AI for reports and briefs on/off + their model (the student's AI comes with S8b). */
export async function saveAiSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const model = fd.get("staffModel");
  if (!isAiModel(model)) return { error: "Chọn một model trong danh sách." };
  const { error } = await createAdminClient()
    .from("ai_settings")
    .update({ staff_enabled: fd.get("staffEnabled") === "on", staff_model: model, updated_by: parent.id, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    console.error("saveAiSettings", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent/ai");
  return { ok: "Đã lưu." };
}
```

- [ ] **Step 2: The page**

`src/app/parent/ai/page.tsx`:

```tsx
import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { saveAiSettings } from "@/app/parent/actions";
import { hasAiKey } from "@/lib/ai/client";
import { monthSpendRows } from "@/lib/ai/usage";
import { AI_MODELS, AI_RULES, MODEL_LABEL, budget, monthKey, spendByKind, usdLabel } from "@/lib/ai/rules";
import { BRIEF_SYSTEM, WEEKLY_SYSTEM, promptVersion } from "@/lib/ai/prompts";
import { vnDate } from "@/lib/learning/rules";

export const metadata: Metadata = { title: "AI — App Toán" };

const KIND_LABEL: Record<string, string> = { weekly: "Báo cáo tuần", brief: "Tóm tắt gia sư", student: "AI cho con", eval: "Bộ test" };

// S8a (spec §5.3, AI4): spend this month vs the $10 cap, the adults' AI switch and model, the prompts, latest calls.
export default async function AiPage() {
  await requireRole("parent");
  const supabase = await createClient();
  const month = monthKey(vnDate());
  const [settings, rows, recent] = await Promise.all([
    supabase.from("ai_settings").select("staff_enabled, staff_model, student_enabled").eq("id", 1).maybeSingle(),
    monthSpendRows(month),
    supabase.from("ai_usage").select("kind, model, input_tokens, output_tokens, cost_micros, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const spend = spendByKind(rows);
  const b = budget(spend.total);
  const s = settings.data;

  return (
    <>
      <h1 className="font-display text-2xl font-bold">AI</h1>
      {!hasAiKey() && (
        <p className="mt-3 rounded-lg border border-warn bg-warn-soft p-3 text-sm text-warn">
          Chưa có khoá ANTHROPIC_API_KEY trên máy chủ: báo cáo và tóm tắt vẫn có số liệu, chỉ không có nhận xét AI.
        </p>
      )}

      <section className="mt-6 rounded-xl border border-border bg-surface p-4" data-testid="ai-spend">
        <h2 className="font-display text-base font-semibold">Chi phí tháng {month.slice(5)}/{month.slice(0, 4)}</h2>
        <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${b.warn ? "text-warn" : ""}`}>
          {usdLabel(spend.total)} <span className="text-sm font-normal text-muted">/ ${AI_RULES.monthlyCapUsd} · {spend.calls} lượt gọi</span>
        </p>
        {b.paused ? (
          <p className="mt-2 text-sm text-warn">Đã chạm hạn mức: AI tạm dừng tới tháng sau. Gợi ý viết sẵn và số liệu vẫn chạy.</p>
        ) : b.warn ? (
          <p className="mt-2 text-sm text-warn">Đã dùng trên 90 % hạn mức tháng.</p>
        ) : null}
        <ul className="mt-2 text-sm text-muted">
          {Object.entries(spend.byKind).map(([k, v]) => (
            <li key={k}>
              {KIND_LABEL[k] ?? k}: {usdLabel(v)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-base font-semibold">Báo cáo tuần và tóm tắt cho gia sư</h2>
        <ActionForm action={saveAiSettings} submitLabel="Lưu" className="mt-3 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="staffEnabled" defaultChecked={!!s?.staff_enabled} data-testid="staff-enabled" /> Dùng AI viết nhận xét và điểm nên chữa
          </label>
          <label className={`${labelClass} max-w-sm`}>
            Model
            <select name="staffModel" defaultValue={(s?.staff_model as string) ?? "claude-haiku-5-5"} className={inputClass}>
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {MODEL_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
        <p className="mt-3 text-sm text-muted">AI cho con: {s?.student_enabled ? "đang bật" : "chưa bật (làm ở lát S8b, sau khi bộ test đạt)"}.</p>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-base font-semibold">Lệnh hệ thống (phụ huynh duyệt)</h2>
        {[
          ["Nhận xét báo cáo tuần", WEEKLY_SYSTEM],
          ["Tóm tắt cho gia sư", BRIEF_SYSTEM],
        ].map(([name, text]) => (
          <details key={name} className="mt-2">
            <summary className="cursor-pointer text-sm">
              {name} <span className="font-mono text-xs text-muted">· bản {promptVersion(text)}</span>
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-bg p-3 font-body text-sm">{text}</pre>
          </details>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-base font-semibold">20 lượt gọi gần nhất</h2>
        <table className="mt-2 w-full text-left text-sm" data-testid="ai-calls">
          <thead className="text-muted">
            <tr>
              <th className="py-1">Lúc</th>
              <th>Việc</th>
              <th>Model</th>
              <th className="text-right">Token vào / ra</th>
              <th className="text-right">Chi phí</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {(recent.data ?? []).map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1">{new Date(r.created_at as string).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td>{KIND_LABEL[r.kind as string] ?? (r.kind as string)}</td>
                <td>{r.model as string}</td>
                <td className="text-right">
                  {r.input_tokens as number} / {r.output_tokens as number}
                </td>
                <td className="text-right">{usdLabel(r.cost_micros as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!recent.data?.length && <p className="mt-2 text-sm text-muted">Chưa có lượt gọi nào.</p>}
      </section>
    </>
  );
}
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/parent/ai/page.tsx src/app/parent/actions.ts
git commit -m "feat(S8a): parent AI page — monthly spend vs cap, switch and model, prompts, latest calls"
```

---

### Task 10: Browser flows

**Files:**
- Create: `e2e/report-flow.mjs`, `e2e/brief-flow.mjs`
- Modify: `e2e/run.sh` (two runs + exit code)

**Interfaces:**
- Consumes:
  - pages `/parent/bao-cao`, `/parent/ai`, `/tutor/<id>/buoi`
  - test ids `weekly-report`, `weekly-comment`, `weekly-reviews`, `weekly-errors`, `no-report`, `ai-spend`, `staff-enabled`, `ai-calls`, `brief`, `brief-point`, `weekly-link`
  - fake Claude (Task 3)

- [ ] **Step 1: Write `e2e/report-flow.mjs`**

```js
// S8a: weekly report (button + fake AI comment), spend on the AI page, AI switched off, cron auth. Parent role.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3114";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const monday = add(vnToday, -((new Date(vnToday + "T00:00:00Z").getUTCDay() + 6) % 7));
const lastWed = add(monday, -5); // Wednesday of the previous week
const shots = "e2e/out/s8a"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

try {
  // Last week: two wrong htl-1 answers with E01, one review done.
  await sql(`
    insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select id, 'htl-1', '${lastWed}T03:00:00Z' from public.students where full_name = 'Hạnh Nguyên';
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code, created_at)
      select id, 'htl-1', v.i, 'practice', '9', false, 'E01', '${lastWed}T03:00:00Z' from public.students, (values ('htl-1-p1'), ('htl-1-p2')) v(i) where full_name = 'Hạnh Nguyên';
    insert into public.review_log (student_id, unit_id, run_id, stage, correct, total, passed, due_on, next_due_on, created_at)
      select id, 'htl-1', gen_random_uuid(), 1, 3, 3, true, '${lastWed}', '${add(lastWed, 7)}', '${lastWed}T04:00:00Z' from public.students where full_name = 'Hạnh Nguyên';`);

  await page.goto(`${BASE}/parent`);
  ok("overview links to the weekly report", (await page.getByTestId("weekly-link").first().getAttribute("href")) === "/parent/bao-cao");

  await page.goto(`${BASE}/parent/bao-cao`);
  ok("no report before the first run", (await page.getByTestId("no-report").count()) === 1);
  await page.getByRole("button", { name: "Tạo lại báo cáo tuần trước" }).click();
  await page.getByText("Đã tạo báo cáo tuần trước.").waitFor();
  await page.reload();
  const comment = await page.getByTestId("weekly-comment").innerText();
  ok("AI comment shown (fake)", comment.includes("Tuần này con học khá đều"), comment.slice(0, 200));
  ok("numbers from the data: 1 review, E01 × 2", (await page.getByTestId("weekly-reviews").innerText()).includes("1") && (await page.getByTestId("weekly-errors").innerText()).includes("E01 — Tính toán sai · 2 lần"));
  await page.screenshot({ path: `${shots}/1-weekly-report.png`, fullPage: true });

  const u = await sql(`select kind, cost_micros, month from public.ai_usage`);
  ok("db: one call recorded with its cost", u.length === 1 && u[0].kind === "weekly" && u[0].cost_micros === 150 && u[0].month === vnToday.slice(0, 7), JSON.stringify(u));
  const r = await sql(`select comment_status, model, period from public.ai_reports where kind = 'weekly'`);
  ok("db: report stored for last week", r.length === 1 && r[0].comment_status === "ok" && r[0].model === "claude-haiku-5-5" && r[0].period === add(monday, -7), JSON.stringify(r));

  await page.goto(`${BASE}/parent/ai`);
  ok("AI page: spend and the call", (await page.getByTestId("ai-spend").innerText()).includes("1 lượt gọi") && (await page.getByTestId("ai-calls").innerText()).includes("Báo cáo tuần"));
  await page.screenshot({ path: `${shots}/2-ai-page.png`, fullPage: true });
  await page.getByTestId("staff-enabled").uncheck();
  await page.getByRole("button", { name: "Lưu" }).click();
  await page.getByText("Đã lưu.").waitFor();

  await page.goto(`${BASE}/parent/bao-cao`);
  await page.getByRole("button", { name: "Tạo lại báo cáo tuần trước" }).click();
  await page.getByText("Đã tạo báo cáo tuần trước.").waitFor();
  await page.reload();
  ok("AI off → template only, with the reason", (await page.getByTestId("weekly-comment").innerText()).includes("AI đang tắt"));
  ok("db: still one report, no new call", (await sql(`select count(*)::int c from public.ai_reports`))[0].c === 1 && (await sql(`select count(*)::int c from public.ai_usage`))[0].c === 1);

  const cron = await fetch(`${BASE}/api/cron/weekly`);
  ok("cron without the secret is refused", cron.status === 401);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/report-error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

The `review_log` seed matches 0004: `run_id`, `stage`, `correct`, `total`, `passed` and `due_on` are required. If 0005 added another required column, add it to the seed too.

- [ ] **Step 2: Write `e2e/brief-flow.mjs`**

```js
// S8a: the tutor makes a brief on Buổi dạy (fake AI points), and reopening shows the stored one. Tutor role.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3115";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/s8a"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

try {
  const [{ id }] = await sql(`select id from public.students where full_name = 'Hạnh Nguyên'`);
  await sql(`
    insert into public.unit_progress (student_id, unit_id, worked_viewed_at) values ('${id}', 'htl-1', now()), ('${id}', 'htl-2', now());
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) values
      ('${id}', 'htl-1', 'htl-1-p1', 'practice', '9', false, 'E03'), ('${id}', 'htl-1', 'htl-1-p2', 'practice', '9', false, 'E03'),
      ('${id}', 'htl-2', 'htl-2-p1', 'practice', '9', false, 'E01'), ('${id}', 'htl-2', 'htl-2-p2', 'practice', '1', true, null);`);

  await page.goto(`${BASE}/tutor/${id}/buoi`);
  await page.getByRole("button", { name: "Tạo tóm tắt trước buổi dạy" }).click();
  await page.getByText("Đã tạo tóm tắt.").waitFor();
  await page.reload();
  const b = await page.getByTestId("brief").innerText();
  ok("brief: KUs since, most wrong first", b.indexOf("Bốn hệ thức lượng") < b.indexOf("Tính độ dài") && b.includes("E03×2"), b.slice(0, 300));
  ok("brief: 2 AI points (fake)", (await page.getByTestId("brief-point").count()) === 2 && b.includes("Chữa lại"));
  await page.screenshot({ path: `${shots}/3-brief.png`, fullPage: true });
  const r = await sql(`select comment_status, tutor_id is not null as has_tutor from public.ai_reports where kind = 'brief'`);
  ok("db: brief stored with its tutor", r.length === 1 && r[0].comment_status === "ok" && r[0].has_tutor === true, JSON.stringify(r));
  await page.reload();
  ok("reopening costs nothing: still one call", (await sql(`select count(*)::int c from public.ai_usage`))[0].c === 1);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/brief-error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

- [ ] **Step 3: Register the flows**

In `e2e/run.sh`, after `run parent 3104 e2e/overview-flow.mjs; e=$?`, add:

```bash
run parent 3114 e2e/report-flow.mjs; o=$?
run tutor 3115 e2e/brief-flow.mjs; p=$?
```

Make the last line:

```bash
exit $(( a || b || c || d || e || f || g || h || i || j || k || l || m || n || o || p ))
```

- [ ] **Step 4: Run everything**

Run: `npm run lint && npm test && npm run build`, commit, then `./e2e/run.sh`
Expected: every line `PASS`, including the old flows.

If a flow fails, read `e2e/out/dev-<role>.log`. Common causes:
- a seed column missing (fix the seed);
- the fake's `lit` not stringifying `facts` (check Task 3 Step 7).

- [ ] **Step 5: Look at the screenshots**

Open `e2e/out/s8a/1-weekly-report.png`, `2-ai-page.png`, `3-brief.png` at 1366 px. Check that nothing overflows, text is Vietnamese, and the light theme is used.

- [ ] **Step 6: Commit**

```bash
git add e2e/report-flow.mjs e2e/brief-flow.mjs e2e/run.sh
git commit -m "test(S8a): browser flows for the weekly report, AI page and tutor brief"
```

---

### Task 11: Docs, push, PR

**Files:**
- Modify:
  - `docs/DESIGN.md`: routes `/parent/bao-cao`, `/parent/ai`, `/api/cron/weekly`, the brief on Buổi dạy; tables 0014; `src/lib/ai/`.
  - `docs/AI_TUTOR.md` §8: S8a done, S8b next.
  - `docs/PROGRESS.md`: dated section + "Trạng thái nhanh" row S8a.
  - `docs/HANDOFF.md`: S8a PR open with SQL 0014, S8b next.
  - `docs/P1_PLAN.md` row 7b: S8a / S8b.

- [ ] **Step 1: Write the docs**

**PROGRESS** section "22/10/2026 (or the real day) — S8a: nền AI, báo cáo tuần, tóm tắt gia sư (nhánh `p1-slice-8`, SQL 0014)". It has three parts:
- **Đã làm**: one line per task.
- **Kiểm thử**: unit count, `test:db`, e2e count, screenshots in `e2e/out/s8a/`.
- **Phụ huynh cần làm**:
  1. Press "Áp dụng SQL" for `0014_p1_ai.sql` on the PR branch.
  2. Check that `CRON_SECRET` and `ANTHROPIC_API_KEY` exist on Vercel (Production).
  3. Check the Haiku 5.5 / Sonnet 5.5 prices on the official pricing page and tell Claude if they differ from spec §3.
  4. Read the two prompts on `/parent/ai` and say "ok" or what to change.
  5. Merge.

**HANDOFF:**
- Phiên Code: row **4a.** S8a ✅ PR mở (SQL 0014); row **4b.** S8b — AI cho con + bộ test, after the test set (02–08/11), its plan written at start from the spec §6.
- Phụ huynh: items 1–5 above.

- [ ] **Step 2: Final checks**

Run: `npm run lint && npm test && npm run build`, commit, `./e2e/run.sh`
Expected: all green.

- [ ] **Step 3: Commit and push**

```bash
git add docs
git commit -m "docs(S8a): design, AI_TUTOR, progress, handoff, plan"
git push -u origin p1-slice-8
```

Pushing `p[0-9]-*` usually opens a PR. If none appears within a minute, open one with `gh api -X POST repos/haleytruong89-moon/math-app/pulls -f title=… -f head=p1-slice-8 -f base=main -F body=@<file>`.

- **Title:** "S8a: nền AI, báo cáo tuần, tóm tắt gia sư (SQL 0014)".
- **Body:** what changed; "Phụ huynh cần làm" 1–5; the line "🤖 Generated with [Claude Code](https://claude.com/claude-code)"; the session link.

Then dispatch CI: `gh api -X POST repos/haleytruong89-moon/math-app/actions/workflows/ci.yml/dispatches -f ref=p1-slice-8`.

---

## Self-review (done when writing)

- **Spec coverage:**
  - §2 rules → Tasks 2, 4, 5, 6 (guard, banned words, no names, cap, key server-only).
  - §3 prices → Task 2.
  - §4 tables → Task 1.
  - §5.1 report → Tasks 4, 6, 7.
  - §5.2 brief → Tasks 5, 6, 8.
  - §5.3 AI page → Task 9.
  - The S8b tables exist (Task 1); S8b behaviour is its own plan.
- **Types:**
  - `WeeklyFacts` (Task 4) is used by Tasks 5 (`weeklyUser`), 6 and 7.
  - `BriefFacts` / `BriefPoint` (Task 5) are used by Tasks 6 and 8.
  - `Generated` / `Check` (Task 2) are used by Tasks 4–6.
  - `comment_status` values `ok | failed | off | none` match the SQL check.
  - The upsert key `kind,student_id,period` matches `unique (kind, student_id, period)`.
- **Known judgement calls:**
  - The brief's "since" includes the day of the last session (homework done after the lesson the same day counts).
  - The report's `newSolid` uses the system level, ignoring parent confirmations.
  - The weekly cron is one call per student in one 60 s request (1–2 students).
