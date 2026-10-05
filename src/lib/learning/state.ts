import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { curriculum, listModules } from "@/lib/content";
import type { Unit } from "@/lib/content/schema";
import type { CurriculumModule, CurriculumUnit } from "@/lib/content/curriculum";
import { studyDaysThisWeek, systemMastery, vnDate, type AttemptRow, type Mastery, type Stage } from "./rules";
import { isInProgress, masteryHistory, selectReviewUnits, suggestNew, unitStatus, type SeqUnit, type UnitStatus } from "./sequence";

export type UnitState = {
  unit: Unit;
  moduleTitle: string;
  workedViewed: boolean;
  fadedDone: boolean;
  mastery: Mastery;
  review: { stage: Stage; dueOn: string | null; completed: boolean } | null;
  attempts: AttemptRow[];
  /** What mastery is computed from (test-out applied) — pass this to displayLevel, not the raw attempts. */
  history: { attempts: AttemptRow[]; workedViewed: boolean; reviewsCompleted: boolean };
  /** S6a: roadmap entry (null only if a file is missing from curriculum.json, which tests forbid). */
  entry: CurriculumUnit | null;
  status: UnitStatus;
  /** Started = worked example viewed, test-out tried, or in the review queue. */
  started: boolean;
  inProgress: boolean;
  testout: { tried: boolean; passed: boolean | null };
};

/** One of the 50 roadmap KUs; `state` is set when the KU has content this viewer may see. */
export type RoadmapNode = { entry: CurriculumUnit; state: UnitState | null; status: UnitStatus; level: number };

export type StudentState = {
  today: string;
  units: UnitState[]; // approved units (or all units with includeDrafts), in course order
  studyDays: number;
  /** S6a: all roadmap KUs in curriculum order, and the roadmap modules. */
  roadmap: RoadmapNode[];
  modules: CurriculumModule[];
  /** LT3: at most 2 new KUs to offer (1 track A + 1 track B/C). */
  suggestions: UnitState[];
  /** LT8: a review session was already finished today (one per day). */
  reviewedToday: boolean;
};

/**
 * Every answer of a student, oldest first. Read in pages: the API returns at most "Max rows"
 * (1000 by default on Supabase) per request, and a silent cut would drop the newest answers.
 */
