# S4 Parent overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/parent` shows, per student, 3 headline numbers, "Cần chú ý" (tutor/system mismatch flags with "Chốt mức", missed tutor sessions by weekly schedule), a unit map and this week's summary; parent-confirmed levels show (with "bố mẹ chốt") on parent, tutor and student screens.

**Architecture:** Migration 0008 adds `parent_confirmations` and `tutor_assignments.weekdays`. All rules are pure functions in `src/lib/learning/overview.ts` (unit-tested). A server component `StudentOverview` loads data through the parent's RLS client; writes go through server actions (`confirmLevel`, weekday edits) with `service_role`. A server-only helper `parentOwnsStudent` moves to `src/lib/parent.ts` so both parent action files share it.

**Tech Stack:** Next.js 16 App Router (server components/actions), Supabase Postgres + RLS (PGlite in tests), zod, Tailwind v4 tokens, `node --test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-05-parent-overview-design.md` (decisions P1–P3; §3 rule as amended 05/10).

## Global Constraints

- UI text Vietnamese; code/comments/commits/file names English.
- Dates and weeks in Vietnam time (`vnDate`, `weekStart` from `rules.ts`); weekday numbers 1 = thứ Hai … 7 = Chủ nhật.
- Confirmed level is **display only** (P2): never changes `review_queue`, "Hôm nay cần làm", or `systemMastery`.
- Display rule (§3 amended): confirmed level is shown while the current system level equals `system_level` at confirmation.
- Flag rule: latest proposal per unit (any tutor) with `|level − system| ≥ 1` and no confirmation after it.
- Missed-session rule: active assignment with weekdays; days in the last 14 days, from the assignment start date, up to **yesterday**; no session of that tutor with that `taught_on`.
- No streaks/leaderboards (D17); "chưa đủ dữ liệu" under 5 answers (D15).
- Migration only adds; RLS on; `service_role` grants; PGlite tests; parent runs SQL 0008 before merge.
- Before pushing: `npm run lint`, `npm test`, `npm run build`, e2e (Windows: Playwright container without `.env.local`).

## Review Focus

