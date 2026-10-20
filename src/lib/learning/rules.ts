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
  hintCountsFrom: 2, // AI2: an answer after hint H2+ doesn't count as right first time (M2)
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
  /** AI2 (0010): highest pre-written hint seen before answering, 0–3. */
  hint_level?: number | null;
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

/** A right answer without hint H2 or more (AI2) — what counts toward M2 and "lần đầu đúng". */
export function rightUnaided(a: AttemptRow): boolean {
  return a.correct && (a.hint_level ?? 0) < RULES.hintCountsFrom;
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
  // AI2: right after hint H2+ isn't a right first try.
  const practiceRate = recent.length >= RULES.practiceWindow ? recent.filter(rightUnaided).length / recent.length : null;
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

/** A new review run (D14): per due unit the least recently answered practice items, interleaved. */
export function newReviewPlan<T extends { id: string }>(units: ReviewPlanUnit<T>[]): { unitId: string; item: T }[] {
  return interleave(units.map((u) => pickReviewItems(u.pool, u.attempts).map((item) => ({ unitId: u.unitId, item }))));
}

/** H1 (0011): a planned question of a server-made review run is stored as "<unit_id>/<item_id>". */
export const runItemKey = (unitId: string, itemId: string) => `${unitId}/${itemId}`;
export function parseRunItem(key: string): { unitId: string; itemId: string } {
  const i = key.indexOf("/");
  return { unitId: key.slice(0, i), itemId: key.slice(i + 1) };
}

export type RunAnswer = { unitId: string; item_id: string; correct: boolean; created_at: string };

/**
 * Where a server-planned review run stands. Only the first answer to a planned question counts
 * (an answer to anything else is ignored); the run may be scored only when `remaining` is empty.
 */
export function reviewRunProgress<Q extends { unitId: string; itemId: string }>(planned: Q[], answers: RunAnswer[]) {
  const key = (u: string, i: string) => `${u}/${i}`;
  const wanted = new Set(planned.map((q) => key(q.unitId, q.itemId)));
  const first = new Map<string, { unitId: string; itemId: string; correct: boolean }>();
  for (const a of [...answers].sort((x, y) => x.created_at.localeCompare(y.created_at))) {
    const k = key(a.unitId, a.item_id);
    if (wanted.has(k) && !first.has(k)) first.set(k, { unitId: a.unitId, itemId: a.item_id, correct: a.correct });
  }
  const perUnit = new Map<string, { correct: number; total: number }>();
  for (const a of first.values()) {
    const u = perUnit.get(a.unitId) ?? { correct: 0, total: 0 };
    u.total += 1;
    if (a.correct) u.correct += 1;
    perUnit.set(a.unitId, u);
  }
  return {
    /** First answers, oldest first. */
    answered: [...first.values()],
    /** Planned questions still without an answer, in plan order. */
    remaining: planned.filter((q) => !first.has(key(q.unitId, q.itemId))),
    perUnit,
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
