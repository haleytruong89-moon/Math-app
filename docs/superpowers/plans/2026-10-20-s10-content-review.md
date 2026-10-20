# S10 — Kho bài, duyệt từng câu, ưu tiên (T7, T8) Implementation Plan

> **For agentic workers:** Implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The tutor (and the parent) see every KU's status, review drafted KUs item by item and approve them in the
app, and set per-student priority KUs that open at once and come first in "Bài mới".

**Architecture:** Content stays in git; verdicts and approvals are DB rows (`item_reviews`, `unit_approvals`,
migration 0012) carrying server-computed hashes of the content reviewed. A pure module (`review.ts`) turns rows +
content into item statuses, the approve rule and the student's view of a unit; a server-only loader
(`approvals.ts`) feeds it and replaces every `status === "approved"` gate. Priorities (`tutor_priorities`) join
the unlock set and `suggestNew`.

**Tech Stack:** Next.js 16 App Router (server components + server actions), TypeScript, Tailwind v4, Supabase
Postgres + RLS, zod 4, `node --test` (TS type stripping), PGlite (RLS test + e2e), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-20-tutor-workspace-design.md` (+ SPEC §0 T7, T8, "Tutor workspace";
mockup "Bàn làm việc gia sư", artboards 2 and 3).

## Global Constraints

- UI text Vietnamese; code, comments, commits, file names English (CLAUDE.md).
- RLS on every table; explicit `GRANT … to service_role` on every new table (lesson of 0002); clients SELECT only, writes through server actions with `createAdminClient()`.
- Never ship `service_role` to the browser; never print secrets; never push `main`; never run SQL on live Supabase — the parent runs `0012` and merges.
- Migration number **0012** (0011 = `review_runs`, PR #25; S8 moves to 0014, S11 takes 0013).
- No streaks or leaderboards (D17). Tokens from `globals.css` only (`bg-surface`, `text-muted`, `bg-accent`, `bg-good-soft`, `bg-warn-soft`, `border-border`, `font-display`, `font-mono`).
- The e2e fake DB client supports only `select / insert / upsert / update / delete / eq / is / in / order / limit / range / maybeSingle / single` — use nothing else in server code (or extend `e2e/patch/e2e-fake.ts` in the same task).
- Before every push: `npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh` (commit the registry first — run.sh restores it).
- Students must never receive answers, solutions or mistakes (`publicItem` whitelist stays the only path to the browser for student and preview players). The review screens are server-rendered for tutor/parent only.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `supabase/migrations/0012_p1_content_review.sql` | tables `item_reviews`, `unit_approvals`, `tutor_priorities` + RLS | 1 |
| `supabase/tests/rls.test.mjs` | RLS checks for 0012 | 1 |
| `src/lib/content/review.ts` (+ `.test.ts`) | pure: reviewables, item status, unit review, approve rule, student view, shelf status, fix-notes text | 2 |
| `src/lib/learning/priorities.ts` (+ `.test.ts`) | pure: edit an ordered priority list | 3 |
| `src/lib/learning/sequence.ts` (+ test) | `suggestNew(units, priority)` | 3 |
| `src/lib/content/approvals.ts` | server-only loader: review rows, `studentModules`, `studentUnit`, `reviewOf`, `shelf` | 4 |
| `src/app/learn/actions.ts`, `src/app/student/learn/[unitId]/page.tsx`, `src/app/student/recap/[unitId]/page.tsx`, `src/lib/learning/state.ts`, `src/app/tutor/actions.ts` | use the loader instead of `status === "approved"`; tutor preview; priorities in state | 4 |
| `src/lib/access.ts` | server-only: `activeAssignment`, `reviewerOf` | 5 |
| `src/app/review/actions.ts` | server actions `reviewItem`, `approveUnit`, `returnUnit`, `editPriorities` | 5 |
| `src/app/tutor/layout.tsx`, `src/components/tutor/tutor-tabs.tsx` | wide layout + per-student tabs | 6 |
| `src/app/tutor/[studentId]/bai/page.tsx` | Kho bài | 6 |
| `src/components/review/*` | item panel, verdict form, workbench (shared tutor/parent) | 7 |
| `src/app/tutor/[studentId]/bai/[unitId]/page.tsx`, `…/thu/page.tsx` | Duyệt + Làm thử | 7 |
| `src/app/parent/content/page.tsx`, `src/app/parent/content/[unitId]/duyet/page.tsx`, `src/components/review/copy-notes.tsx` | parent statuses, review route, notes to copy | 8 |
| `e2e/review-flow.mjs`, `e2e/review-student-flow.mjs`, `e2e/run.sh` | browser checks | 9 |
| `docs/DESIGN.md`, `docs/PROGRESS.md`, `docs/HANDOFF.md`, `docs/CONTENT_STANDARD.md`, `docs/AI_TUTOR.md`, `docs/P1_PLAN.md` | docs | 9 |

---

### Task 0: Branch

- [ ] **Step 1:** Wait until PR #24 (docs T7–T9) and PR #25 (audit H1/H2, SQL 0011) are merged — this plan uses `src/lib/content/lock.ts` from #25.
- [ ] **Step 2:** `git fetch origin '+refs/heads/*:refs/remotes/origin/*' && git checkout -b p1-slice-10 origin/main`
- [ ] **Step 3:** Check numbers: `git ls-tree --name-only origin/main supabase/migrations/` ends at `0011_p1_review_runs.sql`, and `gh api repos/haleytruong89-moon/math-app/pulls --jq '.[].head.ref'` shows no other branch adding `0012`. If 0012 is taken, use the next free number everywhere below.

---

### Task 1: Migration 0012 + RLS tests

**Files:**
- Create: `supabase/migrations/0012_p1_content_review.sql`
- Modify: `supabase/tests/rls.test.mjs` (load 0012 after 0011; checks before the final "locked tutor" block)

**Interfaces:**
- Produces: tables `item_reviews(unit_id, item_id, verdict 'ok'|'fix', note, grading_hash, content_hash, reviewer_id, created_at)`, `unit_approvals(unit_id, action 'approve'|'return', note, actor_id, created_at)`, `tutor_priorities(student_id, unit_id, position 1–20, set_by, updated_at)`.

- [ ] **Step 1: Write the failing RLS checks** — in `rls.test.mjs` add the load line after the 0011 line:

```js
await db.exec(fs.readFileSync(`${repo}/migrations/0012_p1_content_review.sql`, 'utf8'));
```

and before `await db.exec(\`update public.profiles set is_active=false where id=(select id from auth.users where email='trang@example.com')\`);` (the final locked-tutor block):

```js
// 0012: item_reviews / unit_approvals / tutor_priorities (S10, T7–T8)
const q12 = (sql) => db.query(sql).then(()=>'ok', e=>'ERROR '+e.message);
const tutorId = `(select id from auth.users where email='trang@example.com')`;
const parentId = `(select id from auth.users where email='me@example.com')`;
check('service_role writes an item review', await q12(`insert into public.item_reviews (unit_id, item_id, verdict, grading_hash, content_hash, reviewer_id) values ('b-haib','b-haib-p1','ok','0123456789abcdef','0123456789abcdef', ${tutorId})`), 'ok');
check('a "fix" verdict needs a note', isErr(await q12(`insert into public.item_reviews (unit_id, item_id, verdict, grading_hash, content_hash, reviewer_id) values ('b-haib','b-haib-p2','fix','0123456789abcdef','0123456789abcdef', ${tutorId})`)), true);
check('lesson block id accepted', await q12(`insert into public.item_reviews (unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id) values ('b-haib','_lesson','fix','Sửa đoạn 2','0123456789abcdef','0123456789abcdef', ${parentId})`), 'ok');
check('bad hash refused', isErr(await q12(`insert into public.item_reviews (unit_id, item_id, verdict, grading_hash, content_hash, reviewer_id) values ('b-haib','b-haib-p3','ok','xyz','0123456789abcdef', ${tutorId})`)), true);
check('service_role writes an approval', await q12(`insert into public.unit_approvals (unit_id, action, actor_id) values ('b-haib','approve', ${tutorId})`), 'ok');
check('parent reads item reviews', (await as('me@example.com','select count(*)::int c from public.item_reviews'))[0].c, 2);
check('active tutor reads item reviews', (await as('trang@example.com','select count(*)::int c from public.item_reviews'))[0].c, 2);
check('student cannot read item reviews', (await as('nguyen@example.com','select count(*)::int c from public.item_reviews'))[0].c, 0);
check('student reads approvals', (await as('nguyen@example.com','select count(*)::int c from public.unit_approvals'))[0].c, 1);
check('nobody writes reviews directly', [isErr(await as('trang@example.com',`insert into public.item_reviews (unit_id, item_id, verdict, grading_hash, content_hash, reviewer_id) values ('b-haib','b-haib-p4','ok','0123456789abcdef','0123456789abcdef', auth.uid())`)), isErr(await as('me@example.com',`insert into public.unit_approvals (unit_id, action, actor_id) values ('b-haib','return', auth.uid())`))], [true, true]);
check('service_role writes priorities', await q12(`insert into public.tutor_priorities (student_id, unit_id, position, set_by) values (${nguyen}, 'g-giaihpt', 1, ${tutorId}), (${nguyen}, 'g-chuyendong', 2, ${tutorId})`), 'ok');
check('one KU per position', isErr(await q12(`insert into public.tutor_priorities (student_id, unit_id, position, set_by) values (${nguyen}, 'g-chuso', 2, ${tutorId})`)), true);
check('student reads own priorities', (await as('nguyen@example.com','select count(*)::int c from public.tutor_priorities'))[0].c, 2);
check('other student sees no priorities', (await as('an@example.com','select count(*)::int c from public.tutor_priorities'))[0].c, 0);
check('active tutor reads priorities', (await as('trang@example.com','select count(*)::int c from public.tutor_priorities'))[0].c, 2);
```

(`nguyen` is the sub-select constant defined by the 0011 block of PR #25; if missing define `const nguyen = \`(select id from public.students where full_name='Hạnh Nguyên')\`;`.) Also add in the final locked-tutor block:

```js
check('locked tutor reads no item reviews', (await as('trang@example.com','select count(*)::int c from public.item_reviews'))[0].c, 0);
check('locked tutor reads no priorities', (await as('trang@example.com','select count(*)::int c from public.tutor_priorities'))[0].c, 0);
```

- [ ] **Step 2: Run, expect failure** — `npm run test:db` → crash `ENOENT … 0012_p1_content_review.sql`.

- [ ] **Step 3: Write the migration**

```sql
-- 0012 (S10, T7–T8, 20/10/2026): content review in the app and tutor priorities.
-- Content stays in git (D16). A verdict per item (latest row wins) and an approve/return action per unit
-- (latest row wins) live here, each with hashes of the content as reviewed, computed by the server:
-- grading_hash = options/order/right option/right value/steps (same key as the H2 lock), content_hash = whole item.
-- item_id '_lesson' = the theory + worked example + faded example block.
-- Reads: reviews → parent and active tutors; approvals → any signed-in user; priorities → parent, active tutor
-- of the student, the student. Writes: server actions with service_role only.

create table public.item_reviews (
  id bigint generated always as identity primary key,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  item_id text not null check (item_id ~ '^([a-z0-9-]+|_lesson)$'),
  verdict text not null check (verdict in ('ok', 'fix')),
  note text check (char_length(note) between 1 and 500),
  grading_hash text not null check (grading_hash ~ '^[0-9a-f]{16}$'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{16}$'),
  reviewer_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check (verdict = 'ok' or note is not null)
);
create index item_reviews_unit_item on public.item_reviews (unit_id, item_id, created_at desc);

create table public.unit_approvals (
  id bigint generated always as identity primary key,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  action text not null check (action in ('approve', 'return')),
  note text check (char_length(note) between 1 and 500),
  actor_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);
create index unit_approvals_unit on public.unit_approvals (unit_id, created_at desc);

create table public.tutor_priorities (
  student_id uuid not null references public.students (id) on delete cascade,
  unit_id text not null check (unit_id ~ '^[a-z0-9-]+$'),
  position smallint not null check (position between 1 and 20),
  set_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now(),
  primary key (student_id, unit_id),
  unique (student_id, position)
);

alter table public.item_reviews enable row level security;
alter table public.unit_approvals enable row level security;
alter table public.tutor_priorities enable row level security;

create policy item_reviews_select on public.item_reviews
  for select to authenticated
  using (public.current_app_role() in ('parent', 'tutor')
         and (public.current_app_role() = 'parent'
              or exists (select 1 from public.tutor_assignments a where a.tutor_id = (select auth.uid()) and a.ended_at is null)));

create policy unit_approvals_select on public.unit_approvals
  for select to authenticated
  using (public.current_app_role() is not null);

create policy tutor_priorities_select on public.tutor_priorities
  for select to authenticated
  using (public.is_parent_of(student_id) or public.is_active_tutor_of(student_id) or public.is_self_student(student_id));

revoke all on public.item_reviews, public.unit_approvals, public.tutor_priorities from anon, authenticated;
grant select on public.item_reviews, public.unit_approvals, public.tutor_priorities to authenticated;
grant select, insert, update, delete on public.item_reviews, public.unit_approvals, public.tutor_priorities to service_role;
```

- [ ] **Step 4: Run** — `npm run test:db` → `ALL PASSED` (the tutor_assignments RLS for a tutor only shows their own rows, which is all the `exists` needs; `current_app_role()` returns null for a locked profile).
- [ ] **Step 5: Commit** — `git add supabase && git commit -m "S10: migration 0012 item_reviews, unit_approvals, tutor_priorities + RLS tests"`

---

### Task 2: Pure review model

**Files:**
- Create: `src/lib/content/review.ts`, `src/lib/content/review.test.ts`

**Interfaces:**
- Consumes: `itemHash(it)` from `src/lib/content/lock.ts` (PR #25); `Unit`, `Item` types from `schema.ts`; `vnDate` from `src/lib/learning/rules.ts`.
- Produces:
  - `LESSON = "_lesson"`, `REVIEW_RULES = { noteMax: 500, minPractice: 4, minExit: 5 }`
  - types `Verdict`, `ReviewRow`, `ApprovalRow`, `ItemStatus = "unseen" | "ok" | "fix" | "changed"`, `Reviewable`, `ReviewEntry`, `UnitReview`, `ShelfStatus = "approved" | "reapprove" | "waiting" | "none"`
  - `reviewables(unit): Reviewable[]`, `statusOf(r, latest?): ItemStatus`, `unitReview(unit, rows, approvals): UnitReview`, `studentView(unit, review|null): Unit|null`, `shelfStatus(unit|null, review|null): ShelfStatus`, `nextToReview(review, afterId?): string|null`, `fixNotesText(list): string`

- [ ] **Step 1: Write the failing tests** (`review.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Unit } from "./schema.ts";
import { LESSON, fixNotesText, nextToReview, reviewables, shelfStatus, statusOf, studentView, unitReview, type ApprovalRow, type ReviewRow } from "./review.ts";

const draft = Unit.parse(JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../../content/xac-suat/b-haib.json"), "utf8")));
const T = (n: number) => `2026-10-20T0${n}:00:00Z`;
const row = (item_id: string, verdict: "ok" | "fix", r = reviewables(draft).find((x) => x.id === item_id)!, at = T(1)): ReviewRow => ({
  unit_id: draft.id, item_id, verdict, note: verdict === "fix" ? "Đổi số" : null, grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: "t", created_at: at,
});
const okAll = () => reviewables(draft).map((r) => row(r.id, "ok", r));
const approve: ApprovalRow = { unit_id: draft.id, action: "approve", note: null, actor_id: "t", created_at: T(2) };

test("reviewables: lesson block first, then every practice and exit item", () => {
  const rs = reviewables(draft);
  assert.equal(rs[0].id, LESSON);
  assert.equal(rs.length, 1 + draft.practice.length + draft.exit.length);
  assert.ok(rs.every((r) => /^[0-9a-f]{16}$/.test(r.gradingHash) && /^[0-9a-f]{16}$/.test(r.contentHash)));
});

test("status: unseen → ok / fix; a fixed item whose content changed is 'changed'; wording edits keep 'ok'", () => {
  const p1 = draft.practice[0];
  const r = reviewables(draft).find((x) => x.id === p1.id)!;
  assert.equal(statusOf(r, undefined), "unseen");
  assert.equal(statusOf(r, row(p1.id, "ok", r)), "ok");
  assert.equal(statusOf(r, row(p1.id, "fix", r)), "fix");
  const reworded = { ...draft, practice: [{ ...p1, solution: p1.solution + " (sửa)" }, ...draft.practice.slice(1)] } as Unit;
  const r2 = reviewables(reworded).find((x) => x.id === p1.id)!;
  assert.equal(statusOf(r2, row(p1.id, "ok", r)), "ok"); // wording only
  assert.equal(statusOf(r2, row(p1.id, "fix", r)), "changed"); // "Đã sửa, xem lại"
  if (p1.type === "mcq") {
    const regraded = { ...draft, practice: [{ ...p1, correct: (p1.correct + 1) % p1.options.length }, ...draft.practice.slice(1)] } as Unit;
    assert.equal(statusOf(reviewables(regraded).find((x) => x.id === p1.id)!, row(p1.id, "ok", r)), "changed");
  }
});

test("approve rule: lesson ok, nothing unseen/changed, ≥ 4 practice and ≥ 5 exit ok", () => {
  assert.equal(unitReview(draft, [], []).canApprove.ok, false);
  const noLesson = okAll().filter((x) => x.item_id !== LESSON);
  assert.match((unitReview(draft, noLesson, []).canApprove as { reason: string }).reason, /lý thuyết/);
  const oneFix = [...okAll(), row(draft.practice[0].id, "fix", undefined, T(3))]; // later row wins
  const rv = unitReview(draft, oneFix, []);
  assert.equal(rv.canApprove.ok, true);
  assert.equal(rv.counts.fix, 1);
  const tooFew = [...okAll(), ...draft.exit.slice(0, draft.exit.length - 4).map((it) => row(it.id, "fix", undefined, T(3)))];
  assert.match((unitReview(draft, tooFew, []).canApprove as { reason: string }).reason, /kiểm tra/);
});

test("student view: drafts hidden until approved; 'fix' items hidden; git-approved units unchanged", () => {
  assert.equal(studentView(draft, unitReview(draft, okAll(), [])), null);
  const fixId = draft.practice[0].id;
  const v = studentView(draft, unitReview(draft, [...okAll(), row(fixId, "fix", undefined, T(3))], [approve]))!;
  assert.equal(v.status, "approved");
  assert.equal(v.approvedOn, "2026-10-20");
  assert.equal(v.practice.length, draft.practice.length - 1);
  assert.ok(!v.practice.some((i) => i.id === fixId));
  const ret: ApprovalRow = { ...approve, action: "return", created_at: T(4) };
  assert.equal(studentView(draft, unitReview(draft, okAll(), [approve, ret])), null);
  const git = { ...draft, status: "approved", approvedOn: "2026-10-15" } as Unit;
  assert.equal(studentView(git, null), git);
});

test("shelf status, next item to review, notes for Claude", () => {
  assert.equal(shelfStatus(null, null), "none");
  assert.equal(shelfStatus(draft, unitReview(draft, [], [])), "waiting");
  assert.equal(shelfStatus(draft, unitReview(draft, okAll(), [approve])), "approved");
  const changedLesson = { ...draft, faded: { ...draft.faded } } as Unit; // same content: still approved
  assert.equal(shelfStatus(changedLesson, unitReview(changedLesson, okAll(), [approve])), "approved");
  const rv = unitReview(draft, [row(LESSON, "ok")], []);
  assert.equal(nextToReview(rv), draft.practice[0].id);
  assert.equal(nextToReview(rv, draft.practice[0].id), draft.practice[1].id);
  assert.equal(nextToReview(unitReview(draft, okAll(), [])), null);
  assert.equal(
    fixNotesText([{ unitId: "b-haib", unitTitle: "Hai biến cố", itemId: "b-haib-p1", note: "Đổi số", at: "2026-10-20T01:00:00Z" }]),
    "- b-haib (Hai biến cố) / b-haib-p1: Đổi số — 20/10",
  );
});
```

- [ ] **Step 2: Run, expect failure** — `node --test src/lib/content/review.test.ts` → `Cannot find module './review.ts'`.

- [ ] **Step 3: Implement `review.ts`**

```ts
// T7 (S10): per-item content review and unit approval. Pure — shared by the tutor and parent screens,
// the student's view of a unit and the tests. Hashes are always computed from the current content on the server.
import { createHash } from "node:crypto";
import { itemHash } from "./lock.ts";
import type { Item, Unit } from "./schema.ts";
import { vnDate } from "../learning/rules.ts";

export const LESSON = "_lesson";
export const REVIEW_RULES = { noteMax: 500, minPractice: 4, minExit: 5 } as const;

export type Verdict = "ok" | "fix";
export type ReviewRow = { unit_id: string; item_id: string; verdict: Verdict; note: string | null; grading_hash: string; content_hash: string; reviewer_id: string; created_at: string };
export type ApprovalRow = { unit_id: string; action: "approve" | "return"; note: string | null; actor_id: string; created_at: string };
export type ItemStatus = "unseen" | "ok" | "fix" | "changed";
export type Reviewable = { id: string; kind: "lesson" | "practice" | "exit"; gradingHash: string; contentHash: string; item: Item | null };
export type ReviewEntry = Reviewable & { status: ItemStatus; note: string | null; reviewedAt: string | null };
export type UnitReview = {
  items: ReviewEntry[];
  counts: Record<ItemStatus, number>;
  approved: { at: string; by: string } | null;
  canApprove: { ok: true } | { ok: false; reason: string };
  okIds: Set<string>;
};
export type ShelfStatus = "approved" | "reapprove" | "waiting" | "none";

const h16 = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);

/** What gets a verdict: the lesson block (theory, worked, faded), then practice, then exit items. */
export function reviewables(unit: Unit): Reviewable[] {
  const faded = unit.faded.steps.flatMap((s) => ("item" in s ? [s.item] : []));
  return [
    { id: LESSON, kind: "lesson", gradingHash: h16(faded.map(itemHash)), contentHash: h16({ theory: unit.theory, worked: unit.worked, faded: unit.faded, figure: unit.figure ?? null }), item: null },
    ...unit.practice.map((it) => ({ id: it.id, kind: "practice" as const, gradingHash: itemHash(it), contentHash: h16(it), item: it })),
    ...unit.exit.map((it) => ({ id: it.id, kind: "exit" as const, gradingHash: itemHash(it), contentHash: h16(it), item: it })),
  ];
}

