// Luyện đề 4.2 (23/10/2026): which drill problems a student may do now. Pure, so `node --test` covers it.
// Rulings (docs/SPEC.md §0, 23/10): a problem opens when every KU it needs is at M3 or has the tutor's ★,
// at most 3 new problems a week (Monday–Sunday); a problem done with a mistake comes back 7 days later.
import { addDays, vnDate, weekStart, type Level } from "./rules.ts";

export const DRILL_RULES = { newPerWeek: 3, redoAfterDays: 7, solid: 3 } as const;

export type DrillStatus =
  | "locked" // a needed KU is below M3 and not ★
  | "waiting" // open, but this week's 3 new problems are used
  | "new" // may start now
  | "doing" // started, some item not answered yet
  | "later" // finished with a mistake, comes back on `redoOn`
  | "redo" // finished with a mistake, due again
  | "done"; // finished without a mistake on its last day

export type DrillInput = { id: string; order: number; needs: string[]; itemIds: string[] };
export type DrillAttempt = { item_id: string; correct: boolean; created_at: string };
export type DrillState = {
  id: string;
  status: DrillStatus;
  /** Needed KUs still below M3 and not ★ (for "locked"). */
  missing: string[];
  startedOn: string | null;
  lastOn: string | null;
  redoOn: string | null;
  /** Items answered right on the last day / items. */
  right: number;
  total: number;
};

export function drillPlan(
  problems: DrillInput[],
  input: { levels: Map<string, Level>; priorities: Set<string>; attempts: Map<string, DrillAttempt[]>; today: string },
): DrillState[] {
  const week = weekStart(input.today);
  const rows = [...problems].sort((a, b) => a.order - b.order).map((p) => {
    const atts = [...(input.attempts.get(p.id) ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const missing = p.needs.filter((k) => (input.levels.get(k) ?? 0) < DRILL_RULES.solid && !input.priorities.has(k));
    const base = { id: p.id, missing, startedOn: null as string | null, lastOn: null as string | null, redoOn: null as string | null, right: 0, total: p.itemIds.length };
    if (!atts.length) return { ...base, status: (missing.length ? "locked" : "new") as DrillStatus };
    const startedOn = vnDate(atts[0].created_at);
    const lastOn = vnDate(atts[atts.length - 1].created_at);
    const lastDay = atts.filter((a) => vnDate(a.created_at) === lastOn);
    const latest = new Map<string, boolean>();
    for (const a of atts) latest.set(a.item_id, a.correct);
    const right = p.itemIds.filter((id) => latest.get(id) === true && lastDay.some((a) => a.item_id === id)).length;
    const s = { ...base, startedOn, lastOn, right };
    if (!p.itemIds.every((id) => latest.has(id))) return { ...s, status: "doing" as DrillStatus };
    if (lastDay.some((a) => !a.correct)) {
      const redoOn = addDays(lastOn, DRILL_RULES.redoAfterDays);
      return { ...s, redoOn, status: (input.today >= redoOn ? "redo" : "later") as DrillStatus };
    }
    return { ...s, status: "done" as DrillStatus };
  });
  // Weekly cap: problems first started this week use the slots; the earliest open ones get the rest.
  let slots = Math.max(0, DRILL_RULES.newPerWeek - rows.filter((r) => r.startedOn !== null && r.startedOn >= week).length);
  return rows.map((r) => {
    if (r.status !== "new") return r;
    if (slots > 0) {
      slots--;
      return r;
    }
    return { ...r, status: "waiting" as DrillStatus };
  });
}

/** May the student answer this problem now? (Server gate for answers.) */
export const drillOpen = (s: DrillState | undefined) => !!s && s.status !== "locked" && s.status !== "waiting";
