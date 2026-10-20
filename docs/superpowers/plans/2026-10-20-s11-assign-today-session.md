# S11 — Giao bài từng câu, Buổi dạy gọn, Hôm nay (T9 + tutor workspace) Implementation Plan

> **For agentic workers:** Implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The tutor gives a whole KU or hand-picked practice items as homework from a "Giao bài" tab (no session
needed), the student does them in the app and they count as practice; the session form shrinks to three steps;
a "Hôm nay" tab shows the tutor's to-dos.

**Architecture:** `homework` gains `items text[]` and an optional `session_id` (migration 0013). A pure
`parseAssignment` validates the Giao bài form; `checkAnswer` accepts practice answers for items of an open homework
of that student without the worked-example gate; the student plays them with the existing `PracticeStage`.
The tutor's student page becomes a 5-tab workspace (Hôm nay · Kho bài · Giao bài · Buổi dạy · Bài làm).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Supabase + RLS, zod 4, `node --test`, PGlite, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-tutor-workspace-design.md` §2, §5 (+ SPEC §0 T9, "Tutor workspace";
mockup artboards 1, 4, 5).

## Global Constraints

- Same as S10 (`docs/superpowers/plans/2026-10-20-s10-content-review.md` → Global Constraints): Vietnamese UI / English code; RLS + explicit service_role grants; writes only via server actions; no SQL on live Supabase (parent runs **0013** then merges); no streaks (D17); theme tokens only; e2e fake client methods only; lint + test + build + e2e before push.
- Migration number **0013** (S10 = 0012, S8 = 0014).
- Only **practice** items can be assigned (exit items stay unseen, LT13). Homework answers are recorded as `practice` and count toward mastery (T9). Paper homework (task + Drive links, T1–T5) keeps working.
- "Theo dạng" is not built (no type tag on items) — quick-select by level instead.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `supabase/migrations/0013_p1_item_homework.sql`, `supabase/tests/rls.test.mjs` | `homework.items`, optional `session_id` | 1 |
| `src/lib/learning/homework.ts` (+ test) | `parseAssignment`, `homeworkAppResult(…, items)`, `HomeworkRow.items` | 2 |
| `src/lib/learning/tutor-today.ts` (+ test) | pure: to-dos and "Tuần này của con" | 2 |
| `src/app/learn/actions.ts`, `src/components/lesson/lesson-player.tsx`, `src/app/student/homework/[id]/page.tsx`, `src/components/lesson/homework-practice.tsx`, `src/app/student/page.tsx` | student does item homework in the app | 3 |
| `src/app/tutor/actions.ts`, `src/app/tutor/[studentId]/giao/page.tsx`, `src/components/tutor/assign-form.tsx` | Giao bài | 4 |
| `src/app/tutor/[studentId]/buoi/page.tsx`, `src/components/tutor/session-short.tsx`, `src/components/tutor/tutor-tabs.tsx` | Buổi dạy gọn; 5 tabs | 5 |
| `src/app/tutor/[studentId]/page.tsx`, `src/components/tutor/open-homework.tsx`, `src/app/tutor/page.tsx` | Hôm nay; single-student redirect | 6 |
| `e2e/tutor-flow.mjs`, `e2e/assign-flow.mjs`, `e2e/assign-student-flow.mjs`, `e2e/run.sh`, docs | checks + docs | 7 |

---

### Task 0: Branch

- [ ] **Step 1:** S10 (PR, SQL 0012) is merged. `git fetch origin '+refs/heads/*:refs/remotes/origin/*' && git checkout -b p1-slice-11 origin/main`.
- [ ] **Step 2:** `git ls-tree --name-only origin/main supabase/migrations/` ends at `0012_p1_content_review.sql`; no open PR adds `0013` (`gh api repos/haleytruong89-moon/math-app/pulls --jq '.[].head.ref'`).

---

### Task 1: Migration 0013 + RLS tests

**Files:**
- Create: `supabase/migrations/0013_p1_item_homework.sql`
- Modify: `supabase/tests/rls.test.mjs`

**Interfaces:**
- Produces: `homework.items text[] null` (null = whole unit / paper), `homework.session_id` nullable.

- [ ] **Step 1: Failing checks** — load line after 0012:

```js
await db.exec(fs.readFileSync(`${repo}/migrations/0013_p1_item_homework.sql`, 'utf8'));
```

checks (before the final locked-tutor block):

```js
// 0013: homework from the Giao bài tab (T9) — no session needed, hand-picked practice items
const q13 = (sql) => db.query(sql).then(()=>'ok', e=>'ERROR '+e.message);
const tutor13 = `(select id from auth.users where email='trang@example.com')`;
const nguyen13 = `(select id from public.students where full_name='Hạnh Nguyên')`;
check('homework without a session, with items', await q13(`insert into public.homework (student_id, tutor_id, unit_id, items, task, due_on) values (${nguyen13}, ${tutor13}, 'g-giaihpt', array['g-giaihpt-p4','g-giaihpt-p7'], 'Làm 2 câu trên app', current_date + 3)`), 'ok');
check('items need a unit', isErr(await q13(`insert into public.homework (student_id, tutor_id, items, task, due_on) values (${nguyen13}, ${tutor13}, array['x-p1'], 'x', current_date)`)), true);
check('items: 1–20, no empty list', isErr(await q13(`insert into public.homework (student_id, tutor_id, unit_id, items, task, due_on) values (${nguyen13}, ${tutor13}, 'g-giaihpt', '{}', 'x', current_date)`)), true);
check('items must belong to the unit', isErr(await q13(`insert into public.homework (student_id, tutor_id, unit_id, items, task, due_on) values (${nguyen13}, ${tutor13}, 'g-giaihpt', array['htl-1-p1'], 'x', current_date)`)), true);
check('student reads own item homework', (await as('nguyen@example.com',`select cardinality(items)::int n from public.homework where items is not null`))[0]?.n, 2);
```

- [ ] **Step 2: Run** — `npm run test:db` → ENOENT 0013.

- [ ] **Step 3: Migration**

```sql
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
```

- [ ] **Step 4: Run** — `npm run test:db` → `ALL PASSED` (the 0007 checks still pass: `session_id` is set there).
- [ ] **Step 5: Commit** — `git add supabase && git commit -m "S11: migration 0013 homework items, optional session"`

---

### Task 2: Pure rules — assignment form, app result per items, tutor's day

**Files:**
- Modify: `src/lib/learning/homework.ts`, `src/lib/learning/homework.test.ts`
- Create: `src/lib/learning/tutor-today.ts`, `src/lib/learning/tutor-today.test.ts`

