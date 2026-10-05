# Student UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Warm-teal student theme, home with greeting header + weekly ring + grouped cards + journey teaser, a new `/student/journey` page, and a two-state `QuestionFeedback` card for practice and review — per the approved mockup with U1–U8.

**Architecture:** Theme = token overrides under `.student-theme` (light + dark) wrapping the whole student layout. Pure helpers (`masteryNudge`, `greeting`, `errorLabel`, `praise`) are unit-tested. `checkAnswer`/`checkReview` return extra fields (`answerHtml`, `correctHtml`, `errorCode`, practice `mastery`), built from the existing `work.ts` answer formatter. UI components live in `src/components/student/`; players swap `Feedback` for `QuestionFeedback` in practice and review only.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 tokens, `node --test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-05-student-ux-design.md` (U1–U8). Error names: parent's list 05/10 (mục 26 master plan), decision (a): English canonical, Vietnamese shown to the student.

## Global Constraints
- UI text Vietnamese; no "Thử lại" after grading (U1); session count "Đúng x/y câu lượt này", never consecutive (U2, D17); M0 = 🌰 "Chưa bắt đầu" (U3); greeting header only on `/student`, not sticky (U4).
- No DB change; grading, mastery rules, review schedule, today-list selection unchanged.
- Faded steps keep their reveal rule (correct answer only when right or after 2 wrong tries).
- Student input rendered escaped (reuse `work.ts` formatting); parent/tutor routes keep the old theme.
- Weekly ring keeps `role="progressbar"`, `aria-valuenow`, `aria-label="Mục tiêu tuần"` and the visible text "x/4 buổi".

## Review Focus
1. **Practice answer for an item the student already answered this session (re-queued item)** → feedback still renders; the session count counts it as one more answer (x/y counts answers shown, not unique items) — Task 1 test on `sessionTally`.
2. **Mastery nudge at boundaries** (exactly 5 first tries at 60%; 0 answers; M4) → correct text, never "lên M3 nhờ luyện" — Task 1 tests.
3. **Unknown / missing error code** → chip shows the bare code or nothing, never "undefined" — Task 1 test.
4. **Parent preview of a unit** (no student, nothing written) → feedback card renders without the nudge — Task 3 (server returns no `mastery` for preview) + preview e2e.
5. **Dark mode** → student pages use the student dark tokens (no cream background with light text) — Task 2 CSS + dark screenshot in e2e.

---

## File Structure
| File | Responsibility |
|---|---|
| `src/lib/content/errors.ts` (+ test) | E01–E15: `ERROR_CODES` {code, en, vi}; `errorLabel(code, lang)` |
| `src/lib/learning/student-ux.ts` (+ test) | `greeting(date)`, `masteryNudge(m)`, `praise(i)`, `sessionTally(results)` |
| `src/lib/content/public.ts` (modify) | `CheckResult` gains `answerHtml?`, `correctHtml?`, `errorCode?`, `mastery?` |
| `src/app/learn/actions.ts` (modify) | fill new fields; practice `mastery` recomputed after insert |
| `src/lib/learning/work.ts` (modify) | export `answerHtml`, `correctHtml` (already written there) |
| `src/app/globals.css` (modify) | `.student-theme` tokens light + dark |
| `src/app/student/layout.tsx` (modify) | theme wrapper |
| `src/components/student/mastery.ts` | emoji/label/gradient per level |
| `src/components/student/home-header.tsx` | greeting + weekly ring |
| `src/components/student/question-feedback.tsx` | correct/wrong card |
| `src/app/student/page.tsx` (modify) | header, grouped list, teaser; drop old map |
| `src/app/student/journey/page.tsx` | journey page |
| `src/components/lesson/lesson-player.tsx`, `review-player.tsx` (modify) | use `QuestionFeedback` |
| `e2e/student-flow.mjs`, `e2e/preview-flow.mjs` (modify) | updated + new checks |
| docs | SPEC §0 U1–U8, DESIGN §9 + route, HANDOVER copy, PROGRESS |

---

### Task 1: Pure helpers (errors + student UX)

