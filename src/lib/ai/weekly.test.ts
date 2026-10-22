import { test } from "node:test";
import assert from "node:assert/strict";
import { Curriculum } from "../content/curriculum.ts";
import type { AttemptRow } from "../learning/rules.ts";
import { checkWeeklyComment, reportWeek, weeklyFacts, type WeeklyUnit } from "./weekly.ts";

const curriculum = Curriculum.parse({
  start: "2026-10-12",
  learnBy: "2026-11-30",
  phases: [
    { n: 1, from: "2026-10-12", to: "2026-10-25" },
    { n: 2, from: "2026-10-26", to: "2026-11-30" },
  ],
  milestones: [{ id: "a", title: "Mốc 8,5", due: "2026-10-25", phases: [1], mustSolid: ["u1"] }],
  modules: [{ id: "m", title: "M", domains: ["A"] }],
  units: [
    { id: "u1", module: "m", title: "Bài một", track: "A", seq: 1, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 1 },
    { id: "u2", module: "m", title: "Bài hai", track: "A", seq: 2, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 1 },
  ],
});

const at = (day: string) => `${day}T03:00:00Z`; // 10:00 in Hà Nội, same day
const a = (p: Partial<AttemptRow> & Pick<AttemptRow, "mode" | "correct" | "created_at">): AttemptRow => ({ item_id: "u1-p1", error_code: null, exit_run: null, ...p });

const u1: WeeklyUnit = {
  id: "u1",
  title: "Bài một",
  shown: 3,
  reviewDueOn: "2026-10-24",
  history: {
    workedViewed: true,
    reviewsCompleted: false,
    attempts: [
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-13") }), // the week before
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-20") }),
      a({ mode: "practice", correct: false, error_code: "E01", created_at: at("2026-10-21") }),
      a({ mode: "practice", correct: false, error_code: "E02", created_at: at("2026-10-21") }),
      ...[1, 2, 3, 4, 5].map((i) => a({ item_id: `u1-x${i}`, mode: "exit", correct: true, exit_run: "r1", created_at: at("2026-10-22") })),
    ],
  },
};
const u2: WeeklyUnit = { id: "u2", title: "Bài hai", shown: 0, reviewDueOn: null, history: { workedViewed: false, reviewsCompleted: false, attempts: [] } };

const input = {
  today: "2026-10-26", // Monday → the report covers 19–25/10
  units: [u1, u2],
  curriculum,
  reviewLog: [{ created_at: at("2026-10-23") }, { created_at: at("2026-10-15") }],
  sessions: [{ taught_on: "2026-10-22" }],
  homework: [{ created_at: at("2026-10-20"), done_at: at("2026-10-21"), reviewed_at: null }],
};

test("report week = the full Monday–Sunday before", () => {
  assert.deepEqual(reportWeek("2026-10-26"), { from: "2026-10-19", to: "2026-10-25" });
  assert.deepEqual(reportWeek("2026-10-29"), { from: "2026-10-19", to: "2026-10-25" });
  assert.deepEqual(reportWeek("2026-11-01"), { from: "2026-10-19", to: "2026-10-25" }); // Sunday
});

test("weekly facts from the database rows", () => {
  const f = weeklyFacts(input);
  assert.equal(f.from, "2026-10-19");
  assert.equal(f.to, "2026-10-25");
  assert.equal(f.exits, 1);
  assert.equal(f.reviews, 1);
  assert.equal(f.sessions, 1);
  assert.deepEqual(f.homework, { given: 1, done: 1, reviewed: 0 });
  assert.deepEqual(f.newSolid, ["Bài một"]);
  assert.equal(f.overdueReviews, 1);
  assert.deepEqual(f.repeatedErrors, [{ code: "E01", label: "E01 — Tính toán sai", count: 2 }]);
  assert.deepEqual(f.milestones, [{ title: "Mốc 8,5", due: "2026-10-25", solid: 1, total: 2, perWeek: 1, late: 1 }]);
  assert.deepEqual(f.late, ["Bài hai"]);
  assert.equal(f.goalDays, 4);
});

test("the AI comment: only the facts' numbers, no banned words, not too long", () => {
  const f = weeklyFacts(input);
  assert.deepEqual(checkWeeklyComment("  Con làm 1 bài kiểm tra và vững thêm Bài một. Lỗi E01 lặp lại 2 lần.  ", f), {
    ok: true,
    value: "Con làm 1 bài kiểm tra và vững thêm Bài một. Lỗi E01 lặp lại 2 lần.",
  });
  const bad = checkWeeklyComment("Con đúng 75% số câu, giữ chuỗi học tốt.", f);
  assert.equal(bad.ok, false);
  assert.match(!bad.ok ? bad.reasons.join(" | ") : "", /75.*chuỗi/);
  assert.equal(checkWeeklyComment("x".repeat(901), f).ok, false);
  assert.equal(checkWeeklyComment("   ", f).ok, false);
});
