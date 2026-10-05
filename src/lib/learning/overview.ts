// Parent "Tổng quan" rules (S4, spec 2026-10-05). Pure, so `node --test` covers it.
// Confirmed levels are display only (P2): nothing here changes reviews or mastery.
import { addDays, studyDaysThisWeek, vnDate, weekStart, type AttemptRow, type Level } from "./rules.ts";

export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const; // index = weekday − 1

/** 1 = Monday … 7 = Sunday. */
export function isoWeekday(isoDate: string): number {
  return ((new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

/** Checkbox values → sorted unique weekdays, or null if anything is invalid. */
export function parseWeekdays(values: unknown[]): number[] | null {
  const out = new Set<number>();
  for (const v of values) {
    const s = String(v);
    if (!/^[1-7]$/.test(s) || out.has(Number(s))) return null;
    out.add(Number(s));
  }
  return [...out].sort((a, b) => a - b);
}

export type ProposalRow = { session_id: string; unit_id: string; level: number; tutor_id: string; created_at: string };
export type ConfirmationRow = { unit_id: string; level: number; system_level: number; created_at: string };

export function latestByUnit<T extends { unit_id: string; created_at: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const r of rows) {
    const cur = m.get(r.unit_id);
    if (!cur || r.created_at > cur.created_at) m.set(r.unit_id, r);
  }
  return m;
}

/** §3 (amended): the parent's level is shown while the system level hasn't moved since confirming. */
export function displayLevel(system: Level, confirmation?: ConfirmationRow): { level: Level; confirmed: boolean } {
  if (confirmation && confirmation.system_level === system) return { level: confirmation.level as Level, confirmed: true };
  return { level: system, confirmed: false };
}

export type Flag = { unitId: string; proposal: ProposalRow; system: Level };

/** Latest proposal per unit (any tutor) ≥ 1 level from the current system level, not confirmed since. */
export function mismatchFlags(units: { id: string; system: Level }[], proposals: ProposalRow[], confirmations: ConfirmationRow[]): Flag[] {
  const p = latestByUnit(proposals);
  const c = latestByUnit(confirmations);
  const out: Flag[] = [];
  for (const u of units) {
    const prop = p.get(u.id);
    if (!prop || Math.abs(prop.level - u.system) < 1) continue;
    const conf = c.get(u.id);
    if (conf && conf.created_at > prop.created_at) continue;
    out.push({ unitId: u.id, proposal: prop, system: u.system });
  }
  return out;
}

export type AssignmentRow = { id: string; tutor_id: string; started_at: string; ended_at: string | null; weekdays: number[] };

/** Scheduled teaching days in the last `days` days, up to yesterday, with no session logged by that tutor. */
export function missedSessions(
  assignments: AssignmentRow[],
  sessions: { tutor_id: string; taught_on: string }[],
  today: string,
  days = 14,
): { assignmentId: string; tutorId: string; date: string }[] {
  const logged = new Set(sessions.map((s) => `${s.tutor_id}|${s.taught_on}`));
  const out: { assignmentId: string; tutorId: string; date: string }[] = [];
  for (const a of assignments) {
    if (a.ended_at || !a.weekdays.length) continue;
    const start = vnDate(a.started_at);
    for (let i = days; i >= 1; i--) {
      const d = addDays(today, -i);
      if (d < start || !a.weekdays.includes(isoWeekday(d))) continue;
      if (!logged.has(`${a.tutor_id}|${d}`)) out.push({ assignmentId: a.id, tutorId: a.tutor_id, date: d });
    }
  }
  return out;
}

export type WeekSummary = {
  studyDays: number;
  exits: number;
  reviews: number;
  sessions: number;
  homeworkGiven: number;
  homeworkDone: number;
  homeworkReviewed: number;
};

export function weekSummary(input: {
  attempts: AttemptRow[];
  reviewLog: { created_at: string }[];
  sessions: { taught_on: string }[];
  homework: { created_at: string; done_at: string | null; reviewed_at: string | null }[];
  today: string;
}): WeekSummary {
  const from = weekStart(input.today);
  const inWeek = (iso: string | null) => !!iso && vnDate(iso) >= from && vnDate(iso) <= input.today;
  const exitRuns = new Set(input.attempts.filter((a) => a.mode === "exit" && a.exit_run && inWeek(a.created_at)).map((a) => a.exit_run));
  return {
    studyDays: studyDaysThisWeek(input.attempts, input.today),
    exits: exitRuns.size,
    reviews: input.reviewLog.filter((r) => inWeek(r.created_at)).length,
    sessions: input.sessions.filter((s) => s.taught_on >= from && s.taught_on <= input.today).length,
    homeworkGiven: input.homework.filter((h) => inWeek(h.created_at)).length,
    homeworkDone: input.homework.filter((h) => inWeek(h.done_at)).length,
    homeworkReviewed: input.homework.filter((h) => inWeek(h.reviewed_at)).length,
  };
}
