# S5 — Geometry proofs: backward analysis, fill-in proof (C3), order the steps (C2)

> Designed 21/10/2026 with the parent (brainstorming, 4 popup answers + 2 "ok"). Mockups: design canvas
> "Bàn làm việc gia sư", row **S5 · Học hình** (4 artboards, interactive). Decisions: `docs/SPEC.md` §0 rows of 21/10
> (build order, LT21, S5 design, geometry M3). Build: code 28/10 – ~11/11/2026, before batch 5 (due 15/11) and Track C
> (from 23/11). **No SQL.**

## 1. Why

Bài 4.2 is ~3 of the 10 exam points and almost always: a) prove a cyclic quadrilateral, b) similar triangles / product
of segments, c) collinear / midpoint / bisector / tangent (68-paper index). Today the app can only ask MCQ and numeric
questions, so geometry KUs would teach recognition but never the proof. The student must learn to **find** a proof
(think backwards from the goal — "phân tích đi lên") and to **write** it the Vietnamese way
("Xét … có: … ⇒ … (lí do)"). Free writing stays on paper with the tutor (C5 is P3).

## 2. Learning order inside a proof KU (decreasing support)

| # | Step | Where | Graded |
|---|---|---|---|
| 1 | Worked example in two parts: **backward analysis ladder**, then the **write-up** | `worked` (new optional `analysis`) | — |
| 2 | **Phân tích ngược** items — find the way | practice, exit, review, homework | auto |
| 3 | **C3 Điền chỗ trống** — write-up with blanks | same | auto |
| 4 | **C2 Sắp xếp bước** — build the order yourself | same | auto |
| 5 | Free writing on paper | tutor, Buổi dạy | tutor proposes a level |

Applies to KUs of track C whose `grading` ≠ `full` (f3-dongdang, f3-tugiac, k-goiintiep, k-tugiacnt, l-tieptuyen,
o-*, n-ngoainoi). j-coban, j-cung, m-vitri, q-dagiac stay MCQ / numeric.

## 3. Item types (content JSON, `src/lib/content/schema.ts`)

All three share `Authoring` (source, recognition, hints, figure, new `drawFirst`) and `level`, `prompt`, `solution`.
They are added to `Item` (practice / exit), **not** to faded blanks (still `SimpleItem`).

### 3.1 `analysis` — Phân tích ngược
```jsonc
{ "id": "k-tugiacnt-p5", "type": "analysis", "level": "L2",
  "prompt": "Cho ΔABC nhọn, hai đường cao BD, CE cắt nhau tại H. Chứng minh $AD\\cdot AC = AE\\cdot AB$.",
  "goal": "$AD\\cdot AC = AE\\cdot AB$",
  "steps": [            // 2–5 levels, from the goal down to a given
    { "ask": "Muốn có $AD\\cdot AC = AE\\cdot AB$, cần chứng minh gì?",
      "node": "$\\Delta ADB \\backsim \\Delta AEC$",            // shown once this level is right
      "item": { "id": "k-tugiacnt-p5-s1", "type": "mcq", "options": [...], "correct": 0,
                "mistakes": { "1": { "code": "E08", "feedback": "…" }, "2": { "code": "E06", "feedback": "…" } } } },
    …,
    { "ask": "Vì sao $\\angle ADB = \\angle AEC = 90^\\circ$?", "node": "BD, CE là đường cao", "given": true, "item": {…} }
  ],
  "outline": ["BD, CE là đường cao ⇒ …", "Xét ΔADB và ΔAEC …", "⇒ AD·AC = AE·AB"],   // forward write-up, 2–6 lines
  "solution": "…" }
```
- Each level is one MCQ (3–4 options). Wrong options are plausible dead ends (E06 strategy, E09 circular / wrong
  logic, E08 wrong vertex order), each with feedback. The last level must have `given: true`.
- Graded exactly like `steps` (answer = option indices joined by `|`; right only if every level is; error code of the
  first wrong level). Practice checks level by level without recording (S6b rule) and reveals `node` of a right level
  (or of the right option after a wrong one, so the student carries on); recorded once at the end.
- After the last level the ladder **flips into the forward outline** (`outline`), returned by the server only then.
- Step ids `<item id>-s<n>` (same rule as `steps`).

