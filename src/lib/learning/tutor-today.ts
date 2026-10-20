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
