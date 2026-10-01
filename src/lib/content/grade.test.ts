import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeItem, parseAnswer } from "./grade.ts";

const close = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test("parses integers, decimals with comma or dot, negatives", () => {
  close(parseAnswer("12"), 12);
  close(parseAnswer(" 4,8 "), 4.8);
  close(parseAnswer("4.8"), 4.8);
  close(parseAnswer("-2,5"), -2.5);
});

test("parses fractions and roots", () => {
  close(parseAnswer("12/5"), 2.4);
  close(parseAnswer("2√3"), 2 * Math.sqrt(3));
  close(parseAnswer("2·√3"), 2 * Math.sqrt(3));
  close(parseAnswer("√12"), Math.sqrt(12));
  close(parseAnswer("√(12)/2"), Math.sqrt(3));
  close(parseAnswer("sqrt3"), Math.sqrt(3));
  close(parseAnswer("căn 3"), Math.sqrt(3));
  close(parseAnswer("3√3/2"), (3 * Math.sqrt(3)) / 2);
});

test("rejects things it does not understand", () => {
  for (const s of ["", "abc", "1/2/3", "√", "2+3", "1/0", "x=4"]) assert.equal(parseAnswer(s), null, s);
});

const num = { type: "numeric" as const, answer: "2√3", mistakes: [{ answer: "12", code: "E10", feedback: "quên căn" }] };

test("numeric: equivalent exact forms are correct", () => {
  for (const s of ["2√3", "√12", "2 √ 3", "√(12)"]) assert.equal(gradeItem(num, s).correct, true, s);
});

test("numeric: rounded decimals are NOT accepted for irrational answers", () => {
  assert.equal(gradeItem(num, "3,46").correct, false);
  assert.equal(gradeItem(num, "3.4641").correct, false);
});

test("numeric: decimal and fraction forms of the same rational are both accepted", () => {
  const item = { type: "numeric" as const, answer: "24/5" };
  for (const s of ["24/5", "4,8", "4.8", "48/10"]) assert.equal(gradeItem(item, s).correct, true, s);
});

test("numeric: known mistakes return their error code", () => {
  const r = gradeItem(num, "12");
  assert.deepEqual([r.correct, r.errorCode, r.feedback], [false, "E10", "quên căn"]);
  assert.equal(gradeItem(num, "7").errorCode, undefined);
});

test("numeric: unreadable input is flagged, not graded wrong", () => {
  assert.deepEqual(gradeItem(num, "hai căn ba"), { understood: false, correct: false });
});

test("mcq grading and mistakes", () => {
  const mcq = { type: "mcq" as const, options: ["a", "b", "c"], correct: 1, mistakes: { "2": { code: "E03", feedback: "f" } } };
  assert.equal(gradeItem(mcq, "1").correct, true);
  assert.equal(gradeItem(mcq, "2").errorCode, "E03");
  assert.equal(gradeItem(mcq, "0").errorCode, undefined);
  assert.equal(gradeItem(mcq, "7").understood, false);
  assert.equal(gradeItem(mcq, "x").understood, false);
});
