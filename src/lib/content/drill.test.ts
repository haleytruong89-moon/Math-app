// Luyện đề 4.2: the bank file is valid, and checkDrill catches what it should.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum } from "./curriculum.ts";
import { DrillBank, DrillProblem, checkDrill, checkDrillBank } from "./drill.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const roadmap = new Set(Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/curriculum.json"), "utf8"))).units.map((u) => u.id));
const SVG = '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><title>Hình</title><path d="M10 50 L90 50 L10 10 Z" fill="none" stroke="currentColor"/></svg>';
const mcq = (id: string, mistakes = { "1": { code: "E06", feedback: "Lạc hướng." } }) => ({ id, type: "mcq", level: "L2", prompt: "Chọn.", options: ["Đúng", "Sai"], correct: 0, mistakes, solution: "Vì vậy." });
const sample = () => ({
  id: "ld-d03", order: 3, title: "Đề 3 — Bài 4.2a", source: "68 đề – Đề 3, Bài 4.2a", parts: ["a"], needs: ["k-tugiacnt"], status: "draft",
  figure: { svg: SVG, alt: "Hình đề 3" }, problem: "Cho … a) Chứng minh tứ giác $ADEC$ nội tiếp.",
  items: [
    { id: "ld-d03-1", type: "analysis", level: "L2", prompt: "Phân tích ngược.", goal: "$ADEC$ nội tiếp",
      steps: [{ ask: "Cần gì?", node: "Hai góc vuông", item: mcq("ld-d03-1-s1") }, { ask: "Vì sao?", node: "gt", given: true, item: mcq("ld-d03-1-s2") }],
      outline: ["Hai góc vuông", "⇒ nội tiếp"], solution: "Lời giải." },
    { id: "ld-d03-2", type: "proof", level: "L2", prompt: "Điền.", lines: ["Có góc vuông ([[1]])", "⇒ nội tiếp ([[2]])"],
      bank: ["gt", "hai đỉnh kề cùng nhìn", "đối nhau", "vòng"], blanks: [{ correct: 0, mistakes: { "3": { code: "E09", feedback: "Vòng." } } }, { correct: 1, mistakes: { "2": { code: "E04", feedback: "Sai dấu hiệu." } } }], solution: "Lời giải." },
  ],
  solution: "Kết luận: $ADEC$ nội tiếp.",
});

test("the real drill bank is valid and meets the drill rules", () => {
  const bank = DrillBank.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/luyen-de-42.json"), "utf8")));
  assert.deepEqual(checkDrillBank(bank, roadmap), []);
});

test("a well-formed problem passes; the rules catch reserved exams, wrong ids, unknown KUs, missing item types and feedback", () => {
  assert.deepEqual(checkDrill(DrillProblem.parse(sample()), roadmap), []);
  const bad = sample();
  bad.source = "68 đề – Đề 60, Bài 4.2a";
  bad.needs = ["k-khongco"];
  bad.items[1].id = "ld-d03-9";
  (bad.items[0] as { steps: { item: { mistakes: object } }[] }).steps[0].item.mistakes = {};
  const errs = checkDrill(DrillProblem.parse(bad), roadmap).join("\n");
  assert.match(errs, /Đề 1–56/);
  assert.match(errs, /k-khongco/);
  assert.match(errs, /ld-d03-2/);
  assert.match(errs, /tầng 1/);
  const noProof = sample();
  noProof.items = [noProof.items[0], mcq("ld-d03-2") as never];
  assert.match(checkDrill(DrillProblem.parse(noProof), roadmap).join("\n"), /điền chỗ trống hoặc sắp xếp/);
  assert.throws(() => DrillProblem.parse({ ...sample(), id: "ld-3" }));
  assert.throws(() => DrillProblem.parse({ ...sample(), status: "approved" })); // approvedOn needed
});
