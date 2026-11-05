// S8b: the student's AI — stage, limits, guard, fallback, test-set rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiStage, aiSupported, checkStudentReply, contextPack, evalSummary, fallbackFor, guardInputs, hiddenAnswers, leaksAnswer,
  limitReached, pickEvalCases, STUDENT_AI, type AiItem,
} from "./student.ts";

const numeric: AiItem = {
  id: "u-p1", type: "numeric", level: "L2", prompt: "Giải phương trình $x^2 - 5x + 6 = 0$. Tìm nghiệm lớn hơn.", answer: "3",
  mistakes: [{ answer: "2", code: "E10", feedback: "Đó là nghiệm nhỏ hơn." }],
  hints: ["Cần tìm hai nghiệm rồi so sánh.", "Đây là phương trình bậc hai.", "Tính biệt thức $\\Delta$."], solution: "$\\Delta = 1$, nghiệm $2$ và $3$. Kết luận: $3$.",
} as AiItem;
const frac: AiItem = { ...numeric, id: "u-p2", prompt: "Giải hệ $6u + 6v = 1$, $4u + 9v = 1$. Tìm $v$.", answer: "1/15", mistakes: [] } as AiItem;
const mcq: AiItem = {
  id: "u-p3", type: "mcq", level: "L1", prompt: "Từ $x - 2y = 1$, rút $x$ theo $y$:", options: ["$x = 1 - 2y$", "$x = 2y + 1$", "$x = 2y - 1$"], correct: 1,
  mistakes: { "0": { code: "E02", feedback: "Chuyển vế phải đổi dấu." } }, solution: "$x = 2y + 1$.",
} as AiItem;
const unit = { title: "Thử", theory: ["Lý thuyết thử."] };
const reply = (text: string, offTopic = false) => JSON.stringify({ reply: text, offTopic });

test("v1 supports mcq, numeric and steps items only", () => {
  assert.ok(aiSupported(numeric) && aiSupported(mcq));
  assert.equal(aiSupported({ id: "a", type: "analysis" } as never), false);
});

test("stage: 'after' only for a recent wrong answer", () => {
  const now = new Date("2026-11-01T10:00:00Z");
  assert.equal(aiStage(null, now), "before");
  assert.equal(aiStage({ correct: true, created_at: "2026-11-01T09:59:00Z" }, now), "before");
  assert.equal(aiStage({ correct: false, created_at: "2026-11-01T09:45:00Z" }, now), "after");
  assert.equal(aiStage({ correct: false, created_at: "2026-11-01T09:00:00Z" }, now), "before");
});

test("limits: 6 questions an item, 20 a day", () => {
  assert.equal(limitReached(0, 0), null);
  assert.equal(limitReached(STUDENT_AI.turnsPerItem, 6), "item");
  assert.equal(limitReached(1, STUDENT_AI.turnsPerDay), "day");
});

test("context pack: approved content only; her answer and code only after answering", () => {
  const before = contextPack(numeric, unit, { stage: "before", thread: [] });
  assert.equal("traLoiCuaCon" in before, false);
  const after = contextPack(numeric, unit, { stage: "after", answer: "2", errorCode: "E10", thread: [{ role: "student", content: "Sao sai?" }] });
  assert.equal(after.traLoiCuaCon, "2");
  assert.equal(after.maLoi, "E10");
  assert.deepEqual(after.nhacLoiKhiSai, ["Đó là nghiệm nhỏ hơn."]);
  assert.ok(!JSON.stringify(after).includes("Nguyên"));
});

test("hidden answers: right option text, right values", () => {
  assert.deepEqual(hiddenAnswers(mcq).texts, ["$x = 2y + 1$"]);
  assert.deepEqual(hiddenAnswers(numeric).values, [3]);
});

