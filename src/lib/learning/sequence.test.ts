import { test } from "node:test";
import assert from "node:assert/strict";
import { displayLevel } from "./overview.ts";
import { isInProgress, masteryHistory, selectReviewUnits, splitTestOut, suggestNew, unitStatus, type SeqUnit } from "./sequence.ts";
import type { AttemptRow } from "./rules.ts";

const U = (id: string, p: Partial<SeqUnit> = {}): SeqUnit => ({
  id, track: "A", seq: 10, batch: 1, prereq: [], testOut: false, hasContent: true,
  level: 0, started: false, manualUnlock: false, testoutTried: false, inReview: false, ...p,
});
const map = (us: SeqUnit[]) => new Map(us.map((u) => [u.id, u]));

test("status: Sắp có without content; open when every prerequisite is M3, or unlocked by hand, or already started", () => {
  const a = U("a", { level: 3 }), b = U("b", { level: 2 });
  const us = [a, b, U("c", { prereq: ["a"] }), U("d", { prereq: ["a", "b"] }), U("e", { hasContent: false }), U("f", { prereq: ["b"], manualUnlock: true }), U("g", { prereq: ["b"], started: true }), U("h", { prereq: ["missing"] })];
  const m = map(us);
  assert.deepEqual(us.map((u) => unitStatus(u, m)), ["open", "open", "open", "locked", "comingSoon", "open", "open", "locked"]);
});

test("in progress = started, below M3, not yet in the review queue", () => {
  assert.equal(isInProgress(U("a", { started: true, level: 1 })), true);
  assert.equal(isInProgress(U("a", { started: true, level: 3 })), false);
  assert.equal(isInProgress(U("a", { started: true, level: 1, inReview: true })), false);
  assert.equal(isInProgress(U("a", { level: 0 })), false);
});

test("suggestions: 1 from track A + 1 from B/C, batch → B before C → seq; none with 2 in progress", () => {
  const us = [
    U("a2", { track: "A", seq: 20, batch: 1 }), U("a1", { track: "A", seq: 10, batch: 1 }), U("a0", { track: "A", seq: 5, batch: 2 }),
    U("c1", { track: "C", seq: 10, batch: 1 }), U("b1", { track: "B", seq: 30, batch: 1 }), U("b0", { track: "B", seq: 10, batch: 3 }),
    U("locked", { track: "B", seq: 1, batch: 0, prereq: ["a1"] }), U("soon", { track: "B", seq: 1, batch: 0, hasContent: false }),
  ];
  assert.deepEqual(suggestNew(us).map((u) => u.id), ["a1", "b1"]);
  const busy = [...us, U("x", { started: true, level: 1 }), U("y", { started: true, level: 2 })];
  assert.deepEqual(suggestNew(busy), []);
  const oneBusy = [...us, U("x", { started: true, level: 1 })];
  assert.equal(suggestNew(oneBusy).length, 2);
  assert.deepEqual(suggestNew([U("only-b", { track: "B" })]).map((u) => u.id), ["only-b"]);
});

test("test-out: a failed run is left out of mastery; a passed run counts", () => {
  const ex = (item: string, correct: boolean, run = "t1"): AttemptRow => ({ item_id: item, mode: "exit", correct, error_code: null, exit_run: run, created_at: "2026-10-12T03:00:00.000Z" });
  const other: AttemptRow = { item_id: "p1", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: "2026-10-13T03:00:00.000Z" };
  const failed = [ex("x1", true), ex("x2", false), ex("x3", false), ex("x4", true), ex("x5", false), other];
  assert.deepEqual(splitTestOut(failed, "t1"), { counted: [other], passed: false });
  const passed = [ex("x1", true), ex("x2", true), ex("x3", true), ex("x4", true), ex("x5", false), other];
  assert.deepEqual(splitTestOut(passed, "t1"), { counted: passed, passed: true });
  assert.deepEqual(splitTestOut([other], null), { counted: [other], passed: null });
});

test("review session: at most 5 units, most overdue first; an unfinished run keeps its units", () => {
  const due = ["2026-10-01", "2026-10-05", "2026-10-02", "2026-10-07", "2026-10-03", "2026-10-04", "2026-10-06"].map((d, i) => ({ unitId: `u${i}`, dueOn: d }));
  assert.deepEqual(selectReviewUnits(due, []), ["u0", "u2", "u4", "u5", "u1"]);
  assert.deepEqual(selectReviewUnits(due, ["u3"]), ["u3", "u0", "u2", "u4", "u5"]);
  assert.deepEqual(selectReviewUnits(due.slice(0, 2), []), ["u0", "u1"]);
});

test("mastery history: a passed test-out replays as learnt (a parent confirmation survives the next review); a failed one is left out", () => {
  const at = (i: number) => `2026-10-0${i}T00:00:00Z`;
  const exit = (run: string, correct: boolean, day: number): AttemptRow[] =>
    [1, 2, 3, 4, 5].map((n) => ({ item_id: `u-x${n}`, mode: "exit", correct, error_code: null, exit_run: run, created_at: at(day) }) as AttemptRow);
  const passed = masteryHistory([...exit("t", true, 1), { item_id: "u-p1", mode: "review", correct: true, error_code: null, exit_run: null, created_at: at(3) } as AttemptRow], "t", false, false);
  assert.equal(passed.workedViewed, true);
  const conf = { unit_id: "u", level: 3, system_level: 3, created_at: at(2) };
  assert.equal(displayLevel(3, conf, passed).confirmed, true);
  const failed = masteryHistory(exit("t", false, 1), "t", false, false);
  assert.deepEqual([failed.workedViewed, failed.attempts.length], [false, 0]);
  assert.equal(masteryHistory(exit("e", true, 1), null, true, true).attempts.length, 5);
});
