# Tutor workspace — design (T7–T9, S10 + S11)

> Parent decisions 19/10/2026 (SPEC §0 T7–T9, "Tutor workspace"); mockup "Bàn làm việc gia sư"
> (5 artboards, Claude Design) approved by the parent 20/10/2026. Build decisions marked **[20/10]** were
> **confirmed by the parent on 20/10/2026** (all four: hide "Cần sửa" items + approve rule; the 10 approved KUs
> are not re-reviewed; priorities open at once but the LT3 cap of 2 in progress stays; no "Theo dạng" for now).
> Build order: S10 complete → parent runs SQL 0012 + merges → S11.

## 1. Problem (UX audit 19/10)

The tutor's only screen is a ~13 000 px phone form listing all 50 KUs. She cannot see which KUs are drafted or
approved, cannot review content, cannot set what to practise first, and can only give paper homework tied to a
logged session. The tutor is responsible for content quality (T7) but has no tool for it.

## 2. Screens (per student, tabs; 2 columns ≥ 1024 px, 1 column on phones)

| Tab | Route | Slice | Content |
|---|---|---|---|
| Hôm nay | `/tutor/[studentId]` | S11 | To-dos: KUs waiting for review · homework to correct (with the app result) · session not logged yet. Aside: priority list, "Tuần này của con" |
| Kho bài | `/tutor/[studentId]/bai` | S10 | Filters Chờ duyệt / Đã duyệt / Chưa soạn / Tất cả + search; module groups; per KU status, items reviewed x/y, ⭐ priority, Duyệt / Xem. Aside: priority order ↑↓ |
| Duyệt | `/tutor/[studentId]/bai/[unitId]` | S10 | Left: lesson block + every practice/exit item with ✓ / ! / · ; right: the item in full (prompt, options with the right one, answer, hints, solution, wrong answers + error codes) → Đạt / Cần sửa + note; header "Duyệt cả bài", "Làm thử như con" |
| Giao bài | `/tutor/[studentId]/giao` | S11 | Pick an approved KU → Cả bài / Chọn từng câu (practice items, quick-select by level, badges "con hay sai") or paper-only; due date, note to the student, ≤ 3 Drive links. Aside: what is assigned now + results |
| Buổi dạy | `/tutor/[studentId]/buoi` | S11 | 3 steps: date + duration · chips of taught KUs (priority + in progress, search for others) · level M0–M4 only for ticked KUs + note |
| Bài làm | `/tutor/[studentId]/work` | exists | unchanged |

The parent reviews with the same Duyệt screen at `/parent/content/[unitId]/duyet` (parallel role, T7) and sees all
"Cần sửa" notes on `/parent/content` with one copy button (to hand to a Claude content session).

## 3. Approval model (T7) **[20/10]**

- Content stays in git (D16). Review and approval move to the DB:
  - `item_reviews` (one row per verdict; the latest row per unit × item counts). `item_id = "_lesson"` is the
    theory + worked example + faded example block.
  - `unit_approvals` (approve / return, latest counts).
- Every verdict stores two hashes computed on the server from the current content:
  `grading_hash` (options and order, right option, right value, steps — same key as the H2 lock, `lock.ts`)
  and `content_hash` (the whole item JSON). Item status: **unseen** · **ok** · **fix** · **changed**
  (`fix` and the item's content has changed since → "Đã sửa, xem lại"; or `ok` and the grading key has changed).
- What a student sees of a unit (`studentView`):
  - git `status: "approved"` → the whole unit, as today (the H2 lock protects it). The 10 approved units are not
    re-reviewed.
  - otherwise: the latest approval is `approve`, the lesson block is `ok`, and only **ok** items are shown
    (`fix` / `changed` items are hidden until reviewed again); the unit is hidden if fewer than 4 practice or
    5 exit items are ok.
- "Duyệt cả bài" needs: lesson block ok, no item unseen or changed, ≥ 4 practice ok, ≥ 5 exit ok. Items marked
  "Cần sửa" may stay (hidden from the student).
- Who: the parent, or a tutor with an active profile and at least one active assignment. Reviews and approvals
  are content-wide (not per student).

## 4. Priorities (T8)

`tutor_priorities` per student: ordered KU list (≤ 20), set by the assigned tutor or the parent. Effect: those KUs
**open immediately** (added to the unlock set, like T6 homework and the parent's manual unlock, so P2 waits are
skipped too) and come **first in "Bài mới"**; the LT3 cap (at most 2 KUs in progress) stays **[20/10]**. A
priority on a KU that is not approved yet has no effect for the student until it is.

## 5. Item homework (T9) **[20/10]**

- `homework` gains `items text[]` (practice item ids of `unit_id`; null = whole unit) and `session_id` becomes
  optional (homework can be given from the Giao bài tab without logging a session).
- Only **practice** items can be picked (exit items stay unseen, LT13). Answers are graded on the server and
  recorded as `practice` (they count toward mastery, T9); the worked-example gate is skipped for items of an open
  homework of that student.
- "Theo dạng" (by problem type) is **not built**: items carry no type tag. S11 offers whole KU, hand-picked items
  with quick-select by level (L1/L2/L3) and "con hay sai" badges.
- Adding it later is cheap and needs no SQL or rework: homework stores item ids, so "Theo dạng" is only a filter.
  (1) Content: an optional `form` field per item (3–6 forms per KU, list agreed with the tutor); one content session
  tags the existing KUs, new batches tag as they are written (CONTENT_STANDARD). A tag doesn't touch the grading key,
  so approved items stay approved (H2 lock / `grading_hash`). (2) Code: schema field + a "Theo dạng" tab that
  pre-ticks the items of the chosen forms — about half a day.

## 6. Data (migrations; numbers checked against main + open PRs on 20/10)

| No. | Slice | Change |
|---|---|---|
| 0011 | audit fix (PR #25) | `review_runs` |
| **0012** | S10 | `item_reviews`, `unit_approvals`, `tutor_priorities` |
| **0013** | S11 | `homework.items`, `homework.session_id` nullable |
| 0014 | S8 | AI tutor (was 0012) |

RLS: `item_reviews` read by parent and active tutors only; `unit_approvals` read by any signed-in user;
`tutor_priorities` read by parent / active tutor of the student / the student. All writes through server actions
with `service_role`. Students' views read reviews through a server-only loader with the admin client (content
metadata only, no student data).

## 7. Out of scope

AI (S8), "Theo dạng", per-student content, review of the 10 already-approved KUs, editing content in the app.