1. **A confirmation for a unit the student then improves** (system level changes) → display falls back to the system level and the "bố mẹ chốt" label disappears (Task 2 test).
2. **A tutor proposes again after the parent confirmed, still disagreeing** → the flag comes back; display keeps the confirmed level until the system level moves (Task 2 test).
3. **An assignment started today / a weekday that is today** → no "chưa ghi" reminder yet (Task 2 test).
4. **Weekdays form posted with duplicates, 0, 8 or junk** → refused before the DB; DB check also refuses (Task 1 RLS test, Task 2 test).
5. **Parent with a student but no approved units / no tutor / no schedule** → overview renders zeros and "Không có gì cần chú ý", no crash (Task 2 empty-input tests: `mismatchFlags([], [], [])`, `missedSessions` with no weekdays).

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0008_p1_parent_overview.sql` (create) | `parent_confirmations`, `weekdays_ok()`, `tutor_assignments.weekdays`, RLS, grants |
| `supabase/tests/rls.test.mjs` (modify) | load 0008; RLS + constraint tests |
| `src/lib/learning/overview.ts` (create) | `WEEKDAY_SHORT`, `isoWeekday`, `parseWeekdays`, `latestByUnit`, `displayLevel`, `mismatchFlags`, `missedSessions`, `weekSummary` |
| `src/lib/learning/overview.test.ts` (create) | unit tests |
| `src/lib/parent.ts` (create) | server-only `parentOwnsStudent` |
| `src/app/parent/actions.ts` (create) | `confirmLevel` |
| `src/app/parent/accounts/actions.ts` (modify) | use shared helper; `assignTutor` weekdays; `setAssignmentWeekdays` |
| `src/app/parent/accounts/page.tsx` (modify) | weekday checkboxes on assign; "Sửa lịch" per active assignment |
| `src/components/parent/student-overview.tsx` (create) | one student's overview (server component) |
| `src/app/parent/page.tsx` (modify) | render `StudentOverview` per student |
| `src/app/student/page.tsx` (modify) | progress map shows display level + "bố mẹ chốt" |
| `src/app/tutor/[studentId]/page.tsx`, `src/components/tutor/session-form.tsx` (modify) | evidence line "Bố mẹ chốt M3 (dd/mm)" |
| `src/components/work/student-work.tsx` (modify) | summary badge "Bố mẹ chốt M3" |
| `e2e/overview-flow.mjs` (create), `e2e/run.sh`, `e2e/student-flow.mjs` (modify) | browser checks |
| `docs/SPEC.md`, `docs/DESIGN.md`, `docs/P1_PLAN.md`, `docs/PROGRESS.md` (modify) | decisions, routes/tables, status, report |

---

### Task 1: Migration 0008 + RLS tests

**Files:** Create `supabase/migrations/0008_p1_parent_overview.sql`; Modify `supabase/tests/rls.test.mjs`.

**Interfaces:**
- Produces: `public.parent_confirmations(id, student_id, parent_id, unit_id, level, system_level, proposal_session_id, note, created_at)`; `public.tutor_assignments.weekdays smallint[]`; `public.weekdays_ok(smallint[]) returns boolean`.

- [ ] **Step 1: Failing tests.** In `rls.test.mjs`, after the line loading `0007_p1_homework.sql` add:

```js
await db.exec(fs.readFileSync(`${repo}/migrations/0008_p1_parent_overview.sql`, 'utf8'));
```

and just before `await db.exec(\`update public.profiles set is_active=false where id=(select id from auth.users where email='trang@example.com')\`);` (the final lock block) add:

```js
// 0008: parent_confirmations + tutor_assignments.weekdays (S4)
await db.exec(`set role service_role`);
const pc = await db.query(`
  insert into public.parent_confirmations (student_id, parent_id, unit_id, level, system_level, note)
  select s.id, (select id from auth.users where email='me@example.com'), 'htl-1', 3, 1, 'đã kiểm tra trên lớp'
  from public.students s where s.full_name='Hạnh Nguyên'`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write parent_confirmations', pc, true);
check('parent sees confirmations of child', (await as('me@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 1);
check('active tutor sees confirmations', (await as('trang@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 1);
check('ended tutor sees no confirmations', (await as('old@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 0);
check('student sees own confirmations', (await as('nguyen@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 1);
check('other student sees none', (await as('an@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 0);
check('parent cannot write confirmations directly', isErr(await as('me@example.com',`insert into public.parent_confirmations (student_id, parent_id, unit_id, level, system_level) select id, auth.uid(), 'htl-2', 2, 0 from public.students`)), true);
const badPc = (cols) => db.query(`insert into public.parent_confirmations (student_id, parent_id, unit_id, level, system_level, note) select s.id, (select id from auth.users where email='me@example.com'), ${cols} from public.students s where s.full_name='Hạnh Nguyên'`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr);
check('confirmation level 0–4 and note ≤ 300', await badPc(`'htl-1', 5, 0, null`) && await badPc(`'htl-1', 2, 0, repeat('x', 301)`), true);
check('weekdays default empty', (await db.query(`select weekdays from public.tutor_assignments limit 1`)).rows[0].weekdays, []);
const badWd = (arr) => db.query(`update public.tutor_assignments set weekdays = ${arr} where ended_at is null`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr);
check('weekdays 1–7, unique, not null', await badWd(`'{0}'`) && await badWd(`'{8}'`) && await badWd(`'{2,2}'`) && await badWd(`array[null]::smallint[]`), true);
check('weekdays valid set accepted', await db.query(`update public.tutor_assignments set weekdays = '{2,4}' where ended_at is null`).then(()=>true, ()=>false), true);
check('weekdays_ok has a fixed search_path', (await db.query(`select proconfig from pg_proc where proname = 'weekdays_ok'`)).rows[0].proconfig, ['search_path=""']);
```

After `check('locked tutor sees no homework', …)` add:

```js
check('locked tutor sees no confirmations', (await as('trang@example.com','select count(*)::int c from public.parent_confirmations'))[0].c, 0);
```

- [ ] **Step 2: Run** `npm run test:db` → Expected: crash `ENOENT … 0008_p1_parent_overview.sql`.

- [ ] **Step 3: Create `supabase/migrations/0008_p1_parent_overview.sql`**

```sql
-- 0008 (S4): parent "Tổng quan" — confirmed levels (D8) and the tutor's weekly schedule (Q8).
-- A confirmation is display-only (P2): it never changes reviews or mastery rules. Shown while
-- the system level still equals system_level at the time of confirming.
-- Clients may only SELECT (RLS); writes go through server actions with service_role.

create table public.parent_confirmations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  level smallint not null check (level between 0 and 4),
  system_level smallint not null check (system_level between 0 and 4), -- snapshot when confirmed
  proposal_session_id uuid references public.teaching_sessions (id) on delete set null,
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index parent_confirmations_student_unit_time on public.parent_confirmations (student_id, unit_id, created_at desc);

alter table public.parent_confirmations enable row level security;
create policy parent_confirmations_select on public.parent_confirmations
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));
revoke all on public.parent_confirmations from anon, authenticated;
grant select on public.parent_confirmations to authenticated;
grant select, insert, update, delete on public.parent_confirmations to service_role;

-- Weekly teaching days of an assignment: 1 = Monday … 7 = Sunday, no duplicates.
create function public.weekdays_ok(d smallint[]) returns boolean
  language sql immutable set search_path = ''
  as $$ select coalesce(bool_and(x is not null and x between 1 and 7), true) and count(*) = count(distinct x) from unnest(d) as x $$;
revoke all on function public.weekdays_ok(smallint[]) from public;
grant execute on function public.weekdays_ok(smallint[]) to authenticated, service_role;

alter table public.tutor_assignments
  add column weekdays smallint[] not null default '{}' check (public.weekdays_ok(weekdays));
```

- [ ] **Step 4: Run** `npm run test:db` → Expected: `ALL PASSED` (65 + 13).

- [ ] **Step 5: Commit** `git add supabase && git commit -m "Migration 0008: parent confirmations, tutor weekly schedule"`

---

### Task 2: Pure overview rules (`overview.ts`)

**Files:** Create `src/lib/learning/overview.ts`, `src/lib/learning/overview.test.ts`.

**Interfaces:**
- Consumes: `vnDate`, `addDays`, `weekStart`, `studyDaysThisWeek`, `type AttemptRow`, `type Level` from `./rules.ts`.
- Produces:
  - `WEEKDAY_SHORT: readonly ["T2","T3","T4","T5","T6","T7","CN"]` (index = weekday − 1)
  - `isoWeekday(isoDate: string): number` (1–7)
  - `parseWeekdays(values: unknown[]): number[] | null` (sorted unique 1–7; null if any invalid)
  - `type ProposalRow = { session_id: string; unit_id: string; level: number; tutor_id: string; created_at: string }`
  - `type ConfirmationRow = { unit_id: string; level: number; system_level: number; created_at: string }`
  - `latestByUnit<T extends { unit_id: string; created_at: string }>(rows: T[]): Map<string, T>`
  - `displayLevel(system: Level, confirmation?: ConfirmationRow): { level: Level; confirmed: boolean }`
  - `type Flag = { unitId: string; proposal: ProposalRow; system: Level }`
  - `mismatchFlags(units: { id: string; system: Level }[], proposals: ProposalRow[], confirmations: ConfirmationRow[]): Flag[]`
  - `type AssignmentRow = { id: string; tutor_id: string; started_at: string; ended_at: string | null; weekdays: number[] }`
  - `missedSessions(assignments: AssignmentRow[], sessions: { tutor_id: string; taught_on: string }[], today: string, days?: number): { assignmentId: string; tutorId: string; date: string }[]` (oldest first)
  - `type WeekSummary = { studyDays: number; exits: number; reviews: number; sessions: number; homeworkGiven: number; homeworkDone: number; homeworkReviewed: number }`
  - `weekSummary(input: { attempts: AttemptRow[]; reviewLog: { created_at: string }[]; sessions: { taught_on: string }[]; homework: { created_at: string; done_at: string | null; reviewed_at: string | null }[]; today: string }): WeekSummary`

- [ ] **Step 1: Failing tests** — `src/lib/learning/overview.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { displayLevel, isoWeekday, latestByUnit, mismatchFlags, missedSessions, parseWeekdays, weekSummary, type ConfirmationRow, type ProposalRow } from "./overview.ts";
import type { AttemptRow } from "./rules.ts";

const at = (day: string, hour = 10) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00+07:00`).toISOString();
const prop = (unit_id: string, level: number, day: string): ProposalRow => ({ session_id: `s-${day}`, unit_id, level, tutor_id: "t1", created_at: at(day) });
const conf = (unit_id: string, level: number, system_level: number, day: string): ConfirmationRow => ({ unit_id, level, system_level, created_at: at(day, 12) });

