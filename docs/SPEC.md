# App Toán — Product spec (repo copy)

> **Source of truth:** `claude/PJ_APP_TOAN.md` in the claude.ai Project "STUDY BB" (the parent edits it there).
> This file is a copy so every coding session — including Claude Code in VS Code and the nightly
> scheduled runs, which cannot read the Project — works from the same spec.
> Synced: 03/10/2026 from PJ_APP_TOAN v1.0 (01/10/2026) + build decisions below.
> If the two disagree, the Project doc wins; update this copy in the same PR that relies on the change.
> Status columns in §4 are as of 01/10 — current status lives in `docs/PROGRESS.md`.
> Sections kept: §1 goals, §2 decisions D1–D19, §2.5–2.7 non-goals / user stories / acceptance criteria,
> §3 architecture, §4 roadmap, §9–10. Research (§5) and the deliverable inventory (§8) stay in the hub.

## 0. Decisions taken during the build (approved by the parent)

| Date | Decision | Where |
|---|---|---|
| 02/10/2026 | Mastery numbers: M2 = last 5 practice first-tries ≥ 60%; M3 = last exit test ≥ 80% with no error code repeated ≥ 2; M4 = M3 + passed the D+21 review; < 5 answers → "chưa đủ dữ liệu" | `docs/P1_PLAN.md` §2, `src/lib/learning/rules.ts` |
| 02/10/2026 | Review: 3 questions per unit, pass = ≥ 2/3; fail → back to D+1; pass + "easy" → next interval ×1.5 | same |
| 02/10/2026 | Weekly goal = 4 study days/week (Mon–Sun, Vietnam time); a study day = an exit test, a review, or ≥ 5 practice answers | same |
| 02/10/2026 | Units `htl-1`, `htl-2` approved for students | `content/he-thuc-luong/` |
| 02/10/2026 | 8 practice + 5 exit questions per unit for the pilot | content |
| 02/10/2026 | New SQL is pasted into Supabase by the parent; no automatic migrations to the live database | `docs/P1_PLAN.md` §1 |
| 20/10/2026 | **SQL button (replaces the row above):** the parent applies each new migration with the GitHub Actions workflow "Áp dụng SQL" (`apply-sql.yml` + `scripts/apply-migration.sh`): inputs file + PR branch + "CHAY"; it dumps the database first (30-day artifact), runs that one file in one transaction and records it in `app_meta.applied_migrations` (never twice; 0001–0010 refused, applied by hand). Still manual and per file, still before merging; Claude never triggers it and never sees `SUPABASE_DB_URL` | `.github/workflows/apply-sql.yml` |
| 21/10/2026 | **Always light + tutor workspace v2 (mockup approved 21/10):** the app is always light (`<html data-theme="light">`; OS dark mode ignored — everyone is used to white screens; dark tokens kept unused). Tutor workspace: student header + tabs with counts (Hôm nay = homework the student finished + an unlogged teaching day; Kho bài = KUs waiting for review), "Việc tiếp theo" card (`nextAction`: correct finished homework → priority KU to review → unlogged session → any review → give homework), amber Gmail-like priority stars, progress bars, one filled primary button per area, sans-serif UI (serif only for math content), login card | `docs/DESIGN.md` §2, `src/lib/learning/tutor-today.ts` |
| 03/10/2026 | After D+21: keep a **maintenance review every 60 days** until the exam (fail → back to D+1, M4 lost until D+21 is passed again) | rules.ts, migration 0005 |
| 03/10/2026 | **Pilot early**: Nguyên starts with the approved units once S3 (tutor log) is in; S4 parent dashboard and more content follow during the pilot | `docs/P1_PLAN.md` §3 |
| 03/10/2026 | Geometry proof items **C1–C3 (S5) move to after the pilot starts** (deviation from §3.4 / §4 "P1"; hub doc to be updated) | `docs/P1_PLAN.md` §3 |
| 05/10/2026 | Review questions come from **practice items only**; reloading the review page resumes the unfinished run | `src/lib/learning/sequence.ts` (`selectReviewUnits`) |
| 05/10/2026 | **S6a build rulings:** a KU the student already started (worked example viewed, test-out tried, or in the review queue) is **never re-locked**, even if a prerequisite drops below M3; **one review session per day** (after it, home shows "Còn N bài, ôn ngày mai"); an unfinished session resumes with its own units; test-out is offered only before the KU is started | `docs/P1_PLAN.md` S6a, `src/lib/learning/sequence.ts` |
| 05/10/2026 | Tutor tools (T1–T5): homework is done on paper and corrected by the tutor next session, never counted in mastery or the weekly goal (D4 unchanged); task sheets/photos via **Google Drive links** (≤ 3, no file storage in the app); default due date today + 3; the student sees the tutor's correction note; "Bài làm của con" shows practice/exit/review only (no faded steps) | `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` |
| 17/10/2026 | **S9 Tutor assigns app units (T6):** homework may point to **any approved unit** of the app, not only the ones ticked in that session; the student's homework card shows **"Làm trên app"** and that unit **opens even if its prerequisites aren't at M3** (a tutor's homework counts like the parent's manual unlock, LT2); beside each open homework the tutor sees what the student did on that unit in the app since it was given (practice right/total, last exit score, an error code seen ≥ 2×, current level). The tutor's order = due dates. Homework itself is still never graded and not in mastery/weekly goal. No SQL (uses `homework.unit_id`) | `docs/DESIGN.md` §3 |
| 19/10/2026 | **T7 Content review by the tutor (changes D16):** the tutor is the **main reviewer** of drafted KUs; tutor and parent work in parallel and **either can approve** a KU (the tutor is responsible, the parent can also approve or send it back). Review is per item (OK / needs fix + note); notes for fixes are listed on the parent's page with a copy button to hand to Claude. Approval moves from the `status` field in git to a DB record (who, when, content hash), so an approved KU is tied to the exact content approved (also closes audit H2: changing an approved item needs re-approval) | `docs/DESIGN.md` (tutor workspace, after S10) |
| 19/10/2026 | **T8 Tutor priorities:** the tutor keeps an ordered list of focus KUs per student; they come **first in "Bài mới"** and **open immediately** even if prerequisites aren't at M3 (like T6 homework and the parent's manual unlock). Changes LT3 ordering only for those KUs | same |
| 19/10/2026 | **T9 Tutor assigns chosen items:** homework can name a whole KU, one "dạng", or **hand-picked items** of a KU (previewed first); the student does them in the app, the server grades them and they **count as practice toward mastery**. Needs SQL | same |
| 19/10/2026 | **Tutor workspace (UX audit 19/10):** per student 5 tabs — Hôm nay (to-dos) · Kho bài (status Chờ duyệt / Đã duyệt / Chưa soạn, review, ⭐ priority) · Giao bài · Buổi dạy (short form: only taught KUs get a level) · Bài làm của con; 2 columns on laptop. Mockup to be approved by parent + tutor before code | same |
| 05/10/2026 | S4 (P1–P3): tutor schedule = fixed weekdays chosen when assigning (reminder when a scheduled day passes > 24h without a logged session); parent-confirmed level is **display only**, shown while the system level is unchanged since confirming; every confirmation is kept | `docs/superpowers/specs/2026-10-05-parent-overview-design.md` |
| 05/10/2026 | **Student UX** (U1–U8, mockup approved): warm cream + teal theme on student routes only; greeting header with weekly ring on home only; journey page `/student/journey` (🌰 M0 → 🌱 → 🌿 → 🌳 → ⭐); feedback card after practice/review answers — **no "Thử lại"**, session total "Đúng x/y câu lượt này" (not a streak, D17), level nudge by the real rules, "Con trả lời / Đáp án đúng" | `docs/superpowers/specs/2026-10-05-student-ux-design.md` |
| 05/10/2026 | Error names E01–E15 from master plan §26: English canonical, Vietnamese shown to the student | `src/lib/content/errors.ts` |
| 03/10/2026 | Nightly scheduled build at 23:00 (Vietnam) for remaining slices; parent reviews, runs SQL and merges each morning | `docs/PROGRESS.md` |
| 05/10/2026 | **Student UX engagement theme** approved: warm cream bg (`#FFF8F0`), teal accent (`#0D9488`), SVG circle weekly goal, vertical progress map with plant emoji badges (🔒→🌱→🌿→🌳→⭐), 2-state question feedback (celebration green + gentle-wrong yellow). Scoped to student routes only via `.student-theme` CSS class. No DB changes. | `docs/DESIGN.md` §9, `docs/HANDOVER_STUDENT_UX.md` |
| 05/10/2026 | Session correct count in question feedback is **client-side only** (useState) — complies with D17 (no persistent streaks) | same |
| 05/10/2026 | **Curriculum:** 50 KUs in 2 parallel tracks + geometry track + H/Q, per `docs/CURRICULUM.md` (2-track structure and ~90 h estimate) | `docs/CURRICULUM.md` |
| 05/10/2026 | **Timeline:** pilot starts **Mon 12/10/2026**; all 50 KUs learned by **31/03/2027**; April–May = exam papers + maintenance reviews only; exam assumed ~early June 2027 (to confirm when announced) | `docs/CURRICULUM.md` §3 |
| 05/10/2026 | **LT1 Curriculum registry:** machine-readable `content/curriculum.json` (track, sequence, prerequisites, exam weight, grading kind), validated by `npm test`; CURRICULUM.md keeps the explanation | `docs/P1_PLAN.md` S6a |
| 05/10/2026 | **LT2 Unlock:** a KU opens when every prerequisite is at **M3**; the parent can **unlock manually** (new table, migration **0009** — 0006–0008 are taken by S3, homework, S4) | same |
| 05/10/2026 | **LT3 Suggestion:** "Bài mới" offers **1 unlocked KU from Track A + 1 from Track B/C**, student picks; at most **2 KUs in progress** at once (no new suggestion beyond that) | same |
| 05/10/2026 | **LT4 Test-out (rule change):** for Track B and backfill KUs (F1/F3), the student may take the exit test directly, **once per KU**; ≥ 80% (same M3 rule) → M3 + review D+1; below → normal learning, the attempt doesn't count toward mastery | same |
| 05/10/2026 | **LT5 Multi-step items:** new item type `steps` (shared stem + 2–5 MCQ/numeric steps) counts as **one** question; correct only if all steps correct; error code = first wrong step; practice gives per-step feedback; reviews use the whole item | `docs/P1_PLAN.md` S6b |
| 05/10/2026 | **LT6 Tutor-graded parts:** the app holds only auto-gradable items; proofs are done on paper with the tutor. KUs with a tutor part are flagged "cần gia sư xác nhận"; final level via tutor proposal (S3) + parent confirmation (S4). No upload/photo grading in P1 | same |
| 05/10/2026 | **LT7 Figures:** inline **SVG in content JSON** (`figure` field on unit or item), sanitised + validated by tests, colours from theme tokens | same |
| 05/10/2026 | **LT8 Review cap:** at most **5 units per review session** (~15 questions), most overdue first; the rest roll to the next day and still count as overdue for the parent | `src/lib/learning/rules.ts` (`planReview`) |
| 05/10/2026 | **LT9 Progress map:** grouped **track → module**; only the module(s) in progress expanded, others collapsed to one row with a bar; plant badges unchanged | `docs/DESIGN.md` §9 |
| 05/10/2026 | **LT10 Content QA:** Claude drafts per batch; each KU gets an **independent second solve + scripted answer recomputation** before the parent previews; tutor reviews the hard batches (C, E, G) | `docs/P1_PLAN.md` §1 |
| 05/10/2026 | **LT11 Build order:** S3 + tutor tools are already merged and S4 is in PR #11, so the remaining order is S6a (curriculum engine) → student UX → S6b (item types + figures) → content batches, run **in parallel with the pilot** starting 12/10 (week 1 on htl-1/2 in the app + F1 with the tutor on paper) | `docs/P1_PLAN.md` §3 |
| 05/10/2026 | **LT13 Exit pool:** each KU has **8 exit items (2 L1 + 3 L2 + 3 L3)**; every attempt draws **5 (1 L1 + 2 L2 + 2 L3)**, unseen items first; M3 threshold unchanged (≥ 4/5, no repeated error code) | `docs/CONTENT_STANDARD.md` §1 |
| 05/10/2026 | **LT14 Item levels:** practice = **3 L1 + 3 L2 + 2 L3**, ≥ 1 recognition item ("which method?", E05); L4 (mixed, unlabeled) lives in the interleaved review, not in the KU | same §3 |
| 05/10/2026 | **LT15 Sources:** L1–L2 written by Claude with clean numbers; L3 and exam-style items taken/adapted from the 68-exam book + Hà Nội papers with a per-item `source`; the book PDF is not committed to GitHub | same §6 |
| 05/10/2026 | **S6a+ build rulings (LT13):** the draw is deterministic from the student, the unit and their exit history (no table): unseen items first, then the one **seen longest ago**, ties in a seeded order; `submitExit` re-draws and refuses a different set ("Bộ câu kiểm tra đã đổi…", e.g. a second tab). A bank of ≤ 5 items is used whole (htl-1/2 until batch 1). The parent preview shows the whole bank. htl-1/2 are exempt from the authoring checks until normalised (CONTENT_STANDARD §9) | `src/lib/learning/exit-draw.ts`, `src/lib/content/standard.ts` |
| 06/10/2026 | **S6b build rulings (LT5, LT7, LT16, AI2):** practice checks a multi-step item **step by step without recording**; a wrong step shows its feedback, error label and the **right value of that step** so the student carries on; the whole item is graded and recorded once at the end (answers joined by `|`). Faded blanks stay single-answer. Hints are sent with practice items and the browser reports the highest one opened (`hint_level`, student's own data); right after H2+ = not right first time and requeued. Exit test: no hints; review: hints only after answering. "Ôn lại" opens a **read-only recap** (theory + worked example) of any approved KU in a new tab, recording nothing. SVG figures: whitelist of tags/attributes, colours `currentColor` / `none` / `var(--…)`, markers only `url(#id)`, no comments / style / href, viewBox, ≤ 20 KB. | `src/lib/content/svg.ts`, `src/components/lesson/lesson-player.tsx` |
| 05/10/2026 | **LT16 Prerequisite links:** a wrong answer rooted in an earlier KU (E12, or E02/E03 with a backfill cause) carries `review: <KU id>`, shown as "Ôn lại: …"; chosen by the author, never by AI at runtime | same §5 |
| 06/10/2026 | **LT17 Exam-weighted scope:** from the 68-paper index (`docs/SOURCE_INDEX.md`) and the Hà Nội 2025/2026 structure (Bài 1 1,5 · Bài 2 1,5 · Bài 3 2,5 · Bài 4 4,0 · Bài 5 0,5): 8 rarely-tested KUs (f-hamso, f-parabol, e-giaodiem, i-giaitgv, i-ungdung, j-cung, m-vitri, n-ngoainoi) → **P2**, suggested only after their track's P0/P1 KUs reach M3 or by manual unlock; optimisation merged 5 → 3 (h-bdt into hq-amgm, hq-nangcao dropped). **48 KUs: 40 core + 8 P2** | `docs/CURRICULUM.md` §2, §4 |
| 06/10/2026 | **LT18 Geometry earlier:** Track C starts **week 7 (23/11/2026)** with f3-dongdang, j-coban, k-goiintiep, k-tugiacnt; for 9.5, 4.2c (o-nangcao) takes priority over Bài 5; S5 (C1–C3) designed ~11/2026 | same §3.3, §4 |
| 17/10/2026 | **LT19 Tutor-directed G strand:** the tutor assesses word problems by PT/HPT as the current gap and school is teaching Toán 9 chương 1 (PT & HPT bậc nhất hai ẩn) → G moves from batch 8 to **batch 4 (approved by 01/11/2026)**. New KUs **g-giaihpt** (solving linear 2×2 systems, no prerequisite) and **g-chuso** (digit/number problems); g-chuyendong, g-nangsuat, g-phantram require **g-giaihpt** instead of d-ptbh and cover linear (HPT) setups only; word problems leading to a quadratic go to **g-honhop** (still needs d-ptbh, batch 8). **50 KUs: 42 core + 8 P2.** Old batches 4–7 → 5–8, dates unchanged. Which topic comes first is the tutor's call | `docs/CURRICULUM.md` §2, §3 |
| 17/10/2026 | **LT20 Tutor material:** the tutor's topic PDFs (theory + exercises, e.g. "Chuyên đề giải toán bằng cách lập PT, HPT") are a content source like the 68-paper book: items are adapted with `source` ("CĐ lập PT/HPT – §N Câu M (chuyển thể)"), the PDF is never committed; for exercises the tutor assigns, Claude writes step-by-step solutions that cite item numbers without copying the text, checked by script, so the student can self-check at home | `docs/CONTENT_STANDARD.md` §6 |
| 05/10/2026 | **AI1 Timing:** AI for the student is switched on **after 3–4 pilot weeks (~09/11/2026)**, once the 20–30-case test set built from Nguyên's real errors passes the parent's rubric | `docs/AI_TUTOR.md` §8 |
| 05/10/2026 | **AI2 Hint source:** H1–H3 hints are **pre-written in content and reviewed like any item** (available from S6b, no AI); AI only for free questions after H3 / a wrong answer (H4–H5, ≤ 6 turns per item); H6 = the approved solution, never AI text. Answers after H2+ or AI help do not count as first-try correct | same §3–4 |
| 05/10/2026 | **AI3 Parent/tutor AI:** weekly narrative report for the parent, pre-session brief for the tutor, weekly digest of AI conversations; numbers come from the DB via templates and are cross-checked | same §5 |
| 05/10/2026 | **AI4 Budget:** at most **$10/month** (Console spend limit + server token count); at the cap AI pauses and written hints keep working | same §6 |
| 20/10/2026 | **Audit fix H1 — review runs planned by the server:** the first review answer saves today's plan (5 units × 3 practice items, LT8/D14) as the student's **one open run** (`review_runs`, migration 0011); only planned questions are accepted, the first answer to each counts, and a run is **scored only when every planned question has an answer** (closed before scoring). An open run is resumed on reload or another day. Replaces the "resume the latest unscored run" rule of 05/10 | `src/app/learn/actions.ts`, `docs/DESIGN.md` §5 |
| 20/10/2026 | **Audit fix H2 — approved items are locked:** the grading key (options and their order, right option, right value, steps) of every recorded item of an approved KU is pinned in `content/approved.lock.json`; a test refuses changes. Wording stays editable; a changed answer = a new item id. Interim until T7 moves approval + content hash into the DB (S10) | `docs/CONTENT_STANDARD.md` §7 |
| 20/10/2026 | **S10/S11 build rulings (parent, 20/10):** (1) an item marked "Cần sửa" is hidden from the student until fixed and reviewed again; "Duyệt cả bài" needs the lesson block ok, nothing unseen/changed, ≥ 4 practice and ≥ 5 exit items ok; (2) the 10 KUs approved in git are not re-reviewed (H2 lock); (3) priority KUs open at once and lead "Bài mới" but the LT3 cap of 2 in progress stays; (4) no "Theo dạng" for now (items carry no type tag; adding it later = an item `form` field + a filter, no SQL). Migrations: S10 0012, S11 0013, S8 0014 | `docs/superpowers/specs/2026-10-20-tutor-workspace-design.md` |
| 21/10/2026 | **Build order after the tutor workspace (parent, 21/10):** **S5 design → S4b (lean) → S5 code → S8**, because geometry has a hard date (Track C from 23/11, batch 5 due 15/11) and its proof items need the C2/C3 item types, while S8 waits for pilot data and needs the milestone maths of S4b for its weekly report. **S5** builds **C2 (order the steps)** and **C3 (two-column proof)** first; **C1 (drag on the figure) is deferred** and built only if C2 + C3 prove insufficient. **S4b** keeps milestone progress to 8.5 / 9.5 and late KUs highlighted; the **manual-unlock button is dropped** (the tutor's ★ priority already opens a KU). **S8** moves to ~09–25/11, AI for the student on ~end of 11/2026 (supersedes AI1's ~09/11). Migration numbers are taken in build order (next free number at the time) | `docs/P1_PLAN.md` §2 |
| 21/10/2026 | **LT21 Geometry audit (parent, 21/10):** against the 68-paper Bài 4.2 and Toán 9 GDPT 2018: **+f3-tugiac** (grade-8 backfill: special quadrilaterals, midline, Thalès, angle-bisector property; batch 7), **o-chungminh split** into o-chungminh (perpendicular, parallel, bisector, equal angles) + **o-thanghang** (collinear, midpoint, concurrent, special shapes; batch 9, replaces l-kethop's slot), **l-kethop folded** into l-tieptuyen / o-dongdang (0/68 own items), **+q-dagiac** (regular polygons & rotation, P2). **52 KUs: 43 core + 9 P2** | `docs/CURRICULUM.md` §2, §3, §6 |
| 21/10/2026 | **S5 design (parent, 21/10):** geometry proofs get three auto-graded item types — **Phân tích ngược** (backward analysis: from the goal, pick "what is needed" level by level until a given; then the chain flips into the forward outline), **C3 điền chỗ trống** (Vietnamese "Xét … có … ⇒ … (lí do)" proof with 2–5 blanks filled from a shared choice bank) and **C2 sắp xếp bước** (order the lines, 1–2 distractors, any order consistent with the author's "must come after" links is right; feedback names the first wrong line). C1 (drag on figure) deferred. Plus a reviewed **Sổ tay suy ngược** (goal → ways → signs in the problem, and 4 recurring figures with their ready-made facts) and **draw-first** (the figure stays hidden until the student says they drew it on paper). Built for laptop (click, ↑ ↓, no drag). Learning order in a proof KU: worked example (analysis + write-up) → analysis → C3 → C2 → free writing on paper with the tutor | `docs/superpowers/specs/2026-10-21-s5-geometry-design.md` |
| 21/10/2026 | **Geometry M3 (replaces §3.6 "M3+ needs C3 + ≥ 1 C5 confirmed"):** C5 (free writing) is not built (P3), so a proof KU (track C, grading ≠ full) reaches M3 like any KU — exit ≥ 80 % — with an exit bank holding ≥ 1 analysis and ≥ 2 C2/C3 items; free writing is graded on paper by the tutor, who proposes a level in Buổi dạy (a ≥ 1-step gap raises the usual flag) | same spec §6 |
| 22/10/2026 | **S4b milestone rules (parent, 22/10):** each core KU gets the **phase** of `CURRICULUM.md` §3.3 (19 / 13 / 6 / 5; P2 none) in `curriculum.json`, with the phase dates and the milestones. **8.5** = all 38 core KUs of phases 1–3 by 21/02/2027, **9.5** = all 43 core KUs by 31/03/2027; KUs with no content yet count (the student still has to learn them); the KUs §4 names are marked ★ ("bài trọng tâm"). **Solid = shown level ≥ M3** (exit passed; M4 reviews not needed). A KU is **late** once its phase is over and it is below M3 — highlighted yellow on Tổng quan and listed in "Cần chú ý". No manual unlock, no SQL | `src/lib/learning/milestones.ts`, `docs/DESIGN.md` |
| 22/10/2026 | **S8 split (parent, 22/10):** **S8a now** (`p1-slice-8`, migration **0014** with every AI table for S8a + S8b): AI foundation (server-only client, spend in `ai_usage`, $10 cap with 90 % warning, number guard, `ai_settings`), **weekly report** made **Monday ~07:00** by a Vercel cron for the previous week + a "Tạo lại" button, read **in the app only** (no email); **tutor brief** made by a **button** on Buổi dạy and stored; parent AI page. Numbers come from templates; AI writes only a comment the server cross-checks. Reports default to `claude-haiku-5-5`. **S8b later** (`p1-slice-8b`, no SQL, after the pilot test set 02–08/11): the student's AI, guard, log, "AI nói sai?", test-set page, on/off gated by a passed test set; the student's model is chosen by the test set (Haiku 5.5 vs Sonnet 5.5) | `docs/superpowers/specs/2026-10-22-s8-ai-design.md`, `docs/superpowers/plans/2026-10-22-s8a-ai-reports.md` |
| 23/10/2026 | **Approve now, tutor reviews later (parent, 23/10):** the parent approved the 18 draft KUs of batches 3–6 in git (keys locked). Replaces ruling (2) of 20/10 for every git-approved KU: the tutor (or parent) **can still mark "Cần sửa"** on items of a git-approved KU; such an item is **hidden from the student** until its content changes (Claude's fix merged); a "Cần sửa" lesson block, or fewer than 4 practice / 5 exit items left, hides the KU. A "Cần sửa" note has two required parts, **reason** and **how Claude should fix it** (≤ 240 characters each). Answer-key changes of an approved item still go through `content:lock --relock` with the parent's ok | `src/lib/content/review.ts`, `docs/DESIGN.md` |

## 1. Mục tiêu

Web app riêng (tách khỏi SkillGrow) hỗ trợ Hạnh Nguyên học Toán 9 và luyện thi vào 10 (~06/2027), dùng chung giữa **phụ huynh – gia sư – học sinh**, để trả lời được bất kỳ lúc nào:
- Cái gì **đã dạy** / chưa dạy?
- Cái gì con **đã hiểu** (mức M0–M4) / chưa hiểu?
- Cái gì **đến hạn ôn lại**?

Nội dung bám theo `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` (M0–M4, 17 domain A–Q, error taxonomy E01–E15, hint ladder H0–H6, lịch ôn D0/D+1/D+7/D+21). Xây **từng module một**, không xây đồ sộ ngay.

**Phân biệt với SkillGrow:** SkillGrow chỉ là nơi tracking & tổng hợp đa kỹ năng; học Toán thì phải qua App Toán. (Có thể nối dữ liệu tổng hợp sang SkillGrow sau — chưa thuộc phạm vi.)

## 2. Quyết định đã chốt (phụ huynh xác nhận 01/10/2026)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | App Toán tách riêng khỏi SkillGrow | |
| D2 | Gia sư **bắt buộc** cập nhật trực tiếp trên app (không qua Zalo) | |
| D3 | Tài khoản do phụ huynh cấp; **mỗi gia sư 1 tài khoản**, khoá khi nghỉ, tạo mới khi đổi GV | Giữ lịch sử ai dạy/ai đánh giá |
| D4 | Học sinh **làm bài online** để kiểm tra (không chụp bài giấy); bài tập xây từ đơn giản → phức tạp theo module | |
| D5 | Học liệu **nằm trong app**; xây theo từng module | Xem D16 cho quy trình duyệt |
| D6 | Hosting: GitHub + Vercel + Supabase (gói free), phụ huynh tự tạo tài khoản theo hướng dẫn | Kèm biện pháp D19 |
| D7 | Thiết bị: laptop, tablet, điện thoại → giao diện responsive | |
| D8 | Gia sư **đề xuất** mức hiểu, hệ thống **đối chiếu** với kết quả bài kiểm tra, lệch thì phụ huynh chốt | |
| D9 | Có **AI hỏi đáp** để học sinh hỏi lại câu sai; AI giảng theo framework (H0–H6, E01–E15), không trả lời chung chung | Dùng Claude API — **billing riêng** với gói claude.ai |
| D10 | Nhắc lịch ôn **trong app** trước (chưa Zalo/email) | |
| D11 | Thiết kế đa học sinh từ đầu — **An dùng sau** | |
| D12 | Chứng minh hình học: thang C1–C5; chỉ C5 (viết tự do) do AI chấm sơ bộ + gia sư xác nhận | |
| D13 | Module đầu tiên: **Hệ thức lượng** (đã có nội dung HTML) | |
| D14 | **Lịch ôn:** giữ D+1/7/21; **ôn trộn nhiều KU** (interleaving); ôn sai → về D+1, ôn đúng dễ → giãn thêm; **chưa dùng FSRS** nhưng log đủ dữ liệu để nâng cấp sau | Rà soát best practice |
| D15 | **Mức hiểu:** tiêu chí đơn giản (trung bình các lần gần nhất), luôn hiển thị **kèm số lần đã làm (độ chắc chắn)**; không dùng BKT | Rà soát best practice |
| D16 | **Nội dung:** JSON trong GitHub; Claude soạn → phụ huynh xem trên **link preview** → duyệt mới lên app thật | Rà soát best practice |
| D17 | **Động lực:** không streak, không bảng xếp hạng; dùng mục tiêu tuần + bản đồ tiến độ | Rà soát best practice |
| D18 | **Đồng thuận của Nguyên:** phụ huynh nói rõ với con và để con đồng ý trước khi app ghi dữ liệu học & hội thoại AI | Luật BVDLCN 91/2025/QH15 |
| D19 | **Giữ app luôn chạy & sao lưu:** tác vụ tự động "gõ cửa" hằng ngày (tránh Supabase free tự dừng sau 1 tuần) + xuất dữ liệu hằng tuần vào GitHub riêng tư | Rà soát best practice |

## 2.5 Non-Goals (phiên bản đầu — KHÔNG làm)

| Non-Goal | Lý do |
|---|---|
| Không thay thế gia sư | Nghiên cứu (Cognitive Tutor Geometry) cho thấy phần mềm một mình không tốt hơn giáo viên; app chỉ hỗ trợ, không tự dạy |
| Không làm offline / PWA ngoại tuyến | Nhà luôn có mạng; đồng bộ dữ liệu khi mất mạng phức tạp không tương xứng lợi ích ở quy mô 1 gia đình |
| Không dùng streak / bảng xếp hạng | Rà soát best practice: gây áp lực, không phù hợp người học tuổi 14 (D17) |
| Không tự chấm 100% chứng minh hình học viết tự do (C5) | LLM chấm proof còn quá dễ dãi (QEDBench, RefGrader) — luôn cần gia sư xác nhận, không giao hẳn cho máy |
| Không dùng mô hình xác suất (BKT) để tính mastery | Tiêu chí đơn giản cho kết quả tương đương, dễ hiểu và dễ gỡ lỗi hơn (D15) |
| Không mở rộng cho An ngay | Thiết kế đa học sinh từ đầu nhưng chỉ triển khai cho Nguyên ở P1–P3 (D11) |
| Không tích hợp ngược vào SkillGrow ở bản này | SkillGrow là tầng tổng hợp riêng; nối dữ liệu là việc của giai đoạn sau, ngoài phạm vi P0–P4 |

## 2.6 User Stories theo vai trò

**Phụ huynh**
- Là phụ huynh, tôi muốn tạo và khoá tài khoản gia sư/học sinh, để kiểm soát ai được truy cập dữ liệu của con.
- Là phụ huynh, tôi muốn thấy ngay 3 con số (KU đạt M3+, bài ôn quá hạn, cờ lệch) khi mở app, để biết tình hình trong 30 giây mà không cần đọc chi tiết.
- Là phụ huynh, tôi muốn được báo khi mức gia sư đề xuất và mức hệ thống tính lệch nhau, để tôi là người quyết định cuối cùng thay vì máy tự chốt.
- Là phụ huynh, tôi muốn duyệt nội dung bài học qua một link xem trước trước khi nó hiển thị cho Nguyên, để đảm bảo chất lượng trước khi con nhìn thấy.
- Là phụ huynh, tôi muốn thấy buổi dạy nào gia sư chưa ghi sau 24 giờ, để nhắc kịp thời thay vì mất dấu.

**Gia sư**
- Là gia sư, tôi muốn ghi buổi dạy trong dưới 2 phút trên điện thoại, để không tốn thời gian ngoài giờ dạy.
- Là gia sư, tôi muốn thấy điểm các bài làm gần nhất của Nguyên khi đề xuất mức hiểu, để đề xuất có căn cứ thay vì cảm tính.
- Là gia sư, tôi muốn xác nhận hoặc chấm lại bài chứng minh hình học AI đã sơ chấm, để đảm bảo đánh giá chính xác trước khi tính vào mastery.
- Là gia sư (mới), tôi muốn nhận tài khoản riêng khi bắt đầu dạy, để lịch sử dạy của tôi tách biệt với gia sư trước.

**Học sinh (Nguyên)**
- Là học sinh, tôi muốn mở app và thấy ngay "hôm nay cần làm" (bài mới + bài ôn), để không phải tự nhớ cần ôn gì.
- Là học sinh, tôi muốn xem lời giải mẫu trước khi tự làm một dạng bài mới, để không bị bỏ rơi giữa chừng.
- Là học sinh, tôi muốn hỏi AI khi làm sai một câu, để được gợi ý từng bước thay vì nhận đáp án ngay.
- Là học sinh, tôi muốn thấy bản đồ tiến độ của mình thay vì chuỗi ngày liên tục (streak), để không bị áp lực nếu nghỉ một hôm.
- Là học sinh, tôi muốn biết dữ liệu học và hội thoại AI của mình được ghi lại và ai xem được, trước khi bắt đầu dùng app (D18).

## 2.7 Acceptance Criteria theo màn hình (chốt sau khi duyệt mockup 01/10/2026)

**Học sinh — "Hôm nay cần làm"**
- Mở app khi có bài ôn đến hạn → danh sách ưu tiên bài ôn trước bài mới; mỗi mục có badge loại (Ôn lại/Bài mới), thời gian ước tính, nút hành động.
- ≥ 2 KU đến hạn ôn cùng lúc → câu hỏi trong phiên phải **trộn giữa các KU**, không 2 câu liên tiếp cùng KU/cách giải (D14).
- Trả lời sai lúc luyện tập (không phải exit/mastery test) và bấm "Hỏi AI" → AI gợi ý theo hint ladder từ mức thấp nhất (H0), **không đưa đáp án ngay**.
- Đang làm exit test / mastery test → khung hỏi AI **bị tắt/ẩn hoàn toàn**, không có cách mở lại.
- Gặp KU mới lần đầu → bắt buộc xem hết lời giải mẫu trước khi hệ thống mở phần tự giải (không cho bỏ qua).
- Hoàn thành một buổi học → thanh mục tiêu tuần cập nhật ngay; không hiển thị streak hay bảng xếp hạng ở bất kỳ đâu (D17).
- Chưa có xác nhận đồng ý theo D18 → app hiển thị màn hình giải thích & xin đồng ý trước khi vào "Hôm nay cần làm", không có đường vòng.

**Gia sư — "Ghi buổi dạy"**
- Tick một KU đã dạy → hệ thống hiển thị ngay điểm bài gần nhất của Nguyên làm bằng chứng, trước khi gia sư chọn mức đề xuất.
- Đã tick KU nhưng chưa chọn mức M0–M4 → nút "Lưu buổi dạy" chặn hoặc cảnh báo, không cho lưu đề xuất rỗng.
- Form hợp lệ và bấm "Lưu buổi dạy" → lưu thành công, hiển thị thời điểm lưu gần nhất; toàn bộ thao tác thực hiện được trong ≤ 2 phút trên điện thoại.
- Bài chứng minh hình học C5 đã được AI sơ chấm → gia sư phải **xác nhận hoặc chấm lại** trước khi kết quả được tính vào mastery; chưa xác nhận thì không tự động tính.
- Gia sư mới nhận lớp → tài khoản mới hoàn toàn tách biệt (không dùng lại tài khoản cũ); lịch sử buổi dạy trước đó vẫn gắn đúng gia sư cũ.
- Gia sư đăng nhập xem danh sách học sinh → chỉ thấy học sinh được gán cho mình (RLS), không thấy học sinh khác.

**Phụ huynh — "Tổng quan"**
- Mở dashboard → 3 con số đầu trang (KU đạt M3+/tổng, bài ôn quá hạn, cờ lệch) hiển thị ngay ở lần render đầu, không cần cuộn/bấm thêm.
- Mức gia sư đề xuất và mức hệ thống tính lệch ≥ 1 bậc → mục "Cần chú ý" liệt kê KU đó kèm cả hai giá trị + bằng chứng (điểm các bài gần nhất) + nút "Xem & chốt mức".
- Phụ huynh chốt mức hiểu từ màn hình cờ lệch → giá trị "mức phụ huynh chốt" được ghi là nguồn cuối cùng; cờ ⚠️ biến mất khỏi danh sách cần chú ý.
- Một buổi dạy quá 24 giờ chưa được gia sư ghi → mục "Cần chú ý" hiển thị nhắc nhở kèm nút hành động nhắc gia sư.
- Nội dung mới đã soạn (JSON + preview) → phụ huynh xem được qua **link preview hiển thị như bài thật** (không phải JSON thô) trước khi có nút publish.
- KU chưa đủ số lần làm để tin cậy → ô mức hiểu gắn nhãn "chưa đủ dữ liệu" thay vì hiển thị một mức chắc chắn (D15).

## 3. Kiến trúc v1.0

### 3.1 Stack
| Lớp | Chọn |
|---|---|
| Frontend + server | Next.js trên Vercel; có manifest "thêm vào màn hình chính" (không làm offline) |
| DB + Auth + Storage | Supabase (Postgres, RLS bật cho **mọi bảng**) |
| Code & nội dung | GitHub repo → Vercel auto-deploy; mỗi thay đổi có link preview |
| Công thức | KaTeX (hiển thị), MathLive (nhập) |
| Hình học | SVG / GeoGebra embed |
| AI | Claude API gọi phía server, có trần chi phí tháng |
| Vận hành | Tác vụ ping hằng ngày + backup hằng tuần (D19) |

### 3.2 Vai trò & quyền
| Chức năng | Phụ huynh | Gia sư | Học sinh |
|---|---|---|---|
| Tạo/khoá tài khoản | ✅ | — | — |
| Duyệt & publish module/bài tập | ✅ | — | — |
| Ghi buổi dạy | xem | ✅ | — |
| Đề xuất mức M0–M4 | xem | ✅ | — |
| Chốt mức hiểu | ✅ | — | — |
| Làm bài, lịch ôn | xem | xem | ✅ |
| Hỏi AI | xem log | xem log | ✅ |
| Báo cáo | ✅ toàn bộ | ✅ chỉ học sinh được gán | ✅ của mình |

### 3.3 Cấu trúc nội dung
- Module (= domain) → Knowledge Unit (KU) → mỗi KU gồm: lý thuyết tương tác, ví dụ mẫu, ngân hàng bài L1–L4, exit test, mastery test, error map (E01–E15), remediation.
- Lưu dạng **JSON trong repo** (tham khảo định dạng Perseus của Khan Academy): mỗi câu hỏi có KU, cấp độ, đáp án/lời giải chuẩn, mã lỗi gắn với đáp án sai thường gặp.
- Quy trình: Claude soạn → link preview → phụ huynh duyệt → publish (D16).

### 3.4 Thang dạng bài & chấm
| Cấp | Dạng | Chấm | Phase |
|---|---|---|---|
| 1 | Trắc nghiệm, đúng/sai | Tự động | P1 |
| 2 | Nhập đáp số (căn, phân số) | Tự động, chấp nhận dạng tương đương | P1 |
| 3 | Nhập biểu thức/phương trình | Tự động (so tương đương) | P3 |
| 4 | Giải theo bước | Tự động từng bước + gắn mã lỗi | P3 |

**Riêng chứng minh hình học (thang giảm dần hỗ trợ):**
| Bậc | Dạng | Chấm | Phase |
|---|---|---|---|
| C1 | Kéo hình động (drag test), chọn dự đoán | Tự động | P1 |
| C2 | Sắp xếp bước chứng minh (Proof Blocks, có bước nhiễu) | Tự động, báo sai từ dòng nào | P1 |
| C3 | Chứng minh 2 cột: chọn/điền lý do | Tự động | P1 |
| C4 | Chọn đường phụ cần kẻ + sắp xếp | Tự động | P3 |
| C5 | Viết tự do như bài thi | AI sơ chấm theo lời giải chuẩn → gia sư xác nhận | P3 |

### 3.5 Trình tự học trong 1 KU (mới — worked example & fading)
1. Xem **lời giải mẫu** (kèm câu hỏi tự giải thích "vì sao làm bước này?").
2. Lời giải mẫu **khuyết dần bước** → học sinh điền.
3. Tự giải hoàn toàn (L1 → L4).
4. Exit test (AI tắt).

### 3.6 Mức hiểu (mastery)
- Mỗi KU lưu 3 giá trị: mức gia sư đề xuất / mức hệ thống tính / mức phụ huynh chốt. Lệch ≥ 1 bậc → cờ ⚠️.
- Mức hệ thống = **trung bình các lần làm gần nhất**, hiển thị kèm **số lần đã làm**; ít lần → gắn nhãn "chưa đủ dữ liệu" (D15).
- KU yếu / hay quên → yêu cầu nhiều lần đúng hơn mới lên mức.
- Ngưỡng số cụ thể chốt khi làm module 1. Ví dụ khởi điểm: M3 = exit test ≥ 80% + không lặp lỗi nghiêm trọng; M4 = qua lượt ôn D+21. KU hình học: M3+ cần qua C3 + ≥ 1 bài C5 gia sư đã xác nhận.
- **AI tắt trong exit test / mastery test.**

### 3.7 Lịch ôn (D14)
- KU đạt ngưỡng → sinh lượt ôn D+1, D+7, D+21.
- **Mỗi phiên ôn trộn câu từ nhiều KU khác nhau** (không 2 câu liên tiếp cùng cách giải).
- Ôn sai → KU đó quay về D+1; ôn đúng dễ dàng → giãn khoảng cách tiếp theo.
- Log mọi lượt ôn (đúng/sai, thời gian, mức dễ/khó) để có thể chuyển sang FSRS khi đủ dữ liệu.

### 3.8 Màn hình theo vai trò
| Vai trò | Màn hình chính |
|---|---|
| Học sinh | **"Hôm nay cần làm"** (bài mới + bài ôn đến hạn), phiên 20–30 phút; bản đồ tiến độ; mục tiêu tuần. Không streak/xếp hạng (D17) |
| Gia sư | Form ghi buổi dạy **≤ 2 phút trên điện thoại**: tick KU đã dạy từ danh sách, đề xuất mức hiểu **kèm bằng chứng hệ thống** (điểm gần nhất), ghi chú tuỳ chọn |
| Phụ huynh | Đầu trang **3 con số**: KU đạt M3+/tổng · bài ôn quá hạn · cờ lệch đánh giá. Dưới: bảng màu theo domain; buổi dạy chưa ghi > 24h; tóm tắt tuần tự động |

### 3.9 AI giảng bài
| Thiết kế | Cách làm |
|---|---|
| Ngữ cảnh | Đề + **lời giải chuẩn đã duyệt** + bài làm + mã lỗi + lý thuyết KU. **Không gửi họ tên học sinh** |
| Phong cách | Hint ladder H0→H6, Socratic; 6 tiêu chí sư phạm (LearnLM): học chủ động, giảm quá tải, thích ứng, khơi tò mò, siêu nhận thức, bám chủ đề |
| Chống tính sai | Giải thích dựa trên lời giải đã duyệt, không tự giải lại |
| Giới hạn | Chỉ Toán & bài đang làm; giới hạn lượt/ngày; trần chi phí; tắt khi làm bài kiểm tra |
| Kiểm định trước khi bật | **Bộ test 20–30 lỗi sai điển hình** → phụ huynh chấm câu trả lời AI theo rubric → đạt mới bật cho Nguyên |
| Minh bạch | Lưu toàn bộ hội thoại, phụ huynh & gia sư xem được |
| System prompt | Tài liệu riêng, phụ huynh duyệt trước khi bật |

### 3.10 Bảo mật & dữ liệu
- RLS trên mọi bảng; khoá quản trị (service role) chỉ ở server, không bao giờ trên trình duyệt.
- Gia sư chỉ thấy học sinh được gán.
- Không gửi thông tin định danh sang AI.
- Nguyên được giải thích & đồng ý (D18).
- Backup hằng tuần (D19).

### 3.11 Mô hình dữ liệu (sơ bộ)
`users`, `students`, `tutor_assignments`, `modules`, `units`, `items`, `attempts`, `sessions`, `mastery` (3 mức + số lần), `review_queue`, `review_log`, `ai_chats`, `ai_eval_cases`.

## 4. Milestones / Roadmap

| # | Phase | Nội dung | Trạng thái |
|---|---|---|---|
| M0 | Discovery & kiến trúc | Thu thập yêu cầu, research hình học, kiến trúc v0.1 | ✅ Xong 01/10/2026 |
| M0.5 | Rà soát best practice | Đối chiếu 10 hạng mục → chốt v1.0 | ✅ Xong 01/10/2026 |
| P0 | Khung app | Tạo tài khoản dịch vụ; auth 3 vai trò; trang quản trị tài khoản; ping + backup | ⬜ Tiếp theo |
| P1 | Module Hệ thức lượng | Lời giải mẫu & fading; bài cấp 1–2 + C1–C3; ghi buổi dạy; mastery + cờ lệch; lịch ôn trộn; 3 dashboard → **pilot 2 tuần** | ⬜ |
| P2 | AI giảng bài | Bộ test AI → phụ huynh duyệt → bật cho Nguyên | ⬜ |
| P3 | Nâng cao | Cấp 3–4, C4–C5, đề tổng hợp, báo cáo tuần/tháng | ⬜ |
| P4+ | Mở rộng | Thêm module theo lộ trình 24 tuần; thêm An | ⬜ |

## 9. Exit criteria

Dự án đóng khi: app chạy thật cho cả 3 vai trò; phủ đủ các module theo lộ trình 24 tuần; dùng xuyên suốt đến kỳ thi vào 10; retrospective hoàn tất.

## 10. Còn để ngỏ (chốt trong lúc build)

| Hạng mục | Chốt khi nào |
|---|---|
| Ngưỡng số mastery (%, số lần đúng) | Khi soạn module 1 (P1) |
| Quy tắc giãn lịch ôn khi "đúng dễ dàng" | P1 |
| Rubric chấm AI tutor & bộ 20–30 test case | Đầu P2 |
| Có lên gói trả phí Supabase không | Sau pilot P1 |

## 11. Design artifacts

| Artifact | Link |
|---|---|
| Architecture & mastery flow | https://claude.ai/artifact/CwCTQkvaSsCEvTCCFdYUjN |
| Mockup — Học sinh "Hôm nay cần làm" | https://claude.ai/artifact/SbYxtyyYq9tQ17XFBZPeWQ |
| Mockup — Gia sư "Ghi buổi dạy" | https://claude.ai/artifact/1phBDeaFTdVAhbcN9UWxUu |
| Mockup — Phụ huynh "Tổng quan" | https://claude.ai/artifact/3tku853tUt4UonMZxUPtFV |

Content source for module 1: hub file `deliverables/he-thuc-luong-tam-giac-vuong.html` (chapters 0–7); master plan (domains A–Q, error codes E01–E15, hint ladder H0–H6): hub file `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md`.
