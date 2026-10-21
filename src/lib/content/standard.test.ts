// CONTENT_STANDARD §7 step 1: the authoring rules every new KU must meet (LT13, LT14, LT16, AI2).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum, ancestors, isProofKu } from "./curriculum.ts";
import { Unit } from "./schema.ts";
import { checkStandard } from "./standard.ts";

const H = ["Đề hỏi gì?", "Đây là dạng nào?", "Dùng công thức nào?"];
const num = (id: string, level: string, n: number, extra: Record<string, unknown> = {}) => ({ id, type: "numeric", level, prompt: `Tính ${n}.`, answer: String(n), solution: `Bằng $${n}$.`, ...extra });
const good = () => ({
  id: "k", module: "m", order: 1, title: "K", status: "draft", estMinutes: 30, theory: ["Lý thuyết."],
  worked: { problem: "Bài.", steps: [{ text: "Bước." }, { text: "Kết luận: xong." }], selfExplain: "Vì sao?" },
  faded: { problem: "Bài.", steps: [{ text: "Bước." }, { prompt: "Điền.", item: num("k-f1", "L1", 7) }] },
  practice: [
    { id: "k-p1", type: "mcq", level: "L1", prompt: "Nên làm cách nào?", options: ["A", "B", "C"], correct: 0, recognition: true, hints: H,
      mistakes: { "1": { code: "E05", feedback: "Đây là dạng A." }, "2": { code: "E05", feedback: "Đây là dạng A." } }, solution: "A." },
    num("k-p2", "L1", 12, { hints: H }), num("k-p3", "L1", 13, { hints: H }),
    num("k-p4", "L2", 14, { hints: H }), num("k-p5", "L2", 15, { hints: H }), num("k-p6", "L2", 16, { hints: H }),
    num("k-p7", "L3", 17, { hints: H }), num("k-p8", "L3", 18, { hints: H, mistakes: [{ answer: "19", code: "E12", feedback: "Ôn nền.", review: "base" }] }),
  ],
  exit: [
    num("k-x1", "L1", 21), num("k-x2", "L1", 22), num("k-x3", "L2", 23), num("k-x4", "L2", 24), num("k-x5", "L2", 25),
    num("k-x6", "L3", 26, { source: "68 đề – Đề 1, Bài 2" }), num("k-x7", "L3", 27), num("k-x8", "L3", 28),
  ],
});
const prereqs = new Set(["base"]);
const issues = (mut: (u: ReturnType<typeof good>) => void) => {
  const raw = good();
  mut(raw);
  return checkStandard(Unit.parse(raw), prereqs);
};

test("standard: a unit that follows CONTENT_STANDARD has no issues", () => {
  assert.deepEqual(issues(() => {}), []);
});

test("standard: practice must be 3 L1 + 3 L2 + 2 L3 with a recognition item (wrong options = E05)", () => {
  assert.match(issues((u) => { u.practice[6].level = "L2"; }).join(), /luyện tập.*3 L1 \+ 3 L2 \+ 2 L3/);
  assert.match(issues((u) => { delete (u.practice[0] as Record<string, unknown>).recognition; }).join(), /nhận dạng/);
  assert.match(issues((u) => { (u.practice[0] as { mistakes: Record<string, { code: string }> }).mistakes["1"].code = "E01"; }).join(), /E05/);
});

test("standard: every practice item has 3 hints, ≤ 25 words, without the answer; exit items have none", () => {
  assert.match(issues((u) => { delete (u.practice[1] as Record<string, unknown>).hints; }).join(), /k-p2.*gợi ý/);
  assert.match(issues((u) => { (u.practice[1] as { hints: string[] }).hints = [H[0], H[1], "Kết quả là 12."]; }).join(), /k-p2.*đáp số/);
  assert.match(issues((u) => { (u.practice[1] as { hints: string[] }).hints = [H[0], H[1], Array(26).fill("chữ").join(" ")]; }).join(), /k-p2.*25 chữ/);
  assert.deepEqual(issues((u) => { (u.practice[1] as { hints: string[] }).hints = [H[0], H[1], "Dùng $x^12$ rồi cộng 120."]; }), []);
  assert.match(issues((u) => { (u.exit[0] as Record<string, unknown>).hints = H; }).join(), /k-x1.*không có gợi ý/);
});

