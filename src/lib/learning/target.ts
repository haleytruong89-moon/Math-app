// Mục tiêu 8,5 (08/11/2026, docs/superpowers/specs/2026-11-08-ke-hoach-8-5-design.md §4): the target board — per exam
// group (Bài 1, 2, 3, 4.1, 4.2, 5) the target points and the latest measured rate from graded progress tests and thi
// thử. A board, not a prediction: it says how many points were tested. Pure, so `node --test` covers it.
import { groupOf, type TargetGroup } from "../content/progress.ts";
import type { MockPart } from "../content/mock.ts";
import type { MockScoreRow } from "./mock.ts";

export type BoardExam = { label: string; date: string; parts: Pick<MockPart, "part" | "max">[]; scores: MockScoreRow[] };
export type BoardStatus = "ok" | "near" | "low" | "none" | "skip";
export type BoardRow = {
  key: TargetGroup["key"];
  label: string;
  max: number;
  target: number;
  /** The latest exam that tested this group: points earned / points tested there. */
  measured: { got: number; max: number; label: string; date: string } | null;
  /** measured rate × the group's max — what the rate is worth on a full paper. */
  scaled: number | null;
  status: BoardStatus;
  solid: number;
  units: number;
};

const round2 = (x: number) => Math.round(x * 100) / 100;
/** "near" = within this share of the target. */
export const NEAR = 0.8;

export function targetBoard(groups: TargetGroup[], exams: BoardExam[], levels: Map<string, number>, solidAt = 3) {
  // Latest first: by date, then by the order given (later in the array = later).
  const ordered = exams.map((e, i) => ({ e, i })).sort((a, b) => b.e.date.localeCompare(a.e.date) || b.i - a.i).map((x) => x.e);
  const rows: BoardRow[] = groups.map((g) => {
    let measured: BoardRow["measured"] = null;
    for (const e of ordered) {
      const skip = new Set(e.scores.filter((s) => s.skipped).map((s) => s.part));
      const got = new Map(e.scores.map((s) => [s.part, Number(s.points)]));
      const parts = e.parts.filter((p) => groupOf(p.part) === g.key && !skip.has(p.part));
      if (!parts.length) continue;
      measured = { got: round2(parts.reduce((a, p) => a + (got.get(p.part) ?? 0), 0)), max: round2(parts.reduce((a, p) => a + p.max, 0)), label: e.label, date: e.date };
      break;
    }
    const scaled = measured ? round2((measured.got / measured.max) * g.max) : null;
    const status: BoardStatus = g.target === 0 ? "skip" : scaled === null ? "none" : scaled >= g.target - 1e-9 ? "ok" : scaled >= g.target * NEAR ? "near" : "low";
    return { key: g.key, label: g.label, max: g.max, target: g.target, measured, scaled, status, solid: g.units.filter((u) => (levels.get(u) ?? 0) >= solidAt).length, units: g.units.length };
  });
  const tested = rows.filter((r) => r.scaled !== null && r.status !== "skip");
  return {
    rows,
    /** Over the groups measured so far (not Bài 5 when its target is 0): worth, full-paper points, and the target for them. */
    measured: { scaled: round2(tested.reduce((a, r) => a + (r.scaled ?? 0), 0)), max: round2(tested.reduce((a, r) => a + r.max, 0)), target: round2(tested.reduce((a, r) => a + r.target, 0)) },
  };
}
