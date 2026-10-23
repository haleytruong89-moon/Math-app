// Luyện đề 4.2: opening rule, weekly cap, redo after 7 days.
import { test } from "node:test";
import assert from "node:assert/strict";
import { drillOpen, drillPlan, type DrillAttempt } from "./drill-plan.ts";
import type { Level } from "./rules.ts";

const P = (n: number, needs = ["k-tugiacnt"]) => ({ id: `ld-d${String(n).padStart(2, "0")}`, order: n, needs, itemIds: [1, 2, 3].map((i) => `ld-d${String(n).padStart(2, "0")}-${i}`) });
const at = (day: string) => `${day}T03:00:00Z`;
const att = (item: string, correct: boolean, day: string): DrillAttempt => ({ item_id: item, correct, created_at: at(day) });
const base = (levels: [string, Level][] = [], priorities: string[] = [], attempts = new Map<string, DrillAttempt[]>(), today = "2026-11-25") => ({
  levels: new Map(levels),
  priorities: new Set(priorities),
  attempts,
  today,
});

test("locked until every needed KU is at M3 or ★; then open", () => {
  const ps = [P(3), P(5, ["k-tugiacnt", "l-tieptuyen"])];
  assert.deepEqual(drillPlan(ps, base([["k-tugiacnt", 2]])).map((s) => [s.status, s.missing.join()]), [["locked", "k-tugiacnt"], ["locked", "k-tugiacnt,l-tieptuyen"]]);
  assert.deepEqual(drillPlan(ps, base([["k-tugiacnt", 3]])).map((s) => s.status), ["new", "locked"]);
  assert.deepEqual(drillPlan(ps, base([["k-tugiacnt", 4]], ["l-tieptuyen"])).map((s) => s.status), ["new", "new"]);
  assert.equal(drillOpen(drillPlan(ps, base())[0]), false);
});

test("at most 3 new problems a week, in order; next week frees the slots", () => {
  const ps = [P(3), P(5), P(6), P(8), P(16)];
  const lv: [string, Level][] = [["k-tugiacnt", 3]];
  assert.deepEqual(drillPlan(ps, base(lv)).map((s) => s.status), ["new", "new", "new", "waiting", "waiting"]);
  // Two started this week (Mon 23/11–Sun 29/11): one slot left.
  const a = new Map([["ld-d03", [att("ld-d03-1", true, "2026-11-23")]], ["ld-d05", [att("ld-d05-1", true, "2026-11-24")]]]);
  assert.deepEqual(drillPlan(ps, base(lv, [], a)).map((s) => s.status), ["doing", "doing", "new", "waiting", "waiting"]);
  // Started last week → this week has 3 slots again.
  assert.deepEqual(drillPlan(ps, base(lv, [], a, "2026-11-30")).map((s) => s.status), ["doing", "doing", "new", "new", "new"]);
});

test("finished without a mistake → done; with a mistake → later, then redo after 7 days; a clean redo → done", () => {
  const p = P(3);
  const lv: [string, Level][] = [["k-tugiacnt", 3]];
  const clean = new Map([["ld-d03", p.itemIds.map((i) => att(i, true, "2026-11-24"))]]);
  assert.equal(drillPlan([p], base(lv, [], clean))[0].status, "done");
  const wrong = new Map([["ld-d03", [att("ld-d03-1", false, "2026-11-24"), ...p.itemIds.map((i) => att(i, true, "2026-11-24"))]]]);
  const later = drillPlan([p], base(lv, [], wrong, "2026-11-30"))[0];
  assert.equal(later.status, "later");
  assert.equal(later.redoOn, "2026-12-01");
  assert.equal(drillPlan([p], base(lv, [], wrong, "2026-12-01"))[0].status, "redo");
  const redone = new Map([["ld-d03", [...wrong.get("ld-d03")!, ...p.itemIds.map((i) => att(i, true, "2026-12-02"))]]]);
  const s = drillPlan([p], base(lv, [], redone, "2026-12-02"))[0];
  assert.equal(s.status, "done");
  assert.equal(s.right, 3);
  // A started problem stays reachable even if its KU drops below M3.
  assert.equal(drillOpen(drillPlan([p], base([["k-tugiacnt", 2]], [], wrong, "2026-12-01"))[0]), true);
});
