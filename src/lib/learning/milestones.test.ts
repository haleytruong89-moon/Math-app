// S4b: milestone progress and late KUs (rulings 22/10).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum } from "../content/curriculum.ts";
import { currentPhase, lateUnits, milestoneProgress } from "./milestones.ts";
import type { Level } from "./rules.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const real = Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/curriculum.json"), "utf8")));

const none = { levels: new Map<string, Level>(), withContent: new Set<string>() };

test("the real roadmap: 8.5 counts the 38 core KUs of phases 1–3, 9.5 all 43; P2 never", () => {
  const [m85, m95] = milestoneProgress(real, { ...none, today: "2026-10-22" });
  assert.equal(m85.id, "8.5");
  assert.equal(m85.total, 38);
  assert.equal(m85.due, "2027-02-21");
  assert.equal(m95.total, 43);
  assert.equal(m95.due, "2027-03-31");
  for (const m of [m85, m95]) assert.ok(!m.units.some((u) => real.units.find((x) => x.id === u.id)!.priority === "P2"));
  assert.equal(m85.mustSolid.total, 14);
  assert.ok(m95.units.some((u) => u.id === "o-nangcao" && u.mustSolid));
});

test("phase of a date: inside, before the start, after the end", () => {
  assert.equal(currentPhase(real.phases, "2026-10-22")?.n, 1);
  assert.equal(currentPhase(real.phases, "2026-11-23")?.n, 2);
  assert.equal(currentPhase(real.phases, "2026-10-01")?.n, 1);
  assert.equal(currentPhase(real.phases, "2027-04-15"), null);
});

const tiny = Curriculum.parse({
  start: "2026-10-12",
  learnBy: "2026-11-30",
  phases: [
    { n: 1, from: "2026-10-12", to: "2026-10-25" },
    { n: 2, from: "2026-10-26", to: "2026-11-30" },
  ],
  milestones: [
    { id: "a", title: "Mốc A", due: "2026-10-25", phases: [1], mustSolid: ["u1"] },
    { id: "b", title: "Mốc B", due: "2026-11-30", phases: [1, 2], mustSolid: [] },
  ],
  modules: [{ id: "m", title: "M", domains: ["A"] }],
  units: [
    { id: "u1", module: "m", title: "U1", track: "A", seq: 1, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 1 },
    { id: "u2", module: "m", title: "U2", track: "A", seq: 2, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P1", phase: 1 },
    { id: "u3", module: "m", title: "U3", track: "A", seq: 3, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P0", phase: 2 },
    { id: "p2", module: "m", title: "P", track: "A", seq: 4, prereq: [], examWeight: 1, grading: "full", testOut: false, batch: 1, priority: "P2", phase: null },
  ],
});

test("solid = M3 or more; late = phase over and below M3 (the phase's last day is not late yet)", () => {
  const levels = new Map<string, Level>([["u1", 3], ["u2", 2], ["p2", 4]]);
  const onLastDay = milestoneProgress(tiny, { levels, withContent: new Set(["u1", "u2"]), today: "2026-10-25" });
  assert.equal(onLastDay[0].solid, 1);
  assert.equal(onLastDay[0].late.length, 0);
  assert.equal(onLastDay[0].expected, 0);
  const next = milestoneProgress(tiny, { levels, withContent: new Set(["u1", "u2"]), today: "2026-10-26" });
  assert.deepEqual(next[0].late.map((u) => u.id), ["u2"]);
  assert.equal(next[0].expected, 2);
  assert.deepEqual(next[0].mustSolid, { total: 1, solid: 1 });
  assert.equal(next[1].total, 3);
  assert.equal(next[1].solid, 1); // the P2 KU at M4 doesn't count
  assert.deepEqual(lateUnits(tiny, { levels, withContent: new Set(), today: "2026-12-01" }).map((u) => [u.id, u.hasContent]), [["u2", false], ["u3", false]]);
});

test("pace: KUs left per remaining week; due date passed → everything left; done → 0", () => {
  const levels = new Map<string, Level>([["u1", 3]]);
  const [, b] = milestoneProgress(tiny, { levels, withContent: new Set(), today: "2026-11-16" }); // 14 days → 2 weeks, 2 left
  assert.equal(b.weeksLeft, 2);
  assert.equal(b.perWeek, 1);
  const [, late] = milestoneProgress(tiny, { levels, withContent: new Set(), today: "2026-12-05" });
  assert.equal(late.weeksLeft, 0);
  assert.equal(late.perWeek, 2);
  const all = new Map<string, Level>([["u1", 3], ["u2", 4], ["u3", 3]]);
  assert.equal(milestoneProgress(tiny, { levels: all, withContent: new Set(), today: "2026-11-16" })[1].perWeek, 0);
});
