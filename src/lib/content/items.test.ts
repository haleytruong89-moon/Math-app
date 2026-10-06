// S6b: multi-step items (LT5) and inline SVG figures (LT7).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Item, Unit } from "./schema.ts";
import { gradeItem } from "./grade.ts";
import { checkSvg } from "./svg.ts";

const num = (id: string, answer: string, mistakes: unknown[] = []) => ({ id, type: "numeric", level: "L1", prompt: "Bước?", answer, mistakes, solution: "Vì vậy." });
const steps = (n = 4) => ({
  id: "k-p1",
  type: "steps",
  level: "L2",
  prompt: "Rút gọn $P$ rồi tính tại $x = 9$.",
  steps: Array.from({ length: n }, (_, i) => ({
    prompt: `Bước ${i + 1}`,
    item: num(`k-p1-s${i + 1}`, String(i + 1), [{ answer: "99", code: i === 1 ? "E11" : "E01", feedback: `Sai ở bước ${i + 1}.`, ...(i === 1 ? { review: "base" } : {}) }]),
  })),
  solution: "Lời giải.",
});

test("steps item: 2–5 steps, step ids <item id>-s<n>, steps are mcq/numeric only", () => {
  assert.ok(Item.safeParse(steps(4)).success);
  assert.ok(!Item.safeParse(steps(1)).success, "1 step");
  assert.ok(!Item.safeParse(steps(6)).success, "6 steps");
  const badId = steps(2);
  badId.steps[1].item.id = "k-p1-x2";
  assert.ok(!Item.safeParse(badId).success, "step id");
  const nested = steps(2) as { steps: { prompt: string; item: unknown }[] };
  nested.steps[0].item = steps(2);
  assert.ok(!Item.safeParse(nested).success, "nested steps");
});

test("steps grading: one result, correct only if every step is; error code + feedback + review of the first wrong step", () => {
  const it = Item.parse(steps(4));
  assert.deepEqual(gradeItem(it, "1|2|3|4"), { understood: true, correct: true, steps: [true, true, true, true] });
  const g = gradeItem(it, "1|99|99|4");
  assert.equal(g.correct, false);
  assert.equal(g.errorCode, "E11");
  assert.equal(g.feedback, "Sai ở bước 2.");
  assert.equal(g.review, "base");
  assert.deepEqual(g.steps, [true, false, false, true]);
  assert.equal(gradeItem(it, "1|2|3").understood, false, "wrong number of parts");
  assert.equal(gradeItem(it, "1|abc|3|4").understood, false, "unreadable step");
  assert.equal(gradeItem(it, "1|abc|3|4", { blanksWrong: true }).correct, false, "exit: unreadable step counts as wrong");
  assert.equal(gradeItem(it, "1|abc|3|4", { blanksWrong: true }).understood, true);
});

test("a single numeric / mcq mistake still reports its review link", () => {
  const it = Item.parse(num("k-p2", "5", [{ answer: "6", code: "E12", feedback: "Ôn nền.", review: "base" }]));
  assert.equal(gradeItem(it, "6").review, "base");
});

const ok = '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><title>Tam giác</title><path d="M10 50 L90 50 L10 10 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="5" y="58" fill="var(--muted)">A</text></svg>';
test("svg: a plain drawing in theme colours passes", () => {
  assert.deepEqual(checkSvg(ok), []);
});

test("svg: scripts, handlers, external links, url() styles, fixed colours, missing viewBox, > 20 KB are refused", () => {
  const bad = (s: string) => checkSvg(s).length > 0;
  assert.ok(bad(ok.replace("<title>", "<script>alert(1)</script><title>")), "script");
  assert.ok(bad(ok.replace('<path d', '<path onclick="alert(1)" d')), "on*");
  assert.ok(bad(ok.replace("<title>Tam giác</title>", '<a href="https://evil.example"><title>x</title></a>')), "a + href");
  assert.ok(bad(ok.replace('<path d', '<use href="https://evil.example/x.svg#a"/><path d')), "use");
  assert.ok(bad(ok.replace('fill="none"', 'style="fill:url(https://evil.example/a)"')), "style url(");
  assert.ok(bad(ok.replace('stroke="currentColor"', 'stroke="#ff0000"')), "hex colour");
  assert.ok(bad(ok.replace('fill="var(--muted)"', 'fill="red"')), "named colour");
  assert.ok(bad(ok.replace(' viewBox="0 0 100 60"', "")), "viewBox");
  assert.ok(bad(ok.replace("<title>", "<foreignObject><div>x</div></foreignObject><title>")), "foreignObject");
  assert.ok(bad(ok.replace("<title>", "<!-- x --><title>")), "comment / doctype");
  assert.ok(bad(ok.replace("</svg>", `<text>${"x".repeat(21000)}</text></svg>`)), "size");
  assert.ok(bad("<svg viewBox='0 0 1 1'></svg><script>x</script>"), "content after the root");
});

test("svg: arrow markers may reference a local id", () => {
  const arrow = ok.replace(
    "<title>",
    '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs><line x1="0" y1="0" x2="50" y2="50" stroke="currentColor" marker-end="url(#arr)"/><title>',
  );
  assert.deepEqual(checkSvg(arrow), []);
  assert.ok(checkSvg(arrow.replace("url(#arr)", "url(https://e.x/a)")).length > 0);
});

test("figure: unit or item takes { svg, alt } (legacy enum still reads); a bad svg fails the schema", () => {
  const fig = { svg: ok, alt: "Tam giác vuông ABC" };
  assert.ok(Item.safeParse({ ...num("k-p3", "1"), figure: fig }).success);
  assert.ok(!Item.safeParse({ ...num("k-p3", "1"), figure: { svg: ok.replace('stroke="currentColor"', 'stroke="#000"'), alt: "x" } }).success);
  assert.ok(!Item.safeParse({ ...num("k-p3", "1"), figure: { svg: ok } }).success, "alt required");
  const unit = (figure: unknown) => ({
    id: "k", module: "m", order: 1, title: "K", status: "draft", estMinutes: 30, theory: ["T."], figure,
    worked: { problem: "B.", steps: [{ text: "1." }, { text: "2." }], selfExplain: "?" },
    faded: { problem: "B.", steps: [{ text: "1." }, { prompt: "?", item: num("k-f1", "1") }] },
    practice: [1, 2, 3, 4].map((n) => num(`k-p${n}`, "1")),
    exit: [1, 2, 3, 4].map((n) => num(`k-x${n}`, "1")),
  });
  assert.ok(Unit.safeParse(unit(fig)).success);
  assert.ok(Unit.safeParse(unit("right-triangle-altitude")).success);
});
