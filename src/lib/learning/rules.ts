// Learning rules approved by the parent on 02/10/2026 (docs/P1_PLAN.md §2, D14, D15).
// Pure functions only, so they can be unit-tested with `node --test` and reused by
// the student, tutor and parent screens.

export const RULES = {
  practiceWindow: 5, // M2 looks at the last 5 practice first-tries
  m2Rate: 0.6,
  m3ExitRate: 0.8,
  minAnswersForConfidence: 5, // fewer answers → "chưa đủ dữ liệu"
  reviewIntervals: [1, 7, 21] as const, // D+1, D+7, D+21 (D14)
  maintenanceDays: 60, // after D+21: keep reviewing every 60 days until the exam (Q5, 03/10/2026)
  easyFactor: 1.5,
  reviewItemsPerUnit: 3,
  reviewPassRatio: 2 / 3,
  weeklyGoalDays: 4,
  practiceAnswersForStudyDay: 5,
  maxInProgress: 2, // LT3: no new suggestion beyond 2 KUs in progress
  maxUnitsPerReview: 5, // LT8: one session a day, at most 5 units (~15 questions)
  exitDraw: { size: 5, quota: { L1: 1, L2: 2, L3: 2 } }, // LT13: 5 of the bank of 8, unseen first
} as const;

export type Level = 0 | 1 | 2 | 3 | 4;

export type AttemptRow = {
  item_id: string;
  mode: "faded" | "practice" | "exit" | "review";
  correct: boolean;
  error_code: string | null;
  exit_run: string | null;
  created_at: string; // ISO timestamp
};

// ---------- dates (Vietnam time; the app is used in Hà Nội) ----------

