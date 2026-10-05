# Tutor "Bài làm của con" (Part A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tutors (and the parent) can see what the student answered — wrong answers first — per unit, to give feedback and teach the weak spots.

**Architecture:** One shared async server component `StudentWork` renders the whole page from existing tables (read through the caller's RLS client), mounted at `/tutor/[studentId]/work` and `/parent/students/[studentId]/work`. Unit choice and the wrong/all filter are URL search params (`?unit=htl-1&all=1`), so no client state. A pure module `src/lib/learning/work.ts` builds the view model and is unit-tested with `node --test`. No SQL.

**Tech Stack:** Next.js 16 App Router (server components, async `params`/`searchParams`), Supabase JS client (RLS), Tailwind v4 tokens, KaTeX via `texToHtml`, `node --test`, Playwright e2e on PGlite.

**Spec:** `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` (Part A, decisions T5).

## Global Constraints

- UI text Vietnamese; code, comments, commit messages, file names English.
- No SQL / no new migration in Part A. RLS stays the only access control for reads (tutor sees data only while actively assigned; locked tutor sees nothing).
- Only modes `practice`, `exit`, `review` are shown — never `faded` (T5).
- Read-only: no write actions on this page.
- Student-typed answers are escaped plain text — never passed through `texToHtml` (they may contain `$`).
- No streaks, scores-as-ranking, or leaderboards (D17).
- Before pushing: `npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh` (on Windows: in the Playwright Linux container without `.env.local`, see `docs/PROGRESS.md` 05/10 notes).
- Prerequisite: PR #4 (`p1-fixes`) merged into `main`, then `git rebase main` on `p1-tutor-tools` (PR #4 contains the Windows fix for `npm run test:db`).

## Review Focus

1. **Item removed or renamed in content** while attempts still reference it → entry is skipped, page does not crash (Task 1 test).
2. **MCQ answer stored as a non-digit or out-of-range index** (old/corrupt row) → shows "(không đọc được)", no crash (Task 1 test).
3. **Blank exit answer** (`answer = ""`) → shows "(bỏ trống)" (Task 1 test).
4. **Student answer containing `$` or `<script>`** → rendered literally, escaped, not as KaTeX/HTML (Task 1 test).
5. **`?unit=` with an unknown/malicious id** → falls back to the unit list, no query with that id (Task 2 behavior, e2e check in Task 3).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/learning/work.ts` (create) | Pure view-model helpers: `commonErrors`, `workEntries`, `durationLabel` |
| `src/lib/learning/work.test.ts` (create) | Unit tests for the above |
| `src/components/work/student-work.tsx` (create) | Async server component: loads data via the passed client, renders unit list or one unit's entries |
| `src/app/tutor/[studentId]/work/page.tsx` (create) | Tutor route: role check, student lookup (RLS → 404), mounts `StudentWork` |
| `src/app/parent/students/[studentId]/work/page.tsx` (create) | Parent route, same |
| `src/app/tutor/page.tsx` (modify) | "Xem bài làm" button per student |
| `src/components/tutor/session-form.tsx` (modify) | "Xem câu sai →" link in each ticked unit's evidence |
| `src/app/parent/page.tsx` (modify) | "Xem bài làm" link per student |
| `e2e/tutor-flow.mjs`, `e2e/preview-flow.mjs`, `e2e/student-flow.mjs` (modify) | Browser checks |
| `docs/SPEC.md`, `docs/DESIGN.md`, `docs/P1_PLAN.md`, `docs/PROGRESS.md` (modify) | Decisions T1–T5, route, slice row, report |

---

### Task 1: Pure view-model helpers (`work.ts`)

**Files:**
- Create: `src/lib/learning/work.ts`
- Test: `src/lib/learning/work.test.ts`

**Interfaces:**
- Consumes: `AttemptRow` from `./rules.ts`; `Item` from `../content/schema.ts`; `gradeItem` from `../content/grade.ts`; `texToHtml` from `../content/tex.ts`.
- Produces:
  - `type WorkAttempt = AttemptRow & { answer: string; duration_ms: number | null }`
  - `type WorkMode = "practice" | "exit" | "review"`
  - `type WorkEntry = { key: string; itemId: string; mode: WorkMode; at: string; durationMs: number | null; correct: boolean; errorCode: string | null; laterCorrect: boolean; promptHtml: string; answerHtml: string; correctHtml: string; feedbackHtml: string | null; solutionHtml: string }`
  - `commonErrors(attempts: AttemptRow[], min?: number): { code: string; count: number }[]`
  - `workEntries(attempts: WorkAttempt[], lookup: (itemId: string) => Item | null, opts: { wrongOnly: boolean }): WorkEntry[]` — newest first
  - `durationLabel(ms: number | null): string | null`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/learning/work.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { commonErrors, durationLabel, workEntries, type WorkAttempt } from "./work.ts";
import type { Item } from "../content/schema.ts";

const mcq: Item = {
  id: "q-mcq", type: "mcq", level: "L1", prompt: "Hình chiếu của $AC$?", options: ["$BH$", "$CH$", "$AH$"], correct: 1,
  mistakes: { "0": { code: "E08", feedback: "Nhầm hình chiếu." } }, solution: "Là $CH$.",
};
const num: Item = {
  id: "q-num", type: "numeric", level: "L1", prompt: "Tính $AB$.", answer: "15", unit: "cm",
  mistakes: [{ answer: "225", code: "E10", feedback: "Còn bước lấy căn bậc hai." }], solution: "$AB = 15$.",
};
const items = new Map([mcq, num].map((i) => [i.id, i]));
const lookup = (id: string) => items.get(id) ?? null;

let n = 0;
const at = (h: number) => new Date(`2026-10-05T${String(h).padStart(2, "0")}:00:00+07:00`).toISOString();
const w = (p: Partial<WorkAttempt>): WorkAttempt => ({
  item_id: "q-num", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: at(8 + n++),
  answer: "15", duration_ms: null, ...p,
});

test("common errors: codes seen at least twice, most frequent first, faded ignored", () => {
  const rows = [
    w({ correct: false, error_code: "E10" }), w({ correct: false, error_code: "E10", mode: "exit" }),
    w({ correct: false, error_code: "E03" }), w({ correct: false, error_code: "E03", mode: "faded" }),
    w({ correct: false, error_code: "E08" }), w({ correct: false, error_code: "E08" }), w({ correct: false, error_code: "E08", mode: "review" }),
  ];
  assert.deepEqual(commonErrors(rows), [{ code: "E08", count: 3 }, { code: "E10", count: 2 }]);
});

test("entries: newest first, wrong-only filter, faded never shown", () => {
  const rows = [
    w({ answer: "225", correct: false, error_code: "E10", created_at: at(9) }),
    w({ answer: "15", created_at: at(10) }),
    w({ mode: "faded", answer: "1", correct: false, created_at: at(11) }),
  ];
  const all = workEntries(rows, lookup, { wrongOnly: false });
  assert.deepEqual(all.map((e) => e.answerHtml), ["15", "225"]);
  const wrong = workEntries(rows, lookup, { wrongOnly: true });
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].laterCorrect, true); // the 10:00 try was right
  assert.match(wrong[0].feedbackHtml ?? "", /Còn bước lấy căn bậc hai/);
  assert.match(wrong[0].correctHtml, /15 cm/);
  assert.equal(wrong[0].errorCode, "E10");
});

test("MCQ answers show the option text; unreadable index and blank answers are labelled", () => {
  const [picked] = workEntries([w({ item_id: "q-mcq", answer: "0", correct: false, error_code: "E08" })], lookup, { wrongOnly: true });
  assert.match(picked.answerHtml, /katex/); // option "$BH$" rendered
  assert.match(picked.feedbackHtml ?? "", /Nhầm hình chiếu/);
  assert.equal(picked.laterCorrect, false);
  const [bad] = workEntries([w({ item_id: "q-mcq", answer: "7", correct: false })], lookup, { wrongOnly: true });
  assert.equal(bad.answerHtml, "(không đọc được)");
  const [blank] = workEntries([w({ mode: "exit", answer: "", correct: false })], lookup, { wrongOnly: true });
  assert.equal(blank.answerHtml, "(bỏ trống)");
});

test("student input is escaped, never rendered as TeX or HTML", () => {
  const [e] = workEntries([w({ answer: "$x$<script>", correct: false })], lookup, { wrongOnly: true });
  assert.equal(e.answerHtml, "$x$&lt;script&gt;");
});

test("items no longer in the content are skipped", () => {
  assert.equal(workEntries([w({ item_id: "gone", correct: false })], lookup, { wrongOnly: true }).length, 0);
});

test("duration label", () => {
  assert.equal(durationLabel(null), null);
  assert.equal(durationLabel(45_000), "45 giây");
  assert.equal(durationLabel(150_000), "3 phút");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/lib/learning/work.test.ts`
Expected: FAIL — `Cannot find module '.../work.ts'`.

- [ ] **Step 3: Implement `work.ts`**

```ts
// "Bài làm của con" view model for tutors and the parent (spec 2026-10-05, part A).
// Pure, so `node --test` covers it. Faded steps are never shown (T5).
import type { Item } from "../content/schema.ts";
import { gradeItem } from "../content/grade.ts";
import { texToHtml } from "../content/tex.ts";
import type { AttemptRow } from "./rules.ts";

export type WorkAttempt = AttemptRow & { answer: string; duration_ms: number | null };
export type WorkMode = "practice" | "exit" | "review";

export type WorkEntry = {
  key: string;
  itemId: string;
  mode: WorkMode;
  at: string; // ISO timestamp
  durationMs: number | null;
  correct: boolean;
  errorCode: string | null;
  laterCorrect: boolean; // a later answer to the same item was right
  promptHtml: string;
  answerHtml: string; // what the student entered (escaped; MCQ → option text)
  correctHtml: string;
  feedbackHtml: string | null; // targeted feedback for this wrong answer, from the content
  solutionHtml: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Generic so filtering WorkAttempt[] keeps `answer` / `duration_ms`.
const graded = <T extends AttemptRow>(a: T): a is T & { mode: WorkMode } => a.mode !== "faded";

/** Error codes seen at least `min` times in practice, exit and review, most frequent first. */
export function commonErrors(attempts: AttemptRow[], min = 2): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of attempts) if (graded(a) && a.error_code) counts.set(a.error_code, (counts.get(a.error_code) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count >= min)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

function answerHtml(item: Item, raw: string): string {
  const answer = raw.trim();
  if (!answer) return "(bỏ trống)";
  if (item.type === "mcq") {
    const i = /^\d$/.test(answer) ? Number(answer) : -1;
    return i >= 0 && i < item.options.length ? texToHtml(item.options[i]) : "(không đọc được)";
  }
  return escapeHtml(answer);
}

function correctHtml(item: Item): string {
  return item.type === "mcq" ? texToHtml(item.options[item.correct]) : texToHtml(item.unit ? `${item.answer} ${item.unit}` : item.answer);
}

/** Newest first. Items that are no longer in the content are skipped. */
export function workEntries(
  attempts: WorkAttempt[],
  lookup: (itemId: string) => Item | null,
  opts: { wrongOnly: boolean },
): WorkEntry[] {
  const rows = attempts.filter(graded);
  const out: WorkEntry[] = [];
  for (const a of rows) {
    if (opts.wrongOnly && a.correct) continue;
    const item = lookup(a.item_id);
    if (!item) continue;
    const g = a.correct ? null : gradeItem(item, a.answer);
    out.push({
      key: `${a.item_id}|${a.created_at}`,
      itemId: a.item_id,
      mode: a.mode,
      at: a.created_at,
      durationMs: a.duration_ms,
      correct: a.correct,
      errorCode: a.error_code,
      laterCorrect: !a.correct && rows.some((b) => b.item_id === a.item_id && b.correct && b.created_at > a.created_at),
      promptHtml: texToHtml(item.prompt),
      answerHtml: answerHtml(item, a.answer),
      correctHtml: correctHtml(item),
      feedbackHtml: g?.feedback ? texToHtml(g.feedback) : null,
      solutionHtml: texToHtml(item.solution),
    });
  }
  return out.sort((x, y) => y.at.localeCompare(x.at));
}

export function durationLabel(ms: number | null): string | null {
  if (ms === null) return null;
  return ms < 60_000 ? `${Math.round(ms / 1000)} giây` : `${Math.round(ms / 60_000)} phút`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test src/lib/learning/work.test.ts`
Expected: 6 tests PASS. Then `npm run test:content` — all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/learning/work.ts src/lib/learning/work.test.ts
git commit -m "Tutor work view: pure view-model helpers"
```

---

### Task 2: `StudentWork` component + tutor and parent routes + entry links

**Files:**
- Create: `src/components/work/student-work.tsx`
- Create: `src/app/tutor/[studentId]/work/page.tsx`
- Create: `src/app/parent/students/[studentId]/work/page.tsx`
- Modify: `src/app/tutor/page.tsx` (student card)
- Modify: `src/components/tutor/session-form.tsx` (`Evidence` gets `studentId`, adds link)
- Modify: `src/app/parent/page.tsx` (student list item)

**Interfaces:**
- Consumes: `commonErrors`, `workEntries`, `durationLabel`, `WorkAttempt`, `WorkEntry` (Task 1); `loadStudentState(supabase, id, { includeDrafts: true })` and `UnitState` from `@/lib/learning/state`; `vnDate` from `@/lib/learning/rules`; `Rich`, `RightTriangleAltitude`.
- Produces: `StudentWork(props: { supabase: SupabaseClient; student: { id: string; full_name: string }; basePath: string; back: { href: string; label: string }; unitId: string | null; all: boolean; proposer: string })` — `proposer` is the label before "đề xuất" ("Bạn" for a tutor, "Gia sư" for the parent).

- [ ] **Step 1: Read the Next 16 docs for dynamic route props**

Run: `ls node_modules/next/dist/docs/` and read the page on dynamic routes / `searchParams` (look for "PageProps"). Confirm `params` and `searchParams` are Promises and `PageProps<"/route/[param]">` is a global type. Adjust Step 3 if the doc differs.

- [ ] **Step 2: Create `src/components/work/student-work.tsx`**

```tsx
import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "@/lib/content/schema";
import { loadStudentState, type UnitState } from "@/lib/learning/state";
import { vnDate } from "@/lib/learning/rules";
import { commonErrors, durationLabel, workEntries, type WorkAttempt, type WorkEntry } from "@/lib/learning/work";
import { RightTriangleAltitude } from "@/components/lesson/figure";
import { Rich } from "@/components/lesson/rich";

const MODE_LABEL = { practice: "Luyện tập", exit: "Kiểm tra", review: "Ôn lại" } as const;
const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
const ddmm = (iso: string) => vnDate(iso).split("-").reverse().slice(0, 2).join("/");
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

type Proposal = { unit_id: string; level: number; created_at: string };

/**
 * "Bài làm của con" (spec 2026-10-05, part A). Reads through the caller's RLS client:
 * a tutor sees only an actively assigned student, the parent only their own children.
 */
export async function StudentWork(props: {
  supabase: SupabaseClient;
  student: { id: string; full_name: string };
  basePath: string;
  back: { href: string; label: string };
  unitId: string | null;
  all: boolean;
  proposer: string;
}) {
  const { supabase, student, basePath } = props;
  const [state, proposals] = await Promise.all([
    loadStudentState(supabase, student.id, { includeDrafts: true }),
    supabase
      .from("tutor_proposals")
      .select("unit_id, level, created_at")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const latest = new Map<string, Proposal>();
  for (const p of (proposals.data ?? []) as Proposal[]) if (!latest.has(p.unit_id)) latest.set(p.unit_id, p);

  // Only an id from the content is ever used in a query.
  const unit = props.unitId ? state.units.find((u) => u.unit.id === props.unitId) ?? null : null;

  return (
    <>
      <Link href={unit ? basePath : props.back.href} className="text-sm text-accent hover:underline">
        {unit ? "← Tất cả bài" : props.back.label}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold">Bài làm của {student.full_name}</h1>
      {unit ? (
        <UnitWork {...props} u={unit} proposal={latest.get(unit.unit.id)} />
      ) : (
        <ul className="mt-6 flex flex-col gap-3" aria-label="Các bài">
          {state.units.map((u) => (
            <li key={u.unit.id}>
              <Link href={`${basePath}?unit=${u.unit.id}`} className="block rounded-xl border border-border bg-surface p-4 hover:border-accent">
                <Summary u={u} proposal={latest.get(u.unit.id)} proposer={props.proposer} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Summary({ u, proposal, proposer }: { u: UnitState; proposal?: Proposal; proposer: string }) {
  const errors = commonErrors(u.attempts);
  const graded = u.attempts.filter((a) => a.mode !== "faded").length;
  return (
    <div data-testid={`work-summary-${u.unit.id}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[u.mastery.level]} ${u.mastery.level >= 2 ? "text-on-accent" : "text-ink"}`}
        >
          M{u.mastery.level}
        </span>
        <span className="min-w-0">
          <span className="block font-display font-semibold leading-snug">{u.unit.title}</span>
          <span className="font-mono text-xs text-muted">
            {graded ? (u.mastery.enoughData ? `${u.mastery.answers} câu đã làm` : `chưa đủ dữ liệu (${u.mastery.answers} câu)`) : "Chưa làm câu nào"}
            {u.mastery.lastExit && ` · kiểm tra gần nhất ${u.mastery.lastExit.right}/${u.mastery.lastExit.total}`}
          </span>
        </span>
      </div>
      {(errors.length > 0 || proposal) && (
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {errors.map((e) => (
            <span key={e.code} className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-warn">
              {e.code} × {e.count}
            </span>
          ))}
          {proposal && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-accent">
              {proposer} đề xuất M{proposal.level} · {ddmm(proposal.created_at)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

async function UnitWork(props: {
  supabase: SupabaseClient;
  student: { id: string };
  basePath: string;
  all: boolean;
  proposer: string;
  u: UnitState;
  proposal?: Proposal;
}) {
  const { u } = props;
  const { data, error } = await props.supabase
    .from("attempts")
    .select("item_id, mode, correct, error_code, exit_run, created_at, answer, duration_ms")
    .eq("student_id", props.student.id)
    .eq("unit_id", u.unit.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) console.error("StudentWork attempts", error.message);
  const rows = (data ?? []) as WorkAttempt[];
  const pool = new Map<string, Item>([...u.unit.practice, ...u.unit.exit].map((i) => [i.id, i]));
  const lookup = (id: string) => pool.get(id) ?? null;
  const wrong = workEntries(rows, lookup, { wrongOnly: true });
  const entries = props.all ? workEntries(rows, lookup, { wrongOnly: false }) : wrong;
  const total = rows.filter((r) => r.mode !== "faded").length;
  const href = (all: boolean) => `${props.basePath}?unit=${u.unit.id}${all ? "&all=1" : ""}`;
  const tab = (on: boolean) =>
    `rounded-lg px-3 py-2 text-center font-display text-sm ${on ? "bg-accent font-bold text-on-accent" : "border border-border bg-surface"}`;

  return (
    <>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <Summary u={u} proposal={props.proposal} proposer={props.proposer} />
      </div>
      <nav className="mt-4 grid grid-cols-2 gap-2" aria-label="Lọc câu">
        <Link href={href(false)} aria-current={!props.all ? "page" : undefined} className={tab(!props.all)}>
          Chỉ câu sai ({wrong.length})
        </Link>
        <Link href={href(true)} aria-current={props.all ? "page" : undefined} className={tab(props.all)}>
          Tất cả ({total})
        </Link>
      </nav>
      <ul className="mt-4 flex flex-col gap-3" aria-label="Câu đã làm">
        {entries.map((e) => (
          <Entry key={e.key} e={e} figure={u.unit.figure === "right-triangle-altitude"} />
        ))}
        {!entries.length && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            {props.all ? "Con chưa làm câu nào ở bài này." : "Chưa có câu sai nào ở bài này."}
          </li>
        )}
      </ul>
    </>
  );
}

function Entry({ e, figure }: { e: WorkEntry; figure: boolean }) {
  const meta = [MODE_LABEL[e.mode], `${hhmm(e.at)} ${ddmm(e.at)}`, durationLabel(e.durationMs)].filter(Boolean).join(" · ");
  return (
    <li className="rounded-xl border border-border bg-surface p-4" data-testid="work-entry" data-item={e.itemId} data-correct={e.correct}>
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted">
        <span>{meta}</span>
        {e.laterCorrect && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">Lần sau làm đúng</span>}
      </div>
      {figure && <RightTriangleAltitude className="my-2 max-w-[180px]" />}
      <Rich as="div" html={e.promptHtml} className="mt-2 leading-relaxed" />
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Con trả lời</dt>
        <dd className={e.correct ? "text-good" : "font-semibold text-warn"}>
          <Rich html={e.answerHtml} />
        </dd>
        {!e.correct && (
          <>
            <dt className="text-muted">Đáp án đúng</dt>
            <dd>
              <Rich html={e.correctHtml} />
            </dd>
          </>
        )}
        {e.errorCode && (
          <>
            <dt className="text-muted">Lỗi</dt>
            <dd>
              <span className="font-mono">{e.errorCode}</span>
              {e.feedbackHtml && (
                <>
                  {" — "}
                  <Rich html={e.feedbackHtml} />
                </>
              )}
            </dd>
          </>
        )}
      </dl>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-accent">Lời giải</summary>
        <Rich as="div" html={e.solutionHtml} className="mt-2 leading-relaxed" />
      </details>
    </li>
  );
}
```

Note: `answerHtml` is escaped plain text or server KaTeX (Task 1), so passing it to `Rich` is safe.

- [ ] **Step 3: Create the tutor route** `src/app/tutor/[studentId]/work/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { StudentWork } from "@/components/work/student-work";

export const metadata: Metadata = { title: "Bài làm của con — App Toán" };

export default async function TutorWorkPage(props: PageProps<"/tutor/[studentId]/work">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  // RLS: only returns the student while this tutor is actively assigned.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  return (
    <StudentWork
      supabase={supabase}
      student={student}
      basePath={`/tutor/${student.id}/work`}
      back={{ href: "/tutor", label: "← Học sinh" }}
      unitId={typeof sp.unit === "string" ? sp.unit : null}
      all={sp.all === "1"}
      proposer="Bạn"
    />
  );
}
```

- [ ] **Step 4: Create the parent route** `src/app/parent/students/[studentId]/work/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { StudentWork } from "@/components/work/student-work";

export const metadata: Metadata = { title: "Bài làm của con — App Toán" };

export default async function ParentWorkPage(props: PageProps<"/parent/students/[studentId]/work">) {
  await requireRole("parent");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  // RLS: a parent only reads their own children.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  return (
    <div className="mx-auto max-w-md">
      <StudentWork
        supabase={supabase}
        student={student}
        basePath={`/parent/students/${student.id}/work`}
        back={{ href: "/parent", label: "← Tổng quan" }}
        unitId={typeof sp.unit === "string" ? sp.unit : null}
        all={sp.all === "1"}
        proposer="Gia sư"
      />
    </div>
  );
}
```

- [ ] **Step 5: Entry links**

`src/app/tutor/page.tsx` — after the "Ghi buổi dạy" `<Link>` inside the `<li>`:

```tsx
              <Link
                href={`/tutor/${s.id}/work`}
                className="mt-2 block w-full rounded-lg border border-border px-4 py-2.5 text-center font-display text-sm font-semibold"
              >
                Xem bài làm
              </Link>
```

`src/components/tutor/session-form.tsx` — pass `studentId` into `Evidence` (`<Evidence u={u} studentId={studentId} level=… onLevel=… />`), extend its props type with `studentId: string`, and after `<p className="mt-2 text-sm text-muted">{facts.join(" · ")}</p>` add (new tab, so ticks/levels typed so far are not lost):

```tsx
      <a
        href={`/tutor/${studentId}/work?unit=${u.id}`}
        target="_blank"
        rel="noopener"
        className="mt-1 inline-block text-sm text-accent hover:underline"
      >
        Xem câu sai →
      </a>
```

`src/app/parent/page.tsx` — add `import Link from "next/link";` and, inside each student `<li>` after the consent `<span>`:

```tsx
            <Link href={`/parent/students/${s.id}/work`} className="text-sm text-accent hover:underline">
              Xem bài làm
            </Link>
```

- [ ] **Step 6: Lint + build**

Run: `npm run lint` → no errors. Run: `npm run build` → "Compiled successfully" and both new routes listed as `ƒ`.

- [ ] **Step 7: Commit**

```bash
git add src/components/work src/app/tutor src/app/parent src/components/tutor/session-form.tsx
git commit -m "Tutor and parent can see the student's answers per unit, wrong ones first"
```

---

### Task 3: e2e checks

**Files:**
- Modify: `e2e/tutor-flow.mjs` (after `ok("home: last logged date shown", …)` and the multi-line note block; and in the "assignment ended" block)
- Modify: `e2e/preview-flow.mjs` (parent server)
- Modify: `e2e/student-flow.mjs` (student server)

**Interfaces:**
- Consumes: routes from Task 2; `data-testid="work-entry"` (`data-item`, `data-correct`), `data-testid="work-summary-<unit>"`, link names "Xem bài làm", "Xem câu sai →", "Chỉ câu sai (n)", "Tất cả (n)".

- [ ] **Step 1: Tutor flow — make the seeded wrong answers realistic, then check the page**

The seed (top of `tutor-flow.mjs`) stores `answer = '1'` for every row and wrong rows `htl-1-p3`, `htl-1-x4`, `htl-1-x5`. Evidence checks have already run at this point, so changing answers is safe. Insert after the multi-line note block (before `// ---- dark mode`):

```js
// ---- "Bài làm của con": wrong answers with what the student typed
await sql(`
  update public.attempts set answer = '0', error_code = 'E08' where item_id = 'htl-1-p3';
  update public.attempts set answer = '225', error_code = 'E10' where item_id = 'htl-1-x4';
  update public.attempts set answer = '144', error_code = 'E10' where item_id = 'htl-1-x5';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
    select id, 'htl-1', 'htl-1-p3', 'practice', '1', true from public.students where full_name = 'Hạnh Nguyên';`);
await page.goto(`${BASE}/tutor`);
await page.getByRole("link", { name: "Xem bài làm" }).click();
await page.waitForURL(/\/work$/);
const workUrl = page.url();
ok("work: unit list with common error E10 × 2", (await page.getByTestId("work-summary-htl-1").getByText("E10 × 2").count()) === 1);
ok("work: tutor's own proposal shown", (await page.getByTestId("work-summary-htl-1").getByText(/Bạn đề xuất M3/).count()) === 1);
await page.getByTestId("work-summary-htl-1").click();
await page.waitForURL(/unit=htl-1/);
ok("work: wrong-only by default (3)", (await page.getByTestId("work-entry").count()) === 3 && (await page.getByRole("link", { name: "Chỉ câu sai (3)" }).count()) === 1);
const x4 = page.locator('[data-testid=work-entry][data-item="htl-1-x4"]');
ok("work: student answer + right answer + feedback", (await x4.getByText("225").count()) >= 1 && (await x4.getByText("15").count()) >= 1 && (await x4.getByText(/Còn bước lấy căn bậc hai/).count()) === 1);
ok("work: 'Lần sau làm đúng' on p3", (await page.locator('[data-testid=work-entry][data-item="htl-1-p3"]').getByText("Lần sau làm đúng").count()) === 1);
await page.screenshot({ path: `${shots}/6-work-wrong.png`, fullPage: true });
await page.getByRole("link", { name: /^Tất cả \(/ }).click();
await page.waitForURL(/all=1/);
ok("work: 'Tất cả' shows 11", (await page.getByTestId("work-entry").count()) === 11);
await page.goto(`${workUrl}?unit=../../etc`);
ok("work: unknown unit falls back to the list", (await page.getByTestId("work-summary-htl-1").count()) === 1);
await page.goto(formUrl);
await unitBox("htl-1").check();
const evLink = page.getByRole("link", { name: "Xem câu sai →" });
ok("form: evidence links to wrong answers in a new tab", (await evLink.getAttribute("href"))?.endsWith("/work?unit=htl-1") && (await evLink.getAttribute("target")) === "_blank");
```

Note: "Bạn đề xuất M3" relies on the earlier saved session where htl-1 got M3 (`tap(level("htl-1", 3))`). If the flow saved a different level, read it from the file and match that level.

In the "assignment ended" block, after `ok("ended assignment: form URL is 404", …)` add:

```js
ok("ended assignment: work URL is 404", (await page.goto(workUrl)).status() === 404);
```

- [ ] **Step 2: Parent flow** — in `e2e/preview-flow.mjs`, the last page object is `p` (dark context, parent role). Insert just before `await browser.close();`:

```js
await p.goto(`${BASE}/parent`);
await p.getByRole("link", { name: "Xem bài làm" }).first().click();
await p.waitForURL(/\/parent\/students\/[0-9a-f-]{36}\/work$/);
ok("parent: work page opens", (await p.getByRole("heading", { name: /Bài làm của/ }).count()) === 1);
await p.screenshot({ path: `${shots}/dark-parent-work.png`, fullPage: true });
```

- [ ] **Step 3: Student flow** — in `e2e/student-flow.mjs`, before the dark-mode block:

```js
const [{ id: sid }] = await sql(`select id from public.students where full_name = 'Hạnh Nguyên'`);
await page.goto(`${BASE}/tutor/${sid}/work`);
ok("student: tutor work page not reachable", !page.url().includes("/tutor/"), page.url());
```

- [ ] **Step 4: Run e2e**

Linux/CI-like box: `./e2e/run.sh`. On Windows, Docker Desktop running:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src:ro" mcr.microsoft.com/playwright:v1.63.0-noble bash -c '
set -e; mkdir /app && cd /src && tar --exclude=./node_modules --exclude=./.next --exclude=./e2e/out --exclude=./.env.local -cf - . | (cd /app && tar xf -)
cd /app && find . -path ./node_modules -prune -o \( -name "*.sh" -o -name "*.mjs" -o -name "*.py" \) -print | xargs sed -i "s/\r$//"
mkdir -p /opt/pw-browsers && ln -s "$(ls -d /ms-playwright/chromium-*/chrome-linux*/chrome | head -1)" /opt/pw-browsers/chromium
npm ci --no-audit --no-fund >/dev/null 2>&1; git config --global --add safe.directory /app; ./e2e/run.sh'
```

Expected: every line `PASS`, exit 0 (previous 72 + 12 new).

- [ ] **Step 5: Commit**

```bash
git add e2e
git commit -m "e2e: tutor/parent work view, wrong-only filter, guards"
```

---

### Task 4: Docs, full verification, push

**Files:**
- Modify: `docs/SPEC.md` (§0 build-decisions table), `docs/DESIGN.md` (routes table), `docs/P1_PLAN.md` (slice table), `docs/PROGRESS.md` (status table + new top entry)

- [ ] **Step 1: SPEC.md §0** — append rows to the build-decisions table (same `| date | decision | where |` format):

```markdown
| 05/10/2026 | Công cụ gia sư (T1–T5): bài về nhà làm giấy, GS chữa buổi sau, không tính mức M/mục tiêu tuần; đề/ảnh qua link Google Drive (≤ 3); hạn mặc định +3 ngày; con thấy nhận xét; "Bài làm của con" không gồm phần điền bước | `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` |
```

- [ ] **Step 2: DESIGN.md** — add to the routes table after `/tutor/[studentId]`:

```markdown
| `/tutor/[studentId]/work`, `/parent/students/[studentId]/work` | tutor (assigned), parent | "Bài làm của con": per-unit summary (level, answers, common error codes, latest proposal) → one unit's answers, wrong only by default (`?unit=…&all=1`); read-only, RLS |
```

- [ ] **Step 3: P1_PLAN.md** — add a row after S3 in the slice table:

```markdown
| 3b | **S3b** | Công cụ gia sư: A "Bài làm của con" (không SQL) → B giao bài về nhà (SQL 0007) — spec `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` | 🟡 A: PR · B: ⬜ | ✅ |
```

- [ ] **Step 4: PROGRESS.md** — status table row `| S3b — Công cụ gia sư | p1-tutor-tools | 🟡 A: PR mới, không SQL · B: ⬜ |` and a new top entry `## 05/10/2026 — S3b phần A: "Bài làm của con"` with sections Đã làm / Đã tự kiểm (real test counts from Step 5) / Phụ huynh cần làm (no SQL; try: tutor → "Xem bài làm" → a unit → wrong answers; parent → Tổng quan → "Xem bài làm"; merge) / Ghi chú kỹ thuật (`StudentWork` is reused by S4; filter via search params).

- [ ] **Step 5: Full verification**

Run, in order: `npm run lint`, `npm test`, `npm run build`, e2e (Task 3 Step 4). All must pass; copy the counts into PROGRESS.md.

- [ ] **Step 6: Commit and push** (pushing `p1-*` auto-opens the PR; CI does not auto-run on bot PRs → dispatch it)

```bash
git add docs
git commit -m "Docs: S3b part A report, decisions T1-T5"
git push -u origin p1-tutor-tools
gh workflow run ci.yml --ref p1-tutor-tools
```

Expected: PR opened against `main`; CI `check` = success on the pushed SHA.
