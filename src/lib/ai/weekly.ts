// S8a: the weekly report's facts (spec §5.1). Pure: numbers come only from these rows, AI only comments on them.
import type { Curriculum } from "../content/curriculum.ts";
import { errorLabel } from "../content/errors.ts";
import { lateUnits, milestoneProgress } from "../learning/milestones.ts";
import { weekSummary, type UnitHistory } from "../learning/overview.ts";
import { addDays, RULES, systemMastery, vnDate, weekStart, type AttemptRow, type Level } from "../learning/rules.ts";
import { commonErrors } from "../learning/work.ts";
import { allowedNumbers, bannedWords, unknownNumbers, type Check } from "./guard.ts";
import { AI_RULES } from "./rules.ts";

/** The full Monday–Sunday week before the one `today` falls in. */
export function reportWeek(today: string): { from: string; to: string } {
  const from = addDays(weekStart(today), -7);
  return { from, to: addDays(from, 6) };
}

/** A KU the student can see, with what mastery is computed from and the level shown to the parent. */
export type WeeklyUnit = { id: string; title: string; history: UnitHistory; shown: Level; reviewDueOn: string | null };

export type WeeklyInput = {
  today: string;
  units: WeeklyUnit[];
  curriculum: Curriculum;
  reviewLog: { created_at: string }[];
  sessions: { taught_on: string }[];
  homework: { created_at: string; done_at: string | null; reviewed_at: string | null }[];
};

export type WeeklyFacts = {
  from: string;
  to: string;
  studyDays: number;
  goalDays: number;
  exits: number;
  reviews: number;
  sessions: number;
  homework: { given: number; done: number; reviewed: number };
  /** KUs that reached ≥ M3 (by the system) during the week. */
  newSolid: string[];
  /** Reviews overdue on the day the report is made. */
  overdueReviews: number;
  /** Error codes of the week's wrong answers seen ≥ 2×, top 5. */
  repeatedErrors: { code: string; label: string; count: number }[];
  milestones: { title: string; due: string; solid: number; total: number; perWeek: number; late: number }[];
  /** Late KUs (≤ 10), earliest phase first. */
  late: string[];
};

const levelAt = (h: UnitHistory, day: string): Level =>
  systemMastery({ ...h, attempts: h.attempts.filter((a) => vnDate(a.created_at) <= day) }).level;

export function weeklyFacts(input: WeeklyInput): WeeklyFacts {
  const { from, to } = reportWeek(input.today);
  const attempts = input.units.flatMap((u) => u.history.attempts);
  const s = weekSummary({ attempts, reviewLog: input.reviewLog, sessions: input.sessions, homework: input.homework, today: to });
  const inWeek = (a: AttemptRow) => {
    const d = vnDate(a.created_at);
    return d >= from && d <= to;
  };
  const ms = { levels: new Map(input.units.map((u) => [u.id, u.shown])), withContent: new Set(input.units.map((u) => u.id)), today: input.today };
  return {
    from,
    to,
    studyDays: Math.min(s.studyDays, RULES.weeklyGoalDays),
    goalDays: RULES.weeklyGoalDays,
    exits: s.exits,
    reviews: s.reviews,
    sessions: s.sessions,
    homework: { given: s.homeworkGiven, done: s.homeworkDone, reviewed: s.homeworkReviewed },
    newSolid: input.units.filter((u) => levelAt(u.history, to) >= 3 && levelAt(u.history, addDays(from, -1)) < 3).map((u) => u.title),
    overdueReviews: input.units.filter((u) => u.reviewDueOn !== null && u.reviewDueOn < input.today).length,
    repeatedErrors: commonErrors(attempts.filter(inWeek))
      .slice(0, 5)
      .map((e) => ({ code: e.code, label: errorLabel(e.code) ?? e.code, count: e.count })),
    milestones: milestoneProgress(input.curriculum, ms).map((m) => ({ title: m.title, due: m.due, solid: m.solid, total: m.total, perWeek: m.perWeek, late: m.late.length })),
    late: lateUnits(input.curriculum, ms)
      .slice(0, 10)
      .map((u) => u.title),
  };
}

/** The AI "Nhận xét": plain text, every number from the facts, no banned word, ≤ 900 characters. */
export function checkWeeklyComment(text: string, facts: WeeklyFacts): Check<string> {
  const t = text.trim();
  const reasons: string[] = [];
  if (!t) reasons.push("trống");
  if (t.length > AI_RULES.weeklyCommentMaxChars) reasons.push("quá dài");
  const unknown = unknownNumbers(t, allowedNumbers(facts));
  if (unknown.length) reasons.push(`số không có trong dữ liệu: ${unknown.join(", ")}`);
  const banned = bannedWords(t);
  if (banned.length) reasons.push(`từ không dùng: ${banned.join(", ")}`);
  return reasons.length ? { ok: false, reasons } : { ok: true, value: t };
}