test("leak check: answer value, fraction, option text, give-away words; prompt numbers don't count", () => {
  const h = hiddenAnswers(frac);
  const g = guardInputs(frac, contextPack(frac, unit, { stage: "before", thread: [] }), "", "before");
  assert.equal(leaksAnswer("Vậy $v = \\frac{1}{15}$ nhé.", h, g.promptNumbers, g.promptFlat), true);
  assert.equal(leaksAnswer("Con thử rút $u$ từ phương trình đầu xem?", h, g.promptNumbers, g.promptFlat), false);
  assert.equal(leaksAnswer("Đáp án là phương án thứ hai.", hiddenAnswers(mcq), new Set(), ""), true);
  const gm = guardInputs(mcq, {}, "", "before");
  assert.equal(leaksAnswer("Kết quả là $x = 2y + 1$.", hiddenAnswers(mcq), gm.promptNumbers, gm.promptFlat), true);
  // 6 appears in the prompt of `numeric`: a hint mentioning it is not a leak; 3 (the answer) is.
  const gn = guardInputs(numeric, contextPack(numeric, unit, { stage: "before", thread: [] }), "", "before");
  assert.equal(leaksAnswer("Hệ số tự do là 6, con nhớ công thức nào?", hiddenAnswers(numeric), gn.promptNumbers, gn.promptFlat), false);
  assert.equal(leaksAnswer("Nghiệm lớn là 3 nhé?", hiddenAnswers(numeric), gn.promptNumbers, gn.promptFlat), true);
});

test("guard: JSON, length, one question, unknown numbers, leaks only before answering", () => {
  const pack = contextPack(numeric, unit, { stage: "before", thread: [] });
  const g = guardInputs(numeric, pack, "con chưa hiểu", "before");
  assert.deepEqual(checkStudentReply("không phải json", g), { ok: false, reasons: ["json"] });
  assert.equal(checkStudentReply(reply("Con xem đề cho phương trình bậc mấy nhé?"), g).ok, true);
  assert.deepEqual((checkStudentReply(reply("Câu một? Câu hai?"), g) as { reasons: string[] }).reasons, ["questions"]);
  assert.ok((checkStudentReply(reply("Thử với số 4567 xem?"), g) as { reasons: string[] }).reasons[0].startsWith("numbers"));
  assert.deepEqual((checkStudentReply(reply("Nghiệm lớn là 3 nhé?"), g) as { reasons: string[] }).reasons, ["answer"]);
  assert.equal(checkStudentReply(reply("x ".repeat(90).trim()), g).ok, false);
  assert.equal(checkStudentReply(reply("Mình nói chuyện khác nhé", true), g).ok, true);
  // After a wrong answer the solution is already on screen, so the value may be named.
  const ga = guardInputs(numeric, contextPack(numeric, unit, { stage: "after", answer: "2", errorCode: "E10", thread: [] }), "", "after");
  assert.equal(checkStudentReply(reply("Con chọn 2 là nghiệm nhỏ, đề hỏi nghiệm lớn là 3 đấy, con thấy chưa?"), ga).ok, true);
});

test("fallback: next unopened written hint, then the approved solution", () => {
  assert.deepEqual(fallbackFor(numeric, 1), { kind: "hint", level: 2, text: "Đây là phương trình bậc hai." });
  assert.equal(fallbackFor(numeric, 3).kind, "solution");
  assert.equal(fallbackFor(mcq, 0).kind, "solution");
});

test("test set: pass rule and case picking", () => {
  const ok = Array.from({ length: 20 }, () => ({ scores: [2, 2, 2, 1, 2, 2], math_wrong: false }));
  assert.equal(evalSummary(ok).passed, true);
  assert.equal(evalSummary(ok.slice(0, 19)).passed, false);
  assert.equal(evalSummary([...ok, { scores: [2, 2, 2, 2, 2, 2], math_wrong: true }]).passed, false);
  assert.equal(evalSummary(Array.from({ length: 20 }, () => ({ scores: [1, 1, 2, 1, 2, 1], math_wrong: false }))).passed, false);
  const picked = pickEvalCases([
    { item_id: "a", error_code: "E02" }, { item_id: "a", error_code: "E02" }, { item_id: "b", error_code: "E10" }, { item_id: "c", error_code: null },
  ]);
  assert.deepEqual(picked.map((p) => [p.item_id, p.count]), [["a", 2], ["b", 1]]);
});
