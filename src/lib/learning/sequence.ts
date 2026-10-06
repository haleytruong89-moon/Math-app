// Curriculum engine rules (S6a: LT2 unlock, LT3 suggestions, LT4 test-out, LT8 review cap).
// Pure, so `node --test` covers it.
import { RULES, exitReachesM3, lastExitRun, type AttemptRow, type Level } from "./rules.ts";

export type SeqUnit = {
  id: string;
  track: "A" | "B" | "C";
  seq: number;
  batch: number;
  prereq: string[];
  testOut: boolean;
  hasContent: boolean; // an approved content file exists (for this viewer)
  level: Level; // system level
  started: boolean; // worked example viewed, test-out tried, or in the review queue (R1: never re-locked)
  manualUnlock: boolean;
  testoutTried: boolean;
  inReview: boolean;
  priority: "P0" | "P1" | "P2"; // LT17
};

export type UnitStatus = "comingSoon" | "locked" | "open";

/** LT2: open when every prerequisite is at M3 (system level), or unlocked by the parent, or already started. */
export function unitStatus(u: SeqUnit, byId: Map<string, SeqUnit>): UnitStatus {
  if (!u.hasContent) return "comingSoon";
  if (u.started || u.manualUnlock) return "open";
  return u.prereq.every((p) => (byId.get(p)?.level ?? 0) >= 3) ? "open" : "locked";
}

export function isInProgress(u: SeqUnit): boolean {
  return u.started && u.level < 3 && !u.inReview;
}

const byBatchSeq = (a: SeqUnit, b: SeqUnit) => a.batch - b.batch || a.seq - b.seq;
const byBatchTrackSeq = (a: SeqUnit, b: SeqUnit) => a.batch - b.batch || a.track.localeCompare(b.track) || a.seq - b.seq;

/**
 * LT3: one open, not-started KU from track A and one from track B/C (batch → B before C → seq).
 * Nothing while 2 KUs are in progress. P2 KUs only after the track's core (LT17).
 */
export function suggestNew(units: SeqUnit[]): SeqUnit[] {
  if (units.filter(isInProgress).length >= RULES.maxInProgress) return [];
  const byId = new Map(units.map((u) => [u.id, u]));
  // LT17: a P2 KU waits until every core (P0/P1) KU of its track is at M3 — or the parent unlocked it.
  const coreDone = (track: SeqUnit["track"]) => units.every((u) => u.track !== track || u.priority === "P2" || u.level >= 3);
  const fresh = units.filter((u) => !u.started && unitStatus(u, byId) === "open" && (u.priority !== "P2" || u.manualUnlock || coreDone(u.track)));
  const a = fresh.filter((u) => u.track === "A").sort(byBatchSeq)[0];
  const bc = fresh.filter((u) => u.track !== "A").sort(byBatchTrackSeq)[0];
  return [a, bc].filter((x): x is SeqUnit => !!x);
}

/**
 * LT4: answers of a failed test-out run don't count toward mastery (or "câu đã làm");
 * a passed run counts like any exit test. `passed` is null when there was no test-out.
 */
export function splitTestOut(attempts: AttemptRow[], testoutRun: string | null): { counted: AttemptRow[]; passed: boolean | null } {
  if (!testoutRun) return { counted: attempts, passed: null };
  const run = attempts.filter((a) => a.mode === "exit" && a.exit_run === testoutRun);
  const exit = lastExitRun(run);
  const passed = !!exit && exitReachesM3(exit);
  return { counted: passed ? attempts : attempts.filter((a) => a.exit_run !== testoutRun), passed };
}

/**
 * The answer history mastery is computed from, test-out applied (LT4). Every replay of mastery
 * (displayLevel, nudges) must use this, not the raw rows, or it disagrees with the system level.
 */
export function masteryHistory(
  attempts: AttemptRow[],
  testoutRun: string | null,
  workedViewed: boolean,
  reviewsCompleted: boolean,
): { attempts: AttemptRow[]; workedViewed: boolean; reviewsCompleted: boolean; testoutPassed: boolean | null } {
  const split = splitTestOut(attempts, testoutRun);
  return { attempts: split.counted, workedViewed: workedViewed || split.passed === true, reviewsCompleted, testoutPassed: split.passed };
}

/** LT8: units for today's session — an unfinished run keeps its units, then the most overdue, at most 5. */
export function selectReviewUnits(due: { unitId: string; dueOn: string }[], openRunUnits: string[], cap: number = RULES.maxUnitsPerReview): string[] {
  const keep = due.filter((d) => openRunUnits.includes(d.unitId)).map((d) => d.unitId);
  const rest = due
    .filter((d) => !openRunUnits.includes(d.unitId))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.unitId.localeCompare(b.unitId))
    .map((d) => d.unitId);
  return [...keep, ...rest].slice(0, Math.max(cap, keep.length));
}
