# App Toán — Design (as built)

> How the app is actually put together. Product rules live in `docs/SPEC.md`; the slice plan in
> `docs/P1_PLAN.md`; status in `docs/PROGRESS.md`. Update this file in the same PR as any change
> to routes, tables, auth or content format. Last updated: 05/10/2026 (slice 3 + tutor tools + student UX approval).

## 1. Architecture

```
Browser (phone/laptop)
  │  HTML + server-rendered math (KaTeX); never receives answers or service keys
  ▼
Next.js 16 on Vercel (App Router, src/)
  ├─ src/proxy.ts ............ optimistic session refresh + redirect to /login (no authorization)
  ├─ src/lib/dal.ts .......... getCurrentUser / requireRole — the real authorization gate
  ├─ pages (server components) read through RLS with the user's Supabase client
  ├─ server actions .......... requireRole → zod validation → ownership check → admin client write
  └─ /api/cron/ping .......... daily keep-alive (CRON_SECRET), D19
  ▼
Supabase (Postgres + Auth)
  ├─ RLS on every table; clients may only SELECT
  └─ all writes via service_role from server actions
GitHub Actions: CI on PRs · auto-open PR for p[0-9]-* branches · weekly DB backup (D19)
```

Key choices
- **Role** lives in `auth.users.raw_app_meta_data.role` (users can't edit it); a trigger creates `profiles`.
- **Authorization** = `requireRole()` in every page, layout and action (never the proxy alone).
- **Writes** never come from the browser's Supabase client: RLS grants SELECT only, so a tampered client can't write.
- **Grading on the server** (`src/app/learn/actions.ts`); the browser gets prompts/options only (`PublicUnit`).
- **Content in the repo as JSON** (D16), validated by tests; the DB stores only what students did.

## 2. Routes

| Route | Role | What |
|---|---|---|
| `/login` | public | email + password |
| `/` | any | redirect to the role's home |
| `/parent` | parent | "Tổng quan" per student (`StudentOverview`): 3 numbers (M3+ by display level, overdue reviews, open flags), "Cần chú ý" (tutor/system mismatch flags + "Chốt mức"; missed sessions by weekly schedule, last 7 days = backdate limit, up to yesterday), unit map (display level, "bố mẹ chốt"), this week's summary |
| `/parent/accounts` | parent | create/lock accounts, reset password, tutor assignment; **students**: profile list (login email or "chưa có tài khoản", tutors), rename/grade, delete (type the name again; cascades all learning data + deletes the linked login), "tạo tài khoản cho …" preselects the profile (`?student=`) |
| `/parent/content`, `/parent/content/[unitId]` | parent | the roadmap: core KUs grouped by content batch, then "Học thêm khi dư thời gian" (P2, LT17) (S10: Chờ duyệt / Cần duyệt lại / Đã duyệt / Chưa soạn + "đã xem x/y"; "Góp ý cần sửa" block with one copy button for a Claude content session) + preview that records nothing (D16); on a KU page, "Mở khoá cho con" per child for whom it is locked (`unlockUnit`) |
| `/tutor` | tutor | assigned students (RLS) + date of the last session this tutor logged. Tutor pages use a wide layout (`max-w-6xl`) with per-student tabs (`TutorTabs`) |
| `/tutor/[studentId]/bai` | tutor | S10 Kho bài: filters Chờ duyệt / Đã duyệt / Chưa soạn / Tất cả (`?loc=`), search (`?q=`), module groups, status + "đã xem x/y", ☆/★ priority (`editPriorities`), aside: priority order ↑↓ |
| `/tutor/[studentId]/bai/[unitId]`, `/parent/content/[unitId]/duyet` | tutor, parent | S10 Duyệt (`ReviewWorkbench`): item list with ✓ ! ↻ ·, the item in full (answer, hints, solution, wrong answers + codes, source) → "Đạt" / "Cần sửa" + note (`reviewItem`, redirects to the next item to review); "Duyệt cả bài" (`approveUnit`) when allowed, else the reason; "Trả lại để sửa" (`returnUnit`) once approved |
| `/tutor/[studentId]/bai/[unitId]/thu` | tutor | "Làm thử như con": the lesson player in preview mode (the tutor previews like the parent: graded, nothing recorded) |
| `/tutor/[studentId]` | tutor | S11 **Hôm nay**: to-dos — KUs waiting for review (top 3 + "Xem tất cả"), homework this tutor gave and hasn't corrected (`OpenHomework`: done first, then due date; S9/T9 "Trên app từ khi giao" via `homeworkAppResult(…, items)`; "Đã chữa" + note), "Chưa ghi buổi dạy ngày …" (`sessionDue`, from the assignment's weekdays); aside: priority list, "Tuần này của con" (`weekSummary`: study days /4, practice right/total, review runs). `/tutor` redirects here when the tutor has one student |
| `/tutor/[studentId]/buoi` | tutor | S11 **Buổi dạy** (`SessionShort`): date → chips of priority + in-progress KUs, search for the rest → per ticked KU the evidence (system level, answers, last exit, practice rate, last active, parent-confirmed level, "Xem câu sai →" new tab) + level M0–M4 → note (500, counter) → `saveTeachingSession` (no homework fields any more); last 5 own sessions |
| `/tutor/[studentId]/giao` | tutor | S11 **Giao bài** (T9): KU picker (approved units, ★ priorities first) → "Chọn từng câu" (practice items only, rendered prompts, quick-select + L1/L2/L3, "con hay sai", "giống đề thi") / "Cả bài" / "Bài trên giấy" → due date, note, ≤ 3 links (non-Drive warning) → `assignHomework` (no session) |
| `/tutor/[studentId]/work`, `/parent/students/[studentId]/work` | tutor (assigned), parent | "Bài làm của con" (`StudentWork`): per-unit summary (level, answers, error codes seen ≥ 2×, latest proposal) → one unit's answers, wrong only by default (`?unit=…&all=1`): student answer, right answer, error code + content feedback, "lần sau làm đúng", solution. Read-only, RLS |
| `/student` | student | D18 consent gate → greeting header with weekly ring (`HomeHeader`) → "Hôm nay cần làm" grouped: reviews → homework cards (open, and corrected ones for 7 days; "Con làm xong rồi"; S9 "Làm trên app" link when the homework names an approved unit — that unit counts as unlocked in `loadStudentState`) → in progress → "Bài mới": up to 2 suggestions (LT3) with "Đã biết rồi? Làm bài kiểm tra luôn" on test-out KUs (LT4) |
| `/student/learn/[unitId]` | student | worked example → faded → practice → exit test (approved units only; locked → back to `/student`); `?testout=1` on a test-out KU not yet started = exit test only, once |
| `/student/recap/[unitId]` | student | LT16 "Ôn lại": read-only theory + worked example of an approved KU, opened in a new tab from a wrong answer's link; records nothing |
| `/student/homework/[id]` | student | T9: the hand-picked items of an open homework as practice (`PracticeStage` with `homeworkId`), "Xong bài về nhà" at the end; the home card says "Làm N câu trên app" |
| `/student/review` | student | mixed review of the ≤ 5 most overdue units (LT8), interleaved, one session per day; an unfinished run resumes with its own units; `QuestionFeedback` after each answer |
| `/student/journey` | student | "Hành trình của con": summary (Đã vững / Đang học / Chưa bắt đầu) + track A/B/C (core KUs) → one collapsible module each, then "Học thêm khi dư thời gian" (P2 KUs by module) (open = work in progress, else the first suggestion's module); node: plant emoji per display level, next review, "bố mẹ chốt", 🔒 "Khoá — cần đạt M3: …" or "Sắp có" |
| `/api/cron/ping` | Vercel Cron | heartbeat upsert |

## 3. Data model (migrations in `supabase/migrations/`, applied by the parent in order)

| Table | Purpose | Written by |
|---|---|---|
| `profiles` (0001) | role, display name, active flag per auth user | trigger + parent actions |
| `students` (0001) | learner records; `profile_id` links a login; `consent_at` (D18) | parent / consent action |
| `parent_students`, `tutor_assignments` (0001; `weekdays` 0008) | who may see which student; ended assignments keep history (D3); `weekdays` 1–7 = teaching days for the missed-session reminder | parent actions |
| `heartbeat` (0001) | keep-alive row | cron |
| `unit_progress` (0003; `testout_run`, `testout_at` 0009) | per student × unit: worked example viewed, faded done; the one test-out run (both null or both set) | learn actions |
| `attempts` (0003) | every graded answer: mode faded/practice/exit/review, correct, error code, duration, run id | learn actions |
| `attempts.hint_level` (0010) | AI2: highest pre-written hint opened before a practice answer, 0–3 (default 0); right after H2+ is not right first time (`rightUnaided`) | `checkAnswer` |
| `review_queue` (0004, 0005) | next review per unit: stage 1/2/3 = D+1/7/21, 4 = maintenance (60 days); `completed_at` = M4 | learn actions |
| `review_log` (0004) | every finished review, for a later FSRS upgrade (D14) | learn actions |
| `review_runs` (0011) | audit H1: one server-planned review run — `items` = planned questions `"<unit>/<item>"` in order; `finished_at` null = open, unique per student while open. RLS read: parent, active tutor, the student | `checkReview` (creates), `finishReview` (closes) |
| `item_reviews` (0012) | T7: one verdict per row (`ok` / `fix` + note) on an item or `_lesson` (theory + worked + faded); `grading_hash` + `content_hash` of what was reviewed (server-computed, `review.ts`); latest row per unit × item wins. RLS read: parent, tutors with an active assignment | `reviewItem` |
| `unit_approvals` (0012) | T7: `approve` / `return` (+ note) per KU, latest wins. RLS read: any signed-in user | `approveUnit`, `returnUnit` |
| `tutor_priorities` (0012) | T8: ordered focus KUs per student (position 1–20, unique). RLS read: parent, active tutor, the student | `editPriorities` |
| `teaching_sessions` (0006) | one lesson: student, tutor, date taught (≤ today, ≤ 7 days back), note ≤ 500 | `saveTeachingSession` |
| `tutor_proposals` (0006) | per session × unit: tutor's level 0–4 + snapshot of the system level and answer count shown at the time (D8); composite FK pins student/tutor to the session | `saveTeachingSession` |
| `homework` (0007; 0013: `items text[]`, `session_id` optional) | T9: `items` = hand-picked practice items of `unit_id` done in the app (graded, recorded as practice — `checkAnswer({ homeworkId })` skips the worked-example gate for them); null = whole KU or paper; given from Giao bài without a session. Before 0013 — homework given in a session: unit (or "Khác"), task ≤ 300, 0–3 `https://` links (Drive), due date, student `done_at`, tutor `reviewed_at` + note; composite FK to the session. RLS: parent, own active tutor, the student. Never graded, not in mastery/weekly goal | `saveTeachingSession`, `reviewHomework`, `setHomeworkDone` |
| `unit_unlocks` (0009) | manual unlock per student × KU (LT2): `unlocked_by`, `unlocked_at`, unique pair. RLS read: parent, active tutor, the student | `unlockUnit` (parent) |
| `parent_confirmations` (0008) | parent's confirmed level per unit (D8): level, `system_level` snapshot, proposal session, note. Display only — shown while the system level equals the snapshot. RLS: parent, active tutor, the student | `confirmLevel` |

RLS read rule for learning tables: `is_parent_of(student) or is_active_tutor_of(student) or is_self_student(student)`
(security-definer helpers in 0001). **Every new table needs explicit GRANTs to `service_role`** (Supabase no longer
grants them automatically — this broke account creation once, see 0002).

Teaching tables read rule: `is_parent_of(student) or (tutor_id = auth.uid() and is_active_tutor_of(student))` —
a tutor sees only their own sessions and only while assigned (D3); students don't read them.

Not stored: system mastery (computed from `attempts` by `src/lib/learning/rules.ts`). Parent-confirmed levels arrive in S4.

## 4. Content

- Roadmap: `content/curriculum.json` (LT1) — 17 modules, 50 KUs `{id, module, title, track A/B/C, seq, prereq, examWeight, grading, testOut, batch}`; zod schema + `checkCurriculum` in `src/lib/content/curriculum.ts` (ids, per-track seq, prereqs exist / acyclic / earlier in the same track, testOut only track B or `backfill-*`, every file listed with matching title/domains).
- Files: `content/<module>/module.json` (`domains`, legacy `domain` accepted) + one `<unit>.json` per knowledge unit. **Registry:** `npm run content:index` regenerates `src/lib/content/registry.generated.ts` (static imports of every file + the curriculum); `npm test` fails when it is stale, CI fails if it points at `e2e/fixtures`. A KU in the curriculum without an approved file is "Sắp có".
- Schema: `src/lib/content/schema.ts` (zod). Unit = theory, worked example (steps + "why"), faded example
  (text steps + blanks that are items), practice items, exit items, optional figure.
- Items: `mcq` (options, correct index, per-option mistakes), `numeric` (exact answer like `27/5`, `2√3`, typical wrong answers), or `steps` (S6b, LT5: shared stem + 2–5 mcq/numeric steps, ids `<item>-s<n>`; one question — right only if every step is, error code / feedback / review of the first wrong step; answer = step answers joined by `|`). Figures (LT7): unit or item `figure` = the built-in drawing or `{ svg, alt }` checked by `src/lib/content/svg.ts` and rendered inline (`SvgFigure`).
  Error codes E01–E15. IDs are prefixed with the unit id. Levels L1–L3.
- Authoring fields (CONTENT_STANDARD, S6a+): item `source`, `recognition: true`, `hints` (exactly 3), mistake `review` (a prerequisite KU id). They stay on the server — `publicItem` is a whitelist; hints and "Ôn lại" links are shown from S6b.
- `src/lib/content/standard.ts` (`checkStandard`, run on every file by `npm test`): practice 3 L1 + 3 L2 + 2 L3 with ≥ 1 recognition MCQ (wrong options E05), 3 hints per practice item (≤ 25 words, no answer of 2+ characters as a token), exit bank 2 L1 + 3 L2 + 3 L3 without hints and with ≥ 1 `source`, `review` ∈ prerequisites (`ancestors`). `STANDARD_EXEMPT` = htl-1, htl-2 until batch 1.
- Text: plain Vietnamese with `$…$` TeX and `**bold**`, rendered server-side by `texToHtml` (KaTeX, throws on bad TeX).
- What a student sees (`studentView` in `src/lib/content/review.ts`, loaded by `src/lib/content/approvals.ts`): units with `status: "approved"` in git (whole; H2 lock), or units approved in the app (S10, T7): latest approval `approve`, lesson block `ok`, and only `ok` items (≥ 4 practice, ≥ 5 exit) — `fix` / `changed` items are hidden. Item status: `ok` survives wording edits, a changed grading key or any edit after `fix` → `changed` ("↻ xem lại"). Every student gate (`learn/actions.ts`, learn/recap pages, `loadStudentState`, S9 assignable) goes through `studentUnit` / `studentModules`. Git approval (status + `approvedOn` + `npm run content:lock`) still works for content approved outside the app.
- `npm test` checks every file: schema, unique IDs, answers parse, mistakes ≠ answer, TeX renders, module lists files.

## 5. Grading and learning rules

- `src/lib/content/grade.ts`: accepts equivalent exact forms (`12/5` = `2,4`; `2√3` = `√12` = `2·√3`), never rounded
  decimals of irrational answers; unreadable input → "format hint", not counted.
- Practice: one graded try per item, wrong items return once at the end. Faded blanks: retry until right,
  solution after the 2nd wrong try. Exit test: no feedback until submitted; blanks count as wrong.
  Exit bank (LT13, `src/lib/learning/exit-draw.ts`): a run shows 5 of the bank (1 L1 + 2 L2 + 2 L3), unseen first, then seen longest ago, seeded by student + unit + number of past runs; the learn page sends only those, `submitExit` re-draws and refuses another set; both read the history with `exitHistory` (one unit, exit answers only). The exit stage keeps the set it opened with, so the result still lists the answered items after the post-submit re-render. `loadStudentState` reads attempts in pages of 1000 (Supabase API "Max rows"); the e2e fake applies the same cap. Banks ≤ 5 are used whole; the parent preview gets the whole bank with a note.
- `src/lib/learning/rules.ts` (pure, unit-tested): mastery M0–M4, confidence (< 5 answers), review schedule,
  interleaving, review item picking (least recently answered), weekly study days (Vietnam time, Mon–Sun).
- Reaching M3 in an exit test inserts the first review (D+1).
- Review questions come from **practice items only** (review shows solutions; exit-test items stay unseen until a retake).
  Runs are planned by the server (audit H1, 0011): `reviewSession` (state.ts) returns the open run's planned questions
  (minus units no longer due) or a new plan (`newReviewPlan`: 3 least recently answered practice items per unit, LT8 units,
  interleaved). The page writes nothing; the first `checkReview` saves the plan as the student's one open run (a stale open
  run with nothing due is closed first; another tab's run wins the unique index). `checkReview` accepts only planned
  questions, once each (`exit_run` = run id). `finishReview` refuses while `reviewRunProgress().remaining` is non-empty,
  closes the run (conditional update), then scores the first answer per question. Reload resumes the run; a fully answered,
  unsaved run reopens on its rating screen.
- Approved items are locked (audit H2): `content/approved.lock.json` + `src/lib/content/lock.ts` / `lock.test.ts`;
  `npm run content:lock` (`scripts/content-lock.ts`) adds newly approved items, `--relock <id>` accepts a deliberate change.
- T8 priorities: `tutor_priorities` KUs join the unlock set in `loadStudentState` (open at once, P2 wait skipped) and come first in `suggestNew(seq, priorities)`; the LT3 cap (2 in progress) stays.
- Sequencing (`src/lib/learning/sequence.ts`, pure, unit-tested): status open / locked / comingSoon — open when every prerequisite is at **system** M3, manually unlocked, or already started (never re-locked); in progress = started, below M3, not in review; `suggestNew` = none at 2 in progress, else first open track-A KU + first open B/C KU (batch → track → seq); a **P2** KU (LT17, `priority` in curriculum.json) only once every P0/P1 KU of its track is at system M3, or after a manual unlock — and no core KU may depend on a P2 KU (`checkCurriculum`); `splitTestOut` keeps the test-out run's answers out of mastery (pass still gives M3 + D+1, `workedViewed || testoutPassed`); `selectReviewUnits` = open run's units first, else the 5 most overdue. `loadStudentState` returns `roadmap`, `modules`, `suggestions`, `reviewedToday`; `todaysReview` = today's units + how many wait.
- S6b practice: hint box H1→H3 (H2+ → requeued, `hint_level`), multi-step items step by step (`checkAnswer({ step })` grades one step, records nothing; "Hoàn thành câu" records the whole item), "Ôn lại: …" links (new tab), SVG figures. Exit / review take a multi-step item at once (`StepsInput`); review shows hints only after answering. Badge "Cần gia sư xác nhận" (LT6, `needsTutor`: grading partial/tutor) on home cards, the journey map and the parent's unit map.
- Tutor session form rules: `src/lib/learning/session.ts` (`parseSession`, unit-tested). A ticked unit needs a level;
  a session with no unit needs a note. The action (`src/app/tutor/actions.ts`) re-checks an active tutor profile and an
  active assignment with the admin client, inserts the session then the proposals, and deletes the session if the
  proposals fail.

## 6. Operations

| Thing | Where |
|---|---|
| Env vars (names only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `CRON_SECRET` on Vercel; `SUPABASE_DB_URL` as GitHub secret. Never in chat or the repo. |
| Deploy | merge to `main` → Vercel production; every branch → preview URL (shares the production DB) |
| Keep-alive | `vercel.json` cron 01:00 UTC → `/api/cron/ping` |
| Backup | `.github/workflows/weekly-backup.yml` (Sunday 02:00 VN) → 90-day artifact |
| New SQL | `.github/workflows/apply-sql.yml` "Áp dụng SQL" (parent, by hand, before merging the PR): backup dump → `scripts/apply-migration.sh <file> <dir>` = one transaction + row in `app_meta.applied_migrations` (file, time, git sha, sha256); refuses 0001–0010, a file already applied, files with their own `begin/commit` |
| CI | `.github/workflows/ci.yml`: no-e2e-patch guard, lint, tests, build |
| Auto PR | `.github/workflows/auto-pr.yml` for `p[0-9]-*` / `fix-*` branches |

## 7. Testing

| Command | Covers |
|---|---|
| `npm run test:content` | grading, content files, learning rules (node --test) |
| `npm run test:db` | migrations + RLS on PGlite with a stubbed auth schema |
| `./e2e/run.sh` | real browser (Playwright, preinstalled Chromium) against the dev server with PGlite instead of Supabase: parent preview flow + student flow (learn → exit → review scheduling → interleaved review → maintenance) + tutor flow (evidence, missing level, save, guards, ended/locked tutor) + S6a curriculum flows on a **fixture registry** (`e2e/fixtures/content`, built by `make-fixtures.mjs`; run.sh regenerates the registry with `--fixtures` and restores it): suggestions, unlock, test-out pass/fail/once, 2-in-progress cap, manual unlock, 5-unit review + next day. Temporarily patches `dal.ts`, `supabase/server.ts`, `supabase/admin.ts`, `next.config.ts` and reverts on exit. |

## 9. Student theme (05/10/2026)

Spec `docs/superpowers/specs/2026-10-05-student-ux-design.md` (supersedes `docs/HANDOVER_STUDENT_UX.md`).
- `.student-theme` (globals.css) overrides the tokens for everything inside the student layout — light cream/teal and a warm dark set; parent/tutor keep the default tokens.
- Mastery emoji/gradients: `src/components/student/mastery.ts` (🌰 M0 "Chưa bắt đầu" … ⭐ M4 "Đã vững").
- `QuestionFeedback` (practice + review only; faded steps and the exit test keep the old flow): correct → "Chính xác!" + session total + solution + level nudge (`masteryNudge`, real rules); wrong → "Gần đúng rồi!" (known mistake) / "Chưa đúng", error label (`errorLabel`, Vietnamese), "Con trả lời / Đáp án đúng", solution, only "Câu tiếp".
- `checkAnswer`/`checkReview` return `answerHtml`, `correctHtml` (faded: only when the solution may show), `errorCode`, and practice `mastery` (real student only).
- **LT9 (05/10):** with 50 KUs the journey map is grouped track → module; only the module(s) in progress are expanded, the rest collapse to one row with a bar; KUs without approved content show "Sắp có" (built in S6a).

## 8. Gotchas

- Next 16: `proxy.ts` not middleware; async `params`; ESLint CLI; read `node_modules/next/dist/docs/` before using an API.
- React compiler lint: no `Date.now()` during render; refs must be named `…Ref` to be mutated in handlers.
- Don't `revalidatePath` in an action whose page would re-render into a different state mid-flow (`finishReview`).
- Forms whose save can be refused must not use `<form action>`: React resets the form after the action and wipes
  the user's choices. `SessionForm` submits via `onSubmit` + `startTransition(formAction)` and remounts on success.
- Vietnam dates come from `vnDate()`; never compare against `new Date().toISOString().slice(0,10)` (UTC).