test("weekday numbers: Monday = 1 … Sunday = 7; form values parsed strictly", () => {
  assert.equal(isoWeekday("2026-10-05"), 1);
  assert.equal(isoWeekday("2026-10-11"), 7);
  assert.deepEqual(parseWeekdays(["4", "2"]), [2, 4]);
  assert.deepEqual(parseWeekdays([]), []);
  assert.equal(parseWeekdays(["2", "2"]), null);
  assert.equal(parseWeekdays(["0"]), null);
  assert.equal(parseWeekdays(["8"]), null);
  assert.equal(parseWeekdays(["x"]), null);
});

test("latest row per unit", () => {
  const m = latestByUnit([prop("a", 1, "2026-10-01"), prop("a", 3, "2026-10-03"), prop("b", 2, "2026-10-02")]);
  assert.equal(m.get("a")?.level, 3);
  assert.equal(m.get("b")?.level, 2);
});

test("display level: confirmed while the system level is unchanged; falls back when it moves", () => {
  assert.deepEqual(displayLevel(1), { level: 1, confirmed: false });
  assert.deepEqual(displayLevel(1, conf("a", 3, 1, "2026-10-05")), { level: 3, confirmed: true });
  assert.deepEqual(displayLevel(2, conf("a", 3, 1, "2026-10-05")), { level: 2, confirmed: false });
});

test("mismatch flags: ≥ 1 level apart, not confirmed after the proposal, gone when the system catches up", () => {
  const units = [{ id: "a", system: 1 as const }, { id: "b", system: 2 as const }, { id: "c", system: 3 as const }];
  const proposals = [prop("a", 3, "2026-10-03"), prop("b", 2, "2026-10-03"), prop("c", 1, "2026-10-01"), prop("c", 3, "2026-10-04")];
  assert.deepEqual(mismatchFlags(units, proposals, []).map((f) => f.unitId), ["a"]); // b equal; c latest equals system
  assert.deepEqual(mismatchFlags(units, proposals, [conf("a", 3, 1, "2026-10-04")]), []); // confirmed after the proposal
  // tutor proposes again after the confirmation, still disagreeing → flag is back
  assert.deepEqual(mismatchFlags(units, [...proposals, prop("a", 4, "2026-10-05")], [conf("a", 3, 1, "2026-10-04")]).map((f) => f.unitId), ["a"]);
  assert.deepEqual(mismatchFlags([], [], []), []);
});

test("missed sessions: scheduled days up to yesterday, from the assignment start, without a logged session", () => {
  // today Thu 2026-10-08; schedule Tue (2) + Thu (4); assignment started Mon 2026-09-28
  const a = { id: "as1", tutor_id: "t1", started_at: at("2026-09-28"), ended_at: null, weekdays: [2, 4] };
  const sessions = [{ tutor_id: "t1", taught_on: "2026-10-06" }]; // Tue logged
  assert.deepEqual(missedSessions([a], sessions, "2026-10-08").map((m) => m.date), ["2026-09-29", "2026-10-01"]);
  // starting today → nothing yet; no schedule → nothing; ended → nothing
  assert.deepEqual(missedSessions([{ ...a, started_at: at("2026-10-08") }], [], "2026-10-08"), []);
  assert.deepEqual(missedSessions([{ ...a, weekdays: [] }], [], "2026-10-08"), []);
  assert.deepEqual(missedSessions([{ ...a, ended_at: at("2026-10-07") }], [], "2026-10-08"), []);
  // another tutor's session on that day doesn't count
  assert.equal(missedSessions([a], [{ tutor_id: "t2", taught_on: "2026-10-06" }], "2026-10-08").length, 3);
});

test("week summary counts Monday → today (Vietnam time)", () => {
  const A = (p: Partial<AttemptRow>): AttemptRow => ({ item_id: "i", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: at("2026-10-06"), ...p });
  const s = weekSummary({
    today: "2026-10-08",
    attempts: [
      A({ mode: "exit", exit_run: "r1" }), A({ mode: "exit", exit_run: "r1", item_id: "j" }),
      A({ mode: "exit", exit_run: "r0", created_at: at("2026-10-04") }), // last week (Sunday)
      A({ mode: "review", exit_run: "v1", created_at: at("2026-10-07") }),
    ],
    reviewLog: [{ created_at: at("2026-10-07") }, { created_at: at("2026-10-03") }],
    sessions: [{ taught_on: "2026-10-06" }, { taught_on: "2026-10-02" }],
    homework: [
      { created_at: at("2026-10-06"), done_at: at("2026-10-07"), reviewed_at: null },
      { created_at: at("2026-10-01"), done_at: null, reviewed_at: at("2026-10-06") },
    ],
  });
  assert.deepEqual(s, { studyDays: 2, exits: 1, reviews: 1, sessions: 1, homeworkGiven: 1, homeworkDone: 1, homeworkReviewed: 1 });
});
```

- [ ] **Step 2: Run** `node --test src/lib/learning/overview.test.ts` → Expected: FAIL `Cannot find module '.../overview.ts'`.

- [ ] **Step 3: Implement `src/lib/learning/overview.ts`**

```ts
// Parent "Tổng quan" rules (S4, spec 2026-10-05). Pure, so `node --test` covers it.
// Confirmed levels are display only (P2): nothing here changes reviews or mastery.
import { addDays, studyDaysThisWeek, vnDate, weekStart, type AttemptRow, type Level } from "./rules.ts";

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const; // index = weekday − 1