async function allAttempts(supabase: SupabaseClient, studentId: string) {
  const PAGE = 1000;
  const rows: unknown[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) { // 50 000 answers ≈ years of use; never loop forever
    const r = await supabase
      .from("attempts")
      .select("unit_id, item_id, mode, correct, error_code, exit_run, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (r.error) return { data: rows.length ? rows : null, error: r.error };
    rows.push(...(r.data ?? []));
    if ((r.data ?? []).length < PAGE) return { data: rows, error: null };
  }
  return { data: rows, error: null };
}

/** LT13: this student's exit answers on one unit — what the exit draw is computed from (page and submitExit). */
export async function exitHistory(supabase: SupabaseClient, studentId: string, unitId: string) {
  const { data, error } = await supabase
    .from("attempts")
    .select("item_id, mode, correct, error_code, exit_run, created_at")
    .eq("student_id", studentId)
    .eq("unit_id", unitId)
    .eq("mode", "exit");
  return error ? null : ((data ?? []) as AttemptRow[]);
}

/**
 * Everything the screens need about one student, read through RLS with the caller's
 * client (works for the student, their parent, and an assigned tutor).
 * Tutors pass includeDrafts: they teach the school programme, so every unit can be logged.
 */
export async function loadStudentState(
  supabase: SupabaseClient,
  studentId: string,
  opts: { includeDrafts?: boolean } = {},
): Promise<StudentState> {
  const [progress, attempts, queue, unlocks, lastReview] = await Promise.all([
    supabase.from("unit_progress").select("unit_id, worked_viewed_at, faded_done_at, testout_run, testout_at").eq("student_id", studentId),
    allAttempts(supabase, studentId),
    supabase.from("review_queue").select("unit_id, stage, due_on, completed_at").eq("student_id", studentId),
    supabase.from("unit_unlocks").select("unit_id").eq("student_id", studentId),
    supabase.from("review_log").select("created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1),
  ]);
  for (const r of [progress, attempts, queue, unlocks, lastReview]) if (r.error) console.error("loadStudentState", r.error.message);
  const unlocked = new Set((unlocks.data ?? []).map((u) => u.unit_id as string));
  const roadmap = curriculum();
  const entryOf = new Map(roadmap.units.map((u) => [u.id, u]));

  const prog = new Map((progress.data ?? []).map((p) => [p.unit_id as string, p]));
  const q = new Map((queue.data ?? []).map((r) => [r.unit_id as string, r]));
  const byUnit = new Map<string, AttemptRow[]>();
  for (const a of (attempts.data ?? []) as (AttemptRow & { unit_id: string })[]) {
    const list = byUnit.get(a.unit_id) ?? [];
    list.push(a);
    byUnit.set(a.unit_id, list);
  }

  const units: UnitState[] = listModules().flatMap((m) =>
    m.unitList
      .filter((u) => opts.includeDrafts || u.status === "approved")
      .map((unit) => {
        const p = prog.get(unit.id);
        const r = q.get(unit.id);
        const rows = byUnit.get(unit.id) ?? [];
        const review = r ? { stage: r.stage as Stage, dueOn: r.due_on as string | null, completed: !!r.completed_at } : null;
        // LT4: a failed test-out run doesn't count; a passed one counts as having learnt the unit.
        const workedViewed = !!p?.worked_viewed_at;
        const history = masteryHistory(rows, (p?.testout_run as string | null) ?? null, workedViewed, !!review?.completed);
        const tried = !!p?.testout_at;
        return {
          unit,
          moduleTitle: m.title,
          workedViewed,
          fadedDone: !!p?.faded_done_at,
          mastery: systemMastery(history),
          review,
          attempts: rows,
          history,
          entry: entryOf.get(unit.id) ?? null,
          status: "open" as UnitStatus,
          started: workedViewed || tried || !!review,
          inProgress: false,
          testout: { tried, passed: history.testoutPassed },
        };
      }),
  );

  // S6a: status, in-progress and suggestions over the whole roadmap.
  const byUnitId = new Map(units.map((u) => [u.unit.id, u]));
  const seq: SeqUnit[] = roadmap.units.map((e) => {
    const u = byUnitId.get(e.id);
    return {
      id: e.id, track: e.track, seq: e.seq, batch: e.batch, prereq: e.prereq, testOut: e.testOut,
      hasContent: !!u, level: u?.mastery.level ?? 0, started: !!u?.started, manualUnlock: unlocked.has(e.id),
      testoutTried: !!u?.testout.tried, inReview: !!u?.review,
    };
  });
  const seqById = new Map(seq.map((x) => [x.id, x]));
  for (const u of units) {
    const x = seqById.get(u.unit.id);
    if (!x) continue;
    u.status = unitStatus(x, seqById);
    u.inProgress = isInProgress(x);
  }
  const suggestions = suggestNew(seq).map((x) => byUnitId.get(x.id)!).filter(Boolean);

  const today = vnDate();
  const last = (lastReview.data ?? [])[0]?.created_at as string | undefined;
  return {
    today,
    units,
    studyDays: studyDaysThisWeek((attempts.data ?? []) as AttemptRow[], today),
    roadmap: roadmap.units.map((e) => {
      const x = seqById.get(e.id)!;
      return { entry: e, state: byUnitId.get(e.id) ?? null, status: unitStatus(x, seqById), level: x.level };
    }),
    modules: roadmap.modules,
    suggestions,
    reviewedToday: !!last && vnDate(last) === today,
  };
}

export function dueReviews(state: StudentState): UnitState[] {
  return state.units.filter((u) => u.review?.dueOn && u.review.dueOn <= state.today);
}

/**
 * LT8: today's review session — at most 5 due units (most overdue first, an unfinished run keeps
 * its units), one session a day. `later` = due units left for the next days.
 */
export function todaysReview(state: StudentState, openRunUnits: string[] = []): { units: UnitState[]; later: number } {
  const due = dueReviews(state);
  if (state.reviewedToday && !openRunUnits.length) return { units: [], later: due.length };
  const pick = selectReviewUnits(due.map((u) => ({ unitId: u.unit.id, dueOn: u.review!.dueOn! })), openRunUnits);
  const units = due.filter((u) => pick.includes(u.unit.id));
  return { units, later: due.length - units.length };
}
