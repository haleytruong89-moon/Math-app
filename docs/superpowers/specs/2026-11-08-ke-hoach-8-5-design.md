# Kế hoạch tới 8,5 — target, progress tests, weekly plan (design)

Status: **draft 08/11/2026 — four choices made by the parent (below); waiting for "làm" before code.**
Decision row: `docs/SPEC.md` §0, 08/11/2026. Brainstorm: parent asked what the student and tutor desks lack for "đồng hành lên
kế hoạch để đạt 8–8,5 điểm thi vào 10, có progress test, đánh giá thường xuyên và planning".

## 1. Why

- The app measures **KUs at M3**, not **points**. "Mốc 8,5" = 38 core KUs solid by 21/02/2027. A KU passed on a 5-question exit test
  does not show that the student scores in a 120-minute paper (proofs, presentation, time).
- The first exam-format measurement is thi thử Đề 57 in 01/2027 → **11–12/2026 have no score measurement**.
- The tutor's only workflow is "ghi buổi dạy" (after the fact). Nobody owns a weekly plan; the student sees a queue ("Hôm nay cần
  làm") and "1/4 buổi", not a plan agreed with the tutor; nothing the tutor writes reaches the student.

## 2. Parent choices (08/11)

| Question | Choice |
|---|---|
| Target in the app | **8,5 is the target**; 9,5 hidden — shown only on the parent's pages as "nâng cao" |
| Progress test format | **Alternate**: paper (tutor grades per part) ↔ in the app (auto-graded) |
| Rhythm before thi thử | **Every 2 weeks**: 22/11 (paper), 06/12 (app), 20/12 (paper), 03/01 (app); thi thử from 01/2027 as designed 06/11 |
| Tutor role | **Tutor agreed** to set the weekly plan (~10′/week) and grade paper progress tests (~20′ every 2 weeks) |

## 3. The loop (4 rhythms)

| Rhythm | What | Who | App |
|---|---|---|---|
| Each session | prepare → teach → log | tutor | (slice C) suggested 3 most-missed items + next KU; log pre-filled |
| Each week | set the week plan → end-of-week check + one comment | tutor | slice B |
| Every 2 weeks (11–12), thi thử (01–03), weekly (04–06) | **Kiểm tra tiến bộ** (progress test) | student sits, tutor grades paper ones | slice A |
| End of phase (22/11, 10/01, 21/02, 31/03) | on track? change the plan or the target | parent + tutor | slice A's target board is the page to decide on |

## 4. Slice A — target board + progress tests (before 22/11)

**Target budget** (content, in git — parent changes it by PR, no SQL), from `CURRICULUM.md` §4.1, draft:

| Bài | Max | Target 8,5 | Note |
|---|---|---|---|
| 1 Thống kê, xác suất | 1,5 | 1,5 | must be sure |
| 2 Căn thức | 1,5 | 1,25 | 2c may be lost |
| 3 Bài toán thực tế + PT | 2,5 | 2,5 | must be sure |
| 4.1 Hình khối | 1,0 | 1,0 | must be sure |
| 4.2 Hình phẳng | 3,0 | 2,25 | a, b sure; c ~0,25 |
| 5 Tối ưu | 0,5 | 0 | accepted loss |
| **Total** | 10 | **8,5** | |

**Progress test ("Kiểm tra tiến bộ", KT1–KT4)** — one content file per test, same shape as a thi thử score sheet (part, max,
key, KUs) plus the problem text:

| Test | Date | Mode | Covers (phase plan) |
|---|---|---|---|
| KT1 | Sun 22/11 | paper, ~60′ | GĐ1: Bài 1, Bài 3 (one HPT word problem), Bài 4.1 |
| KT2 | Sun 06/12 | app, ~35′ | GĐ1 again (retention) + Bài 2a (tính giá trị căn) |
| KT3 | Sun 20/12 | paper, ~75′ | + Bài 2b (rút gọn), PT bậc hai, 4.2a (tứ giác nội tiếp) |
| KT4 | Sun 03/01 | app, ~45′ | all of GĐ2 |

- **Sources:** problems re-written from Đề 1–56 **with new numbers** (the student may have met the originals as KU items);
  Đề 57–68 stay reserved. Same QA as 08/11: sympy, blind solve, AI audit, then approved.
- **Paper tests:** the app shows a printable page (problems only) and a 60/75′ timer; the tutor grades per part on the thi thử
  grading screen (points in 0,25 steps, error code, note). A part the student has not learnt yet can be marked **"chưa học"** —
  left out of the score instead of counting 0.
- **App tests:** a timed session of app-gradable items (fresh, not in any KU pool), each tagged with its part and points; graded
  on submit; no hints, no AI.
- **Data (SQL 0016, parent applies):** `mock_exams` gains `kind` ('mock' | 'progress'); the paper check becomes 57–68 for mock and
  1–20 for progress; app-graded tests record the student's answers and need no `graded_by`. Final shape decided at code time.
- **Target board** (tutor Hôm nay, parent Tổng quan, student home — simplified): per Bài the target, the **latest measured rate**
  (points earned / points tested, from the latest test that covered the part) and how many target points are **not tested yet**;
  KUs that lost points link to "★ / Ôn lại" as in thi thử (suggestion only). Student sees per-Bài points and KUs to review, no
  answers and no total forecast (same rule as thi thử, 06/11).
- **8,5 / 9,5:** milestone views show 8,5 only; 9,5 moves to a "nâng cao" line on the parent pages; thi thử results show 8,5.

## 5. Slice B — weekly plan (after A, ~end of 11)

- The tutor **sets the week** (Mon–Sun): new KUs, reviews, homework, the progress test if any. The app pre-fills a draft from the
  phase plan (current-phase KUs below M3, in order), late KUs, reviews due and the scheduled test; the tutor edits and saves.
  A new KU in the plan opens it (writes the ★ priority — one mechanism, not two).
- **Student home:** "Tuần này: 3/5 việc" replaces "Mục tiêu tuần 1/4 buổi"; the plan's items come first; the tutor's latest
  comment shows at the top ("Cô nhắn: …").
- **End of week:** the app ticks what was done (from the data); the tutor writes one comment (≤ 300 chars) the student reads; the
  parent's weekly report (S8a) gains "kế hoạch / thực tế" and the comment.
- **Tutor "Việc tiếp theo"** also looks at the student's side: overdue reviews, plan items behind, a test waiting for grading.
- Data: new table(s) for the week plan and comment (SQL, number taken at code time).

## 6. Slice C — later

Session prep card generated before each teaching day; "Con bị kẹt" button inside a lesson that puts the item and the student's
attempt on the tutor's Hôm nay; difficulty signal ("9/9 đúng, 40″/câu → bài quá dễ").

## 7. Risks

- Tutor time is the whole loop — agreed 08/11; if it slips, the weekly report shows plans not set.
- Progress-test content is new work every 2 weeks (KT1 due ~19/11).
- A per-Bài "rate" from one half-paper is noisy; the board shows how many points were tested, not a prediction.
