import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listModules } from "@/lib/content";
import type { Unit } from "@/lib/content/schema";
import { studyDaysThisWeek, systemMastery, vnDate, type AttemptRow, type Mastery, type Stage } from "./rules";

export type UnitState = {
  unit: Unit;
  moduleTitle: string;
  workedViewed: boolean;
  fadedDone: boolean;
  mastery: Mastery;
  review: { stage: Stage; dueOn: string | null; completed: boolean } | null;
  attempts: AttemptRow[];
};

export type StudentState = {
  today: string;
  units: UnitState[]; // approved units (or all units with includeDrafts), in course order
  studyDays: number;
};

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
  const [progress, attempts, queue] = await Promise.all([
    supabase.from("unit_progress").select("unit_id, worked_viewed_at, faded_done_at").eq("student_id", studentId),
    supabase
      .from("attempts")
      .select("unit_id, item_id, mode, correct, error_code, exit_run, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase.from("review_queue").select("unit_id, stage, due_on, completed_at").eq("student_id", studentId),
  ]);
  for (const r of [progress, attempts, queue]) if (r.error) console.error("loadStudentState", r.error.message);

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
        return {
          unit,
          moduleTitle: m.title,
          workedViewed: !!p?.worked_viewed_at,
          fadedDone: !!p?.faded_done_at,
          mastery: systemMastery({ workedViewed: !!p?.worked_viewed_at, attempts: rows, reviewsCompleted: !!review?.completed }),
          review,
          attempts: rows,
        };
      }),
  );

  const today = vnDate();
  return { today, units, studyDays: studyDaysThisWeek((attempts.data ?? []) as AttemptRow[], today) };
}

export function dueReviews(state: StudentState): UnitState[] {
  return state.units.filter((u) => u.review?.dueOn && u.review.dueOn <= state.today);
}
