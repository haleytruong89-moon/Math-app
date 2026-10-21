// S5: geometry proof items — schema, shuffle, grading, public views.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Item, Unit } from "./schema.ts";
import { displayOrder } from "./shuffle.ts";

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