### 3.2 `proof` — C3 Điền chỗ trống
```jsonc
{ "id": "k-tugiacnt-p6", "type": "proof", "level": "L2", "prompt": "… Chứng minh tứ giác BCDE nội tiếp.",
  "lines": ["Ta có $\\angle BDC = 90^\\circ$ ([[1]])", "$\\angle BEC = 90^\\circ$ ([[2]])",
            "⇒ D, E cùng nhìn đoạn BC dưới một góc vuông", "⇒ D, E thuộc đường tròn đường kính [[3]]",
            "⇒ Tứ giác BCDE nội tiếp vì [[4]]"],
  "bank": ["BD là đường cao (gt)", "CE là đường cao (gt)", "BC", "DE", "góc nội tiếp chắn nửa đường tròn",
           "có 4 đỉnh cùng thuộc một đường tròn", "có hai góc đối bù nhau"],
  "blanks": [ { "correct": 0, "mistakes": { "4": { "code": "E09", "feedback": "…" } } }, … ],   // one per [[n]], in order
  "solution": "…" }
```
- `[[n]]` markers numbered 1…k in reading order, k = `blanks.length` (2–5); `bank` 3–10 distinct choices, at least
  k + 2; a choice may be right for several blanks. A blank can be a reason or a statement (e.g. a ratio).
- Answer = the **shown positions** of the chosen choices joined by `|` (the server maps them back through the same deterministic shuffle). Graded per blank like an MCQ over the bank; right only if all
  are; feedback / code of the first wrong blank; the result also returns which blanks are wrong. Exit / review:
  an empty blank counts wrong (`blanksWrong`).
- The browser gets the bank in a **deterministic shuffled order** (seeded by the item id); the server maps back.

### 3.3 `order` — C2 Sắp xếp bước
```jsonc
{ "id": "k-tugiacnt-p7", "type": "order", "level": "L3", "prompt": "… Chứng minh $AD\\cdot AC = AE\\cdot AB$.",
  "lines": [ { "text": "Xét ΔADB và ΔAEC có:" },
             { "text": "$\\angle A$ chung" },                        // after defaults to the previous line
             { "text": "$\\angle ADB = \\angle AEC = 90^\\circ$ (…)", "after": [0] },   // may swap with line 1
             { "text": "⇒ ΔADB ∽ ΔAEC (g.g)", "after": [1, 2] }, … ],
  "distractors": [ { "text": "⇒ ΔADB ∽ ΔACE (g.g)", "code": "E08", "feedback": "…" } ],   // 0–3
  "solution": "…" }
```
- 3–10 lines; `after` = indices of earlier lines that must come before (omitted → `[i − 1]`, `[]` for line 0);
  every index < own index, so the authored order is always right and there are no cycles.