/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(isoDate: string): number {
  return ((new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

/** Checkbox values → sorted unique weekdays, or null if anything is invalid. */
export function parseWeekdays(values: unknown[]): number[] | null {
  const out = new Set<number>();
  for (const v of values) {
    const s = String(v);
    if (!/^[1-7]$/.test(s) || out.has(Number(s))) return null;
    out.add(Number(s));
  }
  return [...out].sort((a, b) => a - b);
}

export type ProposalRow = { session_id: string; unit_id: string; level: number; tutor_id: string; created_at: string };
export type ConfirmationRow = { unit_id: string; level: number; system_level: number; created_at: string };

export function latestByUnit<T extends { unit_id: string; created_at: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const cur = m.get(r.unit_id);
    if (!cur || r.created_at > cur.created_at) m.set(r.unit_id, r);
  }
  return m;
}

/** §3 (amended): the parent's level is shown while the system level hasn't moved since confirming. */
export function displayLevel(system: Level, confirmation?: ConfirmationRow): { level: Level; confirmed: boolean } {
  if (confirmation && confirmation.system_level === system) return { level: confirmation.level as Level, confirmed: true };
  return { level: system, confirmed: false };
}

export type Flag = { unitId: string; proposal: ProposalRow; system: Level };

/** Latest proposal per unit (any tutor) ≥ 1 level from the current system level, not confirmed since. */
export function mismatchFlags(units: { id: string; system: Level }[], proposals: ProposalRow[], confirmations: ConfirmationRow[]): Flag[] {
  const p = latestByUnit(proposals);
  const c = latestByUnit(confirmations);
  const out: Flag[] = [];
  for (const u of units) {
    const prop = p.get(u.id);
    if (!prop || Math.abs(prop.level - u.system) < 1) continue;
    const conf = c.get(u.id);
    if (conf && conf.created_at > prop.created_at) continue;
    out.push({ unitId: u.id, proposal: prop, system: u.system });
  }
  return out;
}

export type AssignmentRow = { id: string; tutor_id: string; started_at: string; ended_at: string | null; weekdays: number[] };

/** Scheduled teaching days in the last `days` days, up to yesterday, with no session logged by that tutor. */
export function missedSessions(
  assignments: AssignmentRow[],
  sessions: { tutor_id: string; taught_on: string }[],
  today: string,
  days = 14,
): { assignmentId: string; tutorId: string; date: string }[] {
  const logged = new Set(sessions.map((s) => `${s.tutor_id}|${s.taught_on}`));
  const out: { assignmentId: string; tutorId: string; date: string }[] = [];
  for (const a of assignments) {
    if (a.ended_at || !a.weekdays.length) continue;
    const start = vnDate(a.started_at);
    for (let i = days; i >= 1; i--) {
      const d = addDays(today, -i);
      if (d < start || !a.weekdays.includes(isoWeekday(d))) continue;
      if (!logged.has(`${a.tutor_id}|${d}`)) out.push({ assignmentId: a.id, tutorId: a.tutor_id, date: d });
    }
  }
  return out;
}

export type WeekSummary = {
  studyDays: number;
  exits: number;
  reviews: number;
  sessions: number;
  homeworkGiven: number;
  homeworkDone: number;
  homeworkReviewed: number;
};

export function weekSummary(input: {
  attempts: AttemptRow[];
  reviewLog: { created_at: string }[];
  sessions: { taught_on: string }[];
  homework: { created_at: string; done_at: string | null; reviewed_at: string | null }[];
  today: string;
}): WeekSummary {
  const from = weekStart(input.today);
  const inWeek = (iso: string | null) => !!iso && vnDate(iso) >= from && vnDate(iso) <= input.today;
  const exitRuns = new Set(input.attempts.filter((a) => a.mode === "exit" && a.exit_run && inWeek(a.created_at)).map((a) => a.exit_run));
  return {
    studyDays: studyDaysThisWeek(input.attempts, input.today),
    exits: exitRuns.size,
    reviews: input.reviewLog.filter((r) => inWeek(r.created_at)).length,
    sessions: input.sessions.filter((s) => s.taught_on >= from && s.taught_on <= input.today).length,
    homeworkGiven: input.homework.filter((h) => inWeek(h.created_at)).length,
    homeworkDone: input.homework.filter((h) => inWeek(h.done_at)).length,
    homeworkReviewed: input.homework.filter((h) => inWeek(h.reviewed_at)).length,
  };
}
```

- [ ] **Step 4: Run** `node --test src/lib/learning/overview.test.ts` → 6 PASS; `npm run test:content` → all pass.

- [ ] **Step 5: Commit** `git add src/lib/learning/overview.ts src/lib/learning/overview.test.ts && git commit -m "Overview rules: display level, mismatch flags, missed sessions, week summary"`

---

### Task 3: Actions — confirm level, weekly schedule

**Files:** Create `src/lib/parent.ts`, `src/app/parent/actions.ts`; Modify `src/app/parent/accounts/actions.ts`, `src/app/parent/accounts/page.tsx`.

**Interfaces:**
- Consumes: `parseWeekdays`, `WEEKDAY_SHORT`, `latestByUnit`, `ProposalRow` (Task 2); `reviewNote` from `@/lib/learning/homework` (≤ 300, CRLF-normalised note); `loadStudentState`; `getUnit`.
- Produces: `parentOwnsStudent(parentId: string, studentId: string): Promise<boolean>` (server-only); `confirmLevel(prev: ActionState, fd: FormData)` fields `studentId`, `unitId`, `level`, `note`; `setAssignmentWeekdays(prev, fd)` fields `assignmentId`, `weekday` (repeated); `assignTutor` reads repeated `weekday`. DOM: checkboxes `input[name="weekday"]` labelled T2…CN; button "Lưu lịch".

- [ ] **Step 1: `src/lib/parent.ts`**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** The parent owns this student (parent_students link). */
export async function parentOwnsStudent(parentId: string, studentId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .maybeSingle();
  return Boolean(data);
}
```

In `src/app/parent/accounts/actions.ts`: delete the local `async function parentOwnsStudent(...)` and add `import { parentOwnsStudent } from "@/lib/parent";`.

- [ ] **Step 2: `src/app/parent/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUnit } from "@/lib/content";
import { reviewNote } from "@/lib/learning/homework";
import { latestByUnit, type ProposalRow } from "@/lib/learning/overview";
import { loadStudentState } from "@/lib/learning/state";
import { parentOwnsStudent } from "@/lib/parent";
import type { ActionState } from "@/components/action-form";

/** "Chốt mức" (D8): display only (P2) — snapshots the current system level and the proposal it answers. */
export async function confirmLevel(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  const unitId = String(fd.get("unitId") ?? "");
  const level = String(fd.get("level") ?? "");
  const note = reviewNote(fd.get("note"));
  if (!studentId.success || !getUnit(unitId)) return { error: "Không tìm thấy bài này." };
  if (!/^[0-4]$/.test(level)) return { error: "Chọn mức M0–M4." };
  if (!note.ok) return { error: note.error };
  if (!(await parentOwnsStudent(parent.id, studentId.data))) return { error: "Không tìm thấy học sinh." };

  const admin = createAdminClient();
  const [state, proposals] = await Promise.all([
    loadStudentState(admin, studentId.data, { includeDrafts: true }),
    admin.from("tutor_proposals").select("session_id, unit_id, level, tutor_id, created_at").eq("student_id", studentId.data).eq("unit_id", unitId),
  ]);
  const system = state.units.find((u) => u.unit.id === unitId)?.mastery.level ?? 0;
  const latest = latestByUnit((proposals.data ?? []) as ProposalRow[]).get(unitId);

  const { error } = await admin.from("parent_confirmations").insert({
    student_id: studentId.data,
    parent_id: parent.id,
    unit_id: unitId,
    level: Number(level),
    system_level: system,
    proposal_session_id: latest?.session_id ?? null,
    note: note.value,
  });
  if (error) {
    console.error("confirmLevel", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent");
  return { ok: `Đã chốt M${level}.` };
}
```

- [ ] **Step 3: Weekdays in `src/app/parent/accounts/actions.ts`**

Add `import { parseWeekdays } from "@/lib/learning/overview";`. In `assignTutor`, after the `tutorId`/`studentId` parse:

```ts
  const weekdays = parseWeekdays(fd.getAll("weekday"));
  if (!weekdays) return fail("Ngày dạy không hợp lệ.");
```

and change the insert to `.insert({ tutor_id: tutorId.data, student_id: studentId.data, weekdays })`. Append:

```ts
/** Edit the weekly teaching days of an active assignment (S4 "buổi dạy chưa ghi"). */
export async function setAssignmentWeekdays(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const id = Uuid.safeParse(fd.get("assignmentId"));
  const weekdays = parseWeekdays(fd.getAll("weekday"));
  if (!id.success) return fail("Không hợp lệ.");
  if (!weekdays) return fail("Ngày dạy không hợp lệ.");

  const admin = createAdminClient();
  const { data: a } = await admin.from("tutor_assignments").select("student_id").eq("id", id.data).is("ended_at", null).maybeSingle();
  if (!a || !(await parentOwnsStudent(parent.id, a.student_id as string))) return fail("Không tìm thấy.");
  const { error } = await admin.from("tutor_assignments").update({ weekdays }).eq("id", id.data);
  if (error) return fail("Chưa lưu được, thử lại sau.");
  revalidatePath(PAGE);
  revalidatePath("/parent");
  return { ok: "Đã lưu lịch." };
}
```

- [ ] **Step 4: Accounts page** — `src/app/parent/accounts/page.tsx`: import `setAssignmentWeekdays` and `WEEKDAY_SHORT` (`@/lib/learning/overview`); add `weekdays` to the `tutor_assignments` select (`"id, tutor_id, student_id, started_at, ended_at, weekdays"`). Add a reusable fragment above `export default`:

```tsx
function WeekdayBoxes({ selected = [] }: { selected?: number[] }) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="mb-1 text-sm text-muted">Ngày dạy trong tuần (để nhắc khi gia sư quên ghi buổi)</legend>
      {WEEKDAY_SHORT.map((label, i) => (
        <label key={label} className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="weekday" value={i + 1} defaultChecked={selected.includes(i + 1)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
```

In the "Gán gia sư" `ActionForm`, after the student `</label>` add `<WeekdayBoxes />`. In "Lịch sử phân công", for each active assignment (`!a.ended_at`), after the name/date `<span>` render the schedule and an editor:

```tsx
                {!a.ended_at && (
                  <details className="w-full text-sm">
                    <summary className="cursor-pointer text-accent">
                      Lịch: {(a.weekdays as number[]).length ? (a.weekdays as number[]).map((d) => WEEKDAY_SHORT[d - 1]).join(", ") : "chưa đặt"} · Sửa lịch
                    </summary>
                    <ActionForm action={setAssignmentWeekdays} submitLabel="Lưu lịch" variant="quiet" className="mt-2 flex flex-col gap-2">
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <WeekdayBoxes selected={a.weekdays as number[]} />
                    </ActionForm>
                  </details>
                )}
```

- [ ] **Step 5: Lint + build** — `npm run lint`, `npm run build` → clean.

- [ ] **Step 6: Commit** `git add src/lib/parent.ts src/app/parent && git commit -m "Parent actions: confirm level, tutor weekly schedule"`

---

### Task 4: `/parent` overview

**Files:** Create `src/components/parent/student-overview.tsx`; Modify `src/app/parent/page.tsx`.

**Interfaces:**
- Consumes: Task 2 rules; `confirmLevel` (Task 3); `loadStudentState`, `dueReviews`; `ActionForm`, `inputClass`, `labelClass`.
- Produces: DOM `data-testid="overview-<studentId>"`, stat tiles `data-testid="stat-m3"|"stat-overdue"|"stat-flags"`, flag cards `data-testid="flag-<unitId>"`, missed cards `data-testid="missed"`, unit tiles `data-testid="unit-<unitId>"`, button "Chốt mức".

- [ ] **Step 1: Create `src/components/parent/student-overview.tsx`**

```tsx
import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { confirmLevel } from "@/app/parent/actions";
import { loadStudentState } from "@/lib/learning/state";
import { RULES, vnDate } from "@/lib/learning/rules";
import {
  displayLevel, isoWeekday, latestByUnit, mismatchFlags, missedSessions, weekSummary,
  type AssignmentRow, type ConfirmationRow, type ProposalRow,
} from "@/lib/learning/overview";
import type { AttemptRow, Level } from "@/lib/learning/rules";

const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
const DAY_NAME = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"] as const;

/** One student's "Tổng quan" (S4). Reads through the parent's RLS client. */
export async function StudentOverview({ supabase, student }: { supabase: SupabaseClient; student: { id: string; full_name: string } }) {
  const id = student.id;
  const [state, proposals, confirmations, assignments, sessions, reviewLog, homework, profiles] = await Promise.all([
    loadStudentState(supabase, id),
    supabase.from("tutor_proposals").select("session_id, unit_id, level, tutor_id, created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(500),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(500),
    supabase.from("tutor_assignments").select("id, tutor_id, started_at, ended_at, weekdays").eq("student_id", id),
    supabase.from("teaching_sessions").select("id, tutor_id, taught_on, note").eq("student_id", id).order("taught_on", { ascending: false }).limit(200),
    supabase.from("review_log").select("created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("homework").select("created_at, done_at, reviewed_at").eq("student_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("id, display_name"),
  ]);
  for (const r of [proposals, confirmations, assignments, sessions, reviewLog, homework]) if (r.error) console.error("StudentOverview", r.error.message);

  const today = state.today;
  const tutorName = new Map((profiles.data ?? []).map((p) => [p.id as string, p.display_name as string]));
  const sessionNote = new Map((sessions.data ?? []).map((s) => [s.id as string, s.note as string | null]));
  const confs = latestByUnit((confirmations.data ?? []) as ConfirmationRow[]);
  const units = state.units.map((u) => ({ u, shown: displayLevel(u.mastery.level, confs.get(u.unit.id)) }));
  const flags = mismatchFlags(state.units.map((u) => ({ id: u.unit.id, system: u.mastery.level })), (proposals.data ?? []) as ProposalRow[], (confirmations.data ?? []) as ConfirmationRow[]);
  const missed = missedSessions((assignments.data ?? []) as AssignmentRow[], (sessions.data ?? []) as { tutor_id: string; taught_on: string }[], today);
  const week = weekSummary({
    attempts: state.units.flatMap((u) => u.attempts) as AttemptRow[],
    reviewLog: (reviewLog.data ?? []) as { created_at: string }[],
    sessions: (sessions.data ?? []) as { taught_on: string }[],
    homework: (homework.data ?? []) as { created_at: string; done_at: string | null; reviewed_at: string | null }[],
    today,
  });
  const m3 = units.filter((x) => x.shown.level >= 3).length;
  const overdue = state.units.filter((u) => u.review?.dueOn && u.review.dueOn < today).length;
  const unitOf = (uid: string) => state.units.find((u) => u.unit.id === uid);
  const workHref = (uid?: string) => `/parent/students/${id}/work${uid ? `?unit=${uid}` : ""}`;

  return (
    <section className="mt-6" data-testid={`overview-${id}`} aria-label={`Tổng quan ${student.full_name}`}>
      <h2 className="font-display text-lg font-semibold">{student.full_name}</h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat testid="stat-m3" value={`${m3}/${state.units.length}`} label="Bài đạt M3 trở lên" href="#ban-do" />
        <Stat testid="stat-overdue" value={String(overdue)} label="Bài ôn quá hạn" href="#ban-do" warn={overdue > 0} />
        <Stat testid="stat-flags" value={String(flags.length)} label="Cờ lệch đánh giá cần chốt" href="#can-chu-y" warn={flags.length > 0} />
      </div>

      <h3 id="can-chu-y" className="mt-8 font-display text-base font-semibold">Cần chú ý</h3>
      <ul className="mt-3 flex flex-col gap-3">
        {flags.map((f) => {
          const u = unitOf(f.unitId)!;
          const m = u.mastery;
          const evidence = [
            m.enoughData ? `${m.answers} câu đã làm` : `chưa đủ dữ liệu (${m.answers} câu)`,
            m.lastExit ? `kiểm tra gần nhất ${m.lastExit.right}/${m.lastExit.total}` : "chưa làm bài kiểm tra",
            m.practiceRate !== null ? `5 câu luyện gần nhất đúng ${Math.round(m.practiceRate * 100)}%` : null,
          ].filter(Boolean).join(" · ");
          const note = sessionNote.get(f.proposal.session_id);
          return (
            <li key={f.unitId} className="rounded-xl border border-warn bg-surface p-4" data-testid={`flag-${f.unitId}`}>
              <p className="font-display font-semibold">{u.unit.title}</p>
              <p className="mt-1 text-sm">
                {tutorName.get(f.proposal.tutor_id) ?? "Gia sư"} đề xuất <b>M{f.proposal.level}</b> ({ddmm(vnDate(f.proposal.created_at))}) · Hệ thống <b>M{f.system}</b>
              </p>
              <p className="mt-1 text-sm text-muted">{evidence}</p>
              {note && <p className="mt-1 text-sm text-muted">Ghi chú buổi dạy: “{note}”</p>}
              <Link href={workHref(f.unitId)} className="mt-1 inline-block text-sm text-accent hover:underline">Xem bài làm →</Link>
              <ActionForm action={confirmLevel} submitLabel="Chốt mức" className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="studentId" value={id} />
                <input type="hidden" name="unitId" value={f.unitId} />
                <label className={`${labelClass} w-28`}>
                  Mức
                  <select name="level" defaultValue={String(f.proposal.level)} className={inputClass}>
                    {[0, 1, 2, 3, 4].map((l) => <option key={l} value={l}>M{l}</option>)}
                  </select>
                </label>
                <label className={`${labelClass} min-w-48 flex-1`}>
                  Ghi chú (không bắt buộc)
                  <input name="note" maxLength={300} className={inputClass} />
                </label>
              </ActionForm>
            </li>
          );
        })}
        {missed.map((m) => (
          <li key={`${m.assignmentId}-${m.date}`} className="rounded-xl border border-border bg-surface p-4 text-sm" data-testid="missed">
            <b>{DAY_NAME[isoWeekday(m.date) - 1]} {ddmm(m.date)}</b>: {tutorName.get(m.tutorId) ?? "Gia sư"} chưa ghi buổi dạy.
          </li>
        ))}
        {!flags.length && !missed.length && <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có gì cần chú ý.</li>}
      </ul>

      <h3 id="ban-do" className="mt-8 font-display text-base font-semibold">Các bài</h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Bản đồ các bài">
        {units.map(({ u, shown }) => (
          <li key={u.unit.id} data-testid={`unit-${u.unit.id}`}>
            <Link href={workHref(u.unit.id)} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:border-accent">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[shown.level as Level]} ${shown.level >= 2 ? "text-on-accent" : "text-ink"}`}>
                M{shown.level}
              </span>
              <span className="min-w-0 text-sm leading-tight">
                {u.unit.title}
                <span className="block font-mono text-[11px] text-muted">
                  {u.mastery.enoughData ? `${u.mastery.answers} câu đã làm` : "chưa đủ dữ liệu"}
                  {shown.confirmed && " · bố mẹ chốt"}
                  {u.review?.dueOn && u.review.dueOn < today && " · ôn quá hạn"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-display text-base font-semibold">Tuần này</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3" data-testid="week">
        <Fact label="Buổi học" value={`${Math.min(week.studyDays, RULES.weeklyGoalDays)}/${RULES.weeklyGoalDays}`} />
        <Fact label="Bài kiểm tra đã nộp" value={week.exits} />
        <Fact label="Lượt ôn đã xong" value={week.reviews} />
        <Fact label="Buổi dạy đã ghi" value={week.sessions} />
        <Fact label="Bài về nhà (giao / xong / chữa)" value={`${week.homeworkGiven} / ${week.homeworkDone} / ${week.homeworkReviewed}`} />
      </dl>
      {(assignments.data ?? []).some((a) => !a.ended_at && !(a.weekdays as number[]).length) && (
        <p className="mt-3 text-xs text-muted">
          Chưa đặt lịch dạy nên app chưa nhắc được buổi dạy chưa ghi — đặt ở <Link href="/parent/accounts" className="text-accent underline">Tài khoản</Link>.
        </p>
      )}
    </section>
  );
}