test("standard: exit bank is 2 L1 + 3 L2 + 3 L3 with at least one sourced item", () => {
  assert.match(issues((u) => { u.exit.pop(); }).join(), /kho kiểm tra.*2 L1 \+ 3 L2 \+ 3 L3/);
  assert.match(issues((u) => { delete (u.exit[5] as Record<string, unknown>).source; }).join(), /source/);
});

test("standard: a 'review' link must point to a prerequisite (direct or indirect)", () => {
  assert.match(issues((u) => { (u.practice[7] as unknown as { mistakes: { review: string }[] }).mistakes[0].review = "other"; }).join(), /review "other"/);
});

// Every real content file.
const root = path.resolve(import.meta.dirname, "../../../content");
const curriculum = Curriculum.parse(JSON.parse(fs.readFileSync(path.join(root, "curriculum.json"), "utf8")));
for (const dir of fs.readdirSync(root)) {
  const mdir = path.join(root, dir);
  if (!fs.statSync(mdir).isDirectory()) continue;
  for (const f of fs.readdirSync(mdir).filter((x) => x.endsWith(".json") && x !== "module.json")) {
    test(`standard: ${dir}/${f}`, () => {
      const u = Unit.parse(JSON.parse(fs.readFileSync(path.join(mdir, f), "utf8")));
      const cu = curriculum.units.find((x) => x.id === u.id);
      assert.deepEqual(checkStandard(u, ancestors(curriculum, u.id), { proofKu: !!cu && isProofKu(cu) }), []);
    });
  }
}

test("standard: an E12 mistake must carry a review link (CONTENT_STANDARD §4)", () => {
  assert.match(issues((u) => { delete (u.practice[7] as unknown as { mistakes: { review?: string }[] }).mistakes[0].review; }).join(), /k-p8.*E12.*review/);
});

test("standard: exams 57–68 are reserved for mock tests — no item may come from them (CONTENT_STANDARD §6)", () => {
  for (const d of [57, 62, 68])
    assert.match(issues((u) => { (u.exit[5] as Record<string, unknown>).source = `68 đề – Đề ${d}, Bài 1.2 (chuyển thể)`; }).join(), new RegExp(`k-x6.*Đề ${d}`));
  assert.match(issues((u) => { (u.practice[6] as Record<string, unknown>).source = "68 đề – Đề 60"; }).join(), /k-p7.*thi thử/);
  for (const d of [1, 5, 56, 156])
    assert.deepEqual(issues((u) => { (u.exit[5] as Record<string, unknown>).source = `68 đề – Đề ${d}, Bài 1`; }), []);
});

test("standard: the correct option must not sit mostly in one slot (options are shown in file order)", () => {
  const mcq = (id: string, correct: number) => ({ id, type: "mcq", level: "L1", prompt: "Chọn.", options: ["A", "B", "C", "D"], correct, solution: "A." });
  const setExit = (slots: number[]) => (u: ReturnType<typeof good>) => {
    slots.forEach((c, i) => { (u.exit as unknown[])[i] = { ...mcq(`k-x${i + 1}`, c), level: u.exit[i].level, ...(i === 5 ? { source: "68 đề – Đề 1" } : {}) }; });
  };
  // 9 mcq (p1 at slot 0 + 8 exit): 7 at slot 0 → flagged; spread → fine; fewer than 8 mcq → not checked.
  assert.match(issues(setExit([0, 0, 0, 0, 0, 0, 1, 2])).join(), /k: 7\/9 câu trắc nghiệm.*phương án 1/);
  assert.deepEqual(issues(setExit([1, 2, 3, 0, 1, 2, 3, 0])), []);
  assert.deepEqual(issues(setExit([0, 0, 0, 0, 0, 0])), []);
});
