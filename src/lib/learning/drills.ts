import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { drills } from "@/lib/content";
import { studentUnit } from "@/lib/content/approvals";
import type { DrillProblem } from "@/lib/content/drill";
import { drillPlan, type DrillAttempt, type DrillState } from "./drill-plan";
import { displayLevel, latestByUnit, type ConfirmationRow } from "./overview";
import { loadStudentState } from "./state";
import type { Level } from "./rules";

export type DrillRow = { problem: DrillProblem; state: DrillState };

/**
 * Luyện đề 4.2: the problems this student may see (approved, none of their items marked "Cần sửa") with their state.
 * Levels are the ones shown to the parent (a confirmed level counts), priorities are the tutor's ★.
 */
export async function studentDrills(supabase: SupabaseClient, studentId: string): Promise<DrillRow[]> {
  const visible = (await Promise.all(drills().map(async (p) => ((await studentUnit(p.id)) ? p : null)))).filter((p): p is DrillProblem => !!p);
  if (!visible.length) return [];
  const [state, conf, atts] = await Promise.all([
    loadStudentState(supabase, studentId),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", studentId).limit(500),
    supabase.from("attempts").select("unit_id, item_id, correct, created_at").eq("student_id", studentId).in("unit_id", visible.map((p) => p.id)).limit(1000),
  ]);
  if (atts.error) console.error("studentDrills", atts.error.message);
  const confs = latestByUnit((conf.data ?? []) as ConfirmationRow[]);
  const levels = new Map<string, Level>(state.units.map((u) => [u.unit.id, displayLevel(u.mastery.level, confs.get(u.unit.id), u.history).level as Level]));
  const byDrill = new Map<string, DrillAttempt[]>();
  for (const a of (atts.data ?? []) as (DrillAttempt & { unit_id: string })[]) byDrill.set(a.unit_id, [...(byDrill.get(a.unit_id) ?? []), a]);
  const plan = drillPlan(
    visible.map((p) => ({ id: p.id, order: p.order, needs: p.needs, itemIds: p.items.map((i) => i.id) })),
    { levels, priorities: new Set(state.priorities), attempts: byDrill, today: state.today },
  );
  const byId = new Map(visible.map((p) => [p.id, p]));
  return plan.map((s) => ({ problem: byId.get(s.id)!, state: s }));
}
