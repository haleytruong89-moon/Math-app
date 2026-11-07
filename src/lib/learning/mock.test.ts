// Thi thử (S9): status, schedule suggestion, totals, lost KUs, grading input.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockSheet } from "../content/mock.ts";
import { checkScores, gradeOverdue, lostByUnit, mockStatus, mockTotals, pts, saturdayFrom, secondsLeft, suggestNext, upcomingForStudent, type MockExamRow } from "./mock.ts";

const sheet = MockSheet.parse({
  paper: 57, status: "draft", pages: "tr. 1",
  parts: [
    { part: "1.1", max: 1, answer: "a", units: ["c-rutgon"] }, { part: "1.2", max: 0.5, answer: "a", units: ["c-cauphu"] },
    { part: "2", max: 1.5, answer: "a", units: ["g-honhop"] }, { part: "3.1", max: 1, answer: "a", units: ["d-ptbh"] },
    { part: "3.2", max: 1.5, answer: "a", units: ["e-vietets", "d-thamso"] }, { part: "4.1", max: 1, answer: "a", units: ["htl-1"] },
    { part: "4.2a", max: 1, answer: "a", units: ["k-tugiacnt"] }, { part: "4.2b", max: 1, answer: "a", units: ["o-dongdang"] },
    { part: "4.2c", max: 1, answer: "a", units: ["o-chungminh"] }, { part: "5", max: 0.5, answer: "a", units: ["e-viete"] },
  ],
});
const full = sheet.parts.map((p) => ({ part: p.part, points: p.max }));
const exam = (o: Partial<MockExamRow>): MockExamRow => ({ id: 1, paper: 57, scheduled_on: "2027-01-09", started_at: null, finished_at: null, graded_at: null, total: null, ...o });

test("status follows the timestamps", () => {
  assert.equal(mockStatus(exam({})), "scheduled");
  assert.equal(mockStatus(exam({ started_at: "2027-01-09T01:00:00Z" })), "running");
  assert.equal(mockStatus(exam({ started_at: "x", finished_at: "y" })), "finished");
  assert.equal(mockStatus(exam({ started_at: "x", finished_at: "y", graded_at: "z" })), "graded");
});

test("schedule: first paper on the first Saturday of 01/2027, monthly until April, then weekly; all 12 → null", () => {
  assert.equal(saturdayFrom("2027-01-01"), "2027-01-02");
  assert.deepEqual(suggestNext([], "2026-11-07"), { paper: 57, date: "2027-01-02" });
  assert.deepEqual(suggestNext([{ paper: 57, scheduled_on: "2027-01-02" }], "2026-11-07"), { paper: 58, date: "2027-02-06" });
  assert.deepEqual(suggestNext([{ paper: 57, scheduled_on: "2027-01-02" }, { paper: 58, scheduled_on: "2027-04-03" }], "2026-11-07"), { paper: 59, date: "2027-04-10" });
  // Never in the past.
  assert.deepEqual(suggestNext([{ paper: 57, scheduled_on: "2027-01-02" }], "2027-03-01"), { paper: 58, date: "2027-03-06" });
  const all = [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68].map((paper) => ({ paper, scheduled_on: "2027-05-01" }));
  assert.equal(suggestNext(all, "2027-05-01"), null);
});

test("timer: 120 minutes, never negative", () => {
  const start = "2027-01-02T01:00:00Z";
  assert.equal(secondsLeft(start, new Date("2027-01-02T01:00:00Z")), 7200);
  assert.equal(secondsLeft(start, new Date("2027-01-02T02:30:00Z")), 1800);
  assert.equal(secondsLeft(start, new Date("2027-01-02T04:00:00Z")), 0);
});

test("totals per Bài and in all; lost points split between the KUs of a part, most first", () => {
  const scores = full.map((s) => (s.part === "3.2" ? { ...s, points: 0.5 } : s.part === "4.2c" ? { ...s, points: 0 } : s));
  const t = mockTotals(sheet, scores);
  assert.equal(t.total, 8);
  assert.deepEqual(t.bai.map((b) => [b.got, b.max]), [[1.5, 1.5], [1.5, 1.5], [1.5, 2.5], [3, 4], [0.5, 0.5]]);
  assert.deepEqual(lostByUnit(sheet, scores), [
    { unitId: "o-chungminh", lost: 1, parts: ["4.2c"] },
    { unitId: "d-thamso", lost: 0.5, parts: ["3.2"] },
    { unitId: "e-vietets", lost: 0.5, parts: ["3.2"] },
  ]);
  assert.deepEqual(lostByUnit(sheet, full), []);
});

test("grading input: every part, within max, quarter points, no unknown part", () => {
  assert.deepEqual(checkScores(sheet, full), []);
  assert.match(checkScores(sheet, full.slice(1)).join(), /Ý 1\.1: chưa nhập/);
  assert.match(checkScores(sheet, full.map((s) => (s.part === "5" ? { ...s, points: 0.75 } : s))).join(), /Ý 5: điểm phải từ 0 đến 0,5/);
  assert.match(checkScores(sheet, full.map((s) => (s.part === "2" ? { ...s, points: 0.3 } : s))).join(), /bội của 0,25/);
  assert.match(checkScores(sheet, [...full, { part: "4.3", points: 0 }]).join(), /Ý 4\.3 không có/);
});

test("overdue grading after 3 days; the student's card shows from 3 days before or while running", () => {
  assert.equal(gradeOverdue({ finished_at: "2027-01-02T03:00:00Z", graded_at: null }, "2027-01-05"), false);
  assert.equal(gradeOverdue({ finished_at: "2027-01-02T03:00:00Z", graded_at: null }, "2027-01-06"), true);
  assert.equal(gradeOverdue({ finished_at: "2027-01-02T03:00:00Z", graded_at: "x" }, "2027-02-01"), false);
  const e = exam({ scheduled_on: "2027-01-09" });
  assert.equal(upcomingForStudent([e], "2027-01-05"), null);
  assert.equal(upcomingForStudent([e], "2027-01-06")?.paper, 57);
  assert.equal(upcomingForStudent([exam({ started_at: "x", finished_at: "y" })], "2027-01-09"), null);
  assert.equal(upcomingForStudent([exam({ paper: 58, scheduled_on: "2027-03-01", started_at: "x" })], "2027-01-09")?.paper, 58);
  assert.equal(pts(7.25), "7,25");
});
