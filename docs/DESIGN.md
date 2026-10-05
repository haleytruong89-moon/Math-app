# App Toán — Design (as built)

> How the app is actually put together. Product rules live in `docs/SPEC.md`; the slice plan in
> `docs/P1_PLAN.md`; status in `docs/PROGRESS.md`. Update this file in the same PR as any change
> to routes, tables, auth or content format. Last updated: 05/10/2026 (after student UX approval).

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
| `/parent` | parent | overview (P0 shell; real numbers in S4) |
| `/parent/accounts` | parent | create/lock accounts, reset password, students, tutor assignment |
| `/parent/content`, `/parent/content/[unitId]` | parent | content list + preview that records nothing (D16) |
| `/tutor` | tutor | shell (S3: "Ghi buổi dạy") |
| `/student` | student | D18 consent gate → "Hôm nay cần làm": weekly goal, progress map, reviews → in progress → next new |
| `/student/learn/[unitId]` | student | worked example → faded → practice → exit test (approved units only) |
| `/student/review` | student | mixed review of all due units, interleaved |
| `/api/cron/ping` | Vercel Cron | heartbeat upsert |

## 3. Data model (migrations in `supabase/migrations/`, applied by the parent in order)

| Table | Purpose | Written by |
|---|---|---|
| `profiles` (0001) | role, display name, active flag per auth user | trigger + parent actions |
| `students` (0001) | learner records; `profile_id` links a login; `consent_at` (D18) | parent / consent action |
| `parent_students`, `tutor_assignments` (0001) | who may see which student; ended assignments keep history (D3) | parent actions |
| `heartbeat` (0001) | keep-alive row | cron |
| `unit_progress` (0003) | per student × unit: worked example viewed, faded done | learn actions |
| `attempts` (0003) | every graded answer: mode faded/practice/exit/review, correct, error code, duration, run id | learn actions |
| `review_queue` (0004, 0005) | next review per unit: stage 1/2/3 = D+1/7/21, 4 = maintenance (60 days); `completed_at` = M4 | learn actions |
| `review_log` (0004) | every finished review, for a later FSRS upgrade (D14) | learn actions |

RLS read rule for learning tables: `is_parent_of(student) or is_active_tutor_of(student) or is_self_student(student)`
(security-definer helpers in 0001). **Every new table needs explicit GRANTs to `service_role`** (Supabase no longer
grants them automatically — this broke account creation once, see 0002).

Not stored: system mastery (computed from `attempts` by `src/lib/learning/rules.ts`). Tutor-proposed and
parent-confirmed levels arrive in S3/S4.

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
| `./e2e/run.sh` | real browser (Playwright, preinstalled Chromium) against the dev server with PGlite instead of Supabase: parent preview flow + student flow (learn → exit → review scheduling → interleaved review → maintenance). Temporarily patches `dal.ts`, `supabase/server.ts`, `supabase/admin.ts`, `next.config.ts` and reverts on exit. |

## 9. Student theme (approved 05/10/2026)

> Mockup: `https://claude.ai/artifact/LNFSgD23tfTxRb3Yi7vWbJ` (3 artboards).
> Full handover: `docs/HANDOVER_STUDENT_UX.md`.

Student routes use a **warm teal engagement theme** instead of the default ink-blue admin theme.
Parent and tutor routes keep the original theme unchanged.

**Scoping:** A `.student-theme` CSS class on the student layout overrides the design tokens
in `globals.css` for student routes only. No changes to parent/tutor routes.

| Token | Default (admin) | Student theme |
|---|---|---|
| `--bg` | `#eef2f5` | `#FFF8F0` (warm cream) |
| `--accent` | `#2454a6` | `#0D9488` (teal-600) |
| `--accent-soft` | `#e5edf7` | `#CCFBF1` (teal-100) |
| `--good` | `#1f7a4d` | `#059669` (emerald-600) |
| `--good-soft` | `#e1f2e8` | `#D1FAE5` (emerald-100) |
| `--warn` | `#9a6a1e` | `#D97706` (amber-600) |
| `--warn-soft` | `#f6ecd9` | `#FEF3C7` (amber-100) |

**Mastery badges:** Emoji plant metaphor replaces `M{n}` text in colored circles.

| Level | Emoji | Node gradient | Border |
|---|---|---|---|
| M0 | 🔒 | gray, dashed, opacity 0.5 | `#D1D5DB` |
| M1 | 🌱 | `#EDE9FE` → `#DDD6FE` | `#8B5CF6` |
| M2 | 🌿 | `#DBEAFE` → `#BFDBFE` | `#2563EB` |
| M3 | 🌳 | `#CCFBF1` → `#99F6E4` | `#0D9488` |
| M4 | ⭐ | `#FEF3C7` → `#FDE68A` | `#F59E0B` |

**Key components changed:**
- `WeeklyGoal`: linear bar → SVG circle ring (stroke-dasharray/dashoffset).
- `ProgressMap`: 2-col grid → vertical path map with emoji nodes and gradient connectors. **Updated 05/10 (Q9):** with 50 KUs the map is grouped track → module; only the module(s) in progress are expanded, the rest collapse to one row with a progress bar (structure built in S6a, plant styling in the UX slice).
- `QuestionFeedback` (new): 2-state card — correct (green gradient, 🎉, session-only correct count, mastery nudge) and wrong (yellow gradient, 💡, side-by-side comparison, error tag, encouragement).
- Student layout: teal gradient header with greeting.

**D17 compliance:** Session correct count in QuestionFeedback is client-side `useState` only — not stored,
not persistent, not a streak. No leaderboards anywhere.

**No DB changes:** All data for the new components comes from existing `loadStudentState()`, `dueReviews()`,
`systemMastery()`, and grading response data.

## 8. Gotchas

- Next 16: `proxy.ts` not middleware; async `params`; ESLint CLI; read `node_modules/next/dist/docs/` before using an API.
- React compiler lint: no `Date.now()` during render; refs must be named `…Ref` to be mutated in handlers.
- Don't `revalidatePath` in an action whose page would re-render into a different state mid-flow (`finishReview`).
- Vietnam dates come from `vnDate()`; never compare against `new Date().toISOString().slice(0,10)` (UTC).
