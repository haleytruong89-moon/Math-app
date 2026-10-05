# App Toán — Design (as built)

> How the app is actually put together. Product rules live in `docs/SPEC.md`; the slice plan in
> `docs/P1_PLAN.md`; status in `docs/PROGRESS.md`. Update this file in the same PR as any change
> to routes, tables, auth or content format. Last updated: 03/10/2026 (after slice 3).

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
| `/parent` | parent | "Tổng quan" per student (`StudentOverview`): 3 numbers (M3+ by display level, overdue reviews, open flags), "Cần chú ý" (tutor/system mismatch flags + "Chốt mức"; missed sessions by weekly schedule, 14 days, up to yesterday), unit map (display level, "bố mẹ chốt"), this week's summary |
| `/parent/accounts` | parent | create/lock accounts, reset password, tutor assignment; **students**: profile list (login email or "chưa có tài khoản", tutors), rename/grade, delete (type the name again; cascades all learning data + deletes the linked login), "tạo tài khoản cho …" preselects the profile (`?student=`) |
| `/parent/content`, `/parent/content/[unitId]` | parent | content list + preview that records nothing (D16) |
| `/tutor` | tutor | assigned students (RLS) + date of the last session this tutor logged |
| `/tutor/[studentId]` | tutor | "Ghi buổi dạy": date → tick units (all units, drafts included) → evidence (+ "Xem câu sai →", new tab) → level M0–M4 → note → "Giao bài về nhà" rows → save; "Bài đã giao chưa chữa" + "Đã chữa" (note) on top; last 5 own sessions |
| `/tutor/[studentId]/work`, `/parent/students/[studentId]/work` | tutor (assigned), parent | "Bài làm của con" (`StudentWork`): per-unit summary (level, answers, error codes seen ≥ 2×, latest proposal) → one unit's answers, wrong only by default (`?unit=…&all=1`): student answer, right answer, error code + content feedback, "lần sau làm đúng", solution. Read-only, RLS |
| `/student` | student | D18 consent gate → "Hôm nay cần làm": weekly goal, progress map, reviews → homework cards (open, and corrected ones for 7 days; "Con làm xong rồi") → in progress → next new |
| `/student/learn/[unitId]` | student | worked example → faded → practice → exit test (approved units only) |
| `/student/review` | student | mixed review of all due units, interleaved |
| `/api/cron/ping` | Vercel Cron | heartbeat upsert |

## 3. Data model (migrations in `supabase/migrations/`, applied by the parent in order)

| Table | Purpose | Written by |
|---|---|---|
| `profiles` (0001) | role, display name, active flag per auth user | trigger + parent actions |
| `students` (0001) | learner records; `profile_id` links a login; `consent_at` (D18) | parent / consent action |
| `parent_students`, `tutor_assignments` (0001; `weekdays` 0008) | who may see which student; ended assignments keep history (D3); `weekdays` 1–7 = teaching days for the missed-session reminder | parent actions |
| `heartbeat` (0001) | keep-alive row | cron |
| `unit_progress` (0003) | per student × unit: worked example viewed, faded done | learn actions |
| `attempts` (0003) | every graded answer: mode faded/practice/exit/review, correct, error code, duration, run id | learn actions |
| `review_queue` (0004, 0005) | next review per unit: stage 1/2/3 = D+1/7/21, 4 = maintenance (60 days); `completed_at` = M4 | learn actions |
| `review_log` (0004) | every finished review, for a later FSRS upgrade (D14) | learn actions |
| `teaching_sessions` (0006) | one lesson: student, tutor, date taught (≤ today, ≤ 7 days back), note ≤ 500 | `saveTeachingSession` |
| `tutor_proposals` (0006) | per session × unit: tutor's level 0–4 + snapshot of the system level and answer count shown at the time (D8); composite FK pins student/tutor to the session | `saveTeachingSession` |
| `homework` (0007) | homework given in a session: unit (or "Khác"), task ≤ 300, 0–3 `https://` links (Drive), due date, student `done_at`, tutor `reviewed_at` + note; composite FK to the session. RLS: parent, own active tutor, the student. Never graded, not in mastery/weekly goal | `saveTeachingSession`, `reviewHomework`, `setHomeworkDone` |
| `parent_confirmations` (0008) | parent's confirmed level per unit (D8): level, `system_level` snapshot, proposal session, note. Display only — shown while the system level equals the snapshot. RLS: parent, active tutor, the student | `confirmLevel` |

