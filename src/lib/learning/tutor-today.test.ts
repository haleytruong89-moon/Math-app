import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionDue, weekSummary } from "./tutor-today.ts";
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
