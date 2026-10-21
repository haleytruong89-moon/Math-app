// S5: geometry proof items — schema, shuffle, grading, public views.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Item, Unit } from "./schema.ts";
import { displayOrder } from "./shuffle.ts";
import { gradeItem } from "./grade.ts";
import { analysisView, orderView, proofView } from "./public-geometry.ts";
import { isProofKu } from "./curriculum.ts";
import { texToHtml } from "./tex.ts";
import { itemHash } from "./lock.ts";
import { answerHtml, correctHtml } from "../learning/work.ts";
import { checkStandard } from "./standard.ts";

const mcq = (id: string, correct = 0, n = 3) => ({
  id, type: "mcq", level: "L2", prompt: "?", options: Array.from({ length: n }, (_, i) => `Phương án ${i + 1}`), correct,
  mistakes: { [String((correct + 1) % n)]: { code: "E06", feedback: "Hướng này không tới giả thiết." } }, solution: "Vì vậy.",
});
const analysis = () => ({
  id: "g-p1", type: "analysis", level: "L2", prompt: "Chứng minh $X$.", goal: "$X$",
  steps: [
    { ask: "Muốn có $X$, cần gì?", node: "$Y$", item: mcq("g-p1-s1", 0) },
    { ask: "Vì sao có $Y$?", node: "giả thiết", given: true, item: mcq("g-p1-s2", 2) },
  ],
  outline: ["Giả thiết ⇒ $Y$", "$Y$ ⇒ $X$"], solution: "Lời giải.",
});
const proof = () => ({
  id: "g-p2", type: "proof", level: "L2", prompt: "Chứng minh BCDE nội tiếp.",
  lines: ["Ta có $\\angle BDC = 90^\\circ$ ([[1]])", "⇒ D, E thuộc đường tròn đường kính [[2]]"],
  bank: ["BD là đường cao (gt)", "BC", "DE", "góc nội tiếp chắn nửa đường tròn"],
  blanks: [{ correct: 0, mistakes: { "3": { code: "E09", feedback: "Đó là hệ quả, không phải lí do." } } } as { correct: number; mistakes?: Record<string, unknown> }, { correct: 1 } as { correct: number; mistakes?: Record<string, unknown> }],
  solution: "Lời giải.",
});
const order = () => ({
  id: "g-p3", type: "order", level: "L3", prompt: "Sắp xếp lời giải.",
  lines: [{ text: "Xét hai tam giác" }, { text: "góc A chung" }, { text: "góc vuông", after: [0] }, { text: "⇒ đồng dạng", after: [1, 2] }] as { text: string; after?: number[] }[],
  distractors: [{ text: "⇒ đồng dạng sai thứ tự", code: "E08", feedback: "Sai thứ tự đỉnh." }],
  solution: "Lời giải.",
});
const issuesOf = (raw: unknown) => JSON.stringify(Item.safeParse(raw).error?.issues ?? []);

test("displayOrder: deterministic permutation, never the identity", () => {
  for (const n of [2, 3, 5, 8, 13]) {
    const a = displayOrder("seed-x", n);
    assert.deepEqual(displayOrder("seed-x", n), a);
    assert.deepEqual([...a].sort((x, y) => x - y), Array.from({ length: n }, (_, i) => i));
    assert.notDeepEqual(a, Array.from({ length: n }, (_, i) => i));
  }
  assert.deepEqual(displayOrder("s", 1), [0]);
});

test("analysis item: 2–5 levels, step ids, last level is the given, outline 2–6", () => {
  assert.ok(Item.safeParse(analysis()).success, issuesOf(analysis()));
  const noGiven = analysis();
  delete (noGiven.steps[1] as { given?: true }).given;
  assert.match(issuesOf(noGiven), /chạm giả thiết/);
  const early = analysis();
  (early.steps[0] as { given?: true }).given = true;
  assert.ok(!Item.safeParse(early).success, "given before the last level");
  const badId = analysis();
  badId.steps[1].item.id = "g-p1-x";
  assert.ok(!Item.safeParse(badId).success, "step id");
  const short = analysis();
  short.outline = ["một"];
  assert.ok(!Item.safeParse(short).success, "outline ≥ 2");
});

test("proof item: [[n]] markers 1..k once in order, outside $…$, bank ≥ k+2 distinct, valid corrects", () => {
  assert.ok(Item.safeParse(proof()).success, issuesOf(proof()));
  const twice = proof();
  twice.lines[1] = "⇒ [[1]]";
  assert.match(issuesOf(twice), /\[\[1\]\]/);
  const inMath = proof();
  inMath.lines[1] = "⇒ $AB = [[2]]$";
  assert.match(issuesOf(inMath), /công thức/);
  const small = proof();
  small.bank = ["a", "b", "c"];
  assert.match(issuesOf(small), /bank cần ≥ 4/);
  const out = proof();
  out.blanks[1].correct = 9;
  assert.ok(!Item.safeParse(out).success);
  const selfMistake = proof();
  selfMistake.blanks[0].mistakes = { "0": { code: "E09", feedback: "x" } };
  assert.ok(!Item.safeParse(selfMistake).success);
});