/** ok stays ok through wording edits; a changed grading key, or any edit after "Cần sửa", asks for another look. */
export function statusOf(r: Reviewable, latest: ReviewRow | undefined): ItemStatus {
  if (!latest) return "unseen";
  if (latest.verdict === "ok") return latest.grading_hash === r.gradingHash ? "ok" : "changed";
  return latest.content_hash === r.contentHash ? "fix" : "changed";
}

export function unitReview(unit: Unit, rows: ReviewRow[], approvals: ApprovalRow[]): UnitReview {
  const latest = new Map<string, ReviewRow>();
  for (const r of rows) {
    if (r.unit_id !== unit.id) continue;
    const prev = latest.get(r.item_id);
    if (!prev || prev.created_at <= r.created_at) latest.set(r.item_id, r);
  }
  const items: ReviewEntry[] = reviewables(unit).map((r) => {
    const l = latest.get(r.id);
    return { ...r, status: statusOf(r, l), note: l?.note ?? null, reviewedAt: l?.created_at ?? null };
  });
  const counts: Record<ItemStatus, number> = { unseen: 0, ok: 0, fix: 0, changed: 0 };
  for (const i of items) counts[i.status]++;
  const okIds = new Set(items.filter((i) => i.status === "ok").map((i) => i.id));
  const okOf = (k: Reviewable["kind"]) => items.filter((i) => i.kind === k && i.status === "ok").length;
  const last = approvals.filter((a) => a.unit_id === unit.id).sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1);
  const left = counts.unseen + counts.changed;
  const canApprove: UnitReview["canApprove"] = !okIds.has(LESSON)
    ? { ok: false, reason: "Phần lý thuyết & bài mẫu chưa đạt." }
    : left
      ? { ok: false, reason: `Còn ${left} câu chưa xem.` }
      : okOf("practice") < REVIEW_RULES.minPractice
        ? { ok: false, reason: `Cần ít nhất ${REVIEW_RULES.minPractice} câu luyện tập đạt (đang có ${okOf("practice")}).` }
        : okOf("exit") < REVIEW_RULES.minExit
          ? { ok: false, reason: `Cần ít nhất ${REVIEW_RULES.minExit} câu kiểm tra đạt (đang có ${okOf("exit")}).` }
          : { ok: true };
  return { items, counts, approved: last?.action === "approve" ? { at: last.created_at, by: last.actor_id } : null, canApprove, okIds };
}

