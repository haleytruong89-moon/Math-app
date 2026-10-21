import { test } from "node:test";
import assert from "node:assert/strict";
import { nextAction, sessionDue, weekSummary } from "./tutor-today.ts";
import type { AttemptRow } from "./rules.ts";

const a = (mode: AttemptRow["mode"], correct: boolean, at: string): AttemptRow => ({ item_id: "i", mode, correct, error_code: null, exit_run: null, created_at: at });

test("week summary: study days (D17 goal, no streak), practice right/total and reviews this Mon–Sun", () => {
  const rows = [
    a("practice", true, "2026-10-19T03:00:00Z"), a("practice", false, "2026-10-19T03:01:00Z"),
    a("review", true, "2026-10-20T03:00:00Z"), a("practice", true, "2026-10-12T03:00:00Z"),
  ];
  assert.deepEqual(weekSummary(rows, "2026-10-20"), { studyDays: 1, practice: { right: 1, total: 2 }, reviews: 1 });
});

test("session reminder: the last scheduled day (≤ today) with no session logged on or after it", () => {
  // weekdays: 2 = Tue, 4 = Thu (ISO, 1 = Mon). Today Tue 20/10.
  assert.equal(sessionDue("2026-10-15", [2, 4], "2026-10-20"), "2026-10-20");
  assert.equal(sessionDue("2026-10-20", [2, 4], "2026-10-20"), null);
  assert.equal(sessionDue("2026-10-13", [4], "2026-10-20"), "2026-10-15");
  assert.equal(sessionDue(null, [], "2026-10-20"), null);
});

test("Việc tiếp theo: correct finished homework → priority KU to review → unlogged session → any review → assign", () => {
  const shelf = [
    { id: "a", title: "A", status: "waiting" as const, reviewed: 3, total: 17 },
    { id: "b", title: "B", status: "approved" as const, reviewed: 0, total: 0 },
    { id: "c", title: "C", status: "none" as const, reviewed: 0, total: 0 },
    { id: "d", title: "D", status: "reapprove" as const, reviewed: 17, total: 17 },
  ];
  assert.deepEqual(nextAction({ priorities: ["d"], shelf, homeworkDone: 2, sessionDue: "2026-10-21" }), { kind: "correct", count: 2 });
  assert.deepEqual(nextAction({ priorities: ["c", "b", "d"], shelf, homeworkDone: 0, sessionDue: "2026-10-21" }), { kind: "review", unitId: "d", title: "D", reviewed: 17, total: 17, priority: 3 });
  assert.deepEqual(nextAction({ priorities: ["b"], shelf, homeworkDone: 0, sessionDue: "2026-10-21" }), { kind: "session", date: "2026-10-21" });
  assert.deepEqual(nextAction({ priorities: [], shelf, homeworkDone: 0, sessionDue: null }), { kind: "review", unitId: "a", title: "A", reviewed: 3, total: 17, priority: null });
  assert.deepEqual(nextAction({ priorities: [], shelf: [shelf[1]], homeworkDone: 0, sessionDue: null }), { kind: "assign" });
});
