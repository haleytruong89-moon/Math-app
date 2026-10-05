# Tutor homework via Drive links (Part B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In "Ghi buổi dạy" the tutor can give homework (task text + up to 3 Google Drive links + due date); the student sees it on "Hôm nay cần làm" and marks it done; at the next session the tutor marks it corrected with a note the student then sees.

**Architecture:** New table `homework` (migration 0007, composite FK to `teaching_sessions`, RLS select for parent / own active tutor / the student; writes only via server actions with `service_role`). Pure rules in `src/lib/learning/homework.ts` (form parsing, validation, labels, visibility). The tutor form gets a client `HomeworkFields` block whose values ride along in the same "Lưu buổi dạy" submit; two small server actions handle "Đã chữa" (tutor) and "Con làm xong rồi" (student).

**Tech Stack:** Next.js 16 App Router (server actions, `useActionState`), Supabase Postgres + RLS (PGlite in tests), zod, Tailwind v4, `node --test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` (Part B; decisions T1–T4).

## Global Constraints

- UI text Vietnamese; code, comments, commits, file names English.
- Homework is **not graded**, never counted in mastery or the weekly goal (T1). No streaks/points (D17).
- Links: 0–3 per homework, each starts with `https://`, ≤ 500 chars; non-Drive links are **warned, still saved** (T2). No file storage.
- Task 1–300 chars; review note ≤ 300 chars; line breaks count as one character (normalize `\r\n` → `\n`, as `parseSession` does).
- Due date default **today + 3** (T3); allowed range: taught day … today + 30.
- The student sees the tutor's review note (T4); a reviewed homework is shown for 7 days, then hidden.
- Migration only **adds** (no drops/renames), has RLS + `service_role` grants + PGlite tests; the parent runs SQL `0007` on Supabase before merge.
- Before pushing: `npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh` (Windows: Playwright container without `.env.local`, see `docs/PROGRESS.md`).
- Branch `p1-homework` from `p1-tutor-tools` (PR #5) — rebase on `main` once PRs #4/#5 are merged.

## Review Focus

1. **A ticked unit chosen in a homework row, then unticked before saving** → refused with a clear message naming the homework row, nothing written (Task 2 test).
2. **A homework row the tutor added but left completely blank** → silently ignored, the session still saves (Task 2 test).
3. **A link pasted with spaces / `http://` / `javascript:`** → refused before the DB; the DB check also refuses (Task 1 RLS test, Task 2 test).
4. **The student taps "Con làm xong rồi" after the tutor already corrected it** (stale page) → nothing changes, a friendly error (Task 4: action filters `reviewed_at is null`, e2e checks button absent after review).
5. **A save of session + homework where the homework insert fails** → no half-saved session (Task 3: session deleted, cascade removes proposals).

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0007_p1_homework.sql` (create) | Table, link check function, RLS, grants |
| `supabase/tests/rls.test.mjs` (modify) | Load 0007; RLS + constraint tests |
| `src/lib/learning/homework.ts` (create) | `HOMEWORK_RULES`, `readHomeworkForm`, `parseHomework`, `reviewNote`, `isDriveLink`, `dueLabel`, `visibleHomework` |
| `src/lib/learning/homework.test.ts` (create) | Unit tests |
| `src/app/tutor/actions.ts` (modify) | Save homework with the session; `reviewHomework`; shared `activeAssignment` |
| `src/components/tutor/homework-fields.tsx` (create) | Client editor for homework rows inside the session form |
| `src/components/tutor/session-form.tsx` (modify) | Mount `HomeworkFields`; new props `defaultDue`, `maxDue` |
| `src/app/tutor/[studentId]/page.tsx` (modify) | "Bài đã giao chưa chữa" list with "Đã chữa" form; pass due props |
| `src/app/student/actions.ts` (modify) | `setHomeworkDone` |
| `src/app/student/page.tsx` (modify) | Homework cards on "Hôm nay cần làm" |
| `e2e/tutor-flow.mjs`, `e2e/student-flow.mjs` (modify) | Browser checks |
| `docs/DESIGN.md`, `docs/P1_PLAN.md`, `docs/PROGRESS.md` (modify) | Table, slice status, report + SQL step |

---

### Task 1: Migration 0007 + RLS tests

**Files:**
- Create: `supabase/migrations/0007_p1_homework.sql`
- Modify: `supabase/tests/rls.test.mjs` (load line after the 0006 load; tests before `// lock` of the S3 block, i.e. before the line `await db.exec(\`update public.profiles set is_active=false where id=(select id from auth.users where email='trang@example.com')\`);` near the end)

**Interfaces:**
- Produces: table `public.homework(id uuid, session_id uuid, student_id uuid, tutor_id uuid, unit_id text null, task text, links text[], due_on date, done_at timestamptz null, reviewed_at timestamptz null, review_note text null, created_at timestamptz)`; function `public.homework_links_ok(text[]) returns boolean`.

- [ ] **Step 1: Write the failing RLS tests**

In `supabase/tests/rls.test.mjs`, add after the line that loads `0006_p1_teaching_sessions.sql`:

```js
await db.exec(fs.readFileSync(`${repo}/migrations/0007_p1_homework.sql`, 'utf8'));
```

Then, just before the final S3 line `await db.exec(\`update public.profiles set is_active=false where id=(select id from auth.users where email='trang@example.com')\`);`, add:

```js
// 0007: homework (S3b part B) — written by service_role, read through RLS
await db.exec(`set role service_role`);
const hw = await db.query(`
  insert into public.homework (session_id, student_id, tutor_id, unit_id, task, links, due_on)
  select id, student_id, tutor_id, 'htl-1', case when note = 'buổi 1' then 'bài mới' else 'bài cũ' end, array['https://drive.google.com/x'], current_date + 3
  from public.teaching_sessions`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write homework', hw, true);
check('student sees own homework (both tutors)', (await as('nguyen@example.com','select count(*)::int c from public.homework'))[0].c, 2);
check('other student sees none', (await as('an@example.com','select count(*)::int c from public.homework'))[0].c, 0);
check('active tutor sees only own homework', names(await as('trang@example.com','select task from public.homework')), ['bài mới']);
check('ended tutor sees no homework', (await as('old@example.com','select count(*)::int c from public.homework'))[0].c, 0);
check('parent sees all homework of child', (await as('me@example.com','select count(*)::int c from public.homework'))[0].c, 2);
check('student cannot mark done directly (server-only)', isErr(await as('nguyen@example.com',`update public.homework set done_at = now()`)), true);
check('tutor cannot insert homework directly', isErr(await as('trang@example.com',`insert into public.homework (session_id, student_id, tutor_id, task, due_on) select id, student_id, tutor_id, 'x', current_date from public.teaching_sessions`)), true);
const bad = (sql) => db.query(sql).then(()=>'ok', e=>'ERROR '+e.message).then(isErr);
const hwIns = (cols) => `insert into public.homework (session_id, student_id, tutor_id, task, links, due_on) select id, student_id, ${cols} from public.teaching_sessions where note='buổi 1'`;
check('homework must match its session tutor', await bad(hwIns(`(select id from auth.users where email='old@example.com'), 'x', '{}', current_date`)), true);
check('homework task 1–300 chars', await bad(hwIns(`tutor_id, '', '{}', current_date`)) && await bad(hwIns(`tutor_id, repeat('x', 301), '{}', current_date`)), true);
check('homework links: at most 3', await bad(hwIns(`tutor_id, 'x', array['https://a','https://b','https://c','https://d'], current_date`)), true);
check('homework links: https only', await bad(hwIns(`tutor_id, 'x', array['http://drive.google.com/x'], current_date`)) && await bad(hwIns(`tutor_id, 'x', array['javascript:alert(1)'], current_date`)), true);
check('review note needs reviewed_at', await bad(`update public.homework set review_note = 'x' where task = 'bài mới'`), true);
```

Also, after the existing `check('locked tutor sees no sessions', …)` line, add:

```js
check('locked tutor sees no homework', (await as('trang@example.com','select count(*)::int c from public.homework'))[0].c, 0);
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:db`
Expected: crash `ENOENT … 0007_p1_homework.sql`.

- [ ] **Step 3: Create `supabase/migrations/0007_p1_homework.sql`**

```sql
-- 0007 (S3b part B): homework a tutor gives in a session (spec 2026-10-05, T1–T4).
-- Done on paper and corrected by the tutor next session; never graded, never counted in
-- mastery or the weekly goal. Task sheets/photos are Google Drive links (no file storage).
-- Clients may only SELECT (RLS); writes go through server actions with service_role.

create function public.homework_links_ok(l text[]) returns boolean
  language sql immutable
  as $$ select coalesce(bool_and(x ~ '^https://[^[:space:]]+$' and char_length(x) <= 500), true) from unnest(l) as x $$;

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  student_id uuid not null,
  tutor_id uuid not null,
  unit_id text check (unit_id ~ '^[a-z0-9-]+$'), -- null = "Khác"
  task text not null check (char_length(task) between 1 and 300),
  links text[] not null default '{}' check (cardinality(links) <= 3 and public.homework_links_ok(links)),
  due_on date not null,
  done_at timestamptz,     -- the student said "Con làm xong rồi"
  reviewed_at timestamptz, -- the tutor marked it corrected
  review_note text check (char_length(review_note) <= 300),
  created_at timestamptz not null default now(),
  check (review_note is null or reviewed_at is not null),
  foreign key (session_id, student_id, tutor_id)
    references public.teaching_sessions (id, student_id, tutor_id) on delete cascade
);
create index homework_student_open on public.homework (student_id, reviewed_at, due_on);

alter table public.homework enable row level security;

-- Parent: all homework of their child. Tutor: only homework they gave, while still actively
-- assigned (D3). Student: their own homework, whoever gave it.
create policy homework_select on public.homework
  for select to authenticated
  using (
    public.is_parent_of(student_id)
    or (tutor_id = (select auth.uid()) and public.is_active_tutor_of(student_id))
    or public.is_self_student(student_id)
  );

revoke all on public.homework from anon, authenticated;
grant select on public.homework to authenticated;
grant select, insert, update, delete on public.homework to service_role;
revoke all on function public.homework_links_ok(text[]) from public;
grant execute on function public.homework_links_ok(text[]) to authenticated, service_role;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:db`
Expected: every line `PASS`, last line `ALL PASSED` (49 previous + 14 new).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0007_p1_homework.sql supabase/tests/rls.test.mjs
git commit -m "Migration 0007: homework table with RLS"
```

---

### Task 2: Pure homework rules (`homework.ts`)

**Files:**
- Create: `src/lib/learning/homework.ts`
- Test: `src/lib/learning/homework.test.ts`

**Interfaces:**
- Consumes: `addDays`, `daysBetween` from `./rules.ts`.
- Produces:
  - `HOMEWORK_RULES = { taskMax: 300, linksMax: 3, linkMax: 500, itemsMax: 5, dueMaxDays: 30, defaultDueDays: 3, reviewNoteMax: 300, shownAfterReviewDays: 7 }`
  - `type RawHomework = { unit: string; task: string; links: string[]; due: string }`
  - `type Homework = { unitId: string | null; task: string; links: string[]; dueOn: string }`
  - `readHomeworkForm(fd: FormData): RawHomework[]` — fields `hw.<i>.unit`, `hw.<i>.task`, `hw.<i>.link` (repeated), `hw.<i>.due`, ordered by `i`
  - `parseHomework(raw: RawHomework[], ctx: { taughtOn: string; today: string; ticked: Set<string> }): { ok: true; value: Homework[] } | { ok: false; error: string }`
  - `reviewNote(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string }`
  - `isDriveLink(url: string): boolean`
  - `dueLabel(dueOn: string, today: string): string`
  - `type HomeworkRow = { id: string; task: string; links: string[]; due_on: string; done_at: string | null; reviewed_at: string | null; review_note: string | null }`
  - `visibleHomework(rows: HomeworkRow[], now: Date): HomeworkRow[]`

- [ ] **Step 1: Write the failing tests** — `src/lib/learning/homework.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { dueLabel, isDriveLink, parseHomework, readHomeworkForm, reviewNote, visibleHomework, type HomeworkRow, type RawHomework } from "./homework.ts";

const ctx = { taughtOn: "2026-10-05", today: "2026-10-05", ticked: new Set(["htl-1"]) };
const raw = (p: Partial<RawHomework>): RawHomework => ({ unit: "htl-1", task: "Làm bài 3 trang 72", links: [], due: "2026-10-08", ...p });

test("form fields hw.<i>.* are read in index order, links repeated", () => {
  const fd = new FormData();
  fd.append("hw.1.task", "B"); fd.append("hw.1.unit", ""); fd.append("hw.1.due", "2026-10-09");
  fd.append("hw.0.task", "A"); fd.append("hw.0.unit", "htl-1"); fd.append("hw.0.due", "2026-10-08");
  fd.append("hw.0.link", "https://drive.google.com/a"); fd.append("hw.0.link", "");
  fd.append("note", "not homework");
  assert.deepEqual(readHomeworkForm(fd), [
    { unit: "htl-1", task: "A", links: ["https://drive.google.com/a", ""], due: "2026-10-08" },
    { unit: "", task: "B", links: [], due: "2026-10-09" },
  ]);
});

test("valid homework: trimmed, blank links dropped, 'Khác' = null unit, CRLF counts once", () => {
  const r = parseHomework([raw({ task: "  dòng 1\r\ndòng 2 ", links: [" https://drive.google.com/a ", ""] }), raw({ unit: "" })], ctx);
  assert.deepEqual(r, {
    ok: true,
    value: [
      { unitId: "htl-1", task: "dòng 1\ndòng 2", links: ["https://drive.google.com/a"], dueOn: "2026-10-08" },
      { unitId: null, task: "Làm bài 3 trang 72", links: [], dueOn: "2026-10-08" },
    ],
  });
});

test("a completely blank row is ignored", () => {
  assert.deepEqual(parseHomework([raw({ task: " ", links: ["", ""] })], ctx), { ok: true, value: [] });
});

test("refusals name the homework row", () => {
  const err = (r: ReturnType<typeof parseHomework>) => (r.ok ? "" : r.error);
  assert.match(err(parseHomework([raw({}), raw({ task: "", links: ["https://drive.google.com/a"] })], ctx)), /Bài về nhà 2: ghi yêu cầu/);
  assert.match(err(parseHomework([raw({ task: "x".repeat(301) })], ctx)), /tối đa 300/);
  assert.match(err(parseHomework([raw({ unit: "htl-2" })], ctx)), /chọn một bài đã tick/);
  assert.match(err(parseHomework([raw({ links: ["http://drive.google.com/a"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["javascript:alert(1)"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["https://a b"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["https://a", "https://b", "https://c", "https://d"] })], ctx)), /tối đa 3 link/);
  assert.match(err(parseHomework([raw({ due: "2026-10-04" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework([raw({ due: "2026-11-05" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework([raw({ due: "2026-02-30" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework(Array.from({ length: 6 }, () => raw({})), ctx)), /tối đa 5 bài/);
});

test("review note: optional, ≤ 300, CRLF counts once", () => {
  assert.deepEqual(reviewNote(null), { ok: true, value: null });
  assert.deepEqual(reviewNote("  "), { ok: true, value: null });
  assert.deepEqual(reviewNote(`${"x".repeat(149)}\r\n${"x".repeat(150)}`), { ok: true, value: `${"x".repeat(149)}\n${"x".repeat(150)}` });
  assert.equal(reviewNote("x".repeat(301)).ok, false);
});

test("Drive link detection", () => {
  assert.equal(isDriveLink("https://drive.google.com/file/d/abc/view"), true);
  assert.equal(isDriveLink("https://docs.google.com/document/d/abc"), true);
  assert.equal(isDriveLink("https://example.com/de.pdf"), false);
  assert.equal(isDriveLink("https://drive.google.com.evil.io/x"), false);
});

test("due labels in Vietnamese", () => {
  assert.equal(dueLabel("2026-10-05", "2026-10-05"), "hạn hôm nay");
  assert.equal(dueLabel("2026-10-06", "2026-10-05"), "hạn ngày mai");
  assert.equal(dueLabel("2026-10-08", "2026-10-05"), "hạn thứ Năm 08/10");
  assert.equal(dueLabel("2026-10-11", "2026-10-05"), "hạn Chủ nhật 11/10");
  assert.equal(dueLabel("2026-10-03", "2026-10-05"), "quá hạn (03/10)");
});

test("reviewed homework stays visible for 7 days", () => {
  const row = (reviewed_at: string | null): HomeworkRow => ({ id: reviewed_at ?? "open", task: "x", links: [], due_on: "2026-10-08", done_at: null, reviewed_at, review_note: null });
  const now = new Date("2026-10-20T12:00:00Z");
  const rows = [row(null), row("2026-10-14T12:00:00Z"), row("2026-10-12T12:00:00Z")];
  assert.deepEqual(visibleHomework(rows, now).map((r) => r.id), ["open", "2026-10-14T12:00:00Z"]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test src/lib/learning/homework.test.ts`
Expected: FAIL — `Cannot find module '.../homework.ts'`.

- [ ] **Step 3: Implement `src/lib/learning/homework.ts`**

```ts
// Homework the tutor gives in "Ghi buổi dạy" (spec 2026-10-05 part B, T1–T4).
// Pure, so `node --test` covers it. Never graded; not part of mastery or the weekly goal.
import { addDays, daysBetween } from "./rules.ts";

export const HOMEWORK_RULES = {
  taskMax: 300,
  linksMax: 3,
  linkMax: 500,
  itemsMax: 5,
  dueMaxDays: 30, // due date: from the taught day up to today + 30
  defaultDueDays: 3, // T3
  reviewNoteMax: 300,
  shownAfterReviewDays: 7, // a corrected homework stays on the student's list this long
} as const;

export type RawHomework = { unit: string; task: string; links: string[]; due: string };
export type Homework = { unitId: string | null; task: string; links: string[]; dueOn: string };
export type HomeworkRow = {
  id: string;
  task: string;
  links: string[];
  due_on: string;
  done_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

// Forms submit line breaks as CRLF while a textarea counts them as one character.
const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\r\n?/g, "\n").trim() : "");
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
const LINK = /^https:\/\/\S+$/;

/** Reads the `hw.<i>.*` fields of the session form, in index order. */
export function readHomeworkForm(fd: FormData): RawHomework[] {
  const idx = new Set<number>();
  for (const k of fd.keys()) {
    const m = /^hw\.(\d+)\./.exec(k);
    if (m) idx.add(Number(m[1]));
  }
  return [...idx]
    .sort((a, b) => a - b)
    .map((i) => ({
      unit: String(fd.get(`hw.${i}.unit`) ?? ""),
      task: String(fd.get(`hw.${i}.task`) ?? ""),
      links: fd.getAll(`hw.${i}.link`).map(String),
      due: String(fd.get(`hw.${i}.due`) ?? ""),
    }));
}

export function parseHomework(
  raw: RawHomework[],
  ctx: { taughtOn: string; today: string; ticked: Set<string> },
): { ok: true; value: Homework[] } | { ok: false; error: string } {
  const R = HOMEWORK_RULES;
  const rows = raw
    .map((r, i) => ({ n: i + 1, task: clean(r.task), links: r.links.map((l) => l.trim()).filter(Boolean), unit: r.unit.trim(), due: r.due.trim() }))
    .filter((r) => r.task || r.links.length);
  if (rows.length > R.itemsMax) return { ok: false, error: `Mỗi buổi giao tối đa ${R.itemsMax} bài về nhà.` };

  const value: Homework[] = [];
  const maxDue = addDays(ctx.today, R.dueMaxDays);
  for (const r of rows) {
    const at = `Bài về nhà ${r.n}`;
    if (!r.task || r.task.length > R.taskMax) return { ok: false, error: `${at}: ghi yêu cầu (tối đa ${R.taskMax} ký tự).` };
    if (r.unit && !ctx.ticked.has(r.unit)) return { ok: false, error: `${at}: chọn một bài đã tick ở trên, hoặc “Khác”.` };
    if (r.links.length > R.linksMax) return { ok: false, error: `${at}: tối đa ${R.linksMax} link.` };
    if (r.links.some((l) => !LINK.test(l) || l.length > R.linkMax))
      return { ok: false, error: `${at}: link phải bắt đầu bằng https:// và không có dấu cách.` };
    if (!isIsoDate(r.due) || r.due < ctx.taughtOn || r.due > maxDue)
      return { ok: false, error: `${at}: hạn làm từ ngày dạy đến tối đa ${R.dueMaxDays} ngày tới.` };
    value.push({ unitId: r.unit || null, task: r.task, links: r.links, dueOn: r.due });
  }
  return { ok: true, value };
}

export function reviewNote(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  const note = clean(raw);
  if (note.length > HOMEWORK_RULES.reviewNoteMax) return { ok: false, error: `Nhận xét tối đa ${HOMEWORK_RULES.reviewNoteMax} ký tự.` };
  return { ok: true, value: note || null };
}

export function isDriveLink(url: string): boolean {
  return /^https:\/\/(drive|docs)\.google\.com\//.test(url.trim());
}

const WEEKDAY = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"] as const;
const ddmm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export function dueLabel(dueOn: string, today: string): string {
  const d = daysBetween(today, dueOn);
  if (d < 0) return `quá hạn (${ddmm(dueOn)})`;
  if (d === 0) return "hạn hôm nay";
  if (d === 1) return "hạn ngày mai";
  return `hạn ${WEEKDAY[new Date(`${dueOn}T00:00:00Z`).getUTCDay()]} ${ddmm(dueOn)}`;
}

/** Open homework, plus corrected homework for 7 days so the student can read the note. */
export function visibleHomework(rows: HomeworkRow[], now: Date): HomeworkRow[] {
  const cutoff = now.getTime() - HOMEWORK_RULES.shownAfterReviewDays * 86_400_000;
  return rows.filter((r) => !r.reviewed_at || Date.parse(r.reviewed_at) >= cutoff);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test src/lib/learning/homework.test.ts` → 8 PASS. Then `npm run test:content` → all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/learning/homework.ts src/lib/learning/homework.test.ts
git commit -m "Homework rules: form parsing, validation, labels"
```

---

### Task 3: Tutor — give homework in the session form, mark it corrected

**Files:**
- Modify: `src/app/tutor/actions.ts`
- Create: `src/components/tutor/homework-fields.tsx`
- Modify: `src/components/tutor/session-form.tsx`
- Modify: `src/app/tutor/[studentId]/page.tsx`

**Interfaces:**
- Consumes (Task 2): `HOMEWORK_RULES`, `readHomeworkForm`, `parseHomework`, `reviewNote`, `isDriveLink`, `dueLabel`.
- Produces: `reviewHomework(prev: ActionState, fd: FormData): Promise<ActionState>` (fields `homeworkId`, `reviewNote`); `SessionForm` props gain `defaultDue: string; maxDue: string`; DOM: rows `data-testid="open-homework"`, inputs `hw.<i>.unit|task|link|due`, buttons "+ Giao bài về nhà", "+ thêm link", "Bỏ bài này", "Đã chữa".

- [ ] **Step 1: Server action changes** — `src/app/tutor/actions.ts`

Add imports:

```ts
import { z } from "zod";
import type { ActionState } from "@/components/action-form";
import { parseHomework, readHomeworkForm, reviewNote } from "@/lib/learning/homework";
```

Extract the ownership check into a helper (replace the inline `Promise.all([...profiles..., ...tutor_assignments...])` block in `saveTeachingSession` with a call to it):

```ts
/** D3: an active tutor profile with an active assignment to this student. */
async function activeAssignment(admin: ReturnType<typeof createAdminClient>, tutorId: string, studentId: string) {
  const [{ data: profile }, { data: assignment }] = await Promise.all([
    admin.from("profiles").select("is_active").eq("id", tutorId).maybeSingle(),
    admin
      .from("tutor_assignments")
      .select("id")
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .is("ended_at", null)
      .maybeSingle(),
  ]);
  return !!profile?.is_active && !!assignment;
}
const NOT_ASSIGNED = "Bạn không còn được phân công dạy học sinh này. Liên hệ phụ huynh.";
```

In `saveTeachingSession`, right after `const v = parsed.value;`:

```ts
  const hw = parseHomework(readHomeworkForm(fd), {
    taughtOn: v.taughtOn,
    today: vnDate(),
    ticked: new Set(v.proposals.map((p) => p.unitId)),
  });
  if (!hw.ok) return { error: hw.error };
```

and replace the ownership block with:

```ts
  const admin = createAdminClient();
  if (!(await activeAssignment(admin, tutor.id, v.studentId))) return { error: NOT_ASSIGNED };
```

After the proposals block (before `revalidatePath`):

```ts
  if (hw.value.length) {
    const { error: hErr } = await admin.from("homework").insert(
      hw.value.map((h) => ({
        session_id: session.id,
        student_id: v.studentId,
        tutor_id: tutor.id,
        unit_id: h.unitId,
        task: h.task,
        links: h.links,
        due_on: h.dueOn,
      })),
    );
    if (hErr) {
      console.error("saveTeachingSession homework", hErr.message);
      await admin.from("teaching_sessions").delete().eq("id", session.id); // cascade: proposals too
      return { error: "Chưa lưu được, thử lại sau." };
    }
  }
```

and change the success return to:

```ts
  const given = hw.value.length ? ` · giao ${hw.value.length} bài về nhà` : "";
  return { ok: `Đã lưu lúc ${time}${given}`, savedAt: session.id as string };
```

Add the review action at the end of the file:

```ts
/** "Đã chữa": the tutor who gave the homework, still assigned, marks it corrected (T4: the student sees the note). */
export async function reviewHomework(_p: ActionState, fd: FormData): Promise<ActionState> {
  const tutor = await requireRole("tutor");
  const id = z.uuid().safeParse(fd.get("homeworkId"));
  const note = reviewNote(fd.get("reviewNote"));
  if (!id.success) return { error: "Không tìm thấy bài này." };
  if (!note.ok) return { error: note.error };

  const admin = createAdminClient();
  const { data: hw } = await admin
    .from("homework")
    .select("id, student_id")
    .eq("id", id.data)
    .eq("tutor_id", tutor.id)
    .is("reviewed_at", null)
    .maybeSingle();
  if (!hw) return { error: "Không tìm thấy bài này (có thể đã chữa rồi)." };
  if (!(await activeAssignment(admin, tutor.id, hw.student_id as string))) return { error: NOT_ASSIGNED };

  const { error } = await admin
    .from("homework")
    .update({ reviewed_at: new Date().toISOString(), review_note: note.value })
    .eq("id", hw.id)
    .is("reviewed_at", null);
  if (error) {
    console.error("reviewHomework", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath(`/tutor/${hw.student_id}`);
  return { ok: "Đã chữa" };
}
```

- [ ] **Step 2: Create `src/components/tutor/homework-fields.tsx`**

```tsx
"use client";

import { useState } from "react";
import { HOMEWORK_RULES, isDriveLink } from "@/lib/learning/homework";

type Row = { key: number; unit: string; task: string; links: string[]; due: string };
const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink";

/** "Giao bài về nhà" rows inside the session form; submitted with it as hw.<i>.* fields. */
export function HomeworkFields({ units, defaultDue, minDue, maxDue }: {
  units: { id: string; title: string }[]; // the units ticked above
  defaultDue: string;
  minDue: string; // the taught day
  maxDue: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState(0);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Giao bài về nhà (không bắt buộc)</legend>
      <ul className="mt-2 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.key} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5" data-testid="homework-row">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Bài về nhà {i + 1}</span>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="text-sm text-muted hover:text-warn">
                Bỏ bài này
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Cho phần
              <select name={`hw.${i}.unit`} value={r.unit} onChange={(e) => set(r.key, { unit: e.target.value })} className={input}>
                <option value="">Khác</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="flex justify-between">
                <span>Yêu cầu</span>
                <span className="font-mono text-xs tabular-nums">{r.task.length}/{HOMEWORK_RULES.taskMax}</span>
              </span>
              <textarea
                name={`hw.${i}.task`}
                rows={2}
                maxLength={HOMEWORK_RULES.taskMax}
                value={r.task}
                onChange={(e) => set(r.key, { task: e.target.value })}
                placeholder="Ví dụ: Làm bài 3, 5, 7 trang 72 SGK."
                className={input}
              />
            </label>
            <div className="flex flex-col gap-1.5 text-sm text-muted">
              <span>Link đề / ảnh (Google Drive)</span>
              {r.links.map((l, j) => (
                <div key={j}>
                  <input
                    name={`hw.${i}.link`}
                    inputMode="url"
                    value={l}
                    onChange={(e) => set(r.key, { links: r.links.map((x, k) => (k === j ? e.target.value : x)) })}
                    placeholder="https://drive.google.com/…"
                    className={input}
                  />
                  {l.trim() && !isDriveLink(l) && (
                    <span className="mt-0.5 block text-xs text-warn">Đây không phải link Google Drive — con có mở được không?</span>
                  )}
                </div>
              ))}
              {r.links.length < HOMEWORK_RULES.linksMax && (
                <button type="button" onClick={() => set(r.key, { links: [...r.links, ""] })} className="self-start text-sm text-accent hover:underline">
                  + thêm link
                </button>
              )}
              <span className="text-xs">Nhớ để chế độ chia sẻ “Bất kỳ ai có đường liên kết”.</span>
            </div>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Hạn làm
              <input type="date" name={`hw.${i}.due`} value={r.due} min={minDue} max={maxDue} onChange={(e) => set(r.key, { due: e.target.value })} className={input} />
            </label>
          </li>
        ))}
      </ul>
      {rows.length < HOMEWORK_RULES.itemsMax && (
        <button
          type="button"
          onClick={() => {
            setRows((rs) => [...rs, { key: next, unit: units[0]?.id ?? "", task: "", links: [""], due: defaultDue }]);
            setNext((n) => n + 1);
          }}
          className="mt-2 w-full rounded-lg border border-dashed border-border px-4 py-2.5 font-display text-sm"
        >
          + Giao bài về nhà
        </button>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 3: Mount it in the session form** — `src/components/tutor/session-form.tsx`

- Import: `import { HomeworkFields } from "./homework-fields";`
- `SessionForm` props type: add `defaultDue: string; maxDue: string;` (both the `SessionForm(props: …)` signature and the `Fields` parameter type).
- In `Fields`, destructure `defaultDue, maxDue`, and insert right after the note `</label>` (before the closing `</>`):

```tsx
      <HomeworkFields
        units={units.filter((u) => ticked.has(u.id)).map((u) => ({ id: u.id, title: u.title }))}
        defaultDue={defaultDue < day ? day : defaultDue}
        minDue={day}
        maxDue={maxDue}
      />
```

- [ ] **Step 4: Tutor page** — `src/app/tutor/[studentId]/page.tsx`

Imports: add `import { ActionForm } from "@/components/action-form";`, `import { HOMEWORK_RULES, dueLabel } from "@/lib/learning/homework";`, `import { reviewHomework } from "@/app/tutor/actions";`.

Extend the `Promise.all` to also load open homework (RLS: only this tutor's, while assigned):

```ts
  const [state, sessions, openHw] = await Promise.all([
    loadStudentState(supabase, student.id, { includeDrafts: true }),
    supabase
      .from("teaching_sessions")
      .select("id, taught_on, note, created_at")
      .eq("student_id", student.id)
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("homework")
      .select("id, unit_id, task, due_on, done_at")
      .eq("student_id", student.id)
      .eq("tutor_id", tutor.id)
      .is("reviewed_at", null)
      .order("due_on", { ascending: true })
      .limit(20),
  ]);
```

Pass the new props: `<SessionForm … defaultDue={addDays(today, HOMEWORK_RULES.defaultDueDays)} maxDue={addDays(today, HOMEWORK_RULES.dueMaxDays)} />`.

Between `<p className="mt-1 text-muted">{student.full_name}</p>` and `<SessionForm …/>` render:

```tsx
      {!!openHw.data?.length && (
        <section className="mt-5" aria-label="Bài đã giao chưa chữa">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Bài đã giao chưa chữa</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {openHw.data.map((h) => (
              <li key={h.id} className="rounded-xl border border-border bg-surface p-3.5 text-sm" data-testid="open-homework">
                <p className="whitespace-pre-line">{h.task}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {h.unit_id ? `${getUnit(h.unit_id)?.unit.title ?? h.unit_id} · ` : ""}
                  {dueLabel(h.due_on as string, today)} ·{" "}
                  {h.done_at ? <span className="text-good">Con đã báo xong ({ddmm(vnDate(h.done_at as string))})</span> : "Con chưa báo xong"}
                </p>
                <ActionForm action={reviewHomework} submitLabel="Đã chữa" variant="quiet" className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="homeworkId" value={h.id} />
                  <textarea
                    name="reviewNote"
                    rows={2}
                    maxLength={HOMEWORK_RULES.reviewNoteMax}
                    placeholder="Nhận xét cho con (không bắt buộc)"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
                  />
                </ActionForm>
              </li>
            ))}
          </ul>
        </section>
      )}
```

Note: `today` is already declared in this page (`const today = vnDate();`) — move that line above the JSX if it is declared later.

- [ ] **Step 5: Lint + build + unit tests**

Run: `npm run lint` → clean. `npm run build` → compiled. `npm run test:content` → all pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/tutor src/components/tutor
git commit -m "Tutor gives homework with Drive links in the session form and marks it corrected"
```

---

### Task 4: Student — homework cards and "Con làm xong rồi"

**Files:**
- Modify: `src/app/student/actions.ts`
- Modify: `src/app/student/page.tsx`

**Interfaces:**
- Consumes (Task 2): `HomeworkRow`, `visibleHomework`, `dueLabel`.
- Produces: `setHomeworkDone(prev: ActionState, fd: FormData): Promise<ActionState>` (fields `homeworkId`, `done` = "1" | "0"); DOM: `data-testid="homework-card"`, buttons "Con làm xong rồi" / "Bỏ đánh dấu xong", link names starting "Mở đề".

- [ ] **Step 1: Student action** — append to `src/app/student/actions.ts` (add `import { z } from "zod";`):

```ts
/** "Con làm xong rồi" on a homework card (T1: the tutor corrects it next session; no grading). */
export async function setHomeworkDone(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const id = z.uuid().safeParse(fd.get("homeworkId"));
  if (!id.success) return { error: "Không tìm thấy bài này." };
  const done = fd.get("done") === "1";

  const admin = createAdminClient();
  const { data: me } = await admin.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) return { error: "Không tìm thấy bài này." };

  const { data, error } = await admin
    .from("homework")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id.data)
    .eq("student_id", me.id) // only the student's own homework
    .is("reviewed_at", null) // a corrected homework can no longer change
    .select("id");
  if (error || !data?.length) return { error: "Bài này thầy/cô đã chữa rồi, hoặc chưa lưu được. Tải lại trang nhé." };

  revalidatePath("/student");
  return { ok: done ? "Đã báo thầy/cô" : "Đã bỏ đánh dấu" };
}
```

- [ ] **Step 2: Student page** — `src/app/student/page.tsx`

Imports: `import { setHomeworkDone } from "./actions";` (extend the existing import), `import { dueLabel, visibleHomework, type HomeworkRow } from "@/lib/learning/homework";`.

In `StudentHome`, replace `const state = await loadStudentState(supabase, me.id);` with:

```ts
  const [state, hw] = await Promise.all([
    loadStudentState(supabase, me.id),
    supabase
      .from("homework")
      .select("id, task, links, due_on, done_at, reviewed_at, review_note")
      .eq("student_id", me.id)
      .order("due_on", { ascending: true })
      .limit(50),
  ]);
  if (hw.error) console.error("StudentHome homework", hw.error.message);
  const homework = visibleHomework((hw.data ?? []) as HomeworkRow[], new Date());
```

and render `<TodayList state={state} homework={homework} />`.

Change `function TodayList({ state }: { state: StudentState })` to `function TodayList({ state, homework }: { state: StudentState; homework: HomeworkRow[] })`. Keep the first `if (!state.units.length)` block as is. Right after the `if (due.length) { cards.push(…review card…) }` block add:

```tsx
  for (const h of homework) cards.push(<HomeworkCard key={h.id} h={h} today={state.today} />);
```

Add the card component to the file:

```tsx
function HomeworkCard({ h, today }: { h: HomeworkRow; today: string }) {
  const due = dueLabel(h.due_on, today);
  const late = !h.done_at && !h.reviewed_at && due.startsWith("quá hạn");
  return (
    <li className="rounded-xl border border-border bg-surface p-4" data-testid="homework-card">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-semibold leading-snug">Bài về nhà của thầy/cô</p>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-xs text-accent">
          {h.reviewed_at ? "Đã chữa" : h.done_at ? "Con đã làm xong" : "Bài về nhà"}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line">{h.task}</p>
      {h.links.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-3 text-sm">
          {h.links.map((l, i) => (
            <a key={l + i} href={l} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Mở đề{h.links.length > 1 ? ` ${i + 1}` : ""} ↗
            </a>
          ))}
        </p>
      )}
      <p className={`mt-2 font-mono text-xs ${late ? "text-warn" : "text-muted"}`}>{due}</p>
      {h.reviewed_at ? (
        <p className="mt-2 text-sm">
          <b className="text-good">Thầy/cô đã chữa</b>
          {h.review_note && <span className="whitespace-pre-line">: “{h.review_note}”</span>}
        </p>
      ) : (
        <ActionForm action={setHomeworkDone} submitLabel={h.done_at ? "Bỏ đánh dấu xong" : "Con làm xong rồi"} variant={h.done_at ? "quiet" : "primary"} className="mt-3">
          <input type="hidden" name="homeworkId" value={h.id} />
          <input type="hidden" name="done" value={h.done_at ? "0" : "1"} />
        </ActionForm>
      )}
    </li>
  );
}
```

(`h.task`, `h.review_note` and link text are rendered as React text — escaped; `href` is DB-checked `https://`.)

- [ ] **Step 3: Lint + build**

Run: `npm run lint` → clean. `npm run build` → compiled.

- [ ] **Step 4: Commit**

```bash
git add src/app/student
git commit -m "Student sees homework on the today list and marks it done"
```

---

### Task 5: e2e

**Files:**
- Modify: `e2e/tutor-flow.mjs` — new block right after the "Bài làm của con" block (after the `form: evidence links …` check), before `// ---- dark mode`
- Modify: `e2e/student-flow.mjs` — new block before the `student: tutor work page not reachable` check

**Interfaces:**
- Consumes: DOM contract from Tasks 3–4.

- [ ] **Step 1: Tutor block**

```js
// ---- homework (part B): give it with the session, see the student's "done", mark corrected
await page.goto(formUrl);
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await page.getByRole("button", { name: "+ Giao bài về nhà" }).click();
ok("homework: due defaults to today + 3", (await page.locator('input[name="hw.0.due"]').inputValue()) === add(vnToday, 3));
await page.locator('input[name="hw.0.link"]').fill("https://drive.google.com/file/d/abc/view");
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("homework: link without a task refused", (await page.locator("form [role=alert]").innerText()).includes("ghi yêu cầu"));
await page.locator('select[name="hw.0.unit"]').selectOption("htl-1");
await page.locator('textarea[name="hw.0.task"]').fill("Làm bài 3, 5 trang 72 SGK");
await page.getByRole("button", { name: "+ thêm link" }).click();
await page.locator('input[name="hw.0.link"]').nth(1).fill("https://example.com/de.pdf");
ok("homework: non-Drive link warned", (await page.getByText(/không phải link Google Drive/).count()) === 1);
await page.locator('input[name="hw.0.link"]').nth(1).fill("");
await page.screenshot({ path: `${shots}/7-homework-form.png`, fullPage: true });
await save().click();
await page.locator("form [role=status]").filter({ hasText: "giao 1 bài về nhà" }).waitFor();
const hwRows = await sql(`select h.unit_id, h.links, h.due_on::text due from public.homework h`);
ok("db: homework saved with the session", hwRows.length === 1 && hwRows[0].unit_id === "htl-1" && hwRows[0].links.length === 1 && hwRows[0].due === add(vnToday, 3), JSON.stringify(hwRows));
await page.reload();
const openHw = page.getByTestId("open-homework");
ok("homework: listed as not done yet", (await openHw.count()) === 1 && (await openHw.getByText("Con chưa báo xong").count()) === 1);
await sql(`update public.homework set done_at = now()`);
await page.reload();
ok("homework: shows the student's 'done'", (await openHw.getByText(/Con đã báo xong/).count()) === 1);
await openHw.locator('textarea[name="reviewNote"]').fill("Bài 5 sai dấu, đã chữa.");
await openHw.getByRole("button", { name: "Đã chữa" }).click();
await openHw.waitFor({ state: "detached" });
const rv = await sql(`select reviewed_at is not null r, review_note from public.homework`);
ok("db: homework corrected with note", rv[0].r === true && rv[0].review_note === "Bài 5 sai dấu, đã chữa.", JSON.stringify(rv));
// keep the later session counts (2) unchanged: the cascade removes the proposal and homework too
await sql(`delete from public.teaching_sessions where id in (select session_id from public.homework)`);
```

- [ ] **Step 2: Student block**

```js
// ---- homework from the tutor (part B)
await page.goto(`${BASE}/student`);
const goalBefore = await page.getByRole("progressbar").getAttribute("aria-valuenow");
await sql(`
  insert into public.teaching_sessions (student_id, tutor_id, taught_on)
    select a.student_id, a.tutor_id, current_date from public.tutor_assignments a join public.students s on s.id = a.student_id
    where s.full_name = 'Hạnh Nguyên' and a.ended_at is null limit 1;
  insert into public.homework (session_id, student_id, tutor_id, unit_id, task, links, due_on)
    select id, student_id, tutor_id, 'htl-1', 'Làm bài 3, 5 trang 72 SGK', array['https://drive.google.com/file/d/abc/view'], current_date + 3
    from public.teaching_sessions order by created_at desc limit 1;`);
await page.goto(`${BASE}/student`);
const hwCard = page.getByTestId("homework-card");
ok("homework: card on today's list", (await hwCard.count()) === 1 && (await hwCard.getByText("Làm bài 3, 5 trang 72 SGK").count()) === 1);
ok("homework: Drive link opens in a new tab", (await hwCard.getByRole("link", { name: /Mở đề/ }).getAttribute("target")) === "_blank");
await page.screenshot({ path: "e2e/out/student/10-homework.png", fullPage: true });
await hwCard.getByRole("button", { name: "Con làm xong rồi" }).click();
await hwCard.getByRole("button", { name: "Bỏ đánh dấu xong" }).waitFor();
ok("db: homework done_at set", (await sql(`select done_at is not null d from public.homework`))[0].d === true);
ok("homework: weekly goal unchanged", (await page.getByRole("progressbar").getAttribute("aria-valuenow")) === goalBefore);
await sql(`update public.homework set reviewed_at = now(), review_note = 'Bài 5 sai dấu.'`);
await page.reload();
ok("homework: tutor's note shown, no buttons", (await hwCard.getByText(/Thầy\/cô đã chữa/).count()) === 1 && (await hwCard.getByText(/Bài 5 sai dấu/).count()) === 1 && (await hwCard.getByRole("button").count()) === 0);
await sql(`update public.homework set reviewed_at = now() - interval '8 days'`);
await page.reload();
ok("homework: hidden 7 days after correction", (await page.getByTestId("homework-card").count()) === 0);
```

- [ ] **Step 3: Run e2e** — `./e2e/run.sh` (Windows: the Playwright container command from `docs/PROGRESS.md`). Expected: all `PASS`, exit 0 (83 previous + 16 new).

- [ ] **Step 4: Commit**

```bash
git add e2e
git commit -m "e2e: homework given, done, corrected"
```

---

### Task 6: Docs, verification, push

**Files:** `docs/DESIGN.md`, `docs/P1_PLAN.md`, `docs/PROGRESS.md`

- [ ] **Step 1: DESIGN.md** — data table: add a row after `tutor_proposals`:

```markdown
| `homework` (0007) | homework given in a session: unit (or "Khác"), task ≤ 300, 0–3 `https://` links (Drive), due date, student "done", tutor "corrected" + note. RLS: parent, own active tutor, the student; writes via server actions | tutor/student actions |
```

and in the routes table extend the `/tutor/[studentId]` row with `→ "Giao bài về nhà" rows; "Bài đã giao chưa chữa" + "Đã chữa"`, and the `/student` row with `homework cards (open + corrected for 7 days)`.

- [ ] **Step 2: P1_PLAN.md** — S3b row status → `🟡 A: PR #5 · B: PR mới (SQL 0007)`.

- [ ] **Step 3: PROGRESS.md** — status row S3b updated; new top entry `## 05/10/2026 — S3b phần B: Giao bài về nhà` with: Đã làm; Đã tự kiểm (real counts); **Phụ huynh cần làm**: 1) merge PR #4, #5 first; 2) **chạy SQL `supabase/migrations/0007_p1_homework.sql`** → "Success. No rows returned"; 3) thử preview: gia sư ghi buổi + "+ Giao bài về nhà" (dán link Drive) → học sinh thấy thẻ, bấm "Con làm xong rồi" → gia sư mở lại form thấy "Con đã báo xong", ghi nhận xét, "Đã chữa" → học sinh thấy nhận xét; 4) merge. Ghi chú kỹ thuật: form fields `hw.<i>.*`; a session still needs a unit or a note (homework alone does not count).

- [ ] **Step 4: Full verification** — `npm run lint`, `npm test`, `npm run build`, e2e. All green.

- [ ] **Step 5: Commit + push + CI**

```bash
git add docs
git commit -m "Docs: S3b part B report, SQL 0007"
git push -u origin p1-homework
gh workflow run ci.yml --ref p1-homework
```

Expected: PR opened against `main`; CI `check` success on the pushed SHA.