/**
 * The unit as a student may see it: git-approved units whole (the H2 lock protects them); DB-approved units
 * with only their "ok" items, and only while the lesson block is ok and enough items remain.
 */
export function studentView(unit: Unit, review: UnitReview | null): Unit | null {
  if (unit.status === "approved") return unit;
  if (!review?.approved || !review.okIds.has(LESSON)) return null;
  const practice = unit.practice.filter((i) => review.okIds.has(i.id));
  const exit = unit.exit.filter((i) => review.okIds.has(i.id));
  if (practice.length < REVIEW_RULES.minPractice || exit.length < REVIEW_RULES.minExit) return null;
  return { ...unit, status: "approved", approvedOn: vnDate(review.approved.at), practice, exit };
}

export function shelfStatus(unit: Unit | null, review: UnitReview | null): ShelfStatus {
  if (!unit) return "none";
  if (unit.status === "approved") return "approved";
  if (review?.approved) return studentView(unit, review) ? "approved" : "reapprove";
  return "waiting";
}

/** The next item that still needs a look (unseen or changed), after `afterId` and wrapping around. */
export function nextToReview(review: UnitReview, afterId?: string): string | null {
  const todo = (e: ReviewEntry) => e.status === "unseen" || e.status === "changed";
  const i = afterId ? review.items.findIndex((e) => e.id === afterId) : -1;
  const order = [...review.items.slice(i + 1), ...review.items.slice(0, i + 1)];
  return order.find(todo)?.id ?? null;
}

/** "Cần sửa" notes as one block the parent pastes to a Claude content session. */
export function fixNotesText(list: { unitId: string; unitTitle: string; itemId: string; note: string; at: string }[]): string {
  return list
    .map((n) => `- ${n.unitId} (${n.unitTitle}) / ${n.itemId}: ${n.note} — ${vnDate(n.at).slice(5).split("-").reverse().join("/")}`)
    .join("\n");
}
```

- [ ] **Step 4: Run** — `node --test src/lib/content/review.test.ts` → 5 pass. If `b-haib` has fewer than 9 exit items the `tooFew` case still holds (it marks all but 4 exit items "fix"). Then `npm run test:content` → all pass.
- [ ] **Step 5: Commit** — `git add src/lib/content/review.ts src/lib/content/review.test.ts && git commit -m "S10: pure review model — item status, approve rule, student view"`

---

### Task 3: Priorities — list editing and "Bài mới" order

**Files:**
- Create: `src/lib/learning/priorities.ts`, `src/lib/learning/priorities.test.ts`
- Modify: `src/lib/learning/sequence.ts` (`suggestNew`), `src/lib/learning/sequence.test.ts`

**Interfaces:**
- Produces: `PRIORITY_MAX = 20`; `editPriorityList(list: string[], op: "toggle" | "up" | "down", unitId: string): string[]`; `suggestNew(units: SeqUnit[], priority?: string[]): SeqUnit[]`.

- [ ] **Step 1: Failing tests** — `priorities.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRIORITY_MAX, editPriorityList } from "./priorities.ts";

test("toggle adds at the end or removes; up/down swap neighbours; the list is capped", () => {
  assert.deepEqual(editPriorityList([], "toggle", "a"), ["a"]);
  assert.deepEqual(editPriorityList(["a", "b"], "toggle", "a"), ["b"]);
  assert.deepEqual(editPriorityList(["a", "b", "c"], "up", "c"), ["a", "c", "b"]);
  assert.deepEqual(editPriorityList(["a", "b", "c"], "down", "a"), ["b", "a", "c"]);
  assert.deepEqual(editPriorityList(["a", "b"], "up", "a"), ["a", "b"]);
  assert.deepEqual(editPriorityList(["a"], "down", "x"), ["a"]);
  const full = Array.from({ length: PRIORITY_MAX }, (_, i) => `k${i}`);
  assert.deepEqual(editPriorityList(full, "toggle", "new"), full);
});
```

and append to `sequence.test.ts`:

```ts
test("T8: priority KUs come first in 'Bài mới' (in the tutor's order), still at most 2 offered and none with 2 in progress", () => {
  const us = [U("a1", { track: "A", seq: 10 }), U("b1", { track: "B", seq: 10 }), U("g2", { track: "B", seq: 50 }), U("g1", { track: "B", seq: 40 })];
  assert.deepEqual(suggestNew(us, ["g1", "g2"]).map((u) => u.id), ["g1", "g2"]);
  assert.deepEqual(suggestNew(us, ["g1"]).map((u) => u.id), ["g1", "a1"]);
  assert.deepEqual(suggestNew(us, ["missing", "a1"]).map((u) => u.id), ["a1", "b1"]);
  assert.deepEqual(suggestNew([...us, U("x", { started: true, level: 1 }), U("y", { started: true, level: 1 })], ["g1"]), []);
  assert.deepEqual(suggestNew(us).map((u) => u.id), ["a1", "b1"]); // unchanged without priorities
});
```

- [ ] **Step 2: Run** — `node --test src/lib/learning/priorities.test.ts src/lib/learning/sequence.test.ts` → FAIL (module missing; `g1, g2` expected but got `a1, b1`).

- [ ] **Step 3: Implement** — `priorities.ts`:

```ts
// T8: the tutor's ordered list of focus KUs for one student. Pure.
export const PRIORITY_MAX = 20;

export function editPriorityList(list: string[], op: "toggle" | "up" | "down", unitId: string): string[] {
  const i = list.indexOf(unitId);
  if (op === "toggle") return i >= 0 ? list.filter((x) => x !== unitId) : list.length >= PRIORITY_MAX ? list : [...list, unitId];
  const j = op === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}
