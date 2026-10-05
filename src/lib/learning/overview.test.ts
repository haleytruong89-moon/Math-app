import { test } from "node:test";
import assert from "node:assert/strict";
import { displayLevel, isoWeekday, latestByUnit, mismatchFlags, missedSessions, parseWeekdays, weekSummary, type ConfirmationRow, type ProposalRow } from "./overview.ts";
import type { AttemptRow } from "./rules.ts";

const at = (day: string, hour = 10) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00+07:00`).toISOString();
const prop = (unit_id: string, level: number, day: string): ProposalRow => ({ session_id: `s-${day}`, unit_id, level, tutor_id: "t1", created_at: at(day) });
const conf = (unit_id: string, level: number, system_level: number, day: string): ConfirmationRow => ({ unit_id, level, system_level, created_at: at(day, 12) });

test("weekday numbers: Monday = 1 … Sunday = 7; form values parsed strictly", () => {
  assert.equal(isoWeekday("2026-10-05"), 1);
  assert.equal(isoWeekday("2026-10-11"), 7);
  assert.deepEqual(parseWeekdays(["4", "2"]), [2, 4]);
  assert.deepEqual(parseWeekdays([]), []);
  assert.equal(parseWeekdays(["2", "2"]), null);
  assert.equal(parseWeekdays(["0"]), null);
  assert.equal(parseWeekdays(["8"]), null);
  assert.equal(parseWeekdays(["x"]), null);
});

test("latest row per unit", () => {
  const m = latestByUnit([prop("a", 1, "2026-10-01"), prop("a", 3, "2026-10-03"), prop("b", 2, "2026-10-02")]);
  assert.equal(m.get("a")?.level, 3);
  assert.equal(m.get("b")?.level, 2);
});

test("display level: confirmed while the system level is unchanged; falls back when it moves", () => {
  assert.deepEqual(displayLevel(1), { level: 1, confirmed: false });
  assert.deepEqual(displayLevel(1, conf("a", 3, 1, "2026-10-05")), { level: 3, confirmed: true });
  assert.deepEqual(displayLevel(2, conf("a", 3, 1, "2026-10-05")), { level: 2, confirmed: false });
});

test("mismatch flags: ≥ 1 level apart, not confirmed after the proposal, gone when the system catches up", () => {
  const units = [{ id: "a", system: 1 as const }, { id: "b", system: 2 as const }, { id: "c", system: 3 as const }];
  const proposals = [prop("a", 3, "2026-10-03"), prop("b", 2, "2026-10-03"), prop("c", 1, "2026-10-01"), prop("c", 3, "2026-10-04")];
  assert.deepEqual(mismatchFlags(units, proposals, []).map((f) => f.unitId), ["a"]); // b equal; c latest equals system
  assert.deepEqual(mismatchFlags(units, proposals, [conf("a", 3, 1, "2026-10-04")]), []); // confirmed after the proposal
  // tutor proposes again after the confirmation, still disagreeing → flag is back
  assert.deepEqual(mismatchFlags(units, [...proposals, prop("a", 4, "2026-10-05")], [conf("a", 3, 1, "2026-10-04")]).map((f) => f.unitId), ["a"]);
  assert.deepEqual(mismatchFlags([], [], []), []);
});

test("missed sessions: scheduled days up to yesterday, from the assignment start, without a logged session", () => {
  // today Thu 2026-10-08; schedule Tue (2) + Thu (4); assignment started Mon 2026-09-28
  const a = { id: "as1", tutor_id: "t1", started_at: at("2026-09-28"), ended_at: null, weekdays: [2, 4] };
  const sessions = [{ tutor_id: "t1", taught_on: "2026-10-06" }]; // Tue logged
  assert.deepEqual(missedSessions([a], sessions, "2026-10-08").map((m) => m.date), ["2026-10-01"]);
  // starting today → nothing yet; no schedule → nothing; ended → nothing
  assert.deepEqual(missedSessions([{ ...a, started_at: at("2026-10-08") }], [], "2026-10-08"), []);
  assert.deepEqual(missedSessions([{ ...a, weekdays: [] }], [], "2026-10-08"), []);
  assert.deepEqual(missedSessions([{ ...a, ended_at: at("2026-10-07") }], [], "2026-10-08"), []);
  // another tutor's session on that day doesn't count
  assert.equal(missedSessions([a], [{ tutor_id: "t2", taught_on: "2026-10-06" }], "2026-10-08").length, 2);
});

test("week summary counts Monday → today (Vietnam time)", () => {
  const A = (p: Partial<AttemptRow>): AttemptRow => ({ item_id: "i", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: at("2026-10-06"), ...p });
  const s = weekSummary({
    today: "2026-10-08",
    attempts: [
      A({ mode: "exit", exit_run: "r1" }), A({ mode: "exit", exit_run: "r1", item_id: "j" }),
      A({ mode: "exit", exit_run: "r0", created_at: at("2026-10-04") }), // last week (Sunday)
      A({ mode: "review", exit_run: "v1", created_at: at("2026-10-07") }),
    ],
    reviewLog: [{ created_at: at("2026-10-07") }, { created_at: at("2026-10-03") }],
    sessions: [{ taught_on: "2026-10-06" }, { taught_on: "2026-10-02" }],
    homework: [
      { created_at: at("2026-10-06"), done_at: at("2026-10-07"), reviewed_at: null },
      { created_at: at("2026-10-01"), done_at: null, reviewed_at: at("2026-10-06") },
    ],
  });
  assert.deepEqual(s, { studyDays: 2, exits: 1, reviews: 1, sessions: 1, homeworkGiven: 1, homeworkDone: 1, homeworkReviewed: 1 });
});

test("fix: missed-session reminders only cover days the tutor can still log (7-day backdate limit)", () => {
  const a = { id: "as1", tutor_id: "t1", started_at: at("2026-09-28"), ended_at: null, weekdays: [2, 4] };
  // 2026-09-29 is 9 days before 2026-10-08 → no longer loggable, so no reminder
  assert.deepEqual(missedSessions([a], [], "2026-10-08").map((m) => m.date), ["2026-10-01", "2026-10-06"]);
});

test("fix: a tutor proposal that agrees with the confirmed level in effect raises no flag", () => {
  const units = [{ id: "a", system: 1 as const, confirmedLevel: 3 }];
  assert.deepEqual(mismatchFlags(units, [prop("a", 3, "2026-10-03"), prop("a", 3, "2026-10-06")], [conf("a", 3, 1, "2026-10-04")]), []);
  assert.equal(mismatchFlags(units, [prop("a", 4, "2026-10-06")], [conf("a", 3, 1, "2026-10-04")]).length, 1);
});

test("fix: once the system level moves after a confirmation, the confirmation stays void even if it moves back", () => {
  const A = (correct: boolean, day: string, hour: number): AttemptRow => ({ item_id: `p${day}${hour}`, mode: "practice", correct, error_code: null, exit_run: null, created_at: at(day, hour) });
  const c = conf("a", 3, 1, "2026-10-04");
  // before the confirmation: 2 right; after: 3 right (→ 5/5 → M2) then 3 wrong (→ 2/5 → back to M1)
  const attempts = [A(true, "2026-10-03", 9), A(true, "2026-10-03", 10), A(true, "2026-10-05", 9), A(true, "2026-10-05", 10), A(true, "2026-10-05", 11),
    A(false, "2026-10-06", 9), A(false, "2026-10-06", 10), A(false, "2026-10-06", 11)];
  assert.deepEqual(displayLevel(1, c, { attempts, workedViewed: true, reviewsCompleted: false }), { level: 1, confirmed: false });
  // answers after the confirmation that never changed the level keep it in effect
  assert.deepEqual(displayLevel(1, c, { attempts: attempts.slice(0, 3), workedViewed: true, reviewsCompleted: false }), { level: 3, confirmed: true });
});
