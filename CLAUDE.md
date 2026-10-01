# App Toán (math-app)

Web app helping Hạnh Nguyên (grade 9) learn math and prepare for the grade-10 entrance exam. Shared by three roles: parent (admin), tutor, student.

**Source of truth for product decisions:** `claude/PJ_APP_TOAN.md` in the "STUDY BB" claude.ai Project (decisions D1–D19, non-goals §2.5, user stories §2.6, acceptance criteria §2.7, architecture §3). Do not change a decision in code without updating that doc.

@AGENTS.md

## Stack
- Next.js 16 (App Router, TypeScript, `src/` dir) on Vercel — read `node_modules/next/dist/docs/` before using any Next API (e.g. `middleware` is now `proxy`; request APIs are async; `next lint` is gone → `npm run lint` uses ESLint CLI).
- Tailwind CSS v4 (tokens in `src/app/globals.css` via `@theme`).
- Supabase (Postgres + Auth). **RLS on every table.** The `service_role` key is server-only (env var on Vercel), never shipped to the browser, never pasted into chat.

## Conventions
- UI text in Vietnamese; code, comments, commit messages, file names in English.
- Design tokens come from the approved mockups (ink-blue accent, mastery scale m0–m4, Libre Franklin / Source Serif 4 / IBM Plex Mono). No streaks or leaderboards anywhere (D17).
- Small commits per checkpoint; run `npm run lint` and `npm run build` before committing.
