# S6a Curriculum engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The app follows the 50-KU roadmap (`content/curriculum.json`) instead of file order: unlocks by prerequisites (or parent), suggests 1 Track A + 1 Track B/C KU (max 2 in progress), lets Track B/backfill KUs be tested out once, caps a review session at 5 units/day, and shows the journey map grouped track → module.

**Architecture:** Curriculum data is static JSON validated by zod + `node --test`. A generated registry (`npm run content:index`) statically imports every content JSON (real, or the e2e fixture set). Pure rules live in `src/lib/learning/sequence.ts` (status, suggestions, review selection) and small `rules.ts` changes (test-out). `loadStudentState` adds curriculum entries, unlock rows and test-out state. Migration 0009 adds `unit_unlocks` and `unit_progress.testout_run/testout_at`.

**Spec:** `docs/P1_PLAN.md` §S6a (table "Thiết kế", "Quyết định chi tiết S6a", "Nghiệm thu S6a") + `docs/SPEC.md` §0 LT1–LT4, LT8, LT9 + `docs/CURRICULUM.md` §2, §6 H6, §8.

## Global Constraints
- 50 KU ids / 17 modules exactly as CURRICULUM.md §2/§8; `seq` 10, 20, 30… per track (lists in "Quyết định chi tiết"); H+Q in track A; `batch` per H6 (htl-1/2 = 0); `testOut` true for all track B + f1-hdt, f1-pnt, f1-tgon, f1-qd, f3-dongdang.
- Unlock by **system level ≥ M3** of every prerequisite, or a manual parent unlock (S4b later switches to display level).
- Max 2 KUs in progress; suggestion order: batch ↑ → track B before C → seq ↑.
- Test-out: once per KU; pass = same M3 rule → M3 + review D+1; fail → KU goes "Đang học", its answers don't count for mastery or "câu đã làm", but the attempt day counts as a study day.
- Review: ≤ 5 units per session, most overdue first, 1 session per day; an unfinished session resumes with its own units; parent overdue count unchanged.
- Map: 🔒 Khoá · 🌰 Chưa bắt đầu (open, M0) · "Sắp có" (no approved file, faded). Fits ≤ 2 screens at 390px with one module open.
- Migration only adds; RLS read like other learning tables; writes via server actions (manual unlock: parent only).

## Rulings taken while planning (spec silent)
- R1: a KU the student already started (worked example viewed, test-out tried, or in the review queue) stays open even if its prerequisites are not M3 (no re-locking).
- R2: S6a is stacked on `p1-student-ux` (PR #12) because it reworks the home list and journey page built there; merge order #11 → #12 → S6a. The plan's "branch from main / independent of #11" is overridden.
- R3: e2e for S6a runs on its own dev server with a fixture-only registry; the other flows keep the real registry.

## Tasks
1. **Curriculum data + schema + tests** — `content/curriculum.json`; `src/lib/content/curriculum.ts` (zod schema, `CurriculumUnit`, `CurriculumModule`); `Module.domains` (accept legacy `domain`); `estMinutes ≤ 90`; `content.test.ts`: 50 ids, per-track unique seq, prereq exist / acyclic / smaller seq within the same track, module exists, every KU file listed, `testOut` only track B or `backfill-*`, title/domains match existing files.
2. **Registry generator** — `scripts/content-index.mjs [--fixtures]` → `src/lib/content/registry.generated.ts`; `index.ts` reads it; `npm run content:index`; test fails when the generated file is stale; CI refuses a registry containing `e2e/fixtures`.
3. **Migration 0009 + RLS tests** — `unit_unlocks(student_id, unit_id, unlocked_by, unlocked_at, unique(student_id, unit_id))`; `unit_progress` + `testout_run uuid`, `testout_at timestamptz`.
4. **Pure rules** — `sequence.ts`: `unitStatus`, `inProgress`, `suggestNew`, `selectReviewUnits`; `rules.ts`/state: test-out handling (`workedViewed || testoutPassed`; failed test-out attempts excluded from mastery). Unit tests for every rule above incl. ordering, cap 2, R1, 5-unit cap, resume.
5. **Server** — `loadStudentState` (curriculum entries, unlocks, test-out, status per unit, `reviewedToday`); `submitExit({ testOut })` path; learn page guard (locked/coming soon → back); review page 5-cap + 1/day; `unlockUnit` parent action.
6. **Student UI** — home: up to 2 "Bài mới" suggestion cards (+ "Làm bài kiểm tra luôn" when allowed), "Còn N bài, ôn ngày mai"; LessonPlayer test-out mode (exit only, result explains next step); journey: track → module `<details>` (open = in progress), 🔒 / 🌰 / "Sắp có".
7. **Tutor + parent** — session form KU list from curriculum grouped by module + search, "cần gia sư xác nhận" first; `/parent/content` grouped by batch with Nháp / Đã duyệt / Chưa soạn; unit page "Mở khoá cho con".
8. **e2e** — fixtures (`e2e/fixtures/content/**` + fixture `curriculum.json`, 7+ approved fake KUs) + `e2e/curriculum-flow.mjs` (acceptance list in P1_PLAN) on its own server; adjust existing flows (1 review session per day: backdate `review_log` before the maintenance session).
9. **Docs, verify, review, push** — DESIGN (routes, tables, registry), PROGRESS (report + SQL 0009), P1_PLAN status; lint, test, build, e2e; final review; PR.
