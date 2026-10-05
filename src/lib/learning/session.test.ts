import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSession } from "./session.ts";

const today = "2026-10-03";
const units = new Map([
  ["htl-1", "Bốn hệ thức lượng"],
  ["htl-2", "Tính độ dài"],
]);
const sid = "11111111-1111-4111-8111-111111111111";
const base = { studentId: sid, taughtOn: today, note: "", units: ["htl-1"], levels: { "htl-1": "2" } };

test("valid session with one unit", () => {
  const r = parseSession(base, today, units);
  assert.deepEqual(r, { ok: true, value: { studentId: sid, taughtOn: today, note: null, proposals: [{ unitId: "htl-1", level: 2 }] } });
});

test("ticked unit without a level is refused and named", () => {
  const r = parseSession({ ...base, units: ["htl-1", "htl-2"] }, today, units);
  assert.equal(r.ok, false);
  assert.match((r as { error: string }).error, /Tính độ dài/);
  assert.doesNotMatch((r as { error: string }).error, /Bốn hệ thức/);
});

test("level must be 0–4", () => {
  assert.equal(parseSession({ ...base, levels: { "htl-1": "5" } }, today, units).ok, false);
  assert.equal(parseSession({ ...base, levels: { "htl-1": "0" } }, today, units).ok, true);
});

test("date: not in the future, at most 7 days back, real calendar date", () => {
  assert.equal(parseSession({ ...base, taughtOn: "2026-10-04" }, today, units).ok, false);
  assert.equal(parseSession({ ...base, taughtOn: "2026-09-26" }, today, units).ok, true); // 7 days
  assert.equal(parseSession({ ...base, taughtOn: "2026-09-25" }, today, units).ok, false); // 8 days
  assert.equal(parseSession({ ...base, taughtOn: "2026-02-30" }, today, units).ok, false);
  assert.equal(parseSession({ ...base, taughtOn: "03/10/2026" }, today, units).ok, false);
});

test("no unit ticked needs a note", () => {
  assert.equal(parseSession({ ...base, units: [], levels: {} }, today, units).ok, false);
  const r = parseSession({ ...base, units: [], levels: {}, note: "  Ôn đề thi giữa kỳ  " }, today, units);
  assert.deepEqual(r.ok && r.value, { studentId: sid, taughtOn: today, note: "Ôn đề thi giữa kỳ", proposals: [] });
});

test("note ≤ 500 characters; unknown unit and bad student refused", () => {
  assert.equal(parseSession({ ...base, note: "x".repeat(501) }, today, units).ok, false);
  assert.equal(parseSession({ ...base, note: "x".repeat(500) }, today, units).ok, true);
  // The textarea shows 500/500 for 491 letters + 9 line breaks; the form sends them as CRLF.
  const crlf = parseSession({ ...base, note: `${"x".repeat(49)}\r\n`.repeat(9) + "x".repeat(50) }, today, units);
  assert.equal(crlf.ok && crlf.value.note?.length, 500);
  assert.equal(crlf.ok && crlf.value.note?.includes("\r"), false);
  assert.equal(parseSession({ ...base, units: ["nope"], levels: { nope: "1" } }, today, units).ok, false);
  assert.equal(parseSession({ ...base, studentId: "x" }, today, units).ok, false);
});

test("duplicate ticks collapse", () => {
  const r = parseSession({ ...base, units: ["htl-1", "htl-1"] }, today, units);
  assert.equal(r.ok && r.value.proposals.length, 1);
});
