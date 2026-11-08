// Mục tiêu 8,5 (08/11): the target board.
import { test } from "node:test";
import assert from "node:assert/strict";
import { targetBoard, type BoardExam } from "./target.ts";
import type { TargetGroup } from "../content/progress.ts";

const groups: TargetGroup[] = [
  { key: "1", label: "Bài 1", max: 1.5, target: 1.5, units: ["a", "b"] },
  { key: "2", label: "Bài 2", max: 1.5, target: 1.25, units: ["c"] },
  { key: "3", label: "Bài 3", max: 2.5, target: 2.5, units: ["d"] },
  { key: "4.1", label: "Bài 4.1", max: 1, target: 1, units: ["e"] },
  { key: "4.2", label: "Bài 4.2", max: 3, target: 2.25, units: ["f"] },
  { key: "5", label: "Bài 5", max: 0.5, target: 0, units: ["g"] },
];
const kt1: BoardExam = {
  label: "KT1", date: "2026-11-22",
  parts: [{ part: "1.1a", max: 0.5 }, { part: "1.1b", max: 0.5 }, { part: "1.2", max: 0.5 }, { part: "3.1", max: 1 }, { part: "4.1", max: 1 }],
  scores: [{ part: "1.1a", points: 0.5 }, { part: "1.1b", points: 0.5 }, { part: "1.2", points: 0.25 }, { part: "3.1", points: 0.5 }, { part: "4.1", points: 0, skipped: true }],
};

test("measured rate per group, scaled to the full paper; untested and skipped groups stay unmeasured", () => {
  const b = targetBoard(groups, [kt1], new Map([["a", 3], ["b", 1], ["d", 4]]));
  const r = Object.fromEntries(b.rows.map((x) => [x.key, x]));
  assert.deepEqual(r["1"].measured, { got: 1.25, max: 1.5, label: "KT1", date: "2026-11-22" });
  assert.equal(r["1"].scaled, 1.25);
  assert.equal(r["1"].status, "near"); // 1.25 ≥ 0.8 × 1.5
  assert.equal(r["3"].scaled, 1.25); // 0.5/1 × 2.5
  assert.equal(r["3"].status, "low");
  assert.equal(r["4.1"].measured, null); // "chưa học"
  assert.equal(r["4.1"].status, "none");
  assert.equal(r["2"].status, "none");
  assert.equal(r["5"].status, "skip");
  assert.deepEqual([r["1"].solid, r["1"].units, r["3"].solid], [1, 2, 1]);
  assert.deepEqual(b.measured, { scaled: 2.5, max: 4, target: 4 });
});

test("the latest exam wins; a later exam that does not test a group leaves the earlier measure", () => {
  const kt2: BoardExam = { label: "KT2", date: "2026-12-06", parts: [{ part: "1.1", max: 1 }, { part: "1.2", max: 0.5 }], scores: [{ part: "1.1", points: 1 }, { part: "1.2", points: 0.5 }] };
  const b = targetBoard(groups, [kt2, kt1], new Map());
  const r = Object.fromEntries(b.rows.map((x) => [x.key, x]));
  assert.equal(r["1"].measured?.label, "KT2");
  assert.equal(r["1"].status, "ok");
  assert.equal(r["3"].measured?.label, "KT1");
});
