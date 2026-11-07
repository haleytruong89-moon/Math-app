// Thi thử (S9): the score-sheet file is valid, and checkSheet catches what it should.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum } from "./curriculum.ts";
import { MockBank, MockSheet, checkBank, checkSheet } from "./mock.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const roadmap = new Set(Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/curriculum.json"), "utf8"))).units.map((u) => u.id));
const part = (p: string, max: number, units = ["d-ptbh"]) => ({ part: p, max, answer: "$x=1$", units });
const sample = () => ({
  paper: 57, status: "draft", pages: "tr. 130–131",
  parts: [part("1.1", 1, ["c-rutgon"]), part("1.2", 0.5, ["c-cauphu"]), part("2", 1.5, ["g-honhop"]), part("3.1", 1), part("3.2", 1.5, ["e-vietets"]), part("4.1", 1, ["htl-1"]), part("4.2a", 1, ["k-tugiacnt"]), part("4.2b", 1, ["o-dongdang"]), part("4.2c", 1, ["o-chungminh"]), part("5", 0.5, ["e-viete"])],
});

test("the real score-sheet file is valid and meets the rules", () => {
  const bank = MockBank.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/thi-thu.json"), "utf8")));
  assert.deepEqual(checkBank(bank, roadmap), []);
});

test("the e2e fixture sheet is valid against the fixture roadmap", () => {
  const fx = new Set(Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "e2e/fixtures/content/curriculum.json"), "utf8"))).units.map((u) => u.id));
  assert.deepEqual(checkBank(MockBank.parse(JSON.parse(fs.readFileSync(path.join(repo, "e2e/fixtures/content/thi-thu.json"), "utf8"))), fx), []);
});

test("a well-formed sheet passes", () => {
  assert.deepEqual(checkSheet(MockSheet.parse(sample()), roadmap), []);
});

test("schema: papers 57–68 only, part keys, approved needs a date, no stray fields", () => {
  assert.equal(MockSheet.safeParse({ ...sample(), paper: 56 }).success, false);
  assert.equal(MockSheet.safeParse({ ...sample(), paper: 69 }).success, false);
  assert.equal(MockSheet.safeParse({ ...sample(), parts: [...sample().parts.slice(1), part("6.1", 1)] }).success, false);
  assert.equal(MockSheet.safeParse({ ...sample(), status: "approved" }).success, false);
  assert.equal(MockSheet.safeParse({ ...sample(), problem: "Cho …" }).success, false); // no problem text in the app
});

test("rules: total 10, quarter points, every Bài, known KUs, no part scored with its own sub-parts, no duplicates", () => {
  const s = sample();
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.slice(0, 9) }), roadmap).join(), /tổng điểm.*9,5|9.5/);
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.map((p, i) => (i === 0 ? { ...p, max: 0.9 } : i === 1 ? { ...p, max: 0.6 } : p)) }), roadmap).join(), /bội của 0,25/);
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.map((p) => (p.part === "5" ? { ...p, part: "4.3" } : p)) }), roadmap).join(), /thiếu Bài 5/);
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.map((p, i) => (i === 0 ? { ...p, units: ["khong-co"] } : p)) }), roadmap).join(), /không có trong lộ trình/);
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.map((p) => (p.part === "4.2c" ? { ...p, part: "4.2" } : p)) }), roadmap).join(), /đã chia nhỏ/);
  assert.match(checkSheet(MockSheet.parse({ ...s, parts: s.parts.map((p) => (p.part === "1.2" ? { ...p, part: "1.1" } : p)) }), roadmap).join(), /ý trùng 1\.1/);
  assert.match(checkBank({ papers: [MockSheet.parse(s), MockSheet.parse(s)] }, roadmap).join(), /Đề trùng: 57/);
});
