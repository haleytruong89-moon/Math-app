import { test } from "node:test";
import assert from "node:assert/strict";
import { budget, costMicros, isAiModel, monthKey, spendByKind, usdLabel } from "./rules.ts";

test("cost in micro-dollars, rounded up", () => {
  assert.equal(costMicros("claude-haiku-5-5", 1000, 100), 150); // 1000×0.1 + 100×0.5
  assert.equal(costMicros("claude-sonnet-5-5", 1000, 100), 3000); // 1000×2 + 100×10
  assert.equal(costMicros("claude-haiku-5-5", 3, 1), 1); // 0.8 → 1
});

test("models and month key", () => {
  assert.equal(isAiModel("claude-haiku-5-5"), true);
  assert.equal(isAiModel("gpt-x"), false);
  assert.equal(monthKey("2026-10-22"), "2026-10");
});

test("budget: warn at 90 %, pause at 100 % of $10", () => {
  assert.deepEqual(budget(8_999_999), { spentMicros: 8_999_999, capMicros: 10_000_000, ratio: 0.8999999, warn: false, paused: false });
  assert.equal(budget(9_000_000).warn, true);
  assert.equal(budget(9_000_000).paused, false);
  assert.equal(budget(10_000_000).paused, true);
});

test("spend by kind and labels", () => {
  const s = spendByKind([{ kind: "weekly", cost_micros: 150 }, { kind: "brief", cost_micros: 50 }, { kind: "weekly", cost_micros: 10 }]);
  assert.deepEqual(s, { total: 210, calls: 3, byKind: { weekly: 160, brief: 50 } });
  assert.equal(usdLabel(0), "$0,00");
  assert.equal(usdLabel(210), "< $0,01");
  assert.equal(usdLabel(1_234_567), "$1,23");
});