**Interfaces:**
- Produces:
  - `type RawAssignment = { mode: string; unit: string; items: string[]; task: string; links: string[]; due: string }`
  - `type Assignment = { unitId: string | null; items: string[] | null; task: string; links: string[]; dueOn: string }`
  - `parseAssignment(raw, ctx: { today: string; units: Map<string, { title: string; practice: string[] }> }): { ok: true; value: Assignment } | { ok: false; error: string }`
  - `homeworkAppResult(attempts, sinceIso, items?: string[] | null)` (attempt rows now need `item_id`)
  - `HomeworkRow.items?: string[] | null`
  - `weekSummary(attempts: AttemptRow[], today: string): { studyDays: number; practice: { right: number; total: number }; reviews: number }`
  - `sessionDue(lastTaughtOn: string | null, weekdays: number[], today: string): string | null` — the most recent scheduled teaching day (≤ today) after the last logged session, else null

- [ ] **Step 1: Failing tests** — append to `homework.test.ts`:

```ts
import { parseAssignment, homeworkAppResult } from "./homework.ts";

const ctxA = { today: "2026-10-20", units: new Map([["g-giaihpt", { title: "Giải hệ PT", practice: ["g-giaihpt-p1", "g-giaihpt-p4", "g-giaihpt-p7"] }]]) };
const rawA = (p: Partial<{ mode: string; unit: string; items: string[]; task: string; links: string[]; due: string }>) =>
  ({ mode: "items", unit: "g-giaihpt", items: ["g-giaihpt-p4"], task: "", links: [], due: "2026-10-22", ...p });

test("T9: hand-picked practice items of an approved KU; default task text; due within 30 days", () => {
  const r = parseAssignment(rawA({ items: ["g-giaihpt-p4", "g-giaihpt-p7", "g-giaihpt-p4"] }), ctxA);
  assert.deepEqual(r, { ok: true, value: { unitId: "g-giaihpt", items: ["g-giaihpt-p4", "g-giaihpt-p7"], task: "Làm 2 câu \"Giải hệ PT\" trên app.", links: [], dueOn: "2026-10-22" } });
  assert.equal(parseAssignment(rawA({ items: [] }), ctxA).ok, false);
  assert.equal(parseAssignment(rawA({ items: ["g-giaihpt-x1"] }), ctxA).ok, false); // exit items can't be assigned
  assert.equal(parseAssignment(rawA({ unit: "htl-9" }), ctxA).ok, false);
  assert.equal(parseAssignment(rawA({ due: "2026-10-19" }), ctxA).ok, false);
  assert.equal(parseAssignment(rawA({ due: "2026-11-30" }), ctxA).ok, false);
});

test("T9: whole KU, or paper homework (task or Drive link required)", () => {
  assert.deepEqual(parseAssignment(rawA({ mode: "unit", items: ["ignored"] }), ctxA), { ok: true, value: { unitId: "g-giaihpt", items: null, task: "Làm cả bài \"Giải hệ PT\" trên app.", links: [], dueOn: "2026-10-22" } });
  assert.equal(parseAssignment(rawA({ mode: "paper", unit: "", task: "" }), ctxA).ok, false);
  const p = parseAssignment(rawA({ mode: "paper", unit: "", task: "Bài 3 trang 72", links: ["https://drive.google.com/x"] }), ctxA);
  assert.deepEqual(p, { ok: true, value: { unitId: null, items: null, task: "Bài 3 trang 72", links: ["https://drive.google.com/x"], dueOn: "2026-10-22" } });
  assert.equal(parseAssignment(rawA({ mode: "paper", task: "x", links: ["http://a"] }), ctxA).ok, false);
});

test("app result can be limited to the homework's items", () => {
  const rows = [
    { item_id: "u-p1", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: "2026-10-20T03:00:00Z" },
    { item_id: "u-p2", mode: "practice", correct: false, error_code: "E02", exit_run: null, created_at: "2026-10-20T03:01:00Z" },
  ];
  assert.deepEqual(homeworkAppResult(rows, "2026-10-20T00:00:00Z", ["u-p2"])?.practice, { right: 0, total: 1 });
  assert.deepEqual(homeworkAppResult(rows, "2026-10-20T00:00:00Z")?.practice, { right: 1, total: 2 });
});
```

`tutor-today.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionDue, weekSummary } from "./tutor-today.ts";
import type { AttemptRow } from "./rules.ts";

const a = (mode: AttemptRow["mode"], correct: boolean, at: string): AttemptRow => ({ item_id: "i", mode, correct, error_code: null, exit_run: null, created_at: at });

test("week summary: study days (D17 goal, no streak), practice right/total and reviews this Mon–Sun", () => {
  const rows = [
    a("practice", true, "2026-10-19T03:00:00Z"), a("practice", false, "2026-10-19T03:01:00Z"),
    a("review", true, "2026-10-20T03:00:00Z"), a("practice", true, "2026-10-12T03:00:00Z"),
  ];
  assert.deepEqual(weekSummary(rows, "2026-10-20"), { studyDays: 1, practice: { right: 1, total: 2 }, reviews: 1 });
});

test("session reminder: the last scheduled day (≤ today) with no session logged on or after it", () => {
  // weekdays: 2 = Tue, 4 = Thu (ISO, 1 = Mon). Today Tue 20/10.
  assert.equal(sessionDue("2026-10-15", [2, 4], "2026-10-20"), "2026-10-20");
  assert.equal(sessionDue("2026-10-20", [2, 4], "2026-10-20"), null);
  assert.equal(sessionDue("2026-10-13", [4], "2026-10-20"), "2026-10-15");
  assert.equal(sessionDue(null, [], "2026-10-20"), null);
});
```

- [ ] **Step 2: Run** — `node --test src/lib/learning/homework.test.ts src/lib/learning/tutor-today.test.ts` → FAIL (exports missing).

- [ ] **Step 3: Implement** — in `homework.ts`:

