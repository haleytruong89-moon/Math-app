// Kiểm tra tiến bộ (08/11): the content file is valid, and checkProgressBank catches what it should.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum } from "./curriculum.ts";
import { checkProgressBank, groupOf, ProgressBank } from "./progress.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(repo, f), "utf8"));
const roadmap = new Set(Curriculum.parse(read("content/curriculum.json")).units.map((u) => u.id));
const real = () => ProgressBank.parse(read("content/kiem-tra.json"));
const part = (p: string, max: number, units = ["a-tanso"], source = "68 đề – Đề 12, Bài 1.1 (đổi số liệu)") => ({ part: p, max, answer: "$x=1$", units, source });
const sampleTest = () => ({
  n: 1, date: "2026-11-22", mode: "paper", minutes: 45, status: "draft", covers: "GĐ1",
  problems: [{ bai: 1, text: ["Cho bảng …"] }, { bai: 3, text: ["Hai xe …"] }],
  parts: [part("1.1", 0.75), part("1.2", 0.75, ["b-xsuat"]), part("3.1", 1.25, ["g-chuyendong"])],
});

test("the real file is valid and meets the rules", () => {
  assert.deepEqual(checkProgressBank(real(), roadmap), []);
});

test("the e2e fixture file is valid against the fixture roadmap", () => {
  const fx = new Set(Curriculum.parse(read("e2e/fixtures/content/curriculum.json")).units.map((u) => u.id));
  assert.deepEqual(checkProgressBank(ProgressBank.parse(read("e2e/fixtures/content/kiem-tra.json")), fx), []);
});

test("target: 8,5 over six groups summing to 10", () => {
  const t = real().target;
  assert.equal(t.total, 8.5);
  assert.deepEqual(t.groups.map((g) => g.key), ["1", "2", "3", "4.1", "4.2", "5"]);
});

test("groupOf maps part keys to target groups", () => {
  assert.deepEqual(["1.1", "2", "2.2b", "3.3", "4.1", "4.1a", "4.2c", "5"].map(groupOf), ["1", "2", "2", "3", "4.1", "4.1", "4.2", "5"]);
});

test("a well-formed test passes; Đề 57–68 refused; parts need a problem; no part with its sub-parts", () => {
  const bank = (t: unknown) => ProgressBank.parse({ ...real(), tests: [t] });
  assert.deepEqual(checkProgressBank(bank(sampleTest()), roadmap), []);
  const t1 = sampleTest(); t1.parts[0].source = "68 đề – Đề 60, Bài 1";
  assert.match(checkProgressBank(bank(t1), roadmap).join(), /Đề 60 để dành/);
  const t2 = sampleTest(); t2.parts.push(part("4.1", 1, ["p-cau"]));
  assert.match(checkProgressBank(bank(t2), roadmap).join(), /không có đề Bài 4/);
  const t3 = sampleTest(); t3.parts.push(part("1", 0.5));
  assert.match(checkProgressBank(bank(t3), roadmap).join(), /đã chia nhỏ/);
  const t4 = sampleTest(); t4.parts[0].units = ["khong-co"];
  assert.match(checkProgressBank(bank(t4), roadmap).join(), /không có trong lộ trình/);
});

test("schema: approved needs a date, KT 1–20, app mode not yet, every part has a source", () => {
  const ok = (t: unknown) => ProgressBank.safeParse({ ...real(), tests: [t] }).success;
  assert.equal(ok(sampleTest()), true);
  assert.equal(ok({ ...sampleTest(), status: "approved" }), false);
  assert.equal(ok({ ...sampleTest(), n: 21 }), false);
  assert.equal(ok({ ...sampleTest(), mode: "app" }), false);
  const t = sampleTest(); delete (t.parts[0] as { source?: string }).source;
  assert.equal(ok(t), false);
});