function Stat({ value, label, href, warn = false, testid }: { value: string; label: string; href: string; warn?: boolean; testid: string }) {
  return (
    <a href={href} className="rounded-xl border border-border bg-surface p-4 hover:border-accent" data-testid={testid}>
      <div className={`font-display text-3xl font-bold tabular-nums ${warn ? "text-warn" : ""}`}>{value}</div>
      <div className="mt-1.5 text-sm text-muted">{label}</div>
    </a>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-base tabular-nums">{value}</dd>
    </div>
  );
}
```



- [ ] **Step 2: `src/app/parent/page.tsx`** — replace the `STATS` constant, the three "—" tiles and the "Số liệu sẽ có…" line with one `StudentOverview` per student (keep the "Học sinh" list with consent + "Xem bài làm" below it):

```tsx
import { StudentOverview } from "@/components/parent/student-overview";
// …
      <h1 className="font-display text-2xl font-bold">Tổng quan</h1>
      {(students ?? []).map((s) => (
        <StudentOverview key={s.id} supabase={supabase} student={s} />
      ))}
```

- [ ] **Step 3: Lint + build** → clean.

- [ ] **Step 4: Commit** `git add src/components/parent src/app/parent/page.tsx && git commit -m "Parent overview: numbers, mismatch flags with confirm, missed sessions, unit map, week"`

---

### Task 5: Show the confirmed level to the student and the tutor

**Files:** Modify `src/app/student/page.tsx`, `src/app/tutor/[studentId]/page.tsx`, `src/components/tutor/session-form.tsx`, `src/components/work/student-work.tsx`.

**Interfaces:** Consumes `displayLevel`, `latestByUnit`, `ConfirmationRow`. Produces: student map label "bố mẹ chốt"; tutor evidence line "Bố mẹ chốt M{n} ({dd/mm})"; StudentWork summary chip "Bố mẹ chốt M{n}".

- [ ] **Step 1: Student map** — in `StudentHome` add to the existing `Promise.all`: `supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", me.id).limit(500)`; build `const confs = latestByUnit((confRows.data ?? []) as ConfirmationRow[]);` and pass `confs` to `ProgressMap`. In `ProgressMap({ units, confs })`, per unit: `const shown = displayLevel(u.mastery.level, confs.get(u.unit.id));` use `shown.level` for the badge colour/text and append ` · bố mẹ chốt` to the small line when `shown.confirmed`. Mastery-based logic elsewhere (`TodayList`) stays on `u.mastery.level`.