```ts
export type RawAssignment = { mode: string; unit: string; items: string[]; task: string; links: string[]; due: string };
export type Assignment = { unitId: string | null; items: string[] | null; task: string; links: string[]; dueOn: string };

/** T9, "Giao bài" tab: whole KU, hand-picked practice items, or paper homework (no session needed). */
export function parseAssignment(
  raw: RawAssignment,
  ctx: { today: string; units: Map<string, { title: string; practice: string[] }> },
): { ok: true; value: Assignment } | { ok: false; error: string } {
  const R = HOMEWORK_RULES;
  const task = clean(raw.task);
  const links = raw.links.map((l) => l.trim()).filter(Boolean);
  const due = raw.due.trim();
  if (!isIsoDate(due) || due < ctx.today || due > addDays(ctx.today, R.dueMaxDays)) return { ok: false, error: `Hạn nộp từ hôm nay đến ${R.dueMaxDays} ngày tới.` };
  if (task.length > R.taskMax) return { ok: false, error: `Lời dặn tối đa ${R.taskMax} ký tự.` };
  if (links.length > R.linksMax || links.some((l) => !LINK.test(l) || l.length > R.linkMax)) return { ok: false, error: `Tối đa ${R.linksMax} link, mỗi link bắt đầu bằng https://.` };
  if (raw.mode === "paper") {
    if (!task && !links.length) return { ok: false, error: "Ghi yêu cầu bài làm hoặc dán link đề." };
    const unit = raw.unit.trim();
    if (unit && !ctx.units.has(unit)) return { ok: false, error: "Bài này chưa có trong app." };
    return { ok: true, value: { unitId: unit || null, items: null, task: task || "Làm theo đề trong link.", links, dueOn: due } };
  }
  const u = ctx.units.get(raw.unit.trim());
  if (!u) return { ok: false, error: "Chọn một bài đã duyệt." };
  if (raw.mode === "unit") return { ok: true, value: { unitId: raw.unit.trim(), items: null, task: task || `Làm cả bài "${u.title}" trên app.`, links, dueOn: due } };
  if (raw.mode !== "items") return { ok: false, error: "Chọn cách giao." };
  const items = [...new Set(raw.items)];
  if (!items.length || items.length > 20) return { ok: false, error: "Chọn từ 1 đến 20 câu." };
  if (items.some((id) => !u.practice.includes(id))) return { ok: false, error: "Có câu không thuộc phần luyện tập của bài này." };
  return { ok: true, value: { unitId: raw.unit.trim(), items, task: task || `Làm ${items.length} câu "${u.title}" trên app.`, links, dueOn: due } };
}
```

Change `homeworkAppResult`:

```ts
export function homeworkAppResult(
  attempts: { item_id: string; mode: string; correct: boolean; error_code: string | null; exit_run: string | null; created_at: string }[],
  sinceIso: string,
  /** T9: only these items (hand-picked homework); null/undefined = the whole unit. */
  items?: string[] | null,
): HomeworkAppResult | null {
  const since = Date.parse(sinceIso);
  const only = items ? new Set(items) : null;
  const rows = attempts.filter((a) => Date.parse(a.created_at) >= since && a.mode !== "faded" && (!only || only.has(a.item_id)));
  // … rest unchanged
```

and add `items?: string[] | null;` to `HomeworkRow`. Existing tests that build attempt rows without `item_id` get `item_id: "x"` added.

`tutor-today.ts`:

```ts
// Tutor "Hôm nay" (S11): this week of the student and the session reminder. Pure.
import { addDays, studyDaysThisWeek, weekStart, vnDate, type AttemptRow } from "./rules.ts";

export function weekSummary(attempts: AttemptRow[], today: string) {
  const start = weekStart(today);
  const week = attempts.filter((a) => { const d = vnDate(a.created_at); return d >= start && d <= today; });
  const practice = week.filter((a) => a.mode === "practice");
  return {
    studyDays: studyDaysThisWeek(attempts, today),
    practice: { right: practice.filter((a) => a.correct).length, total: practice.length },
    reviews: new Set(week.filter((a) => a.mode === "review").map((a) => a.exit_run ?? a.created_at)).size,
  };
}

/** ISO weekday 1 = Mon … 7 = Sun of a YYYY-MM-DD date. */
const isoDow = (d: string) => ((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

export function sessionDue(lastTaughtOn: string | null, weekdays: number[], today: string): string | null {
  if (!weekdays.length) return null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    if (!weekdays.includes(isoDow(d))) continue;
    return lastTaughtOn && lastTaughtOn >= d ? null : d;
  }
  return null;
}
```

(`studyDaysThisWeek` counts a review day by any review answer; `weekSummary.reviews` counts review runs; `weekStart`, `addDays`, `vnDate` are already exported from `rules.ts`.)

- [ ] **Step 4: Run** — same command → PASS; `npm run test:content` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S11: parseAssignment, app result per items, tutor week summary + session reminder"`

---

### Task 3: Student does item homework in the app

**Files:**
- Modify: `src/app/learn/actions.ts`, `src/components/lesson/lesson-player.tsx`, `src/app/student/page.tsx`
- Create: `src/app/student/homework/[id]/page.tsx`, `src/components/lesson/homework-practice.tsx`

**Interfaces:**
- Consumes: `studentUnit` (S10), `toPublicUnit`, `HomeworkRow.items`.
- Produces: `checkAnswer({ …, homeworkId?: string })`; `export function PracticeStage({ unit, onDone, recapHref, homeworkId? })`; route `/student/homework/[id]`.

- [ ] **Step 1: Server gate** — `src/app/learn/actions.ts`:

```ts
// CheckInput: add
  /** T9: an item of an open homework of this student — practised without the worked-example gate. */
  homeworkId: z.uuid().optional(),

async function homeworkAllows(studentId: string, homeworkId: string, unitId: string, itemId: string) {
  const { data } = await createAdminClient()
    .from("homework").select("unit_id, items").eq("id", homeworkId).eq("student_id", studentId).is("reviewed_at", null).maybeSingle();
  return !!data && data.unit_id === unitId && Array.isArray(data.items) && (data.items as string[]).includes(itemId);
}

// in checkAnswer, replace the student gate block:
  if (who.kind === "student") {
    const viaHomework = v.mode === "practice" && !!v.homeworkId && (await homeworkAllows(who.studentId, v.homeworkId, v.unitId, v.itemId));
    if (!viaHomework) {
      // §2.7: no self-solving before the worked example has been viewed in full.
      const p = await progress(who.studentId, v.unitId);
      if (!p?.worked_viewed_at) return { ok: false, message: "Con cần xem hết lời giải mẫu trước." };
      if (v.mode === "practice" && !p.faded_done_at) return { ok: false, message: "Con cần làm xong phần điền bước trước." };
    }
  }
```

(The item must still be in the student's view of the unit: `findItem(found.unit, …)` on `studentUnit` — a hidden "Cần sửa" item is refused.)

- [ ] **Step 2: Player** — `lesson-player.tsx`: `export function PracticeStage(...)` with props `{ unit; onDone; recapHref; homeworkId?: string }`; pass `homeworkId` into both `checkAnswer` calls (the whole-item call in `PracticeStage.check` and the step call in `StepsPractice`, which gets a `homeworkId?: string` prop threaded from `PracticeStage`). In the `finished` branch:

```tsx
if (finished) {
  const right = Object.values(firstTry).filter(Boolean).length;
  return (
    <Card>
      <h2 className="font-display text-lg font-bold">{homeworkId ? "Xong bài về nhà" : "Xong phần luyện tập"}</h2>
      <p className="mt-2">Đúng ngay lần đầu: <b className="tabular-nums">{right}/{unit.practice.length}</b> câu.</p>
      <p className="mt-1 text-sm text-muted">{homeworkId ? "Thầy/cô xem được kết quả này." : "Phần tiếp theo là bài kiểm tra ngắn: không có gợi ý, xem đáp án sau khi nộp."}</p>
      <PrimaryButton className="mt-4 w-full" onClick={onDone}>{homeworkId ? "Về trang chính" : "Làm bài kiểm tra"}</PrimaryButton>
    </Card>
  );
}
```

- [ ] **Step 3: Homework page** — `homework-practice.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import type { PublicUnit } from "@/lib/content/public";
import { PracticeStage } from "./lesson-player";

export function HomeworkPractice({ unit, homeworkId }: { unit: PublicUnit; homeworkId: string }) {
  const router = useRouter();
  return <PracticeStage unit={unit} homeworkId={homeworkId} onDone={() => router.push("/student")} recapHref={(id) => `/student/recap/${id}`} />;
}
```

`src/app/student/homework/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { toPublicUnit } from "@/lib/content";
import { studentUnit } from "@/lib/content/approvals";
import { HomeworkPractice } from "@/components/lesson/homework-practice";

export const metadata: Metadata = { title: "Bài về nhà — App Toán" };

// T9: the items the tutor picked, as practice (graded on the server, counted toward mastery).
export default async function HomeworkPage(props: PageProps<"/student/homework/[id]">) {
  const user = await requireRole("student");
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");
  const { data: hw } = await supabase.from("homework").select("id, unit_id, items, task, reviewed_at").eq("id", id).eq("student_id", me.id).maybeSingle();
  if (!hw?.unit_id || !Array.isArray(hw.items) || !hw.items.length || hw.reviewed_at) notFound();
  const found = await studentUnit(hw.unit_id as string);
  if (!found) notFound();
  const pub = toPublicUnit(found.unit, found.module);
  const items = (hw.items as string[]).flatMap((x) => pub.practice.filter((p) => p.id === x));
  if (!items.length) notFound();
  return (
    <div className="flex flex-col gap-3">
      <Link href="/student" className="text-sm text-accent hover:underline">← Trang chính</Link>
      <p className="font-mono text-xs text-muted">Bài về nhà · {found.unit.title} · {items.length} câu</p>
      <p className="whitespace-pre-line">{hw.task as string}</p>
      <HomeworkPractice unit={{ ...pub, practice: items }} homeworkId={hw.id as string} />
    </div>
  );
}
```

- [ ] **Step 4: Homework card** — `src/app/student/page.tsx`: add `items` to `cols`; in `HomeworkCard`, when `h.items?.length` link to `/student/homework/${h.id}` with label `Làm ${h.items.length} câu trên app` (keep `data-testid="homework-app-link"`), else the existing KU link. An item homework shows even if the KU's roadmap status is not "open" (the KU is unlocked by S9 anyway): pass `unit={h.unit_id ? state.units.find((u) => u.unit.id === h.unit_id) : undefined}` for item homework.

- [ ] **Step 5: Verify** — `npm run lint && npm test && npm run build`. Commit registry; `./e2e/run.sh` → all previous PASS (no behaviour change without `items`).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "S11: student practises hand-picked homework items in the app (counts as practice)"`

---

### Task 4: Giao bài tab

**Files:**
- Modify: `src/app/tutor/actions.ts`
- Create: `src/app/tutor/[studentId]/giao/page.tsx`, `src/components/tutor/assign-form.tsx`

**Interfaces:**
- Consumes: `parseAssignment` (Task 2), `studentModules` (S10), `activeAssignment` (`@/lib/access`), `homeworkAppResult(…, items)`, `loadStudentState`.
- Produces: action `assignHomework(prev: ActionState, fd: FormData): Promise<ActionState>`; form fields `studentId`, `mode` (`unit`|`items`|`paper`), `unit`, `item` (repeated), `task`, `link` (≤ 3), `due`.

- [ ] **Step 1: Action** — append to `src/app/tutor/actions.ts`:

```ts
import { parseAssignment } from "@/lib/learning/homework";
import { studentModules } from "@/lib/content/approvals";

/** T9 "Giao bài": homework without a session — whole KU, hand-picked practice items, or paper. */
export async function assignHomework(_p: ActionState, fd: FormData): Promise<ActionState> {
  const tutor = await requireRole("tutor");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  if (!studentId.success) return { error: "Không tìm thấy học sinh." };
  const units = new Map((await studentModules()).flatMap((m) => m.unitList.map((u) => [u.id, { title: u.title, practice: u.practice.map((i) => i.id) }] as const)));
  const parsed = parseAssignment(
    { mode: String(fd.get("mode") ?? ""), unit: String(fd.get("unit") ?? ""), items: fd.getAll("item").map(String), task: String(fd.get("task") ?? ""), links: fd.getAll("link").map(String), due: String(fd.get("due") ?? "") },
    { today: vnDate(), units },
  );
  if (!parsed.ok) return { error: parsed.error };
  const admin = createAdminClient();
  if (!(await activeAssignment(admin, tutor.id, studentId.data))) return { error: NOT_ASSIGNED };
  const v = parsed.value;
  const { error } = await admin.from("homework").insert({ student_id: studentId.data, tutor_id: tutor.id, unit_id: v.unitId, items: v.items, task: v.task, links: v.links, due_on: v.dueOn });
  if (error) {
    console.error("assignHomework", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath(`/tutor/${studentId.data}`, "layout");
  revalidatePath("/student");
  return { ok: v.items ? `Đã giao ${v.items.length} câu.` : "Đã giao bài." };
}
```

- [ ] **Step 2: Form** — `assign-form.tsx` (client; quick-select by level checks boxes in the DOM):

```tsx
"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { assignHomework } from "@/app/tutor/actions";

export type PickItem = { id: string; level: "L1" | "L2" | "L3"; promptText: string; oftenWrong: boolean; examLike: boolean };

export function AssignForm(p: { studentId: string; studentName: string; unitId: string | null; mode: "unit" | "items" | "paper"; items: PickItem[]; defaultDue: string; maxDue: string; today: string }) {
  const [state, action, pending] = useActionState(assignHomework, {});
  const list = useRef<HTMLDivElement>(null);
  const pick = (level?: string) =>
    list.current?.querySelectorAll<HTMLInputElement>('input[name="item"]').forEach((b) => { b.checked = !level ? false : b.dataset.level === level || b.checked; });
  return (
    <form action={action} className="flex flex-wrap items-start gap-5">
      <input type="hidden" name="studentId" value={p.studentId} />
      <input type="hidden" name="mode" value={p.mode} />
      {p.unitId && <input type="hidden" name="unit" value={p.unitId} />}
      <section className="min-w-0 flex-[999_1_560px]">
        {p.mode === "items" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface" ref={list}>
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg px-4 py-2 text-sm">
              <b className="font-display">Câu luyện tập</b>
              <span className="ml-auto text-muted">Chọn nhanh:</span>
              {(["L1", "L2", "L3"] as const).map((l) => <button key={l} type="button" onClick={() => pick(l)} className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-xs">+ {l}</button>)}
              <button type="button" onClick={() => pick()} className="rounded-full px-2.5 py-0.5 text-xs text-muted">Bỏ chọn</button>
            </div>
            {p.items.map((it) => (
              <label key={it.id} className="flex cursor-pointer items-start gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <input type="checkbox" name="item" value={it.id} data-level={it.level} className="mt-1 size-[18px] accent-[var(--accent)]" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap gap-2 font-mono text-xs">
                    <b>{it.id.split("-").at(-1)}</b><span className="text-muted">{it.level}</span>
                    {it.oftenWrong && <span className="rounded-full bg-warn-soft px-2 text-warn">con hay sai</span>}
                    {it.examLike && <span className="rounded-full bg-accent-soft px-2 text-accent">giống đề thi</span>}
                  </span>
                  <span className="mt-1 block text-[15px]">{it.promptText}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {p.mode === "unit" && <p className="rounded-xl border border-border bg-surface p-4 text-sm">Con làm cả bài theo thứ tự của app (luyện tập rồi kiểm tra). Bài mở ngay cho con.</p>}
        {p.mode === "paper" && <p className="rounded-xl border border-border bg-surface p-4 text-sm">Bài làm trên giấy: ghi yêu cầu và/hoặc dán link đề (Google Drive). Không chấm trên app.</p>}
      </section>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="font-display text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="due">Hạn nộp</label>
        <input id="due" name="due" type="date" defaultValue={p.defaultDue} min={p.today} max={p.maxDue} className="rounded-lg border border-border px-3 py-2" />
        <label className="font-display text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="task">{p.mode === "paper" ? "Yêu cầu" : "Lời dặn con (tuỳ chọn)"}</label>
        <textarea id="task" name="task" rows={3} maxLength={300} className="rounded-lg border border-border px-3 py-2" />
        {[0, 1, 2].map((i) => <input key={i} name="link" type="url" placeholder={i ? "Link khác (tuỳ chọn)" : "Link đề Google Drive (tuỳ chọn)"} className="rounded-lg border border-border px-3 py-2 text-sm" />)}
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent disabled:opacity-60">{pending ? "Đang giao…" : `Giao cho ${p.studentName}`}</button>
        {state.error && <p role="alert" className="text-sm text-warn">{state.error}</p>}
        {state.ok && <p role="status" className="text-sm text-good">✓ {state.ok} <Link href={`/tutor/${p.studentId}`} className="underline">Về Hôm nay</Link></p>}
        <p className="text-xs text-muted">Câu làm trên app được chấm và tính như luyện tập; cô thấy đúng/sai ở tab Hôm nay.</p>
      </aside>
    </form>
  );
}
```

- [ ] **Step 3: Page** — `src/app/tutor/[studentId]/giao/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { studentModules } from "@/lib/content/approvals";
import { loadStudentState } from "@/lib/learning/state";
import { addDays, vnDate } from "@/lib/learning/rules";
import { HOMEWORK_RULES } from "@/lib/learning/homework";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { AssignForm, type PickItem } from "@/components/tutor/assign-form";

export const metadata: Metadata = { title: "Giao bài — App Toán" };
const MODES = [
  { id: "items", label: "Chọn từng câu" },
  { id: "unit", label: "Cả bài" },
  { id: "paper", label: "Bài trên giấy" },
] as const;
// Plain text of a prompt for the picker (TeX kept as typed).
const plain = (s: string) => s.replace(/\*\*/g, "").replace(/\$/g, "").slice(0, 160);

// Mockup artboard 4: pick a KU (priorities first) → mode → items → due → Giao.
export default async function AssignPage(props: PageProps<"/tutor/[studentId]/giao">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const [mods, state] = await Promise.all([studentModules(), loadStudentState(supabase, student.id)]);
  const approved = mods.flatMap((m) => m.unitList);
  const ordered = [...state.priorities.flatMap((id) => approved.filter((u) => u.id === id)), ...approved.filter((u) => !state.priorities.includes(u.id))];
  const mode = MODES.find((m) => m.id === sp.mode)?.id ?? "items";
  const unit = approved.find((u) => u.id === sp.unit) ?? ordered[0] ?? null;
  const attempts = state.units.find((u) => u.unit.id === unit?.id)?.attempts ?? [];
  const wrongs = new Map<string, number>();
  for (const a of attempts) if (!a.correct) wrongs.set(a.item_id, (wrongs.get(a.item_id) ?? 0) + 1);
  const items: PickItem[] = (unit?.practice ?? []).map((it) => ({ id: it.id, level: it.level, promptText: plain(it.prompt), oftenWrong: (wrongs.get(it.id) ?? 0) >= 1, examLike: !!it.source }));
  const today = vnDate();
  const q = (o: Record<string, string>) => `?${new URLSearchParams({ unit: unit?.id ?? "", mode, ...o })}`;

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="giao" />
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="mode" value={mode} />
          <label htmlFor="unit" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Bài</label>
          <select id="unit" name="unit" defaultValue={unit?.id} className="rounded-lg border border-border bg-surface px-3 py-2 font-display font-semibold">
            {ordered.map((u) => <option key={u.id} value={u.id}>{state.priorities.includes(u.id) ? "★ " : ""}{u.title}</option>)}
          </select>
          <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm">Chọn</button>
        </form>
        <nav className="flex flex-wrap gap-2" aria-label="Cách giao">
          {MODES.map((m) => (
            <Link key={m.id} href={q({ mode: m.id })} aria-current={m.id === mode ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 font-display text-sm font-semibold ${m.id === mode ? "border-accent bg-accent text-on-accent" : "border-border bg-surface"}`}>{m.label}</Link>
          ))}
        </nav>
      </div>
      {unit || mode === "paper" ? (
        <AssignForm key={`${unit?.id}-${mode}`} studentId={student.id} studentName={student.full_name} unitId={unit?.id ?? null} mode={mode} items={items}
          today={today} defaultDue={addDays(today, HOMEWORK_RULES.defaultDueDays)} maxDue={addDays(today, HOMEWORK_RULES.dueMaxDays)} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Chưa có bài nào được duyệt — duyệt ở tab Kho bài trước.</p>
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify** — `npm run lint && npm run build` → pass.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S11: Giao bài tab — whole KU, hand-picked items, paper homework"`

---

### Task 5: Buổi dạy gọn + five tabs

**Files:**
- Create: `src/app/tutor/[studentId]/buoi/page.tsx`, `src/components/tutor/session-short.tsx`
- Modify: `src/components/tutor/tutor-tabs.tsx`

**Interfaces:**
- Consumes: `saveTeachingSession` (unchanged; it reads `studentId`, `taughtOn`, `note`, `unit` (repeated), `level:<id>`; no `hw.*` fields → no homework), `UnitEvidence` type, `SESSION_RULES`.
- Produces: `TutorTab = "today" | "bai" | "giao" | "buoi" | "work"`; `<SessionShort studentId today minDate units chips />`.

- [ ] **Step 1: Tabs** — `tutor-tabs.tsx`:

```ts
export type TutorTab = "today" | "bai" | "giao" | "buoi" | "work";
const TABS: { id: TutorTab; label: string; path: string }[] = [
  { id: "today", label: "Hôm nay", path: "" },
  { id: "bai", label: "Kho bài", path: "/bai" },
  { id: "giao", label: "Giao bài", path: "/giao" },
  { id: "buoi", label: "Buổi dạy", path: "/buoi" },
  { id: "work", label: "Bài làm", path: "/work" },
];
```

- [ ] **Step 2: Short form** — `session-short.tsx`:

```tsx
"use client";

import { startTransition, useActionState, useState } from "react";
import { saveTeachingSession, type SaveSessionState } from "@/app/tutor/actions";

export type ChipUnit = { id: string; title: string; group: "priority" | "progress" | "other"; level: number };
const HINT = ["chưa học", "làm được khi có hướng dẫn", "tự làm bài cơ bản", "làm bài dạng đề thi", "vững, chỉ cần ôn"];

/** Mockup artboard 5: date → taught KUs as chips (priority + in progress, search for others) → level only for ticked. */
export function SessionShort({ studentId, today, minDate, units }: { studentId: string; today: string; minDate: string; units: ChipUnit[] }) {
  const [state, formAction, pending] = useActionState<SaveSessionState, FormData>(saveTeachingSession, {});
  const [ticked, setTicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const toggle = (id: string) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const chip = (u: ChipUnit) => (
    <button key={u.id} type="button" onClick={() => toggle(u.id)} aria-pressed={ticked.includes(u.id)}
      className={`rounded-full border px-3 py-1.5 text-sm ${ticked.includes(u.id) ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface"}`}>
      {ticked.includes(u.id) ? "✓ " : ""}{u.title}
    </button>
  );
  const found = q.trim() ? units.filter((u) => u.group === "other" && u.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  return (
    <form key={state.savedAt ?? "new"} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => formAction(fd)); }} className="mx-auto flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="studentId" value={studentId} />
      {ticked.map((id) => <input key={id} type="hidden" name="unit" value={id} />)}
      <section className="rounded-xl border border-border bg-surface p-4">
        <label htmlFor="taughtOn" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">1 · Ngày dạy</label>
        <input id="taughtOn" name="taughtOn" type="date" defaultValue={today} min={minDate} max={today} className="ml-3 rounded-lg border border-border px-3 py-2" />
      </section>
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">2 · Hôm nay dạy bài nào?</p>
        {(["priority", "progress"] as const).map((g) => units.some((u) => u.group === g) && (
          <div key={g}><p className="text-sm text-muted">{g === "priority" ? "Ưu tiên của cô" : "Con đang học dở"}</p><div className="mt-1 flex flex-wrap gap-2">{units.filter((u) => u.group === g).map(chip)}</div></div>
        ))}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm bài khác (${units.length} bài)…`} aria-label="Tìm bài khác" className="rounded-lg border border-border px-3 py-2" />
        {found.length > 0 && <div className="flex flex-wrap gap-2">{found.map(chip)}</div>}
        {ticked.filter((id) => units.find((u) => u.id === id)?.group === "other").length > 0 && (
          <div className="flex flex-wrap gap-2">{units.filter((u) => u.group === "other" && ticked.includes(u.id)).map(chip)}</div>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">3 · Con nắm đến đâu? (chỉ bài đã chọn)</p>
        {ticked.map((id) => {
          const u = units.find((x) => x.id === id)!;
          return (
            <fieldset key={id} className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">{u.title}</legend>
              <span className="min-w-0 flex-[1_1_220px] font-display font-semibold">{u.title} <span className="font-mono text-xs text-muted">hệ thống M{u.level}</span></span>
              {[0, 1, 2, 3, 4].map((n) => (
                <label key={n} title={HINT[n]} className="cursor-pointer">
                  <input type="radio" name={`level:${id}`} value={n} required className="peer sr-only" />
                  <span className="inline-block w-11 rounded-lg border border-border py-1.5 text-center font-mono text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent">M{n}</span>
                </label>
              ))}
            </fieldset>
          );
        })}
        {!ticked.length && <p className="text-sm text-muted">Chọn bài ở bước 2. Buổi chữa đề / không theo bài: ghi chú bên dưới là đủ.</p>}
        <label htmlFor="note" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Ghi chú (tuỳ chọn)</label>
        <textarea id="note" name="note" rows={2} maxLength={500} className="rounded-lg border border-border px-3 py-2" />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-3 font-display font-bold text-on-accent disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu buổi dạy"}</button>
        <a href={`/tutor/${studentId}/giao`} className="font-display font-semibold text-accent">Giao bài về nhà →</a>
        <span aria-live="polite" className="text-sm">{state.error ? <span role="alert" className="text-warn">{state.error}</span> : state.ok ? <span role="status" className="text-good">✓ {state.ok}</span> : null}</span>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Page** — `src/app/tutor/[studentId]/buoi/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { addDays, vnDate } from "@/lib/learning/rules";
import { SESSION_RULES } from "@/lib/learning/session";
import { loadStudentState } from "@/lib/learning/state";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { SessionShort, type ChipUnit } from "@/components/tutor/session-short";

export const metadata: Metadata = { title: "Buổi dạy — App Toán" };

export default async function SessionPage(props: PageProps<"/tutor/[studentId]/buoi">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const state = await loadStudentState(supabase, student.id, { includeDrafts: true });
  const units: ChipUnit[] = state.roadmap.map(({ entry, state: u, level }) => ({
    id: entry.id,
    title: entry.title,
    level,
    group: state.priorities.includes(entry.id) ? "priority" : u?.inProgress ? "progress" : "other",
  }));
  units.sort((a, b) => (a.group === "priority" && b.group === "priority" ? state.priorities.indexOf(a.id) - state.priorities.indexOf(b.id) : 0));
  const today = vnDate();
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="buoi" />
      <SessionShort studentId={student.id} today={today} minDate={addDays(today, -SESSION_RULES.maxBackdateDays)} units={units} />
    </>
  );
}
```

- [ ] **Step 4: Verify** — `npm run lint && npm run build`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S11: short Buổi dạy form (chips, levels only for taught KUs); five tabs"`

---

### Task 6: Hôm nay + single-student redirect

**Files:**
- Create: `src/components/tutor/open-homework.tsx`
- Modify: `src/app/tutor/[studentId]/page.tsx` (replace), `src/app/tutor/page.tsx`
- Delete: `src/components/tutor/session-form.tsx`, `src/components/tutor/homework-fields.tsx` (replaced by Tasks 4–5; `grep -rn "session-form\|homework-fields" src` must be empty after)

**Interfaces:**
- Consumes: `shelf()`, `weekSummary`, `sessionDue`, `homeworkAppResult(…, items)`, `reviewHomework`, `dueLabel`, `errorLabel`.

- [ ] **Step 1: Open homework block** — move the existing "Bài đã giao chưa chữa" `<section>` (with `data-testid="open-homework"` and `homework-app-result`) from the old page into `open-homework.tsx` as `export function OpenHomework({ rows, state, today }: { rows: OpenHwRow[]; state: StudentState; today: string })` with `type OpenHwRow = { id: string; unit_id: string | null; items: string[] | null; task: string; due_on: string; done_at: string | null; created_at: string }`. Changes inside: `homeworkAppResult(u.attempts, h.created_at, h.items)`, and the unit line shows `· ${h.items.length} câu` when `h.items`. Sort: done-but-not-corrected first, then by due date.

- [ ] **Step 2: Hôm nay page** — `src/app/tutor/[studentId]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { shelf } from "@/lib/content/approvals";
import { loadStudentState } from "@/lib/learning/state";
import { vnDate } from "@/lib/learning/rules";
import { sessionDue, weekSummary } from "@/lib/learning/tutor-today";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { OpenHomework, type OpenHwRow } from "@/components/tutor/open-homework";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };
const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

// Mockup artboard 1: what needs the tutor today, for one student.
export default async function TodayPage(props: PageProps<"/tutor/[studentId]">) {
  const tutor = await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const [state, rows, hw, last, assign] = await Promise.all([
    loadStudentState(supabase, student.id),
    shelf(),
    supabase.from("homework").select("id, unit_id, items, task, due_on, done_at, created_at").eq("student_id", student.id).eq("tutor_id", tutor.id).is("reviewed_at", null).order("due_on", { ascending: true }).limit(20),
    supabase.from("teaching_sessions").select("taught_on").eq("student_id", student.id).eq("tutor_id", tutor.id).order("taught_on", { ascending: false }).limit(1),
    supabase.from("tutor_assignments").select("weekdays").eq("student_id", student.id).eq("tutor_id", tutor.id).is("ended_at", null).maybeSingle(),
  ]);
  const today = vnDate();
  const waiting = rows.filter((r) => r.status === "waiting" || r.status === "reapprove");
  const due = sessionDue((last.data ?? [])[0]?.taught_on ?? null, (assign.data?.weekdays as number[] | null) ?? [], today);
  const week = weekSummary(state.units.flatMap((u) => u.attempts), today);
  const title = new Map(rows.map((r) => [r.id, r.title]));

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="today" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Việc hôm nay">
          {waiting.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4" data-testid="todo-review">
              <p className="font-display font-semibold">{waiting.length} bài chờ cô duyệt</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {waiting.slice(0, 3).map((r) => <li key={r.id}><Link href={`/tutor/${student.id}/bai/${r.id}`} className="text-accent hover:underline">{r.title}</Link> <span className="font-mono text-xs text-muted">đã xem {r.reviewed}/{r.total}</span></li>)}
              </ul>
              {waiting.length > 3 && <Link href={`/tutor/${student.id}/bai?loc=cho`} className="mt-2 inline-block text-sm text-accent">Xem tất cả →</Link>}
            </div>
          )}
          <OpenHomework rows={(hw.data ?? []) as OpenHwRow[]} state={state} today={today} />
          {due && (
            <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm" data-testid="todo-session">
              Chưa ghi buổi dạy ngày {ddmm(due)}. <Link href={`/tutor/${student.id}/buoi`} className="font-semibold underline">Ghi buổi dạy →</Link>
            </div>
          )}
          {!waiting.length && !hw.data?.length && !due && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có việc gì đang chờ. <Link href={`/tutor/${student.id}/giao`} className="text-accent">Giao bài mới →</Link></p>}
        </section>
        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display font-semibold">Ưu tiên luyện trước</p>
            <ol className="mt-2 list-decimal pl-5 text-sm">{state.priorities.map((id) => <li key={id}>{title.get(id) ?? id}</li>)}</ol>
            {!state.priorities.length && <p className="mt-1 text-sm text-muted">Chưa đặt.</p>}
            <Link href={`/tutor/${student.id}/bai`} className="mt-2 inline-block text-sm text-accent">Sửa ở Kho bài →</Link>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm" data-testid="week-summary">
            <p className="font-display font-semibold">Tuần này của con</p>
            <p className="mt-2">Buổi học: <b>{week.studyDays}/4</b></p>
            <p>Luyện tập: <b>{week.practice.right}/{week.practice.total}</b> câu đúng</p>
            <p>Lượt ôn: <b>{week.reviews}</b></p>
          </div>
        </aside>
      </div>
    </>
  );
}
```

(`tutor_assignments.weekdays` from 0008; RLS lets the tutor read own rows.)

- [ ] **Step 3: Single-student redirect** — `src/app/tutor/page.tsx`: after loading `students`, `if (students?.length === 1) redirect(\`/tutor/${students[0].id}\`);` (import `redirect` from `next/navigation`). Each list card links to `/tutor/${s.id}` ("Mở bàn làm việc") instead of the two old buttons.

- [ ] **Step 4: Verify** — `npm run lint && npm run build`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S11: Hôm nay tab; one student opens straight into the workspace"`

---

### Task 7: End-to-end + docs + push

**Files:**
- Modify: `e2e/tutor-flow.mjs`, `e2e/run.sh`
- Create: `e2e/assign-flow.mjs`, `e2e/assign-student-flow.mjs`
- Modify docs: `docs/DESIGN.md`, `docs/PROGRESS.md`, `docs/HANDOFF.md`, `docs/SPEC.md` (if a build ruling changed), hub draft `docs/HUB_PJ_APP_TOAN_UPDATE.md`

- [ ] **Step 1: Update `tutor-flow.mjs`** — the session part now lives at `/tutor/${sid}/buoi`:
  - home: `/tutor` redirects to `/tutor/${sid}` (one student) → assert the tab "Hôm nay" is current; the "Đăng An hidden" RLS check stays (no link to An).
  - session: open `/tutor/${sid}/buoi`; tick a KU by clicking its chip (`page.getByRole("button", { name: title["htl-1"] })`, search first for a non-priority KU: `page.getByLabel("Tìm bài khác").fill("…")`); level radios keep `name="level:<id>"` → reuse the `level(id, n)` helper; save button "Lưu buổi dạy"; keep the DB assertions on `teaching_sessions` / `tutor_proposals` and the "empty unit needs a note" rule.
  - homework: replace the `hw.0.*` steps with the Giao bài tab (`/tutor/${sid}/giao?mode=paper`): fill "Yêu cầu" + one Drive link → "Giao cho Hạnh Nguyên" → DB row with `session_id is null`; "link without task" still allowed (Drive link alone) — drop the old "link without a task refused" assertion; keep the "Đã chữa" correction on the Hôm nay tab (`data-testid="open-homework"`).
  - S9: `/tutor/${sid}/giao?unit=htl-2&mode=unit` → "Giao" → `homework.unit_id = 'htl-2'`, `items is null`; the app-result line (`homework-app-result`) on Hôm nay.
  - Remove the tap-count assertion tied to the long form if it no longer applies; keep `no browser errors`.

- [ ] **Step 2: `assign-flow.mjs`** (E2E_ROLE=tutor, port 3110):

```js
// S11 tutor: give 2 hand-picked practice items of htl-1; see the app result after the student answers. Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3110";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const htl1 = JSON.parse(fs.readFileSync("content/he-thuc-luong/htl-1.json", "utf8"));
const [p1, p2] = [htl1.practice[0].id, htl1.practice[1].id];

await sql(`delete from public.homework; delete from public.attempts where unit_id = 'htl-1';`);
const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
await page.goto(`${BASE}/tutor/${sid}/giao?unit=htl-1&mode=items`);
ok("giao: practice items listed, no exit items", (await page.locator('input[name="item"]').count()) === htl1.practice.length && (await page.locator(`input[value="${htl1.exit[0].id}"]`).count()) === 0);
await page.locator(`input[name="item"][value="${p1}"]`).check();
await page.locator(`input[name="item"][value="${p2}"]`).check();
await page.getByRole("button", { name: /Giao cho/ }).click();
await page.getByText("Đã giao 2 câu.").waitFor();
const hw = await sql(`select unit_id, items, session_id from public.homework`);
ok("db: item homework without a session", hw.length === 1 && hw[0].unit_id === "htl-1" && hw[0].items.join() === `${p1},${p2}` && hw[0].session_id === null, JSON.stringify(hw));
fs.writeFileSync("e2e/out/assign-hw.json", JSON.stringify({ id: (await sql(`select id from public.homework`))[0].id, items: [p1, p2] }));
await page.goto(`${BASE}/tutor/${sid}`);
ok("hôm nay: homework listed, nothing done in the app yet", (await page.getByTestId("homework-app-result").innerText()).includes("con chưa làm"));
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

- [ ] **Step 3: `assign-student-flow.mjs`** (E2E_ROLE=student, port 3111, runs right after; answers both items right, without the worked example):

```js
// S11 student: hand-picked homework opens from the card, no worked-example gate, answers count as practice.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3111";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const htl1 = JSON.parse(fs.readFileSync("content/he-thuc-luong/htl-1.json", "utf8"));
const key = Object.fromEntries(htl1.practice.map((it) => [it.id, it.type === "mcq" ? { mcq: it.correct } : { num: it.answer }]));
const hw = JSON.parse(fs.readFileSync("e2e/out/assign-hw.json", "utf8"));

await sql(`delete from public.unit_progress where unit_id = 'htl-1'`); // no worked example viewed
await page.goto(`${BASE}/student`);
const link = page.getByTestId("homework-app-link");
ok("card: 'Làm 2 câu trên app'", (await link.innerText()).includes("Làm 2 câu trên app"));
await link.click();
await page.waitForURL(new RegExp(`/student/homework/${hw.id}`));
for (const id of hw.items) {
  const k = key[id];
  if (k.mcq !== undefined) await page.getByRole("radio").nth(k.mcq).check(); else await page.getByLabel("Đáp số").fill(k.num);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
}
await page.getByText("Xong bài về nhà").waitFor();
const rows = await sql(`select item_id, mode, correct from public.attempts where unit_id = 'htl-1' order by id`);
ok("db: both answers recorded as practice, right", rows.length === 2 && rows.every((r) => r.mode === "practice" && r.correct), JSON.stringify(rows));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

(If an htl-1 practice item is of type `steps`, pick `htl1.practice.filter((i) => i.type !== "steps")` for p1/p2 in both scripts.)

- [ ] **Step 4: run.sh** — after the S10 lines add `run tutor 3110 e2e/assign-flow.mjs; k=$?` and `run student 3111 e2e/assign-student-flow.mjs; l=$?`; exit line includes `k || l`.
- [ ] **Step 5: Run everything** — commit registry; `npm run lint && npm test && npm run build && ./e2e/run.sh` → all PASS; fix until green. Take screenshots of the 5 tabs at 1280 and 390 px (`e2e/out/…`) and compare with the mockup.
- [ ] **Step 6: Docs** — `DESIGN.md` §2 routes (5 tabs, `/student/homework/[id]`), §3 `homework.items`, optional `session_id` (0013), §5 T9 gate rule; `PROGRESS.md` dated section + quick-status S11 (parent: **run SQL 0013 before merging**); `HANDOFF.md` S11 ✅ PR open, next S8 (0014); `docs/HUB_PJ_APP_TOAN_UPDATE.md` note for the hub (parent copies).
- [ ] **Step 7: Commit, push, CI** — `git add -A && git commit -m "S11: e2e assign flows; tutor flow on the new tabs; docs" && git push -u origin p1-slice-11`; then `gh api -X POST repos/haleytruong89-moon/math-app/actions/workflows/ci.yml/dispatches -f ref=p1-slice-11` and wait for `completed success`.