```

In `sequence.ts` replace the body of `suggestNew`:

```ts
/** LT3 + T8: the tutor's priority KUs first (her order), then 1 from track A + 1 from B/C; at most 2 offered. */
export function suggestNew(units: SeqUnit[], priority: string[] = []): SeqUnit[] {
  if (units.filter(isInProgress).length >= RULES.maxInProgress) return [];
  const byId = new Map(units.map((u) => [u.id, u]));
  // LT17: a P2 KU waits until every core (P0/P1) KU of its track is at M3 — or the parent unlocked it.
  const coreDone = (track: SeqUnit["track"]) => units.every((u) => u.track !== track || u.priority === "P2" || u.level >= 3);
  const fresh = units.filter((u) => !u.started && unitStatus(u, byId) === "open" && (u.priority !== "P2" || u.manualUnlock || coreDone(u.track)));
  const first = priority.map((id) => fresh.find((u) => u.id === id)).filter((u): u is SeqUnit => !!u);
  const a = fresh.filter((u) => u.track === "A").sort(byBatchSeq)[0];
  const bc = fresh.filter((u) => u.track !== "A").sort(byBatchTrackSeq)[0];
  const out: SeqUnit[] = [];
  for (const u of [...first, a, bc]) if (u && !out.includes(u) && out.length < 2) out.push(u);
  return out;
}
```

- [ ] **Step 4: Run** — same command → PASS; `npm run test:content` → all pass.
- [ ] **Step 5: Commit** — `git commit -am "S10: priority list editing; priority KUs first in Bài mới (T8)" && git add src/lib/learning/priorities* && git commit --amend --no-edit`

---

### Task 4: Server loader + switch every approval gate; priorities in the student state; tutor preview

**Files:**
- Create: `src/lib/content/approvals.ts`
- Modify: `src/app/learn/actions.ts`, `src/app/student/learn/[unitId]/page.tsx`, `src/app/student/recap/[unitId]/page.tsx`, `src/lib/learning/state.ts`, `src/app/tutor/actions.ts`, `src/components/lesson/lesson-player.tsx`

**Interfaces:**
- Consumes: Task 2 (`unitReview`, `studentView`, `shelfStatus`, types), Task 3 (`suggestNew(seq, priority)`), `listModules`, `getUnit`, `curriculum` from `@/lib/content`.
- Produces:
  - `loadReviewData(): Promise<{ rows: ReviewRow[]; approvals: ApprovalRow[] }>` (React-cached per request)
  - `reviewOf(unitId): Promise<UnitReview | null>`
  - `studentModules(opts?: { includeDrafts?: boolean }): Promise<ContentModule[]>`
  - `studentUnit(unitId): Promise<{ unit: Unit; module: Module } | null>`
  - `shelf(): Promise<ShelfRow[]>` with `ShelfRow = { id; title; module; moduleTitle; track; status: ShelfStatus; approvedOn: string | null; reviewed: number; total: number; fix: number }`
  - `StudentState.priorities: string[]`
  - `LessonPlayer` prop `previewBase?: string` (default `"/parent/content"`)

- [ ] **Step 1: Write `approvals.ts`**

```ts
import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculum, getUnit, listModules, type ContentModule } from "@/lib/content";
import type { Module, Unit } from "@/lib/content/schema";
import { shelfStatus, studentView, unitReview, type ApprovalRow, type ReviewRow, type ShelfStatus, type UnitReview } from "./review";
import { vnDate } from "@/lib/learning/rules";

const PAGE = 1000; // Supabase "Max rows"

async function readAll<T>(table: string, cols: string): Promise<T[] | null> {
  const admin = createAdminClient();
  const out: T[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const r = await admin.from(table).select(cols).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (r.error) {
      console.error("approvals", table, r.error.message);
      return null;
    }
    out.push(...((r.data ?? []) as T[]));
    if ((r.data ?? []).length < PAGE) break;
  }
  return out;
}

/**
 * T7: every verdict and approval (content metadata, no student data), once per request. Read with the admin
 * client so a student's own pages can compute what they may see. On a read error only git-approved units show.
 */
export const loadReviewData = cache(async (): Promise<{ rows: ReviewRow[]; approvals: ApprovalRow[] }> => {
  const [rows, approvals] = await Promise.all([
    readAll<ReviewRow>("item_reviews", "unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id, created_at"),
    readAll<ApprovalRow>("unit_approvals", "unit_id, action, note, actor_id, created_at"),
  ]);
  return { rows: rows ?? [], approvals: approvals ?? [] };
});

export async function reviewOf(unitId: string): Promise<UnitReview | null> {
  const f = getUnit(unitId);
  if (!f) return null;
  const d = await loadReviewData();
  return unitReview(f.unit, d.rows, d.approvals);
}

/** Modules as a student sees them; `includeDrafts` (tutor views) keeps the rest as plain drafts. */
export async function studentModules(opts: { includeDrafts?: boolean } = {}): Promise<ContentModule[]> {
  const d = await loadReviewData();
  return listModules().map((m) => ({
    ...m,
    unitList: m.unitList.flatMap((u) => {
      const v = studentView(u, u.status === "approved" ? null : unitReview(u, d.rows, d.approvals));
      return v ? [v] : opts.includeDrafts ? [u] : [];
    }),
  }));
}

export async function studentUnit(unitId: string): Promise<{ unit: Unit; module: Module } | null> {
  const f = getUnit(unitId);
  if (!f) return null;
  const d = await loadReviewData();
  const v = studentView(f.unit, f.unit.status === "approved" ? null : unitReview(f.unit, d.rows, d.approvals));
  return v ? { unit: v, module: f.module } : null;
}

export type ShelfRow = { id: string; title: string; module: string; moduleTitle: string; track: string; status: ShelfStatus; approvedOn: string | null; reviewed: number; total: number; fix: number };

/** Kho bài: every roadmap KU with its status and review progress. */
export async function shelf(): Promise<ShelfRow[]> {
  const d = await loadReviewData();
  const { units, modules } = curriculum();
  const title = new Map(modules.map((m) => [m.id, m.title]));
  return units.map((e) => {
    const f = getUnit(e.id);
    const rv = f && f.unit.status !== "approved" ? unitReview(f.unit, d.rows, d.approvals) : null;
    return {
      id: e.id,
      title: e.title,
      module: e.module,
      moduleTitle: title.get(e.module) ?? e.module,
      track: e.track,
      status: shelfStatus(f?.unit ?? null, rv),
      approvedOn: f?.unit.status === "approved" ? (f.unit.approvedOn ?? null) : rv?.approved ? vnDate(rv.approved.at) : null,
      reviewed: rv ? rv.counts.ok + rv.counts.fix : 0,
      total: rv ? rv.items.length : 0,
      fix: rv?.counts.fix ?? 0,
    };
  });
}
```

- [ ] **Step 2: Switch the gates** (each is a behaviour-preserving swap for git-approved units):

`src/app/learn/actions.ts`:
```ts
import { studentUnit } from "@/lib/content/approvals";
// learner(): the tutor previews like the parent (T7 "Làm thử như con"); nothing is recorded.
  if (user.role === "parent" || user.role === "tutor") return { kind: "preview" };