- [ ] **Step 2: Tutor evidence** — `UnitEvidence` gains `confirmed: string | null` ("M3 (05/10)"). In `src/app/tutor/[studentId]/page.tsx` load `parent_confirmations` (same select, `.eq("student_id", student.id)`), `latestByUnit`, and set `confirmed: c && displayLevel(u.mastery.level, c).confirmed ? \`M${c.level} (${ddmm(vnDate(c.created_at))})\` : null`. In `Evidence`, add `u.confirmed ? \`Bố mẹ chốt ${u.confirmed}\` : null` to `facts`.

- [ ] **Step 3: StudentWork** — load confirmations in the `Promise.all`, pass `latestByUnit(...)` to `Summary`; when `displayLevel(u.mastery.level, conf).confirmed`, render chip `<span className="rounded-full bg-good-soft px-2 py-0.5 font-mono text-good">Bố mẹ chốt M{conf.level}</span>` next to the proposal chip (render the chip row when errors, proposal or confirmation exist).

- [ ] **Step 4: Lint + build + `npm run test:content`** → clean.

- [ ] **Step 5: Commit** `git add src/app/student src/app/tutor src/components && git commit -m "Confirmed level shown to student (map) and tutor (evidence, work view)"`

---

### Task 6: e2e

**Files:** Create `e2e/overview-flow.mjs`; Modify `e2e/run.sh` (add `run parent 3104 e2e/overview-flow.mjs; e=$?` and `|| e` in the exit line), `e2e/student-flow.mjs`.

