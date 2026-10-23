# Luyện đề hình 4.2 — drill bank of real exam proofs

> Designed 23/10/2026 with the parent (proposal + 2 popup answers). Decision: `docs/SPEC.md` §0 row of 23/10 ("Luyện đề 4.2").
> Status: design only — the implementation plan is written when the parent says go.

## 1. Why

Each geometry proof KU has 7 proof-type items (2 backward analysis, 3 C3, 2 C2); a student meets ~4–5 of them per KU, and
once a KU is learnt only 3 practice items come back per review. Bài 4.2 a–b (~2 of the 10 exam points; 4.2a "prove a
cyclic quadrilateral" is in 64/68 papers) needs many varied full problems. Target: **~40 real 4.2 problems done in full by
21/02/2027**, about **3 a week**.

## 2. What

| Topic | Decision |
|---|---|
| Source | Bài 4.2 parts a and b of **Đề 1–56** only (Đề 57–68 stay for mock exams). Part c belongs to o-nangcao (P1, GĐ4) |
| One drill problem | the real figure (draw it first, `drawFirst`) → **backward analysis** of part a → **C3 write-up** of part a → **C2 order** of part b (part b only once its KUs exist); the full approved solution after answering |
| Where | a new student section **"Luyện đề hình"**, separate from the KU lessons; results **do not change any KU's mastery level** |
| Opening rule (parent, 23/10) | each problem lists the KUs it needs (part a: `k-tugiacnt`; part b: `o-dongdang`, sometimes `l-tieptuyen`). It opens when **every needed KU is at M3 or carries the tutor's ★**; **at most 3 new problems a week** |
| Part b (parent, 23/10) | **keep the roadmap**: part a problems from 23/11 (k-tugiacnt, batch 6), part b from 01/2027 (o-dongdang, batch 8). o-dongdang is not moved earlier |
| Spacing | a problem answered with a mistake comes back 7 days later |
| Tutor | sees the answers in "Bài làm"; free writing stays on paper |
| Data | no SQL expected: answers go to `attempts` with the drill problem's id as `unit_id` (outside the roadmap, so no mastery) |
| Content | ~45 problems × 3 items ≈ 135 items, written in batches of 9–10 with the usual checks (recomputed answers, coordinate checks, blind solve). First batch: 9 part-a problems before 23/11 |
| Review | approved by the parent in git like other content; the tutor can mark "Cần sửa" (reason + how to fix) — the technical shape (pseudo-unit per batch vs per problem) is settled in the plan |

## 3. Out of scope

Part c; free-text proof grading; mock exams (Đề 57–68); AI help on these items (comes with S8b if the test set passes).