RLS read rule for learning tables: `is_parent_of(student) or is_active_tutor_of(student) or is_self_student(student)`
(security-definer helpers in 0001). **Every new table needs explicit GRANTs to `service_role`** (Supabase no longer
grants them automatically — this broke account creation once, see 0002).

Teaching tables read rule: `is_parent_of(student) or (tutor_id = auth.uid() and is_active_tutor_of(student))` —
a tutor sees only their own sessions and only while assigned (D3); students don't read them.

Not stored: system mastery (computed from `attempts` by `src/lib/learning/rules.ts`). Parent-confirmed levels arrive in S4.

## 4. Content

- Files: `content/<module>/module.json` + one `<unit>.json` per knowledge unit; registered in `src/lib/content/index.ts`.
- Schema: `src/lib/content/schema.ts` (zod). Unit = theory, worked example (steps + "why"), faded example
  (text steps + blanks that are items), practice items, exit items, optional figure.
- Items: `mcq` (options, correct index, per-option mistakes) or `numeric` (exact answer like `27/5`, `2√3`,
  typical wrong answers with error codes E01–E15). IDs are prefixed with the unit id.
- Text: plain Vietnamese with `$…$` TeX and `**bold**`, rendered server-side by `texToHtml` (KaTeX, throws on bad TeX).
- Students see `status: "approved"` units only; the parent previews drafts. Approval = PR that flips status + `approvedOn`.
- `npm test` checks every file: schema, unique IDs, answers parse, mistakes ≠ answer, TeX renders, module lists files.

## 5. Grading and learning rules

- `src/lib/content/grade.ts`: accepts equivalent exact forms (`12/5` = `2,4`; `2√3` = `√12` = `2·√3`), never rounded
  decimals of irrational answers; unreadable input → "format hint", not counted.
- Practice: one graded try per item, wrong items return once at the end. Faded blanks: retry until right,
  solution after the 2nd wrong try. Exit test: no feedback until submitted; blanks count as wrong.
- `src/lib/learning/rules.ts` (pure, unit-tested): mastery M0–M4, confidence (< 5 answers), review schedule,
  interleaving, review item picking (least recently answered), weekly study days (Vietnam time, Mon–Sun).
- Reaching M3 in an exit test inserts the first review (D+1). `finishReview` scores the first answer per question in the run.
- Review questions come from **practice items only** (review shows solutions; exit-test items stay unseen until a retake).
  Reloading `/student/review` resumes the latest unfinished run (`planReview`: review answers for a due unit with no
  `review_log` row for that run), so answered questions count and aren't asked again.
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
| CI | `.github/workflows/ci.yml`: no-e2e-patch guard, lint, tests, build |
| Auto PR | `.github/workflows/auto-pr.yml` for `p[0-9]-*` / `fix-*` branches |

## 7. Testing

| Command | Covers |
|---|---|
| `npm run test:content` | grading, content files, learning rules (node --test) |
| `npm run test:db` | migrations + RLS on PGlite with a stubbed auth schema |
| `./e2e/run.sh` | real browser (Playwright, preinstalled Chromium) against the dev server with PGlite instead of Supabase: parent preview flow + student flow (learn → exit → review scheduling → interleaved review → maintenance) + tutor flow (evidence, missing level, save, guards, ended/locked tutor). Temporarily patches `dal.ts`, `supabase/server.ts`, `supabase/admin.ts`, `next.config.ts` and reverts on exit. |

## 8. Gotchas

- Next 16: `proxy.ts` not middleware; async `params`; ESLint CLI; read `node_modules/next/dist/docs/` before using an API.
- React compiler lint: no `Date.now()` during render; refs must be named `…Ref` to be mutated in handlers.
- Don't `revalidatePath` in an action whose page would re-render into a different state mid-flow (`finishReview`).
- Forms whose save can be refused must not use `<form action>`: React resets the form after the action and wipes
  the user's choices. `SessionForm` submits via `onSubmit` + `startTransition(formAction)` and remounts on success.
- Vietnam dates come from `vnDate()`; never compare against `new Date().toISOString().slice(0,10)` (UTC).
