import { test } from "node:test";
import assert from "node:assert/strict";
import { PRIORITY_MAX, editPriorityList } from "./priorities.ts";

test("toggle adds at the end or removes; up/down swap neighbours; the list is capped", () => {
  assert.deepEqual(editPriorityList([], "toggle", "a"), ["a"]);
  assert.deepEqual(editPriorityList(["a", "b"], "toggle", "a"), ["b"]);
  assert.deepEqual(editPriorityList(["a", "b", "c"], "up", "c"), ["a", "c", "b"]);
  assert.deepEqual(editPriorityList(["a", "b", "c"], "down", "a"), ["b", "a", "c"]);
  assert.deepEqual(editPriorityList(["a", "b"], "up", "a"), ["a", "b"]);
  assert.deepEqual(editPriorityList(["a"], "down", "x"), ["a"]);
  const full = Array.from({ length: PRIORITY_MAX }, (_, i) => `k${i}`);
  assert.deepEqual(editPriorityList(full, "toggle", "new"), full);
});
