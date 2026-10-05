# App Toán (math-app)

Web app helping Hạnh Nguyên (grade 9) learn math and prepare for the grade-10 entrance exam. Shared by three roles: parent (admin), tutor, student.

**Source of truth for product decisions:** `claude/PJ_APP_TOAN.md` in the "STUDY BB" claude.ai Project. **Repo copy: `docs/SPEC.md`** (D1–D19, non-goals, user stories, acceptance criteria, architecture, plus build decisions in §0) — read it if you can't reach the Project. As-built design: `docs/DESIGN.md`. Do not change a decision in code without updating both.

@AGENTS.md

## Stack
- Next.js 16 (App Router, TypeScript, `src/` dir) on Vercel — read `node_modules/next/dist/docs/` before using any Next API (e.g. `middleware` is now `proxy`; request APIs are async; `next lint` is gone → `npm run lint` uses ESLint CLI).
- Tailwind CSS v4 (tokens in `src/app/globals.css` via `@theme`).
- Supabase (Postgres + Auth). **RLS on every table.** The `service_role` key is server-only (env var on Vercel), never shipped to the browser, never pasted into chat.

## Conventions
- UI text in Vietnamese; code, comments, commit messages, file names in English.
- Design tokens come from the approved mockups (ink-blue accent, mastery scale m0–m4, Libre Franklin / Source Serif 4 / IBM Plex Mono). No streaks or leaderboards anywhere (D17).
- Small commits per checkpoint; run `npm run lint` and `npm run build` before committing.

## Build workflow (P1+)
- Plan: `docs/P1_PLAN.md`; status, open questions and the latest report: `docs/PROGRESS.md` — read both first.
- Curriculum (48 KUs: 40 core + 8 P2, tracks, prerequisites, timeline 12/10/2026 → 31/03/2027, content batches): `docs/CURRICULUM.md`; its decisions are LT1–LT18 in `docs/SPEC.md` §0. AI design (hints, guardrails, eval, budget): `docs/AI_TUTOR.md` (AI1–AI4). Student UI: `docs/HANDOVER_STUDENT_UX.md` (progress map superseded by LT9). **Writing content: follow `docs/CONTENT_STANDARD.md`** (item mix, error codes, sources, QA).
- Migration numbers are global across branches: check `supabase/migrations/` on `main` **and** open PRs before picking the next number.
- One branch per slice (`p1-slice-N`), never push `main`; pushing a `p[0-9]-*` branch auto-opens a PR. The parent runs new SQL in Supabase and merges.
- Before pushing: `npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh` (browser + in-memory DB; patches auth temporarily and reverts itself).