- The browser gets lines + distractors in a deterministic shuffled order and the number of distractors ("Có 2 bước
  thừa"). Answer = shown positions in the chosen order, comma-separated (≤ 13 numbers, well under the 200-char limit).
- Grading walks the answer: a distractor → wrong at that line (its code / feedback); a line whose `after` lines are
  not all earlier → wrong there, E09 "Dòng này cần «…» đứng trước"; any real line missing → wrong at the end, E09
  "Lời giải còn thiếu bước". Result carries `at` (the first wrong line, 0-based) → "Sai từ dòng N". Repeated or
  out-of-range numbers → not understood.

### 3.4 Shared
- `drawFirst: true` (any item): the figure is collapsed behind "Đã vẽ hình trên giấy — xem hình" (practice and exit);
  nothing recorded. "Chọn hình vẽ đúng với đề" items need no code: one SVG with Hình 1/2/3 + an MCQ.
- `worked.analysis?: { goal, steps: [{ ask, node }] }` — rendered as a static ladder above the worked steps.
- `GradeResult` gains `parts?: boolean[]` (per level / blank) and `at?: number` (order). `steps` keeps `steps`.
- Every place that switches on `type` handles the new types: `index.ts` (public item), `public.ts` types,
  `grade.ts`, `lock.ts` (grading key: options + correct per level; bank + corrects; lines + after + distractors),
  `review.ts` (hashes cover them through canonical JSON), `work.ts` (readable answer + right answer for "Bài làm"),
  `standard.ts`, `learn/actions.ts` (level-by-level check for `analysis` like `steps`).

## 4. Screens (laptop first, still usable on a phone)

As the mockups, inside the existing lesson player (practice, exit, review, homework):
- **Analysis:** problem + figure on the left; ladder on the right starting from "CẦN CHỨNG MINH"; each level "⇑ ask"
  + option buttons; wrong → red feedback with code, the right node appears, carry on; done → "Lật thành dàn ý lời
  giải" shows `outline`.
- **C3:** lines with inline blank buttons; click a blank (active ring) then a chip in "Lí do / khẳng định để chọn"
  (auto-advance to the next empty blank); "Kiểm tra" colours blanks; first wrong blank's feedback; "Xoá hết".
  Chips are buttons rendering TeX (no native `<select>`).
- **C2:** "Các bước (n)" on the left — click adds to the end of "Lời giải của em"; right column numbered with ↑ ↓ ×;
  "Kiểm tra" → lines before `at` green, line `at` red + "Sai từ dòng N: …".
- All controls are real buttons ≥ 40 px, keyboard reachable; no drag-and-drop.
- **Tutor / parent review (Kho bài → Duyệt):** the item panel shows the answer key — analysis: each level's right
  option, the nodes, the outline; C3: the lines with right fills and the bank with mistakes; C2: the authored order
  with "có thể đổi chỗ với dòng k" from `after`, and the distractors with codes. "Làm thử" plays them as the student.
- **Bài làm:** the student's answer rendered readably (chosen options / fills / ordered lines) next to the right one.

## 5. Sổ tay suy ngược (handbook)

- `content/so-tay.json`: `{ status: "draft" | "approved", approvedOn?, goals: [{ id, title, tip, ways: [{ how, sign,
  units: [KU id] }] }], figures: [{ id, title, figure: SvgFigure, facts: [text] }] }`, zod-validated, KU ids must
  exist in the curriculum. Reviewed and approved like content (draft until the parent approves in a PR).
- Goals (first version): tứ giác nội tiếp, hai tam giác đồng dạng, đẳng thức tích, hai góc bằng nhau, vuông góc /
  tiếp tuyến, trung điểm / song song, thẳng hàng. Figures (LT21): point outside + two tangents (+ secant);
  triangle with three altitudes + orthocentre; semicircle + tangent Ax; diameter + perpendicular chord.
- Route `/student/so-tay` (approved only; parent / tutor also see a draft with a banner), two-pane like the mockup;
  linked from geometry lessons ("Mở Sổ tay suy ngược") and allowed in hints. Read-only, records nothing.

## 6. Mastery and content rules

- **M3 for a proof KU** = the usual rule (exit ≥ 80 %, no repeated serious error); C5 condition of SPEC §3.6 replaced
  (SPEC §0, 21/10). Tutor's paper grading enters through the existing level proposal / flag.
- `CONTENT_STANDARD.md` + `standard.ts` for new proof KUs: practice has ≥ 1 analysis, ≥ 1 proof, ≥ 1 order; the exit
  bank has ≥ 1 analysis and ≥ 2 proof / order items; analysis levels end on a given; every wrong option / bank choice
  used as a trap has a mistake entry. Independent solve (§7) covers the new types (the blind solver gets the shuffled
  view).
- Error codes: E06 strategy, E08 figure reading / vertex order, E09 proof logic (existing E01–E15).

## 7. Out of scope
C1 drag on figure, C4 auxiliary line, C5 AI-graded free writing, drag-and-drop, partial credit, new SQL, AI (S8).

## 8. Testing
- Unit: schema refusals (markers vs blanks, bank size, `after` ≥ own index, last level not a given, step ids);
  grading — analysis = steps semantics; proof per blank + blanksWrong; order accepts every topological order, rejects
  distractor / prerequisite / missing with the right `at`; shuffles are deterministic and the public view carries no
  answer, node, outline or `after`; lock / review hashes change when the key changes; `work.ts` readable answers;
  standard rules; so-tay schema + KU ids.
- E2E (fixture KU with the three types + so-tay fixture): student does each type in practice (wrong then right) and in
  the exit test; tutor sees the answer key in Duyệt and plays Làm thử; parent sees the readable answer in Bài làm;
  so-tay draft hidden from the student, visible after approval. Screenshots at 1366×768.

## 9. Effort
Item types + grading + public views ~4 d · player UI (3 components + draw-first + worked ladder) ~3 d · review panel,
Bài làm, lock / standard ~1,5 d · so-tay page ~1 d · e2e + docs ~1,5 d → **~11 days** (28/10 – ~11/11).
Content for batch 5 is written in parallel against this format.