const VN = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD in Vietnam time. */
export function vnDate(at: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: VN, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof at === "string" ? new Date(at) : at,
  );
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing isoDate. */
export function weekStart(isoDate: string): string {
  const dow = new Date(`${isoDate}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(isoDate, -((dow + 6) % 7));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

// ---------- mastery (D15: recent average + how many answers) ----------

export type Mastery = {
  level: Level;
  answers: number; // practice + exit + review answers (the "độ chắc chắn" shown next to the level)
  enoughData: boolean;
  practiceRate: number | null; // over the last practiceWindow first-tries, null if fewer
  lastExit: { right: number; total: number; repeatedError: string | null } | null;
};

/** First try of each item per (Vietnam) day — a re-queued wrong item doesn't count twice. */
export function practiceFirstTries(attempts: AttemptRow[]): AttemptRow[] {
  const seen = new Set<string>();
  return attempts
    .filter((a) => a.mode === "practice")
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .filter((a) => {
      const key = `${a.item_id}|${vnDate(a.created_at)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function lastExitRun(attempts: AttemptRow[]): Mastery["lastExit"] {
  const exits = attempts.filter((a) => a.mode === "exit" && a.exit_run);
  if (!exits.length) return null;
  const latest = exits.reduce((a, b) => (b.created_at > a.created_at ? b : a));
  const run = exits.filter((a) => a.exit_run === latest.exit_run);
  const counts = new Map<string, number>();
  for (const a of run) if (a.error_code) counts.set(a.error_code, (counts.get(a.error_code) ?? 0) + 1);
  const repeated = [...counts].find(([, n]) => n >= 2)?.[0] ?? null;
  return { right: run.filter((a) => a.correct).length, total: run.length, repeatedError: repeated };
}

export function exitReachesM3(exit: NonNullable<Mastery["lastExit"]>): boolean {
  return exit.right / exit.total >= RULES.m3ExitRate - 1e-9 && exit.repeatedError === null;
}

export function systemMastery(input: { workedViewed: boolean; attempts: AttemptRow[]; reviewsCompleted: boolean }): Mastery {
  const answers = input.attempts.filter((a) => a.mode !== "faded").length;
  const recent = practiceFirstTries(input.attempts).slice(-RULES.practiceWindow);
  const practiceRate = recent.length >= RULES.practiceWindow ? recent.filter((a) => a.correct).length / recent.length : null;
  const lastExit = lastExitRun(input.attempts);

  let level: Level = 0;
  if (input.workedViewed) level = 1;
  if (level >= 1 && practiceRate !== null && practiceRate >= RULES.m2Rate - 1e-9) level = 2;
  if (level >= 1 && lastExit && exitReachesM3(lastExit)) level = 3;
  if (level === 3 && input.reviewsCompleted) level = 4;

  return { level, answers, enoughData: answers >= RULES.minAnswersForConfidence, practiceRate, lastExit };
}

// ---------- review schedule (D14) ----------

export type Stage = 1 | 2 | 3 | 4; // 4 = maintenance
export type Rating = "easy" | "normal";

export function reviewPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= RULES.reviewPassRatio - 1e-9;
}

/** First review after a unit reaches M3. */
export function firstReview(today: string): { stage: Stage; dueOn: string } {
  return { stage: 1, dueOn: addDays(today, RULES.reviewIntervals[0]) };
}

/**
 * Next state after finishing the review of `stage`.
 * Pass: 1 → 2 (D+7), 2 → 3 (D+21), 3 → 4 maintenance (+60, reaching M4), 4 → 4 (+60).
 * "Easy" stretches the next interval ×1.5. Fail at any stage: back to 1 (D+1) and M4 is lost.
 */
export function afterReview(
  stage: Stage,
  passed: boolean,
  rating: Rating,
  today: string,
): { stage: Stage; dueOn: string; completed: boolean } {
  if (!passed) return { stage: 1, dueOn: addDays(today, RULES.reviewIntervals[0]), completed: false };
  const next: Stage = stage >= 3 ? 4 : ((stage + 1) as Stage);
  const base = next === 4 ? RULES.maintenanceDays : RULES.reviewIntervals[next - 1];
  const days = rating === "easy" ? Math.ceil(base * RULES.easyFactor) : base;
  return { stage: next, dueOn: addDays(today, days), completed: next === 4 };
}

// ---------- review session building ----------

/** Round-robin across units so no two consecutive questions come from the same unit (when ≥ 2 units). */
export function interleave<T>(groups: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < max; i++) for (const g of groups) if (i < g.length) out.push(g[i]);
  return out;
}

/** Least recently answered items first (never-answered before anything else), keeping content order on ties. */
export function pickReviewItems<T extends { id: string }>(pool: T[], attempts: AttemptRow[], n: number = RULES.reviewItemsPerUnit): T[] {
  const last = new Map<string, string>();
  for (const a of attempts) if ((last.get(a.item_id) ?? "") < a.created_at) last.set(a.item_id, a.created_at);
  return pool
    .map((item, i) => ({ item, i, t: last.get(item.id) ?? "" }))
    .sort((a, b) => a.t.localeCompare(b.t) || a.i - b.i)
    .slice(0, n)
    .map((x) => x.item);
}

export type ReviewPlanUnit<T> = { unitId: string; pool: T[]; attempts: AttemptRow[] };

export type ReviewPlan<T> = {
  /** Unfinished run to resume, or null to start a new one. */
  runId: string | null;
  /** First answers already given in that run, oldest first. */
  answered: { unitId: string; itemId: string; correct: boolean }[];
  /** Questions still to ask, interleaved across units (D14). */
  remaining: { unitId: string; item: T }[];
};

/**
 * Build today's review session. A run is unfinished while it has review answers for a
 * due unit but no review_log row for that unit (`scored` holds "runId|unitId").
 * Reloading the page resumes the latest unfinished run, so a wrong answer still counts
 * and the questions don't change; the run's own answers are left out when picking the
 * rest, which gives back the set the run started with.
 */
export function planReview<T extends { id: string }>(units: ReviewPlanUnit<T>[], scored: Set<string>): ReviewPlan<T> {
  let latest: AttemptRow | null = null;
  for (const u of units)
    for (const a of u.attempts)
      if (a.mode === "review" && a.exit_run && !scored.has(`${a.exit_run}|${u.unitId}`) && (!latest || a.created_at > latest.created_at))
        latest = a;
  const runId = latest?.exit_run ?? null;

  const answered: (ReviewPlan<T>["answered"][number] & { at: string })[] = [];
  const groups = units.map((u) => {
    const inRun = u.attempts.filter((a) => a.mode === "review" && runId !== null && a.exit_run === runId);
    const done = new Set<string>();
    for (const a of [...inRun].sort((x, y) => x.created_at.localeCompare(y.created_at))) {
      if (done.has(a.item_id)) continue;
      done.add(a.item_id);
      answered.push({ unitId: u.unitId, itemId: a.item_id, correct: a.correct, at: a.created_at });
    }
    const others = u.attempts.filter((a) => !inRun.includes(a));
    const pool = u.pool.filter((it) => !done.has(it.id));
    const n = Math.max(0, RULES.reviewItemsPerUnit - done.size);
    return pickReviewItems(pool, others, n).map((item) => ({ unitId: u.unitId, item }));
  });

  return {
    runId,
    answered: answered
      .sort((x, y) => x.at.localeCompare(y.at))
      .map((a) => ({ unitId: a.unitId, itemId: a.itemId, correct: a.correct })),
    remaining: interleave(groups),
  };
}

// ---------- weekly goal (D17: goal, never streaks) ----------

/** A study day = a day with a finished exit test or review, or at least 5 practice answers. */
export function studyDaysThisWeek(attempts: AttemptRow[], today: string): number {
  const start = weekStart(today);
  const practice = new Map<string, number>();
  const days = new Set<string>();
  for (const a of attempts) {
    const d = vnDate(a.created_at);
    if (d < start || d > today) continue;
    if (a.mode === "exit" || a.mode === "review") days.add(d);
    if (a.mode === "practice") practice.set(d, (practice.get(d) ?? 0) + 1);
  }
  for (const [d, n] of practice) if (n >= RULES.practiceAnswersForStudyDay) days.add(d);
  return days.size;
}