- [ ] **Step 1: `e2e/overview-flow.mjs`**

```js
// Parent "Tổng quan" (S4): numbers, mismatch flag → confirm, missed session by schedule, weekly schedule edit.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3104";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const yesterday = add(vnToday, -1);
const isoWd = (d) => ((new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7) + 1;
const shots = "e2e/out/overview"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

// htl-1: worked example seen + 2 practice answers → system M1. Tutor proposed M3 two days ago.
// Assignment started 3 days ago with yesterday's weekday → exactly one missed day (yesterday).
await sql(`
  update public.tutor_assignments set started_at = now() - interval '3 days', weekdays = '{${isoWd(yesterday)}}' where ended_at is null;
  insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select id, 'htl-1', now() from public.students where full_name = 'Hạnh Nguyên';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
    select id, 'htl-1', v.i, 'practice', '1', true from public.students, (values ('htl-1-p1'), ('htl-1-p2')) v(i) where full_name = 'Hạnh Nguyên';
  with s as (insert into public.teaching_sessions (student_id, tutor_id, taught_on, note)
    select a.student_id, a.tutor_id, '${add(vnToday, -2)}', 'Con làm tốt trên lớp' from public.tutor_assignments a where a.ended_at is null returning id, student_id, tutor_id)
  insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select id, student_id, tutor_id, 'htl-1', 3, 1, 2 from s;`);

await page.goto(`${BASE}/parent`);
ok("numbers: 0/2 at M3+, 0 overdue, 1 flag", (await page.getByTestId("stat-m3").innerText()).includes("0/2") && (await page.getByTestId("stat-overdue").innerText()).includes("0") && (await page.getByTestId("stat-flags").innerText()).includes("1"));
const flag = page.getByTestId("flag-htl-1");
ok("flag: proposal vs system + session note", (await flag.getByText(/đề xuất M3/).count()) === 1 && (await flag.getByText(/Hệ thống M1/).count()) === 1 && (await flag.getByText(/Con làm tốt trên lớp/).count()) === 1);
ok("missed: yesterday's scheduled session", (await page.getByTestId("missed").getByText(/chưa ghi buổi dạy/).count()) === 1);
await page.screenshot({ path: `${shots}/1-overview.png`, fullPage: true });

await flag.locator('input[name="note"]').fill("Đã xem bài trên lớp");
await flag.getByRole("button", { name: "Chốt mức" }).click();
await flag.waitFor({ state: "detached" });
const c = await sql(`select level, system_level, note, proposal_session_id is not null as linked from public.parent_confirmations`);
ok("db: confirmation saved with system snapshot", c.length === 1 && c[0].level === 3 && c[0].system_level === 1 && c[0].linked === true, JSON.stringify(c));
await page.reload();
ok("after confirm: 1/2 at M3+, no flag, map says 'bố mẹ chốt'", (await page.getByTestId("stat-m3").innerText()).includes("1/2") && (await page.getByTestId("stat-flags").innerText()).includes("0") && (await page.getByTestId("unit-htl-1").getByText(/bố mẹ chốt/).count()) === 1);

await sql(`insert into public.teaching_sessions (student_id, tutor_id, taught_on) select student_id, tutor_id, '${yesterday}' from public.tutor_assignments where ended_at is null`);
await page.reload();
ok("missed reminder gone once yesterday's session is logged", (await page.getByTestId("missed").count()) === 0);

// weekly schedule editor on Tài khoản
await page.goto(`${BASE}/parent/accounts`);
await page.getByText(/Sửa lịch/).first().click();
const box = (n) => page.locator(`details:has-text("Sửa lịch") input[name="weekday"][value="${n}"]`).first();
for (const n of [1, 2, 3, 4, 5, 6, 7]) if (await box(n).isChecked()) await box(n).uncheck();
await box(2).check(); await box(5).check();
await page.getByRole("button", { name: "Lưu lịch" }).click();
await page.getByText("Đã lưu lịch.").waitFor();
ok("db: weekdays saved", JSON.stringify((await sql(`select weekdays from public.tutor_assignments where ended_at is null`))[0].weekdays) === "[2,5]");
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

- [ ] **Step 2: Student label** — in `e2e/student-flow.mjs`, before the `// ---- homework from the tutor (part B)` block:

