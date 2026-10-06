import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays, afterReview, firstReview, interleave, pickReviewItems, planReview, reviewPassed,
  studyDaysThisWeek, systemMastery, vnDate, weekStart, type AttemptRow,
} from "./rules.ts";

let t = 0;
const at = (day: string, hour = 10) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00+07:00`).toISOString();
const a = (p: Partial<AttemptRow>): AttemptRow => ({
  item_id: `i${t++}`, mode: "practice", correct: true, error_code: null, exit_run: null, created_at: at("2026-10-05"), ...p,
});

test("dates use Vietnam time", () => {
  assert.equal(vnDate(new Date("2026-10-04T18:30:00Z")), "2026-10-05"); // 01:30 VN next day
  assert.equal(addDays("2026-10-30", 3), "2026-11-02");
  assert.equal(weekStart("2026-10-04"), "2026-09-28"); // Sunday → previous Monday
  assert.equal(weekStart("2026-10-05"), "2026-10-05"); // Monday
});

test("M0 before the worked example, M1 after", () => {
  assert.equal(systemMastery({ workedViewed: false, attempts: [], reviewsCompleted: false }).level, 0);
  assert.equal(systemMastery({ workedViewed: true, attempts: [], reviewsCompleted: false }).level, 1);
});

test("M2 needs 5 practice first-tries with ≥ 60% right", () => {
  const four = [1, 1, 1, 1].map(() => a({}));
  assert.equal(systemMastery({ workedViewed: true, attempts: four, reviewsCompleted: false }).level, 1);
  const three_of_five = [true, false, true, false, true].map((correct) => a({ correct }));
  assert.equal(systemMastery({ workedViewed: true, attempts: three_of_five, reviewsCompleted: false }).level, 2);
  const two_of_five = [true, false, false, false, true].map((correct) => a({ correct }));
  assert.equal(systemMastery({ workedViewed: true, attempts: two_of_five, reviewsCompleted: false }).level, 1);
});

test("a re-queued wrong item counts once per day (first try only)", () => {
  const items = ["p1", "p2", "p3", "p4", "p5"];
  const rows = items.map((id, i) => a({ item_id: id, correct: i < 2, created_at: at("2026-10-05", 9) }));
  // wrong items answered again correctly later the same day
  rows.push(...["p3", "p4", "p5"].map((id) => a({ item_id: id, correct: true, created_at: at("2026-10-05", 11) })));
  const m = systemMastery({ workedViewed: true, attempts: rows, reviewsCompleted: false });
  assert.equal(m.practiceRate, 0.4);
  assert.equal(m.level, 1);
});

test("M3 = last exit ≥ 80% without a repeated error code; M4 = M3 + D+21 passed", () => {
  const exit = (run: string, results: (string | true)[], day = "2026-10-06") =>
    results.map((r) => a({ mode: "exit", exit_run: run, correct: r === true, error_code: r === true ? null : r, created_at: at(day) }));
  const m3 = systemMastery({ workedViewed: true, attempts: exit("r1", [true, true, true, true, "E10"]), reviewsCompleted: false });
  assert.equal(m3.level, 3);
  assert.equal(systemMastery({ workedViewed: true, attempts: exit("r1", [true, true, true, true, "E10"]), reviewsCompleted: true }).level, 4);
  // 3/5 → not M3
  assert.equal(systemMastery({ workedViewed: true, attempts: exit("r2", [true, true, true, "E10", "E03"]), reviewsCompleted: false }).level, 1);
  // 8/10 but E03 twice → not M3
  const rep = exit("r3", [true, true, true, true, true, true, true, true, "E03", "E03"]);
  assert.equal(systemMastery({ workedViewed: true, attempts: rep, reviewsCompleted: false }).lastExit?.repeatedError, "E03");
  assert.equal(systemMastery({ workedViewed: true, attempts: rep, reviewsCompleted: false }).level, 1);
  // a later, worse exit run replaces the earlier one
  const later = [...exit("r1", [true, true, true, true, true]), ...exit("r4", [true, "E10", "E10", true, true], "2026-10-09")];
  assert.equal(systemMastery({ workedViewed: true, attempts: later, reviewsCompleted: true }).level, 1);
});

test("confidence: fewer than 5 answers → not enough data; faded answers don't count", () => {
  const rows = [a({ mode: "faded" }), a({ mode: "faded" }), a({}), a({}), a({})];
  const m = systemMastery({ workedViewed: true, attempts: rows, reviewsCompleted: false });
  assert.deepEqual([m.answers, m.enoughData], [3, false]);
  assert.equal(systemMastery({ workedViewed: true, attempts: [...rows, a({}), a({})], reviewsCompleted: false }).enoughData, true);
});

test("review schedule: D+1 → D+7 → D+21, easy ×1.5, wrong → D+1", () => {
  assert.deepEqual(firstReview("2026-10-05"), { stage: 1, dueOn: "2026-10-06" });
  assert.deepEqual(afterReview(1, true, "normal", "2026-10-06"), { stage: 2, dueOn: "2026-10-13", completed: false });
  assert.deepEqual(afterReview(1, true, "easy", "2026-10-06"), { stage: 2, dueOn: "2026-10-17", completed: false }); // 11 days
  assert.deepEqual(afterReview(2, true, "normal", "2026-10-13"), { stage: 3, dueOn: "2026-11-03", completed: false });
  assert.deepEqual(afterReview(2, true, "easy", "2026-10-13"), { stage: 3, dueOn: "2026-11-14", completed: false }); // 32 days
  assert.deepEqual(afterReview(2, false, "easy", "2026-10-13"), { stage: 1, dueOn: "2026-10-14", completed: false });
});

test("after D+21: maintenance every 60 days (easy 90); a failed maintenance review goes back to D+1", () => {
  assert.deepEqual(afterReview(3, true, "normal", "2026-11-03"), { stage: 4, dueOn: "2027-01-02", completed: true });
  assert.deepEqual(afterReview(4, true, "normal", "2027-01-02"), { stage: 4, dueOn: "2027-03-03", completed: true });
  assert.deepEqual(afterReview(4, true, "easy", "2027-01-02"), { stage: 4, dueOn: "2027-04-02", completed: true });
  assert.deepEqual(afterReview(4, false, "normal", "2027-01-02"), { stage: 1, dueOn: "2027-01-03", completed: false });
});

test("review pass = at least 2 of 3", () => {
  assert.equal(reviewPassed(2, 3), true);
  assert.equal(reviewPassed(1, 3), false);
  assert.equal(reviewPassed(0, 0), false);
});

test("interleave never puts two items of the same unit next to each other", () => {
  const out = interleave([["a1", "a2", "a3"], ["b1", "b2", "b3"], ["c1", "c2", "c3"]]);
  assert.deepEqual(out, ["a1", "b1", "c1", "a2", "b2", "c2", "a3", "b3", "c3"]);
  for (let i = 1; i < out.length; i++) assert.notEqual(out[i][0], out[i - 1][0]);
});

test("review picks least recently answered items, never-answered first", () => {
  const pool = [{ id: "x1" }, { id: "x2" }, { id: "x3" }, { id: "x4" }];
  const seen = [a({ item_id: "x1", created_at: at("2026-10-01") }), a({ item_id: "x2", created_at: at("2026-10-03") })];
  assert.deepEqual(pickReviewItems(pool, seen, 3).map((i) => i.id), ["x3", "x4", "x1"]);
});

test("reloading the review page resumes the unfinished run: same questions, wrong answers still count", () => {
  const pool = ["p1", "p2", "p3", "p4", "p5"].map((id) => ({ id }));
  const before = [a({ item_id: "p1", created_at: at("2026-10-01") }), a({ item_id: "p2", created_at: at("2026-10-02") })];
  const fresh = planReview([{ unitId: "u", pool, attempts: before }], new Set());
  assert.equal(fresh.runId, null);
  assert.deepEqual(fresh.remaining.map((q) => q.item.id), ["p3", "p4", "p5"]);

  // Answered p3 wrong, then pressed F5.
  const wrong = a({ item_id: "p3", mode: "review", correct: false, exit_run: "run-1", created_at: at("2026-10-05", 9) });
  const resumed = planReview([{ unitId: "u", pool, attempts: [...before, wrong] }], new Set());
  assert.equal(resumed.runId, "run-1");
  assert.deepEqual(resumed.answered, [{ unitId: "u", itemId: "p3", correct: false }]);
  assert.deepEqual(resumed.remaining.map((q) => q.item.id), ["p4", "p5"]);

  // Once the run is scored, the next review starts a new run.
  const next = planReview([{ unitId: "u", pool, attempts: [...before, wrong] }], new Set(["run-1|u"]));
  assert.equal(next.runId, null);
  assert.equal(next.answered.length, 0);
  assert.equal(next.remaining.length, 3);
});

test("a resumed run with every question answered has nothing left to ask for that unit", () => {
  const pool = ["p1", "p2", "p3", "p4"].map((id) => ({ id }));
  const run = ["p1", "p2", "p3"].map((item_id, i) => a({ item_id, mode: "review", exit_run: "r", created_at: at("2026-10-05", 9 + i) }));
  const plan = planReview([{ unitId: "u", pool, attempts: run }, { unitId: "v", pool: [{ id: "q1" }], attempts: [] }], new Set());
  assert.equal(plan.runId, "r");
  assert.equal(plan.answered.length, 3);
  assert.deepEqual(plan.remaining.map((q) => `${q.unitId}:${q.item.id}`), ["v:q1"]); // a newly due unit joins the run
});

test("weekly goal counts study days in the current week (Mon–Sun), never streaks", () => {
  const rows = [
    a({ mode: "exit", created_at: at("2026-10-05") }), // Mon
    ...[1, 2, 3, 4, 5].map(() => a({ created_at: at("2026-10-06") })), // Tue: 5 practice → counts
    ...[1, 2].map(() => a({ created_at: at("2026-10-07") })), // Wed: 2 practice → no
    a({ mode: "review", created_at: at("2026-10-08") }), // Thu
    a({ mode: "review", created_at: at("2026-10-04") }), // previous Sunday → not this week
  ];
  assert.equal(studyDaysThisWeek(rows, "2026-10-08"), 3);
});

test("AI2: a practice answer given after hint H2+ isn't a right first try for M2 (H1 still counts)", () => {
  const five = (hint: number) => [1, 2, 3, 4, 5].map((i) => a({ item_id: `h${hint}-${i}`, correct: true, hint_level: i <= 3 ? hint : 0 }));
  assert.equal(systemMastery({ workedViewed: true, attempts: five(1), reviewsCompleted: false }).level, 2);
  const m = systemMastery({ workedViewed: true, attempts: five(2), reviewsCompleted: false });
  assert.equal(m.practiceRate, 0.4);
  assert.equal(m.level, 1);
});