test("order item: 3–10 lines, after only points backwards, texts unique, ≤ 3 distractors", () => {
  assert.ok(Item.safeParse(order()).success, issuesOf(order()));
  const fwd = order();
  fwd.lines[1].after = [2];
  assert.match(issuesOf(fwd), /đứng trước/);
  const dup = order();
  dup.distractors[0].text = "góc A chung";
  assert.ok(!Item.safeParse(dup).success);
});

test("drawFirst and worked.analysis are accepted", () => {
  assert.ok(Item.safeParse({ ...proof(), drawFirst: true }).success);
  const reId = (raw: ReturnType<typeof analysis>, id: string) => ({ ...raw, id, steps: raw.steps.map((s, i) => ({ ...s, item: { ...s.item, id: `${id}-s${i + 1}` } })) });
  const u = {
    id: "g", module: "m", order: 1, title: "G", status: "draft", estMinutes: 30, theory: ["Lý thuyết."],
    worked: { problem: "Bài.", analysis: { goal: "$X$", steps: [{ ask: "Cần gì?", node: "$Y$" }, { ask: "Vì sao?", node: "gt" }] }, steps: [{ text: "Bước." }, { text: "Xong." }], selfExplain: "Vì sao?" },
    faded: { problem: "Bài.", steps: [{ text: "Bước." }, { prompt: "Điền.", item: mcq("g-f1") }] },
    practice: [analysis(), proof(), order(), { ...mcq("g-p4"), level: "L1" }],
    exit: [reId(analysis(), "g-x1"), { ...proof(), id: "g-x2" }, { ...order(), id: "g-x3" }, { ...mcq("g-x4"), level: "L1" }],
  };
  const r = Unit.safeParse(u);
  assert.ok(r.success, JSON.stringify(r.error?.issues));
});


// ---------------------------------------------------------------- grading

type Of<T extends Item["type"]> = Extract<Item, { type: T }>;
const P = (raw: ReturnType<typeof proof>) => Item.parse(raw) as Of<"proof">;
const O = (raw: ReturnType<typeof order>) => Item.parse(raw) as Of<"order">;
/** Shown position of an authored index. */
const shownAt = (id: string, n: number, authored: number) => displayOrder(id, n).indexOf(authored);

test("grade analysis = steps semantics (first wrong level's code)", () => {
  const it = Item.parse(analysis());
  assert.deepEqual(gradeItem(it, "0|2"), { understood: true, correct: true, steps: [true, true] });
  const g = gradeItem(it, "1|2");
  assert.equal(g.correct, false);
  assert.equal(g.errorCode, "E06");
  assert.deepEqual(g.steps, [false, true]);
  assert.equal(gradeItem(it, "0").understood, false);
});

test("grade proof: shown positions mapped back, per-blank parts, first wrong blank's mistake", () => {
  const it = P(proof());
  const s = (k: number) => shownAt(it.id, it.bank.length, k);
  assert.deepEqual(gradeItem(it, `${s(0)}|${s(1)}`), { understood: true, correct: true, parts: [true, true] });
  const g = gradeItem(it, `${s(3)}|${s(1)}`);
  assert.deepEqual([g.correct, g.parts, g.errorCode, g.feedback], [false, [false, true], "E09", "Đó là hệ quả, không phải lí do."]);
  assert.equal(gradeItem(it, `${s(0)}|`).understood, false, "blank in practice = not understood");
  const ex = gradeItem(it, `${s(0)}|`, { blanksWrong: true });
  assert.deepEqual([ex.understood, ex.correct, ex.parts], [true, false, [true, false]]);
  assert.equal(gradeItem(it, "9|0").understood, false, "out of range");
});

test("grade order: every topological order is right; distractor / prerequisite / missing give `at`", () => {
  const it = O(order());
  const n = it.lines.length + it.distractors.length;
  const ans = (authored: number[]) => authored.map((a) => shownAt(it.id, n, a)).join(",");
  assert.equal(gradeItem(it, ans([0, 1, 2, 3])).correct, true);
  assert.equal(gradeItem(it, ans([0, 2, 1, 3])).correct, true, "lines 1 and 2 may swap");
  const d = gradeItem(it, ans([0, 4, 1, 2, 3]));
  assert.deepEqual([d.correct, d.at, d.errorCode, d.feedback], [false, 1, "E08", "Sai thứ tự đỉnh."]);
  const pre = gradeItem(it, ans([0, 1, 3, 2]));
  assert.deepEqual([pre.at, pre.errorCode], [2, "E09"]);
  assert.match(pre.feedback!, /góc vuông/);
  const miss = gradeItem(it, ans([0, 1, 2]));
  assert.deepEqual([miss.correct, miss.at, miss.errorCode], [false, 3, "E09"]);
  assert.match(miss.feedback!, /thiếu bước/);
  for (const bad of ["", "0,0", "99", "a,b"]) assert.equal(gradeItem(it, bad).understood, false, bad);
});