**Interfaces — produces:**
- `ERROR_CODES: readonly { code: string; en: string; vi: string }[]`; `errorLabel(code: string | null | undefined, lang?: "vi" | "en"): string | null` → `"E04 — Chưa hiểu khái niệm"`, unknown code → the code, null/empty → null.
- `greeting(at: Date): "Chào buổi sáng" | "Chào buổi chiều" | "Chào buổi tối"` (VN hour < 11 / < 18 / else).
- `type NudgeInput = { level: number; practiceCount: number; practiceRight: number }`; `masteryNudge(m: NudgeInput): { text: string; progress?: { done: number; total: number } }` (rules in spec §4; window 5, M2 needs ≥ 60% = 3/5).
- `praise(i: number): string` (cycles a fixed list).
- `sessionTally(results: boolean[]): { right: number; total: number }`.

- [ ] Step 1: tests `src/lib/content/errors.test.ts`, `src/lib/learning/student-ux.test.ts`:

```ts
// errors.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES, errorLabel } from "./errors.ts";
test("15 error codes E01–E15 with English (canonical) and Vietnamese names", () => {
  assert.equal(ERROR_CODES.length, 15);
  assert.deepEqual(ERROR_CODES.map((e) => e.code), Array.from({ length: 15 }, (_, i) => `E${String(i + 1).padStart(2, "0")}`));
  assert.equal(ERROR_CODES[3].en, "Concept Gap");
});
test("labels: Vietnamese for the student, English on request, bare code if unknown, null if none", () => {
  assert.equal(errorLabel("E10"), "E10 — Sơ ý");
  assert.equal(errorLabel("E10", "en"), "E10 — Careless Error");
  assert.equal(errorLabel("E99"), "E99");
  assert.equal(errorLabel(null), null);
  assert.equal(errorLabel(""), null);
});
```

```ts
// student-ux.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { greeting, masteryNudge, praise, sessionTally } from "./student-ux.ts";
const vn = (h: number) => new Date(`2026-10-05T${String(h).padStart(2, "0")}:30:00+07:00`);
test("greeting by Vietnam hour", () => {
  assert.equal(greeting(vn(7)), "Chào buổi sáng");
  assert.equal(greeting(vn(11)), "Chào buổi chiều");
  assert.equal(greeting(vn(18)), "Chào buổi tối");
});
test("nudge follows the real mastery rules", () => {
  assert.deepEqual(masteryNudge({ level: 1, practiceCount: 2, practiceRight: 2 }), { text: "Làm thêm 3 câu luyện để hệ thống đánh giá lên M2", progress: { done: 2, total: 5 } });
  assert.deepEqual(masteryNudge({ level: 0, practiceCount: 0, practiceRight: 0 }), { text: "Làm thêm 5 câu luyện để hệ thống đánh giá lên M2", progress: { done: 0, total: 5 } });
  assert.deepEqual(masteryNudge({ level: 1, practiceCount: 5, practiceRight: 2 }), { text: "Cần đúng thêm 1 câu trong 5 câu gần nhất để lên M2", progress: { done: 2, total: 5 } });
  assert.equal(masteryNudge({ level: 2, practiceCount: 5, practiceRight: 3 }).text, "Làm bài kiểm tra cuối để lên M3");
  assert.equal(masteryNudge({ level: 3, practiceCount: 5, practiceRight: 5 }).text, "Qua lượt ôn D+21 để lên M4");
  assert.equal(masteryNudge({ level: 4, practiceCount: 5, practiceRight: 5 }).text, "Đã vững — giữ phong độ khi ôn nhé");
});
test("praise cycles; session tally counts every graded answer", () => {
  assert.equal(praise(0), praise(3 * 1000 % 3));
  assert.notEqual(praise(0), praise(1));
  assert.deepEqual(sessionTally([true, false, true]), { right: 2, total: 3 });
  assert.deepEqual(sessionTally([]), { right: 0, total: 0 });
});
```

