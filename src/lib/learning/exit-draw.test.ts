import { test } from "node:test";
import assert from "node:assert/strict";
import { drawExit } from "./exit-draw.ts";
import type { AttemptRow } from "./rules.ts";

// Standard bank (CONTENT_STANDARD §1): 2 L1 + 3 L2 + 3 L3.
const bank = [
  { id: "u-x1", level: "L1" }, { id: "u-x2", level: "L1" },
  { id: "u-x3", level: "L2" }, { id: "u-x4", level: "L2" }, { id: "u-x5", level: "L2" },
  { id: "u-x6", level: "L3" }, { id: "u-x7", level: "L3" }, { id: "u-x8", level: "L3" },
];
const levelOf = new Map(bank.map((b) => [b.id, b.level]));
const run = (ids: string[], runId: string, at: string): AttemptRow[] =>
  ids.map((item_id) => ({ item_id, mode: "exit", correct: false, error_code: null, exit_run: runId, created_at: at }) as AttemptRow);
const count = (ids: string[], lvl: string) => ids.filter((i) => levelOf.get(i) === lvl).length;

test("draw: 1 L1 + 2 L2 + 2 L3, in bank order, the same every time for the same history", () => {
  const a = drawExit(bank, [], "s1:u");
  assert.equal(a.length, 5);
  assert.deepEqual([count(a, "L1"), count(a, "L2"), count(a, "L3")], [1, 2, 2]);
  assert.deepEqual(a, [...a].sort((x, y) => bank.findIndex((b) => b.id === x) - bank.findIndex((b) => b.id === y)));
  assert.deepEqual(drawExit(bank, [], "s1:u"), a);
});

test("draw: the next run takes every unseen item first, then the one seen longest ago", () => {
  const first = drawExit(bank, [], "s1:u");
  const h1 = run(first, "r1", "2026-10-10T00:00:00Z");
  const second = drawExit(bank, h1, "s1:u");
  const unseen = bank.map((b) => b.id).filter((id) => !first.includes(id));
  assert.equal(unseen.length, 3);
  for (const id of unseen) assert.ok(second.includes(id), `${id} unseen but not drawn`);
  assert.deepEqual([count(second, "L1"), count(second, "L2"), count(second, "L3")], [1, 2, 2]);
  // Run 3: everything seen; within a level the oldest last-seen comes first.
  const h2 = [...h1, ...run(second, "r2", "2026-10-11T00:00:00Z")];
  const third = drawExit(bank, h2, "s1:u");
  const onlyInFirst = first.filter((id) => !second.includes(id));
  for (const id of onlyInFirst) assert.ok(third.includes(id), `${id} seen longest ago but not drawn`);
});

test("draw: practice answers don't count as seen; a bank of 5 or fewer is used whole", () => {
  const practice = bank.map((b) => ({ item_id: b.id, mode: "practice", correct: true, error_code: null, exit_run: null, created_at: "2026-10-10T00:00:00Z" }) as AttemptRow);
  assert.deepEqual(drawExit(bank, practice, "s1:u"), drawExit(bank, [], "s1:u"));
  const small = bank.slice(0, 5);
  assert.deepEqual(drawExit(small, [], "s1:u"), small.map((b) => b.id));
});

test("draw: a bank without enough of one level fills up from the others", () => {
  const lopsided = [...bank.slice(0, 5), { id: "u-x9", level: "L2" }]; // no L3
  const d = drawExit(lopsided, [], "s1:u");
  assert.equal(d.length, 5);
  assert.equal(new Set(d).size, 5);
});