```js
// ---- parent-confirmed level shows on the student's map (S4); htl-2 is M1 here
await sql(`insert into public.parent_confirmations (student_id, parent_id, unit_id, level, system_level)
  select id, '00000000-0000-0000-0000-00000000e2e0', 'htl-2', 3, 1 from public.students where full_name = 'Hạnh Nguyên'`);
await page.goto(`${BASE}/student`);
ok("student map: parent-confirmed level with label", (await page.locator("[role=listitem]").filter({ hasText: "Tính độ dài" }).getByText(/bố mẹ chốt/).count()) === 1);
```

- [ ] **Step 3: Run e2e** (container) → all PASS, exit 0.

- [ ] **Step 4: Commit** `git add e2e && git commit -m "e2e: parent overview, confirm level, missed sessions, schedule"`

---

### Task 7: Docs, verification, push

- [ ] **SPEC.md §0** add: `| 05/10/2026 | S4 (P1–P3): tutor schedule = fixed weekdays chosen when assigning; parent-confirmed level is display-only, shown while the system level is unchanged since confirming; every confirmation kept | docs/superpowers/specs/2026-10-05-parent-overview-design.md |`
- [ ] **DESIGN.md**: route `/parent` row → "Tổng quan per student: 3 numbers, mismatch flags + Chốt mức, missed sessions by schedule, unit map (display level), week summary"; data table rows `parent_confirmations (0008)`, `tutor_assignments.weekdays (0008)`.
- [ ] **P1_PLAN.md** S4 → `🟡 PR (SQL 0008)`. **PROGRESS.md**: status row + entry "S4 — Tổng quan phụ huynh" (Đã làm / Đã tự kiểm with real counts / **Phụ huynh cần làm: chạy SQL 0008**, set lịch dạy ở Tài khoản, thử, merge / ghi chú kỹ thuật: display rule amended, `parentOwnsStudent` in `src/lib/parent.ts`).
- [ ] **Verify**: `npm run lint`, `npm test`, `npm run build`, e2e — all green.
- [ ] **Commit + push + CI**: `git push -u origin p1-slice-4`, `gh workflow run ci.yml --ref p1-slice-4` → PR opened, CI success.
