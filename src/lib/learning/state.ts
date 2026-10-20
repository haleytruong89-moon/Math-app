import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { curriculum } from "@/lib/content";
import { studentModules } from "@/lib/content/approvals";
import type { Unit } from "@/lib/content/schema";
import type { CurriculumModule, CurriculumUnit } from "@/lib/content/curriculum";
import { newReviewPlan, parseRunItem, reviewRunProgress, studyDaysThisWeek, systemMastery, vnDate, type AttemptRow, type Mastery, type Stage } from "./rules";
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
  /** T8: the tutor's focus KUs, in order. */
  priorities: string[];
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
      .select("unit_id, item_id, mode, correct, error_code, exit_run, created_at, hint_level")
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
  const [progress, attempts, queue, unlocks, lastReview, assigned, prio, modules] = await Promise.all([
    supabase.from("unit_progress").select("unit_id, worked_viewed_at, faded_done_at, testout_run, testout_at").eq("student_id", studentId),
    allAttempts(supabase, studentId),
    supabase.from("review_queue").select("unit_id, stage, due_on, completed_at").eq("student_id", studentId),
    supabase.from("unit_unlocks").select("unit_id").eq("student_id", studentId),
    supabase.from("review_log").select("created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1),
    // S9: a unit the tutor gave as homework is open for the student, like a parent's manual unlock.
    supabase.from("homework").select("unit_id").eq("student_id", studentId).order("created_at", { ascending: false }).limit(200),
    // T8: the tutor's focus KUs for this student, in order.
    supabase.from("tutor_priorities").select("unit_id, position").eq("student_id", studentId).order("position", { ascending: true }),
    // T7: what the student may see (git-approved, or approved in the app with only its ok items).
    studentModules({ includeDrafts: opts.includeDrafts }),
  ]);
  for (const r of [progress, attempts, queue, unlocks, lastReview, assigned, prio]) if (r.error) console.error("loadStudentState", r.error.message);
  const priorities = (prio.data ?? []).map((p) => p.unit_id as string);
  // T8: a priority KU opens at once, like a parent's unlock or a tutor's homework (S9).
  const unlocked = new Set([...(unlocks.data ?? []), ...(assigned.data ?? [])].map((u) => u.unit_id as string | null).filter((x): x is string => !!x).concat(priorities));
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

  const units: UnitState[] = modules.flatMap((m) =>
    m.unitList
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
      testoutTried: !!u?.testout.tried, inReview: !!u?.review, priority: e.priority,
    };
  });
  const seqById = new Map(seq.map((x) => [x.id, x]));
  for (const u of units) {
    const x = seqById.get(u.unit.id);
    if (!x) continue;
    u.status = unitStatus(x, seqById);
    u.inProgress = isInProgress(x);
  }
  const suggestions = suggestNew(seq, priorities).map((x) => byUnitId.get(x.id)!).filter(Boolean);

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
    priorities,
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

// ---------- H1 (0011): server-planned review runs ----------

export type OpenRun = { id: string; items: string[] };

/** The student's unfinished review run, null if none, or "error" if it couldn't be read. */
export async function findOpenRun(supabase: SupabaseClient, studentId: string): Promise<OpenRun | null | "error"> {
  const { data, error } = await supabase
    .from("review_runs")
    .select("id, items")
    .eq("student_id", studentId)
    .is("finished_at", null)
    .maybeSingle();
  if (error) {
    console.error("findOpenRun", error.message);
    return "error";
  }
  return (data as OpenRun | null) ?? null;
}

export type ReviewSession = {
  /** The open run these questions belong to, or null: the first answer creates the run with `planned`. */
  runId: string | null;
  /** An open run with nothing left that is due (to be closed when the next run starts). */
  staleRunId: string | null;
  units: UnitState[];
  later: number;
  planned: { unitId: string; item: Unit["practice"][number] }[];
  answered: { unitId: string; itemId: string; correct: boolean }[];
  remaining: { unitId: string; item: Unit["practice"][number] }[];
};

/**
 * Today's review (D14, LT8). An open run keeps its planned questions (reload / another day resumes it,
 * wrong answers still count); otherwise a new plan from today's due units, saved as a run on the first answer.
 * Review questions come from practice only: exit-test solutions stay unseen until a retake.
 */
export function reviewSession(state: StudentState, run: OpenRun | null): ReviewSession {
  const planItems = (run?.items ?? []).map(parseRunItem);
  const { units: today } = todaysReview(state, [...new Set(planItems.map((p) => p.unitId))]);
  const due = dueReviews(state).length;
  const byId = new Map(today.map((u) => [u.unit.id, u]));
  const live = planItems.flatMap((p) => {
    const item = byId.get(p.unitId)?.unit.practice.find((i) => i.id === p.itemId);
    return item ? [{ unitId: p.unitId, item }] : [];
  });
  if (run && live.length) {
    const inRun = new Set(live.map((q) => q.unitId));
    const units = today.filter((u) => inRun.has(u.unit.id));
    const answers = units.flatMap((u) =>
      u.attempts.filter((a) => a.mode === "review" && a.exit_run === run.id).map((a) => ({ unitId: u.unit.id, ...a })),
    );
    const p = reviewRunProgress(live.map((q) => ({ ...q, itemId: q.item.id })), answers);
    return {
      runId: run.id,
      staleRunId: null,
      units,
      later: due - units.length,
      planned: live,
      answered: p.answered,
      remaining: p.remaining.map(({ unitId, item }) => ({ unitId, item })),
    };
  }
  // No open run, or a stale one (its units were picked with it in mind): plan from today's due units alone.
  const units = run ? todaysReview(state).units : today;
  const plan = newReviewPlan(units.map((u) => ({ unitId: u.unit.id, pool: u.unit.practice, attempts: u.attempts })));
  return { runId: null, staleRunId: run?.id ?? null, units, later: due - units.length, planned: plan, answered: [], remaining: plan };
}
