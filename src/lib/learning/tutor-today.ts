// Tutor "Hôm nay" (S11): this week of the student and the session reminder. Pure.
import { addDays, studyDaysThisWeek, weekStart, vnDate, type AttemptRow } from "./rules.ts";

export function weekSummary(attempts: AttemptRow[], today: string) {
  const start = weekStart(today);
  const week = attempts.filter((a) => { const d = vnDate(a.created_at); return d >= start && d <= today; });
  const practice = week.filter((a) => a.mode === "practice");
  return {
    studyDays: studyDaysThisWeek(attempts, today),
    practice: { right: practice.filter((a) => a.correct).length, total: practice.length },
    reviews: new Set(week.filter((a) => a.mode === "review").map((a) => a.exit_run ?? a.created_at)).size,
  };
}

/** ISO weekday 1 = Mon … 7 = Sun of a YYYY-MM-DD date. */
const isoDow = (d: string) => ((new Date(`${d}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

export function sessionDue(lastTaughtOn: string | null, weekdays: number[], today: string): string | null {
  if (!weekdays.length) return null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    if (!weekdays.includes(isoDow(d))) continue;
    return lastTaughtOn && lastTaughtOn >= d ? null : d;
  }
  return null;
}

export type ShelfLite = { id: string; title: string; status: "approved" | "reapprove" | "waiting" | "none"; reviewed: number; total: number };
export type NextAction =
  | { kind: "grade"; key: string; label: string }
  | { kind: "correct"; count: number }
  | { kind: "review"; unitId: string; title: string; reviewed: number; total: number; priority: number | null }
  | { kind: "session"; date: string }
  | { kind: "assign" };

/**
 * "Việc tiếp theo" on the tutor's Hôm nay (v2, 21/10): a progress test / thi thử handed in and not graded (08/11) →
 * grade it; homework the student finished → correct it; then her priority KUs still waiting for review (in her order);
 * then a teaching day not logged; then any KU waiting; else give homework.
 */
export function nextAction(p: { priorities: string[]; shelf: ShelfLite[]; homeworkDone: number; sessionDue: string | null; toGrade?: { key: string; label: string } | null }): NextAction {
  if (p.toGrade) return { kind: "grade", ...p.toGrade };
  if (p.homeworkDone) return { kind: "correct", count: p.homeworkDone };
  const waiting = (s: ShelfLite) => s.status === "waiting" || s.status === "reapprove";
  const review = (s: ShelfLite, i: number | null): NextAction => ({ kind: "review", unitId: s.id, title: s.title, reviewed: s.reviewed, total: s.total, priority: i });
  for (const [i, id] of p.priorities.entries()) {
    const s = p.shelf.find((x) => x.id === id);
    if (s && waiting(s)) return review(s, i + 1);
  }
  if (p.sessionDue) return { kind: "session", date: p.sessionDue };
  const any = p.shelf.find(waiting);
  return any ? review(any, null) : { kind: "assign" };
}