// loadUnit becomes async:
/** Students only ever reach what `studentView` allows (T7); parent/tutor previews see drafts. */
async function loadUnit(who: Learner, unitId: string) {
  return who.kind === "student" ? studentUnit(unitId) : getUnit(unitId);
}
/** LT16: "Ôn lại: …" — only to a KU the viewer can open. */
async function reviewLink(who: Learner, unitId: string | undefined) {
  if (!unitId) return undefined;
  const f = who.kind === "student" ? await studentUnit(unitId) : getUnit(unitId);
  return f ? { unitId, title: f.unit.title } : undefined;
}
```
then add `await` at every `loadUnit(` call (`markWorkedViewed`, `checkAnswer`, `completeFaded`, `submitExit`, `checkReview`) and every `reviewLink(` call (`checkAnswer` ×2, `checkReview`). `grep -n "loadUnit(\|reviewLink(" src/app/learn/actions.ts` must show `await` before each call site.

`src/app/student/learn/[unitId]/page.tsx` and `src/app/student/recap/[unitId]/page.tsx`: replace
```ts
const found = getUnit(unitId);
if (!found || found.unit.status !== "approved") notFound();
```
with
```ts
const found = await studentUnit(unitId); // T7: git-approved, or approved in the app (only its ok items)
if (!found) notFound();
```
(import `studentUnit` from `@/lib/content/approvals`, drop the unused `getUnit` import).

`src/lib/learning/state.ts`:
```ts
import { studentModules } from "@/lib/content/approvals";
// in the Promise.all of loadStudentState add:
    supabase.from("tutor_priorities").select("unit_id, position").eq("student_id", studentId).order("position", { ascending: true }),
// destructure it as `prio`, add `prio` to the error-log loop, then:
  const priorities = (prio.data ?? []).map((p) => p.unit_id as string);
  // T8: a priority KU opens at once, like a parent's unlock or a tutor's homework (S9).
  const unlocked = new Set([...(unlocks.data ?? []), ...(assigned.data ?? [])].map((u) => u.unit_id as string | null).filter((x): x is string => !!x).concat(priorities));
// units: replace `listModules().flatMap((m) => m.unitList.filter((u) => opts.includeDrafts || u.status === "approved").map(...`
  const modules = await studentModules({ includeDrafts: opts.includeDrafts });
  const units: UnitState[] = modules.flatMap((m) => m.unitList.map((unit) => { /* body unchanged */ }));
// suggestions:
  const suggestions = suggestNew(seq, priorities).map((x) => byUnitId.get(x.id)!).filter(Boolean);
// StudentState: add `priorities: string[];` (doc: "T8: the tutor's focus KUs, in order") and return `priorities`.
```
Remove `listModules` from the `@/lib/content` import if now unused.

`src/app/tutor/actions.ts` (S9 assignable):
```ts
import { studentModules } from "@/lib/content/approvals";
    assignable: new Set((await studentModules()).flatMap((m) => m.unitList.map((u) => u.id))),
```

`src/components/lesson/lesson-player.tsx`: add prop `previewBase?: string` to the props type, default `"/parent/content"`, and use it in `recapHref`:
```ts
const recapHref = (id: string) => (mode === "preview" ? `${previewBase}/${id}` : `/student/recap/${id}`);
```

- [ ] **Step 3: Regression run** — `npm run lint && npm test && npm run build` → pass. Commit the registry state, then `./e2e/run.sh` → same PASS count as before this task (the student flow only uses git-approved `htl-1/2`; tutor flow unchanged).
- [ ] **Step 4: Commit** — `git add -A && git commit -m "S10: student view from DB approvals; priorities open KUs and lead Bài mới; tutor preview"`

---

### Task 5: Access helpers + review/priority server actions

**Files:**
- Create: `src/lib/access.ts`, `src/app/review/actions.ts`
- Modify: `src/app/tutor/actions.ts` (import `activeAssignment` from `@/lib/access`, delete the local copy)

**Interfaces:**
- Consumes: `getCurrentUser` (`@/lib/dal`), `reviewables`, `unitReview`, `nextToReview`, `REVIEW_RULES`, `LESSON` (Task 2), `loadReviewData` (Task 4), `editPriorityList`, `PRIORITY_MAX` (Task 3), `curriculumUnit`, `getUnit`.
- Produces: `activeAssignment(admin, tutorId, studentId): Promise<boolean>`, `reviewerOf(): Promise<{ id: string; role: "parent" | "tutor" } | null>`; actions `reviewItem(prev, fd)`, `approveUnit(prev, fd)`, `returnUnit(prev, fd)`, `editPriorities(prev, fd)` — all `(ActionState, FormData) => Promise<ActionState>`. Form fields: `unitId`, `itemId`, `verdict` (`ok`|`fix`), `note`, `back`; `studentId`, `op` (`toggle`|`up`|`down`).

- [ ] **Step 1: `src/lib/access.ts`**

```ts
import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/dal";

type Admin = ReturnType<typeof createAdminClient>;

/** D3: an active tutor profile with an active assignment to this student. */
export async function activeAssignment(admin: Admin, tutorId: string, studentId: string): Promise<boolean> {
  const [{ data: profile }, { data: assignment }] = await Promise.all([
    admin.from("profiles").select("is_active").eq("id", tutorId).maybeSingle(),
    admin.from("tutor_assignments").select("id").eq("tutor_id", tutorId).eq("student_id", studentId).is("ended_at", null).maybeSingle(),
  ]);
  return !!profile?.is_active && !!assignment;
}

/** T7: who may review content — the parent, or an active tutor who still teaches someone. */
export async function reviewerOf(): Promise<{ id: string; role: "parent" | "tutor" } | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "parent" && user.role !== "tutor")) return null;
  if (user.role === "parent") return { id: user.id, role: "parent" };
  const { data } = await createAdminClient().from("tutor_assignments").select("id").eq("tutor_id", user.id).is("ended_at", null).limit(1);
  return data?.length ? { id: user.id, role: "tutor" } : null;
}
```

- [ ] **Step 2: `src/app/review/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { curriculumUnit, getUnit } from "@/lib/content";
import { LESSON, REVIEW_RULES, nextToReview, reviewables, unitReview } from "@/lib/content/review";
import { loadReviewData } from "@/lib/content/approvals";
import { editPriorityList } from "@/lib/learning/priorities";
import { activeAssignment, reviewerOf } from "@/lib/access";
import { getCurrentUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/action-form";

const UnitId = z.string().regex(/^[a-z0-9-]+$/).max(60);
const ItemId = z.union([UnitId, z.literal(LESSON)]);
// Where to go back to: the tutor's or the parent's review screen of this unit.
const Back = z.string().regex(/^\/(tutor\/[0-9a-f-]{36}\/bai\/[a-z0-9-]+|parent\/content\/[a-z0-9-]+\/duyet)$/);
const Note = z.string().trim().max(REVIEW_RULES.noteMax);
const NO_RIGHT = { error: "Bạn không có quyền duyệt bài (cần tài khoản phụ huynh hoặc gia sư đang dạy)." };
const FAILED = { error: "Chưa lưu được, thử lại sau." };

function refresh(unitId: string) {
  revalidatePath("/parent/content");
  revalidatePath(`/parent/content/${unitId}/duyet`);
  revalidatePath("/tutor", "layout");
}

/** "Đạt" / "Cần sửa" on one item (or the lesson block); hashes come from the content now on the server. */
export async function reviewItem(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const v = z.object({ unitId: UnitId, itemId: ItemId, verdict: z.enum(["ok", "fix"]), note: Note, back: Back }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: "Thiếu thông tin, tải lại trang." };
  const f = getUnit(v.data.unitId);
  const r = f && reviewables(f.unit).find((x) => x.id === v.data.itemId);
  if (!f || !r) return { error: "Không tìm thấy câu này." };
  if (v.data.verdict === "fix" && !v.data.note) return { error: "Ghi ngắn cần sửa gì để Claude sửa được." };
  const { error } = await createAdminClient().from("item_reviews").insert({
    unit_id: f.unit.id, item_id: r.id, verdict: v.data.verdict, note: v.data.note || null,
    grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: who.id,
  });
  if (error) {
    console.error("reviewItem", error.message);
    return FAILED;
  }
  refresh(f.unit.id);
  const d = await loadReviewData(); // cached before the insert in this request: add the new verdict by hand
  const rv = unitReview(f.unit, [...d.rows, { unit_id: f.unit.id, item_id: r.id, verdict: v.data.verdict, note: v.data.note || null, grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: who.id, created_at: new Date().toISOString() }], d.approvals);
  redirect(`${v.data.back}?item=${encodeURIComponent(nextToReview(rv, r.id) ?? r.id)}`);
}

export async function approveUnit(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const id = UnitId.safeParse(fd.get("unitId"));
  const f = id.success ? getUnit(id.data) : null;
  if (!f || f.unit.status === "approved") return { error: "Bài này không duyệt trên app được." };
  const d = await loadReviewData();
  const rv = unitReview(f.unit, d.rows, d.approvals);
  if (!rv.canApprove.ok) return { error: rv.canApprove.reason };
  const { error } = await createAdminClient().from("unit_approvals").insert({ unit_id: f.unit.id, action: "approve", actor_id: who.id });
  if (error) {
    console.error("approveUnit", error.message);
    return FAILED;
  }
  refresh(f.unit.id);
  return { ok: "Đã duyệt — con thấy bài này ngay." };
}

export async function returnUnit(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const v = z.object({ unitId: UnitId, note: Note.min(1, "Ghi lý do trả lại.") }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Thiếu thông tin." };
  const { error } = await createAdminClient().from("unit_approvals").insert({ unit_id: v.data.unitId, action: "return", note: v.data.note, actor_id: who.id });
  if (error) {
    console.error("returnUnit", error.message);
    return FAILED;
  }
  refresh(v.data.unitId);
  return { ok: "Đã trả lại — con không thấy bài này nữa." };
}

/** T8: ⭐ / ↑ / ↓ on the student's priority list (assigned tutor or parent). */
export async function editPriorities(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const v = z.object({ studentId: z.uuid(), unitId: UnitId, op: z.enum(["toggle", "up", "down"]) }).safeParse(Object.fromEntries(fd));
  if (!user || !v.success || !curriculumUnit(v.data.unitId)) return { error: "Thiếu thông tin, tải lại trang." };
  const admin = createAdminClient();
  if (user.role === "tutor" ? !(await activeAssignment(admin, user.id, v.data.studentId)) : user.role !== "parent")
    return { error: "Bạn không còn được phân công dạy học sinh này." };
  if (user.role === "parent") {
    const { data: link } = await admin.from("parent_students").select("student_id").eq("parent_id", user.id).eq("student_id", v.data.studentId).maybeSingle();
    if (!link) return { error: "Không tìm thấy học sinh." };
  }
  const { data: rows, error: rErr } = await admin.from("tutor_priorities").select("unit_id, position").eq("student_id", v.data.studentId).order("position", { ascending: true });
  if (rErr) return FAILED;
  const next = editPriorityList((rows ?? []).map((r) => r.unit_id as string), v.data.op, v.data.unitId);
  // Replace the whole list (≤ 20 rows): positions stay 1..n without gaps.
  const { error: dErr } = await admin.from("tutor_priorities").delete().eq("student_id", v.data.studentId);
  const { error: iErr } = next.length
    ? await admin.from("tutor_priorities").insert(next.map((unit_id, i) => ({ student_id: v.data.studentId, unit_id, position: i + 1, set_by: user.id })))
    : { error: null };
  if (dErr || iErr) {
    console.error("editPriorities", dErr?.message ?? iErr?.message);
    return FAILED;
  }
  revalidatePath(`/tutor/${v.data.studentId}`, "layout");
  revalidatePath("/student");
  return { ok: "Đã lưu thứ tự ưu tiên." };
}
```

(`parent_students(parent_id, student_id)` — 0001.)

- [ ] **Step 3: Move `activeAssignment`** — in `src/app/tutor/actions.ts` delete the local function and add `import { activeAssignment } from "@/lib/access";`.
- [ ] **Step 4: Verify** — `npm run lint && npm run build` → pass (actions are exercised by the e2e in Task 9).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S10: review, approve, return and priority actions; shared access helpers"`

---

### Task 6: Wide tutor layout, tabs, Kho bài

**Files:**
- Modify: `src/app/tutor/layout.tsx`, `src/app/tutor/page.tsx`, `src/app/tutor/[studentId]/page.tsx`, `src/app/tutor/[studentId]/work/page.tsx`
- Create: `src/components/tutor/tutor-tabs.tsx`, `src/components/tutor/priority-button.tsx`, `src/app/tutor/[studentId]/bai/page.tsx`

**Interfaces:**
- Consumes: `shelf()` (Task 4), `editPriorities` (Task 5).
- Produces: `TutorTabs({ studentId, studentName, active })` with `active: "buoi" | "bai" | "work"` (S11 adds `"today" | "giao"`); `PriorityButton({ studentId, unitId, op, label, title })`.

- [ ] **Step 1: Layout** — `layout.tsx`: `<main className="mx-auto max-w-6xl px-4 py-6">`. Wrap the existing content of `/tutor/page.tsx`, `/tutor/[studentId]/page.tsx` and `/work/page.tsx` in `<div className="mx-auto max-w-md">…</div>` so they look as before.

- [ ] **Step 2: Tabs** — `tutor-tabs.tsx`:

```tsx
import Link from "next/link";

export type TutorTab = "buoi" | "bai" | "work";
const TABS: { id: TutorTab; label: string; path: string }[] = [
  { id: "buoi", label: "Buổi dạy", path: "" },
  { id: "bai", label: "Kho bài", path: "/bai" },
  { id: "work", label: "Bài làm", path: "/work" },
];

/** Per-student navigation of the tutor workspace (mockup "Bàn làm việc gia sư"). */
export function TutorTabs({ studentId, studentName, active }: { studentId: string; studentName: string; active: TutorTab }) {
  return (
    <div className="mb-5 border-b border-border">
      <p className="font-display text-sm text-muted">
        <Link href="/tutor" className="text-accent hover:underline">Học sinh</Link> · {studentName}
      </p>
      <nav className="mt-2 flex flex-wrap gap-1" aria-label="Bàn làm việc">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/tutor/${studentId}${t.path}`}
            aria-current={t.id === active ? "page" : undefined}
            className={`border-b-[3px] px-3.5 py-2.5 font-display text-sm font-semibold ${t.id === active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

Render `<TutorTabs studentId={student.id} studentName={student.full_name} active="buoi" />` at the top of `/tutor/[studentId]/page.tsx` (replacing the "← Học sinh" link) and `active="work"` on `/work/page.tsx`.

- [ ] **Step 3: Priority button** — `priority-button.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { editPriorities } from "@/app/review/actions";

/** ⭐ / ↑ / ↓ — one small form per button (T8). */
export function PriorityButton({ studentId, unitId, op, label, title }: { studentId: string; unitId: string; op: "toggle" | "up" | "down"; label: string; title: string }) {
  const [state, action, pending] = useActionState(editPriorities, {});
  return (
    <form action={action} className="inline">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" disabled={pending} title={state.error ?? title} aria-label={title} className="rounded-md px-2 py-1 font-mono text-sm hover:bg-accent-soft disabled:opacity-50">
        {label}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Kho bài page** — `src/app/tutor/[studentId]/bai/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { shelf, type ShelfRow } from "@/lib/content/approvals";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { PriorityButton } from "@/components/tutor/priority-button";

export const metadata: Metadata = { title: "Kho bài — App Toán" };

const FILTERS = [
  { id: "cho", label: "Chờ duyệt", test: (r: ShelfRow) => r.status === "waiting" || r.status === "reapprove" },
  { id: "da", label: "Đã duyệt", test: (r: ShelfRow) => r.status === "approved" },
  { id: "chua", label: "Chưa soạn", test: (r: ShelfRow) => r.status === "none" },
  { id: "tat", label: "Tất cả", test: () => true },
] as const;
const BADGE: Record<ShelfRow["status"], [string, string]> = {
  approved: ["Đã duyệt", "bg-good-soft text-good"],
  waiting: ["Chờ duyệt", "bg-warn-soft text-warn"],
  reapprove: ["Cần duyệt lại", "bg-warn-soft text-warn"],
  none: ["Chưa soạn", "border border-border text-muted"],
};

// T7 + T8 (mockup artboard 2): every KU's status, review progress, and this student's priority list.
export default async function ShelfPage(props: PageProps<"/tutor/[studentId]/bai">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

  const [rows, prio] = await Promise.all([
    shelf(),
    supabase.from("tutor_priorities").select("unit_id, position").eq("student_id", studentId).order("position", { ascending: true }),
  ]);
  const priority = (prio.data ?? []).map((p) => p.unit_id as string);
  const filter = FILTERS.find((f) => f.id === sp.loc) ?? FILTERS[0];
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const shown = rows.filter((r) => filter.test(r) && (!q || r.title.toLowerCase().includes(q)));
  const modules = [...new Set(shown.map((r) => r.module))];
  const title = new Map(rows.map((r) => [r.id, r.title]));

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="min-w-0 flex-[999_1_560px]" aria-label="Kho bài">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Link key={f.id} href={`?loc=${f.id}`} aria-current={f.id === filter.id ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-display text-sm font-semibold ${f.id === filter.id ? "border-accent bg-accent text-on-accent" : "border-border bg-surface"}`}>
                {f.label} <span className="font-mono text-xs">{rows.filter(f.test).length}</span>
              </Link>
            ))}
            <form className="ml-auto">
              <input type="hidden" name="loc" value={filter.id} />
              <input name="q" defaultValue={q} placeholder="Tìm bài…" aria-label="Tìm bài" className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm" />
            </form>
          </div>
          {modules.map((m) => (
            <div key={m} className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <h2 className="bg-bg px-4 py-2 font-display text-sm font-semibold text-muted">{shown.find((r) => r.module === m)!.moduleTitle}</h2>
              <ul className="divide-y divide-border">
                {shown.filter((r) => r.module === m).map((r) => {
                  const [label, cls] = BADGE[r.status];
                  const starred = priority.includes(r.id);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5" data-testid={`shelf-${r.id}`}>
                      <PriorityButton studentId={student.id} unitId={r.id} op="toggle" label={starred ? "★" : "☆"} title={starred ? "Bỏ ưu tiên" : "Ưu tiên luyện trước"} />
                      <span className="min-w-0 flex-1 font-display">{r.title}</span>
                      {r.total > 0 && <span className="font-mono text-xs text-muted">đã xem {r.reviewed}/{r.total}{r.fix ? ` · ${r.fix} cần sửa` : ""}</span>}
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${cls}`}>{label}</span>
                      {r.status !== "none" && (
                        <Link href={`/tutor/${student.id}/bai/${r.id}`} className="text-sm font-semibold text-accent hover:underline">
                          {r.status === "approved" ? "Xem" : "Duyệt"} →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {!shown.length && <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có bài nào.</p>}
        </section>

        <aside className="min-w-0 flex-[1_1_280px] rounded-xl border border-border bg-surface p-4" aria-label="Ưu tiên luyện trước">
          <h2 className="font-display font-semibold">Ưu tiên luyện trước</h2>
          <p className="mt-1 text-sm text-muted">Bài ⭐ mở ngay cho {student.full_name} và hiện đầu tiên ở &ldquo;Bài mới&rdquo;.</p>
          <ol className="mt-3 flex flex-col gap-1" data-testid="priority-list">
            {priority.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg">
                <span className="w-5 font-mono text-xs text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 text-sm">{title.get(id) ?? id}</span>
                <PriorityButton studentId={student.id} unitId={id} op="up" label="↑" title="Lên" />
                <PriorityButton studentId={student.id} unitId={id} op="down" label="↓" title="Xuống" />
              </li>
            ))}
            {!priority.length && <li className="text-sm text-muted">Chưa có — bấm ☆ cạnh bài.</li>}
          </ol>
          <p className="mt-4 text-xs text-muted">Phụ huynh cũng duyệt được bài. Gia sư là người duyệt chính.</p>
        </aside>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verify** — `npm run lint && npm run build` → pass. `./e2e/run.sh` → tutor flow still passes (it opens `/tutor/[id]` and finds the form inside `max-w-md`).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "S10: wide tutor layout, per-student tabs, Kho bài with filters and priorities"`

---

### Task 7: Review workbench (shared) + tutor Duyệt + Làm thử

**Files:**
- Create: `src/components/review/item-panel.tsx`, `src/components/review/verdict-form.tsx`, `src/components/review/workbench.tsx`, `src/app/tutor/[studentId]/bai/[unitId]/page.tsx`, `src/app/tutor/[studentId]/bai/[unitId]/thu/page.tsx`

**Interfaces:**
- Consumes: `reviewOf`, `getUnit`, `texToHtml`, `errorLabel`, `reviewItem`, `approveUnit`, `returnUnit`, `nextToReview`, `LESSON`.
- Produces: `<ReviewWorkbench unitId base selected tryHref backHref />` (server component), `<VerdictForm unitId itemId back note />` (client).

- [ ] **Step 1: Item panel** — `item-panel.tsx` (server component; tutor/parent only — shows answers):

```tsx
import { texToHtml } from "@/lib/content/tex";
import { errorLabel } from "@/lib/content/errors";
import type { Item, Unit } from "@/lib/content/schema";

const Html = ({ html, className = "" }: { html: string; className?: string }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
const Label = ({ children }: { children: React.ReactNode }) => <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>;
const ABC = "ABCDEF";

function Answer({ item }: { item: Item }) {
  if (item.type === "mcq")
    return (
      <ol className="flex flex-col gap-1.5">
        {item.options.map((o, i) => (
          <li key={i} className={`flex gap-2 rounded-lg border px-3 py-2 ${i === item.correct ? "border-good bg-good-soft" : "border-border"}`}>
            <b className="font-mono">{ABC[i]}</b>
            <Html html={texToHtml(o)} />
            {i === item.correct && <span className="ml-auto font-mono text-xs text-good">đúng</span>}
          </li>
        ))}
      </ol>
    );
  if (item.type === "numeric") return <p className="font-mono text-xl font-semibold text-good">{item.answer}{item.unit ? ` ${item.unit}` : ""}</p>;
  return (
    <ol className="flex flex-col gap-3">
      {item.steps.map((s, i) => (
        <li key={i} className="rounded-lg border border-border p-3">
          <Html html={texToHtml(s.prompt)} className="text-sm" />
          <div className="mt-2"><Answer item={s.item} /></div>
        </li>
      ))}
    </ol>
  );
}

function Mistakes({ item }: { item: Item }) {
  const list =
    item.type === "mcq"
      ? Object.entries(item.mistakes ?? {}).map(([k, m]) => ({ key: ABC[Number(k)], ...m }))
      : item.type === "numeric"
        ? (item.mistakes ?? []).map((m) => ({ key: m.answer, ...m }))
        : item.steps.flatMap((s, i) => (s.item.type === "mcq" ? Object.entries(s.item.mistakes ?? {}).map(([k, m]) => ({ key: `B${i + 1}·${ABC[Number(k)]}`, ...m })) : (s.item.mistakes ?? []).map((m) => ({ key: `B${i + 1}·${m.answer}`, ...m }))));
  if (!list.length) return <p className="text-sm text-muted">Không có phản hồi riêng cho câu sai.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {list.map((m, i) => (
        <li key={i} className="flex flex-wrap gap-3 px-3 py-2">
          <b className="w-16 font-mono">{m.key}</b>
          <span className="rounded-full bg-warn-soft px-2 font-mono text-xs text-warn" title={errorLabel(m.code) ?? m.code}>{m.code}</span>
          <Html html={texToHtml(m.feedback)} className="min-w-0 flex-1" />
          {m.review && <span className="font-mono text-xs text-muted">ôn: {m.review}</span>}
        </li>
      ))}
    </ul>
  );
}

/** One item in full for the reviewer: prompt, answer, hints, solution, wrong answers with codes, source. */
export function ItemPanel({ item, kind }: { item: Item; kind: "practice" | "exit" }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="flex flex-wrap gap-2 font-mono text-xs">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{kind === "practice" ? "Luyện tập" : "Kiểm tra"}</span>
        <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.level} · {item.type === "mcq" ? "trắc nghiệm" : item.type === "numeric" ? "điền số" : "nhiều bước"}</span>
        {item.source && <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.source}</span>}
      </p>
      <Html html={texToHtml(item.prompt)} className="text-lg leading-relaxed" />
      <div className="flex flex-col gap-2"><Label>Đáp án đúng</Label><Answer item={item} /></div>
      {item.hints && (
        <div className="flex flex-col gap-2"><Label>Gợi ý con mở dần</Label>
          <ol className="list-decimal pl-5 text-sm">{item.hints.map((h, i) => <li key={i}><Html html={texToHtml(h)} /></li>)}</ol>
        </div>
      )}
      <div className="flex flex-col gap-2"><Label>Lời giải (con xem sau khi làm)</Label><Html html={texToHtml(item.solution)} className="text-sm" /></div>
      <div className="flex flex-col gap-2"><Label>Con trả lời sai thì app nói gì</Label><Mistakes item={item} /></div>
    </div>
  );
}

/** The lesson block: theory, worked example, faded example with the blanks' answers. */
export function LessonPanel({ unit }: { unit: Unit }) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="flex flex-col gap-2"><Label>Lý thuyết</Label>{unit.theory.map((t, i) => <Html key={i} html={texToHtml(t)} />)}</div>
      <div className="flex flex-col gap-2"><Label>Bài mẫu</Label><Html html={texToHtml(unit.worked.problem)} />
        <ol className="list-decimal pl-5">{unit.worked.steps.map((s, i) => <li key={i}><Html html={texToHtml(s.text)} />{s.why && <Html html={texToHtml(s.why)} className="text-muted" />}</li>)}</ol>
        <Html html={texToHtml(unit.worked.selfExplain)} className="text-muted" />
      </div>
      <div className="flex flex-col gap-2"><Label>Bài khuyết (con điền chỗ trống)</Label><Html html={texToHtml(unit.faded.problem)} />
        <ol className="list-decimal pl-5">{unit.faded.steps.map((s, i) => <li key={i}>{"item" in s ? <><Html html={texToHtml(s.prompt)} /><div className="mt-1"><Answer item={s.item} /></div></> : <Html html={texToHtml(s.text)} />}</li>)}</ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verdict form** — `verdict-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { reviewItem } from "@/app/review/actions";

export function VerdictForm({ unitId, itemId, back, note }: { unitId: string; itemId: string; back: string; note: string | null }) {
  const [state, action, pending] = useActionState(reviewItem, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="back" value={back} />
      <label htmlFor="note" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Góp ý (bắt buộc khi cần sửa)</label>
      <textarea id="note" name="note" rows={2} maxLength={500} defaultValue={note ?? ""} placeholder="Ví dụ: đổi số cho dễ nhẩm; thêm phương án sai khi con quên đổi dấu…" className="rounded-lg border border-border px-3 py-2 text-base" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" name="verdict" value="ok" disabled={pending} className="rounded-lg bg-good px-4 py-2.5 font-display font-bold text-white disabled:opacity-60">✓ Đạt — câu tiếp</button>
        <button type="submit" name="verdict" value="fix" disabled={pending} className="rounded-lg border border-warn px-4 py-2.5 font-display font-bold text-warn disabled:opacity-60">! Cần sửa</button>
        {state.error && <span role="alert" className="text-sm text-warn">{state.error}</span>}
      </div>
      <p className="text-xs text-muted">Câu &ldquo;cần sửa&rdquo; vẫn duyệt cả bài được: câu đó ẩn với con tới khi sửa xong và được xem lại.</p>
    </form>
  );
}
```

- [ ] **Step 3: Workbench** — `workbench.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/content";
import { reviewOf } from "@/lib/content/approvals";
import { LESSON, nextToReview, type ItemStatus } from "@/lib/content/review";
import { ActionForm } from "@/components/action-form";
import { approveUnit, returnUnit } from "@/app/review/actions";
import { ItemPanel, LessonPanel } from "./item-panel";
import { VerdictForm } from "./verdict-form";

const MARK: Record<ItemStatus, [string, string]> = { ok: ["✓", "text-good"], fix: ["!", "text-warn"], changed: ["↻", "text-accent"], unseen: ["·", "text-muted"] };

/** Mockup artboard 3 — shared by the tutor (/tutor/[id]/bai/[unit]) and the parent (/parent/content/[unit]/duyet). */
export async function ReviewWorkbench({ unitId, base, selected, tryHref, backHref }: { unitId: string; base: string; selected?: string; tryHref: string; backHref: string }) {
  const f = getUnit(unitId);
  const rv = await reviewOf(unitId);
  if (!f || !rv) notFound();
  const gitApproved = f.unit.status === "approved";
  const current = rv.items.find((e) => e.id === selected) ?? rv.items.find((e) => e.id === nextToReview(rv)) ?? rv.items[0];
  const label = (id: string) => (id === LESSON ? "Lý thuyết & bài mẫu" : id.replace(`${unitId}-`, ""));

  return (
    <>
      <header className="flex flex-wrap items-center gap-3">
        <Link href={backHref} className="text-sm text-accent hover:underline">← Kho bài</Link>
        <h1 className="font-display text-xl font-bold">{f.unit.title}</h1>
        <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${gitApproved || rv.approved ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>
          {gitApproved ? `Đã duyệt ${f.unit.approvedOn}` : rv.approved ? "Đã duyệt trên app" : "Chờ duyệt"}
        </span>
        <span className="font-mono text-xs text-muted" data-testid="review-progress">đã xem {rv.counts.ok + rv.counts.fix}/{rv.items.length} · {rv.counts.fix} cần sửa</span>
        <Link href={tryHref} className="ml-auto text-sm font-semibold text-accent hover:underline">Làm thử như con ↗</Link>
      </header>
      {!gitApproved && (
        <div className="mt-3 flex flex-wrap gap-3">
          {rv.canApprove.ok && !rv.approved ? (
            <ActionForm action={approveUnit} submitLabel="Duyệt cả bài"><input type="hidden" name="unitId" value={unitId} /></ActionForm>
          ) : !rv.approved ? (
            <p className="rounded-lg bg-bg px-3 py-2 text-sm text-muted" data-testid="approve-blocked">Chưa duyệt cả bài được: {(rv.canApprove as { reason: string }).reason}</p>
          ) : (
            <ActionForm action={returnUnit} submitLabel="Trả lại để sửa" variant="warn" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="unitId" value={unitId} />
              <input name="note" required maxLength={500} placeholder="Lý do (con sẽ không thấy bài này)" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </ActionForm>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-start gap-5">
        <nav aria-label="Các câu" className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5 rounded-xl border border-border bg-surface p-2">
          {rv.items.map((e) => {
            const [m, cls] = MARK[e.status];
            return (
              <Link key={e.id} href={`${base}?item=${encodeURIComponent(e.id)}`} aria-current={e.id === current.id ? "true" : undefined}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${e.id === current.id ? "bg-accent-soft font-semibold" : "hover:bg-bg"}`} data-status={e.status}>
                <span className={`w-4 text-center font-mono ${cls}`}>{m}</span>
                <span className="font-mono text-xs text-muted">{e.kind === "lesson" ? "" : e.kind === "practice" ? "LT" : "KT"}</span>
                {label(e.id)}{e.item ? ` · ${e.item.level}` : ""}
              </Link>
            );
          })}
        </nav>
        <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-4" aria-label="Câu đang xem" data-item={current.id}>
          <article className="rounded-xl border border-border bg-surface p-5">
            {current.item ? <ItemPanel item={current.item} kind={current.kind as "practice" | "exit"} /> : <LessonPanel unit={f.unit} />}
            {current.status === "changed" && <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">Câu này đã được sửa sau lần xem trước — xem lại.</p>}
          </article>
          {!gitApproved && <VerdictForm unitId={unitId} itemId={current.id} back={base} note={current.status === "fix" ? current.note : null} />}
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Tutor routes** — `src/app/tutor/[studentId]/bai/[unitId]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { ReviewWorkbench } from "@/components/review/workbench";

export const metadata: Metadata = { title: "Duyệt bài — App Toán" };

export default async function TutorReviewPage(props: PageProps<"/tutor/[studentId]/bai/[unitId]">) {
  await requireRole("tutor");
  const [{ studentId, unitId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !/^[a-z0-9-]+$/.test(unitId)) notFound();
  const { data: student } = await (await createClient()).from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const base = `/tutor/${student.id}/bai/${unitId}`;
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <ReviewWorkbench unitId={unitId} base={base} selected={typeof sp.item === "string" ? sp.item : undefined} tryHref={`${base}/thu`} backHref={`/tutor/${student.id}/bai`} />
    </>
  );
}
```

`…/thu/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Làm thử — App Toán" };

// T7: the tutor tries a draft exactly as the student will; checkAnswer grades it as a preview and records nothing.
export default async function TutorTryPage(props: PageProps<"/tutor/[studentId]/bai/[unitId]/thu">) {
  await requireRole("tutor");
  const { studentId, unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found || !/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const back = `/tutor/${studentId}/bai/${unitId}`;
  return (
    <div className="mx-auto max-w-md">
      <LessonPlayer unit={toPublicUnit(found.unit, found.module)} mode="preview" initial={{ workedViewed: false, fadedDone: false }} backHref={back} previewBase={`/tutor/${studentId}/bai`} />
    </div>
  );
}
```

- [ ] **Step 5: Verify** — `npm run lint && npm run build` → pass; `npm run dev` + E2E is covered in Task 9.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "S10: shared review workbench; tutor Duyệt and Làm thử"`

---

### Task 8: Parent — statuses, review route, notes to copy

**Files:**
- Modify: `src/app/parent/content/page.tsx`
- Create: `src/app/parent/content/[unitId]/duyet/page.tsx`, `src/components/review/copy-notes.tsx`

**Interfaces:**
- Consumes: `shelf()`, `loadReviewData()`, `fixNotesText`, `unitReview`, `ReviewWorkbench`.

- [ ] **Step 1: Copy component** — `copy-notes.tsx`:

```tsx
"use client";

import { useState } from "react";

/** T7: every "Cần sửa" note as one block, to paste to a Claude content session. */
export function CopyNotes({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <textarea readOnly value={text} rows={Math.min(10, text.split("\n").length + 1)} className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs" aria-label="Góp ý cần sửa" />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); } catch { setDone(false); } }}
        className="self-start rounded-lg border border-border bg-surface px-3.5 py-2 font-display text-sm font-semibold">
        {done ? "Đã chép ✓" : "Chép để gửi Claude"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Parent list** — in `content/page.tsx` replace the `getUnit`-based badge with `shelf()` rows (map by id) and add the notes block above the groups:

```tsx
import { shelf, loadReviewData } from "@/lib/content/approvals";
import { fixNotesText, unitReview } from "@/lib/content/review";
import { CopyNotes } from "@/components/review/copy-notes";
// in the component:
  const [rows, d] = await Promise.all([shelf(), loadReviewData()]);
  const status = new Map(rows.map((r) => [r.id, r]));
  const notes = units.flatMap((c) => {
    const f = getUnit(c.id);
    if (!f || f.unit.status === "approved") return [];
    return unitReview(f.unit, d.rows, d.approvals).items
      .filter((e) => e.status === "fix" && e.note)
      .map((e) => ({ unitId: c.id, unitTitle: c.title, itemId: e.id, note: e.note!, at: e.reviewedAt! }));
  });
// JSX, after the intro paragraph (replace the intro's "nói với Claude duyệt bài …" sentence with:
//   "Bài Chờ duyệt: gia sư (hoặc phụ huynh) duyệt từng câu trong app; con thấy bài ngay khi duyệt xong."):
      {notes.length > 0 && (
        <section className="mt-6 max-w-3xl rounded-xl border border-border bg-surface p-4" data-testid="fix-notes">
          <h2 className="font-display font-semibold">Góp ý cần sửa ({notes.length})</h2>
          <p className="mt-1 text-sm text-muted">Chép rồi dán cho phiên Claude soạn nội dung. Sửa xong, câu hiện &ldquo;↻ xem lại&rdquo; ở màn duyệt.</p>
          <div className="mt-3"><CopyNotes text={fixNotesText(notes)} /></div>
        </section>
      )}
// per row badge: const s = status.get(c.id)!; const [label, cls] = SHELF_BADGE[s.status];
// text = s.status === "approved" ? `Đã duyệt ${s.approvedOn}` : label   ← keep "Đã duyệt <date>": preview-flow counts /^Đã duyệt \d/ (10)
// and "Chưa soạn" exactly (curriculum-parent-flow); add `đã xem x/y` when s.total > 0; links:
//   "Xem trước →" (existing) and, when s.status is "waiting" or "reapprove", "Duyệt →" to `/parent/content/${c.id}/duyet`.
```

Move `BADGE` (Task 6) to `src/components/review/badges.ts` and import it in both pages (DRY):

```ts
import type { ShelfStatus } from "@/lib/content/review";
export const SHELF_BADGE: Record<ShelfStatus, [string, string]> = {
  approved: ["Đã duyệt", "bg-good-soft text-good"],
  waiting: ["Chờ duyệt", "bg-warn-soft text-warn"],
  reapprove: ["Cần duyệt lại", "bg-warn-soft text-warn"],
  none: ["Chưa soạn", "border border-border text-muted"],
};
```

- [ ] **Step 3: Parent review route** — `src/app/parent/content/[unitId]/duyet/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { ReviewWorkbench } from "@/components/review/workbench";

export const metadata: Metadata = { title: "Duyệt bài — App Toán" };

// T7: the parent reviews in parallel with the tutor, same screen.
export default async function ParentReviewPage(props: PageProps<"/parent/content/[unitId]/duyet">) {
  await requireRole("parent");
  const [{ unitId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[a-z0-9-]+$/.test(unitId)) notFound();
  return <ReviewWorkbench unitId={unitId} base={`/parent/content/${unitId}/duyet`} selected={typeof sp.item === "string" ? sp.item : undefined} tryHref={`/parent/content/${unitId}`} backHref="/parent/content" />;
}
```

- [ ] **Step 4: Verify** — `npm run lint && npm run build`; `./e2e/run.sh` → `preview-flow` (10 × "Đã duyệt <date>") and `curriculum-parent-flow` ("Chưa soạn") still pass.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "S10: parent sees review status, reviews in the app, copies fix notes"`

---

### Task 9: End-to-end checks + docs + push

**Files:**
- Create: `e2e/review-flow.mjs`, `e2e/review-student-flow.mjs`
- Modify: `e2e/run.sh`, `docs/DESIGN.md`, `docs/PROGRESS.md`, `docs/HANDOFF.md`, `docs/CONTENT_STANDARD.md`, `docs/AI_TUTOR.md`, `docs/P1_PLAN.md`

- [ ] **Step 1: Tutor e2e** — `e2e/review-flow.mjs` (E2E_ROLE=tutor, real content, draft `b-haib`):

```js
// S10 tutor flow: Kho bài → ⭐ → review b-haib item by item (one "Cần sửa") → approve. Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3108";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/review"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const unit = JSON.parse(fs.readFileSync("content/xac-suat/b-haib.json", "utf8"));
const total = 1 + unit.practice.length + unit.exit.length;
const fixId = unit.practice[0].id;

await sql(`delete from public.item_reviews; delete from public.unit_approvals; delete from public.tutor_priorities;`);
const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;

await page.goto(`${BASE}/tutor/${sid}/bai`);
ok("shelf: b-haib waiting for review", (await page.getByTestId("shelf-b-haib").getByText("Chờ duyệt").count()) === 1);
await page.goto(`${BASE}/tutor/${sid}/bai?loc=da`);
ok("shelf: approved htl-1 under 'Đã duyệt'", (await page.getByTestId("shelf-htl-1").count()) === 1);
await page.goto(`${BASE}/tutor/${sid}/bai?loc=cho`);
await page.getByTestId("shelf-b-haib").getByRole("button", { name: "Ưu tiên luyện trước" }).click();
await page.getByTestId("priority-list").getByText(unit.title).waitFor();
ok("priority: ⭐ adds b-haib to the list", (await sql(`select unit_id, position from public.tutor_priorities`)).length === 1);
await page.screenshot({ path: `${shots}/1-shelf.png`, fullPage: true });

await page.getByTestId("shelf-b-haib").getByRole("link", { name: /Duyệt/ }).click();
await page.waitForURL(/\/bai\/b-haib/);
ok("review: approve blocked before reviewing", (await page.getByTestId("approve-blocked").count()) === 1);
for (let i = 0; i < total; i++) {
  const id = await page.locator("[data-item]").getAttribute("data-item");
  if (id === fixId) {
    await page.getByLabel(/Góp ý/).fill("Đổi số cho dễ nhẩm hơn");
    await page.getByRole("button", { name: "! Cần sửa" }).click();
  } else await page.getByRole("button", { name: /Đạt — câu tiếp/ }).click();
  // The action redirects to the next item; wait until the panel shows another one (the last verdict stays put).
  if (i < total - 1) await page.waitForFunction((old) => document.querySelector("[data-item]")?.getAttribute("data-item") !== old, id);
}
await page.reload();
await page.getByTestId("review-progress").filter({ hasText: `đã xem ${total}/${total}` }).waitFor();
await page.screenshot({ path: `${shots}/2-reviewed.png`, fullPage: true });
ok("review: every item has a verdict", (await sql(`select count(distinct item_id)::int c from public.item_reviews`))[0].c === total);
ok("review: the fix note is saved", (await sql(`select note from public.item_reviews where item_id='${fixId}'`))[0]?.note === "Đổi số cho dễ nhẩm hơn");
await page.getByRole("button", { name: "Duyệt cả bài" }).click();
await page.getByText(/Đã duyệt — con thấy bài này ngay/).waitFor();
ok("approve: one approval row", (await sql(`select action from public.unit_approvals`)).map((r) => r.action).join() === "approve");
await page.goto(`${BASE}/tutor/${sid}/bai?loc=da`);
ok("shelf: b-haib now 'Đã duyệt'", (await page.getByTestId("shelf-b-haib").getByText("Đã duyệt").count()) === 1);

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

- [ ] **Step 2: Student e2e** — `e2e/review-student-flow.mjs` (E2E_ROLE=student; runs right after, same DB):

```js
// S10 student side: an app-approved KU is visible without its "Cần sửa" item; a priority KU leads Bài mới. Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3109";
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const unit = JSON.parse(fs.readFileSync("content/xac-suat/b-haib.json", "utf8"));
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
// LT3: no suggestion at all with 2 KUs in progress — leave only the htl-1/2 history of the earlier flows.
await sql(`delete from public.unit_progress where unit_id not in ('htl-1','htl-2')`);

await page.goto(`${BASE}/student`);
const first = page.getByRole("link", { name: "Học bài mới" }).first();
ok("Bài mới: the tutor's priority KU first", (await first.getAttribute("href")) === "/student/learn/b-haib", await first.getAttribute("href"));
const r = await page.goto(`${BASE}/student/learn/b-haib`);
ok("learn: app-approved b-haib opens", r.status() === 200);
const html = await page.content();
const has = (id) => new RegExp(`${id}(?![0-9])`).test(html); // b-haib-p1 ≠ b-haib-p10
ok("learn: the 'Cần sửa' item is hidden", !has(unit.practice[0].id) && has(unit.practice[1].id));
const d = await page.goto(`${BASE}/student/learn/g-giaihpt`);
ok("learn: a draft KU is still 404", d.status() === 404);
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
```

- [ ] **Step 3: run.sh** — after `run tutor 3102 e2e/tutor-flow.mjs; c=$?` add:

```bash
run tutor 3108 e2e/review-flow.mjs; i=$?
run student 3109 e2e/review-student-flow.mjs; j=$?
```

and change the exit line to `exit $(( a || b || c || d || e || f || g || h || i || j ))`. (Real content is in place at that point; the fixture swap happens later.)

- [ ] **Step 4: Run everything** — commit the registry first; `npm run lint && npm test && npm run build && ./e2e/run.sh` → all PASS. Fix and re-run until green.

- [ ] **Step 5: Docs**
  - `docs/DESIGN.md` §2 routes: `/tutor/[id]/bai`, `/tutor/[id]/bai/[unit]`, `…/thu`, `/parent/content/[unit]/duyet`; §3 tables `item_reviews`, `unit_approvals`, `tutor_priorities` (0012); §4: "Students see git-approved units, or units approved in the app (`studentView`, only ok items)"; §5: T8 in `suggestNew`.
  - `docs/CONTENT_STANDARD.md` §7 step 5 → "Gia sư (hoặc phụ huynh) duyệt từng câu trong app"; the parent checklist points to the Duyệt screen; "Góp ý cần sửa" block → content session fixes → items show ↻.
  - Migration numbers: `docs/HANDOFF.md`, `docs/PROGRESS.md`, `docs/AI_TUTOR.md`, `docs/P1_PLAN.md`: S10 = 0012, S11 = 0013, S8 = **0014**.
  - `docs/PROGRESS.md`: new dated section (done / self-checks with PASS counts / parent: **run SQL 0012 before merging**), quick-status row S10.
  - `docs/HANDOFF.md`: S10 ✅ PR open; next S11.
- [ ] **Step 6: Commit and push** — `git add -A && git commit -m "S10: e2e review flows; docs" && git push -u origin p1-slice-10`. The push opens the PR; CI does not start on bot-opened PRs → `gh api -X POST repos/haleytruong89-moon/math-app/actions/workflows/ci.yml/dispatches -f ref=p1-slice-10` and wait for `completed success`. PR body: SQL 0012 first, then merge.