- [ ] Step 2: run → FAIL (modules missing).
- [ ] Step 3: implement `src/lib/content/errors.ts` (table from the parent's list + Vietnamese names approved 05/10: Tính toán sai · Biến đổi đại số sai · Nhớ sai công thức · Chưa hiểu khái niệm · Chưa nhận ra dạng bài · Chưa tìm được hướng giải · Chưa chuyển đề thành mô hình · Đọc hoặc vẽ hình sai · Lập luận chứng minh chưa chặt · Sơ ý · Trình bày thiếu hoặc sai · Hổng kiến thức nền · Chưa phân bổ thời gian · Sai điều kiện, miền hoặc đơn vị · Sai do máy tính hoặc làm tròn) and `src/lib/learning/student-ux.ts`; add `src/lib/content/errors.test.ts` is already covered by the `test:content` glob.
- [ ] Step 4: run → PASS; `npm run test:content` green. Commit.

### Task 2: Server fields + theme + components
- `work.ts`: export `answerHtml`, `correctHtml`.
- `public.ts`: `CheckResult` understood branch gains `answerHtml?: string; correctHtml?: string; errorCode?: string | null; mastery?: { level: number; practiceCount: number; practiceRight: number }`.
- `checkAnswer`: `answerHtml` always; `correctHtml` only when `showSolution`; `errorCode` from grading; for `mode === "practice"` and a real student, after the insert reload the unit's attempts (admin, `student_id`, `unit_id`) + `unit_progress.worked_viewed_at`, compute `systemMastery` and `practiceFirstTries(...).slice(-5)` → `mastery`.
- `checkReview`: `answerHtml`, `correctHtml`, `errorCode`.
- `globals.css`: `.student-theme` light/dark tokens (spec §1).
- `student/layout.tsx`: wrap header + main in `<div className="student-theme min-h-dvh bg-bg text-ink">`.
- `components/student/mastery.ts`: `MASTERY[level] = { emoji, label, from, to, ring }` (U3 + handover gradients).
- `components/student/question-feedback.tsx` (client): props `{ result, mode: "practice" | "review", tally, index, onNext, nextLabel }`; correct/wrong layouts per spec §4 using `errorLabel`, `praise`, `masteryNudge`.
- Lint + build. Commit.

### Task 3: Screens
- `components/student/home-header.tsx`: greeting header + ring (spec §2).
- `student/page.tsx`: header replaces h1/WeeklyGoal; grouped list (each group `<section>` with badge + `<ul>`; review group first); teaser link to `/student/journey`; old `ProgressMap` removed (keep `ConsentScreen`, `HomeworkCard`).
- `student/journey/page.tsx`: requireRole student + consent gate, `loadStudentState`, confirmations (S4) → summary strip + per-module path (spec §3), nodes `role="listitem"` with `data-testid="node-<unitId>"`.
- Players: practice + review use `QuestionFeedback` with an in-session `boolean[]` of results; practice wrong shows "Câu này sẽ quay lại cuối bài".
- Lint + build + test:content. Commit.

### Task 4: e2e
- `student-flow.mjs`: home checks → "0/4 buổi" in the ring card; "chưa đủ dữ liệu" ×2 and M3/M4/"bố mẹ chốt" checks move to `/student/journey` nodes; practice: after the first answer "Chính xác!" + "Đúng 1/1 câu lượt này" + nudge "Làm thêm 4 câu luyện"; a wrong practice answer → "Con trả lời", "Đáp án đúng", "Câu này sẽ quay lại cuối bài", no button "Thử lại"; journey summary strip; dark screenshot of home + journey.
- `preview-flow.mjs`: "Chưa đúng." → "Chưa đúng" card title; preview has no nudge.
- Run e2e (container). Commit.

### Task 5: Docs + verify + push
SPEC §0 U1–U8 + error-name decision (a); DESIGN §9 student theme (from handover, corrected) + `/student/journey`; `docs/HANDOVER_STUDENT_UX.md` from `origin/p1-student-ux-handover` with a header line "Superseded by docs/superpowers/specs/2026-10-05-student-ux-design.md"; PROGRESS entry (+ note: Remediation Router mục 27 covers 7/15 codes — E03, E07, E11, E13, E14, E15 need paths before that feature). Lint, test, build, e2e; push; CI.
