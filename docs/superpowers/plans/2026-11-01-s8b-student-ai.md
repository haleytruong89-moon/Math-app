# S8b — AI help for the student: implementation plan

> Parent "ok" 01/11/2026: build S8b now instead of waiting weeks; keep a short test-set gate before the student switch
> can be turned on. Design: `docs/superpowers/specs/2026-10-22-s8-ai-design.md` §6, `docs/AI_TUTOR.md` §3–§4.
> Branch `p1-slice-8b`, **no SQL** (every table and `attempts.hint_level` 0–4 came with migration 0014).

## Scope of v1

| In | Out (later) |
|---|---|
| Practice: "Hỏi thêm" after H3 is opened (before answering) or after a wrong answer | Worked example "Giải thích cách khác" |
| Review: only after a wrong answer | Weekly report section "Hội thoại với AI" |
| Items of type `mcq`, `numeric`, `steps` (answers the guard can check) | Geometry proof items (analysis / C3 / C2) and Luyện đề — they have their own scaffolding |
| Guard, one retry, written-hint / solution fallback, log in `ai_messages` | Tutor view of conversations (parent sees them; tutor later) |
| "AI nói sai?" on every AI message → flag → parent AI page + Tổng quan "Cần chú ý" | |
| Test set page `/parent/ai/bo-test`: build from real wrong answers (top up from authored mistakes), run per model, score, pass rule | |
| Student switch on `/parent/ai`, allowed only for a model + prompt version that passed | |

Never in exit, test-out, or before answering in review (AI_TUTOR §3).

## Rules (pure, `src/lib/ai/student.ts`, unit-tested)

- `STUDENT_AI = { turnsPerItem: 6, turnsPerDay: 20, replyMaxWords: 80, maxQuestionMarks: 1, questionMaxChars: 300 }`.
- `stage`: `"after"` only when the server finds the student's latest attempt on this item (same mode) in the last 30 minutes
  and it is wrong; otherwise `"before"`. The browser's claim is never trusted.
- Context pack (layer 2): prompt, approved solution, theory, H1–H3, the wrong options' feedback, her answer + error code
  (after only), the thread so far, her question. No name, school, or other data.
- Guard (layer 3) on the model text: JSON `{ "reply": string, "offTopic": boolean }`; every number in `reply` is in the
  context ∪ her question or a small integer ≤ 10; **stage before: the final answer must not appear** (numeric value not in
  the prompt; the right option's text; "đáp án là / chọn phương án"); ≤ 80 words; ≤ 1 question mark; banned words (D17).
  Fail → one retry → fallback.
- Fallback: the next written hint she has not opened yet; when none is left, H6 = the approved solution. Stored as role
  `fallback`, flag `guard`. `offTopic: true` → fixed polite reply, no flag.
- `hint_level = 4`: `checkAnswer` stores 4 for a practice attempt when an `ai_messages` student turn exists for this item
  today after her last attempt on it (server-side, not from the browser) → not "right first time" (AI_TUTOR §3).

## Gate (layer 4)

`studentAiOff()` → `no-key` · `disabled` · `version` (switch on but `student_prompt_version` ≠ current prompt version) ·
`budget` (monthly cap) · null. Pass rule for a (model, version): ≥ 20 scored cases, no "sai toán", mean of the 6 scores
≥ 1.6. `saveStudentAi` turns the switch on only when that (model, current version) passed.

## Files

| File | What |
|---|---|
| `src/lib/ai/student.ts` (+ test) | rules, stage, context pack, guard, fallback choice, pass rule |
| `src/lib/ai/prompts.ts` | `STUDENT_SYSTEM` (marker «Hỏi thêm» for the e2e fake), `studentUser()` |
| `src/lib/ai/usage.ts` | `studentAiOff()` |
| `src/app/learn/ai-actions.ts` | `askAi`, `flagAiMessage` (student) |
| `src/app/learn/actions.ts` | `hint_level = 4` rule |
| `src/components/lesson/ai-help.tsx` | the panel: question box, thread, "AI nói sai?", limits, fallback rendering |
| `src/components/lesson/lesson-player.tsx`, `review-player.tsx`, `student/question-feedback.tsx` | where the panel shows |
| `src/app/parent/ai/bo-test/page.tsx` + `actions.ts` | build / edit / archive cases, run per model, score, summary |
| `src/app/parent/ai/page.tsx` + `actions.ts` | student switch + model, flagged messages, latest conversations |
| `src/lib/learning/overview.ts` (or the Tổng quan page) | "Cần chú ý": AI messages the student flagged |
| `e2e/patch/e2e-fake.ts` | fake reply for the student prompt (one bad reply that leaks the answer, to test the guard) |
| `e2e/ai-student-flow.mjs`, `e2e/ai-eval-flow.mjs` | student panel + flag; parent test set → pass → switch on |

## Checks

`npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh`. Docs: SPEC §0 row, DESIGN routes, AI_TUTOR §8, PROGRESS,
HANDOFF.