// ---------------------------------------------------------------- public views
const SECRET = /"(correct|mistakes|node|outline|after|given|solution|feedback|code)"/;

test("public views: no answer key, lines and bank shuffled", () => {
  const p = P(proof());
  const pv = proofView(p);
  assert.doesNotMatch(JSON.stringify(pv), SECRET);
  assert.deepEqual(pv.proofLines[0].filter((s) => "blank" in s), [{ blank: 0 }]);
  assert.deepEqual(pv.bankHtml, displayOrder(p.id, 4).map((k) => texToHtml(p.bank[k])), "bank follows displayOrder");
  const o = O(order());
  const ov = orderView(o);
  assert.doesNotMatch(JSON.stringify(ov), SECRET);
  assert.equal(ov.extraCount, 1);
  assert.equal(ov.orderLinesHtml.length, 5);
  assert.notDeepEqual(ov.orderLinesHtml.slice(0, 4), o.lines.map((l) => texToHtml(l.text)), "authored order hidden");
  const a = Item.parse(analysis()) as Of<"analysis">;
  const av = analysisView(a);
  assert.doesNotMatch(JSON.stringify(av), SECRET);
  assert.equal(av.steps.length, 2);
  assert.doesNotMatch(JSON.stringify(av), /giả thiết/, "nodes stay on the server");
});

test("isProofKu: track C and not fully auto-graded", () => {
  assert.equal(isProofKu({ track: "C", grading: "partial" }), true);
  assert.equal(isProofKu({ track: "C", grading: "tutor" }), true);
  assert.equal(isProofKu({ track: "C", grading: "full" }), false);
  assert.equal(isProofKu({ track: "A", grading: "partial" }), false);
});

// ---------------------------------------------------------------- lock, Bài làm, standard
test("lock: grading key of the new types; wording outside the key may change", () => {
  const o = O(order());
  assert.equal(itemHash(o), itemHash(O({ ...order(), prompt: "Đề khác." })));
  const o3 = order();
  o3.lines[2].after = [0, 1];
  assert.notEqual(itemHash(o), itemHash(O(o3)));
  const p2 = proof();
  p2.blanks[1].correct = 2;
  assert.notEqual(itemHash(P(proof())), itemHash(P(p2)));
  assert.equal(itemHash(Item.parse(analysis())), itemHash(Item.parse({ ...analysis(), outline: ["x", "y"] })), "outline is wording");
});

test("work: readable answers and right answers", () => {
  const p = P(proof());
  const s = (k: number) => displayOrder(p.id, 4).indexOf(k);
  assert.match(answerHtml(p, `${s(3)}|${s(1)}`), /\(1\) góc nội tiếp.*\(2\) BC/);
  assert.match(correctHtml(p), /\(1\) BD là đường cao.*\(2\) BC/);
  const o = O(order());
  const ans = [0, 2, 1, 3].map((a) => displayOrder(o.id, 5).indexOf(a)).join(",");
  assert.match(answerHtml(o, ans), /1\. Xét hai tam giác[\s\S]*2\. góc vuông[\s\S]*3\. góc A chung/);
  assert.match(correctHtml(o), /1\. Xét hai tam giác[\s\S]*4\. ⇒ đồng dạng/);
  assert.equal(answerHtml(o, ""), "(bỏ trống)");
  assert.match(answerHtml(Item.parse(analysis()), "1|2"), /Tầng 1: Phương án 2 · Tầng 2: Phương án 3/);
});

test("standard: a proof KU needs analysis, C3 and C2 in practice and exit", () => {
  const u = Unit.parse({
    id: "g", module: "m", order: 1, title: "G", status: "draft", estMinutes: 30, theory: ["L."],
    worked: { problem: "B.", steps: [{ text: "a" }, { text: "b" }], selfExplain: "?" },
    faded: { problem: "B.", steps: [{ text: "a" }, { prompt: "Điền.", item: mcq("g-f1") }] },
    practice: ["g-p1", "g-p2", "g-p3", "g-p4"].map((id) => mcq(id)),
    exit: ["g-x1", "g-x2", "g-x3", "g-x4"].map((id) => mcq(id)),
  });
  const out = checkStandard(u, new Set(), { proofKu: true }).join("\n");
  assert.match(out, /luyện tập của bài hình cần ≥ 1 câu phân tích ngược, ≥ 1 câu điền chỗ trống, ≥ 1 câu sắp xếp/);
  assert.match(out, /kho kiểm tra của bài hình cần ≥ 1 câu phân tích ngược và ≥ 2 câu điền chỗ trống \/ sắp xếp/);
  assert.doesNotMatch(checkStandard(u, new Set()).join("\n"), /bài hình/, "only for proof KUs");
});
