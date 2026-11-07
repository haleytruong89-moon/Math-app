# Thi thử (mock exams, Đề 57–68) — design

Status: **approved by the parent 06/11/2026** (four choices below, all the recommended option). **Code built 07/11 (`p1-slice-9`, migration 0015)** — see §8 for what differs from this text.
Decision row: `docs/SPEC.md` §0, 06/11/2026. Reserved papers: `docs/CONTENT_STANDARD.md` §6 (Đề 57–68 are never used as content).

## 1. Why

The 12 papers Đề 57–68 of the 68-paper book were kept untouched since 06/10 for mock exams from ~01/2027. The app has no way to
schedule them, record a score or turn the lost points into study work. The book has **no solutions**, so a score sheet has to be
written for every paper.

## 2. What (v1)

The student sits the paper **on paper**, like the real exam (120 minutes, 10 points, Bài 1–5). The app handles the schedule, a
timer, the per-part score and the follow-up.

| Step | Who | App |
|---|---|---|
| 1. Schedule | tutor or parent | pick a paper (57–68) and a date. Student home shows a card "Thi thử Đề 57 — <thứ, ngày> · 120 phút · làm trên giấy" from 3 days before |
| 2. Sit | student | "Bắt đầu" → 120-minute countdown → "Nộp bài" (records start/finish only; nothing is typed). The parent prints the paper from the PDF |
| 3. Grade | **tutor** (parent choice 06/11) | the **score sheet** of the paper: every part (ý) with its max points, the final answer / key idea to check against, and the KU(s) it tests. Points per part in steps of 0,25, optional error code E01–E15 and a short note |
| 4. Results | everyone | total /10, per Bài, a line of the mock scores against the 8,5 and 9,5 targets; **KUs that lost points** (sum of lost points per KU) |
| 5. Follow-up | tutor / parent | **suggestion only** (parent choice 06/11): each KU that lost points has "★ Cần tập trung" and "Ôn lại (D+1)" buttons; nothing changes by itself |
| 6. Student review | student | after grading: points per part and links to the KUs to review — **no answers** (parent choice 06/11); the full solution is gone through with the tutor |

**Schedule** (parent choice 06/11): one paper a month in 01–03/2027 (Đề 57, 58, 59), then one a week from 04/2027 to early 06/2027
(Đề 60–68). The app suggests the next paper and a date; the adult confirms.

## 3. Score sheets (content, written by Claude)

- One file for all papers, `content/thi-thu.json` (`{papers: [...]}`; a folder would be read as a content module), loaded **server-side only** (never by `/student/*` before
  the attempt is graded, and never the `answer` field for the student at all).
- Per part: `key` ("1.1", "4.2b"…), `max` (points), `answer` (final answer or key idea, short, TeX allowed), `units` (1–2 KU ids
  from `curriculum.json`). The sum of `max` per Bài matches the paper (Bài 1 1,5 · Bài 2 1,5 · Bài 3 2,5 · Bài 4 4,0 · Bài 5 0,5)
  and the total is 10 — checked by a test.
- **No problem text** is copied: the student must not meet the paper before sitting it, and the app should not reproduce the book.
  The adult reads the paper from the PDF / the printout.
- Part max points follow the Hà Nội answer-key style (the book prints only the points per Bài); the tutor can correct them before
  the paper is used.
- Quality: every answer computed with sympy (geometry by coordinates), then a blind solve by a second agent, then the tutor reads
  the sheet before the first use (same pipeline as content, `CONTENT_STANDARD.md` §7). Sheets for Đề 57–59 before 01/2027.

## 4. Data (migration 0015)

```
mock_exams   id, student_id → students, paper smallint check 57..68, scheduled_on date,
             started_at, finished_at, graded_by → profiles, graded_at, total numeric(4,2),
             created_by → profiles, created_at;  unique (student_id, paper)
mock_scores  exam_id → mock_exams on delete cascade, part text check '^[1-5](\.[0-9][a-c]?)?$',
             points numeric(3,2) check (points >= 0 and points*4 = floor(points*4)),
             error_code text check E01–E15, note text ≤ 300;  primary key (exam_id, part)
```

RLS: parent of the student and active tutor of the student read and write (`is_parent_of`, `is_active_tutor_of`); the student reads
own rows, and `mock_scores` only once `graded_at` is set. `points ≤ max` and "every part scored" are checked in the server action
against the score sheet (the sheet lives in git, not in the database). Applied by the parent with "Áp dụng SQL", as always.

## 5. Screens

| Route | Who | Content |
|---|---|---|
| `/tutor/[studentId]/thi-thu` | tutor | list of the 12 papers (chưa hẹn / đã hẹn / đã làm – chờ chấm / đã chấm), schedule form, scores line |
| `/tutor/[studentId]/thi-thu/[paper]` | tutor | score sheet + grading form; after grading: results + follow-up buttons |
| `/parent` Tổng quan + `/parent/thi-thu` | parent | same list and results (read + schedule); "Cần chú ý": a paper finished > 3 days and not graded |
| `/student` home card, `/student/thi-thu/[paper]` | student | upcoming card, timer page, then the graded result (points per part, KUs to review) |

Weekly report (S8a) gets one line per graded mock (total, weakest Bài) — no extra AI call.

## 6. Out of scope (v1)

AI grading of photos of the written work (not reliable enough for proofs); typing answers into the app; showing answers or
solutions to the student; a timer that locks anything; papers other than 57–68.

## 7. Plan

1. Code slice `p1-slice-9` (migration 0015, screens, tests, e2e flows for tutor grading and student view) — after the parent says go.
2. Score sheets Đề 57–59 (`p1-thithu-1`) before 01/2027; Đề 60–68 in 02–03/2027.

## 8. As built (07/11/2026, `p1-slice-9`)

- Migration `0015_p1_mock_exams.sql` as in §4, plus `mock_exams.comment` (≤ 500, the tutor's comment the student reads).
  RLS tests in `supabase/tests/rls.test.mjs`.
- Score sheets: one file `content/thi-thu.json`, schema + rules in `src/lib/content/mock.ts`; empty until the sheets of
  Đề 57–59 are written (`p1-thithu-1`). A paper without a sheet can be scheduled; the grading page says "chưa có phiếu chấm".
- Logic in `src/lib/learning/mock.ts` (status, `suggestNext`, `mockTotals`, `lostByUnit`, `checkScores`, `gradeOverdue`,
  `upcomingForStudent`), writes in `src/app/thi-thu/actions.ts`, views in `src/components/mock/`.
- Grading is the tutor's only (parent choice); the parent schedules, cancels, reads and uses ★ / "Ôn lại".
- The tutor can grade from the paper's date even if the student did not press Bắt đầu/Nộp (sat it without the app),
  and can re-grade (points are replaced).
- "Ôn lại ngày mai" works only for a KU that already has a review row (the student passed its exit); otherwise the
  tutor/parent is told to use ★.
- **Not built yet:** the weekly-report line per graded mock (§5) — v1.1, together with the first real results.
- e2e: `mock-tutor-flow`, `mock-student-flow`, `mock-parent-flow` on the fixture sheet `e2e/fixtures/content/thi-thu.json`.
