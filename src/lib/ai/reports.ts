import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculum } from "@/lib/content";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { vnDate } from "@/lib/learning/rules";
import { loadStudentState } from "@/lib/learning/state";
import { briefFacts, briefSince, checkBrief, type BriefFacts, type BriefPoint } from "./brief";
import { generateChecked, type Check, type Generated } from "./guard";
import { BRIEF_SYSTEM, WEEKLY_SYSTEM, briefUser, weeklyUser } from "./prompts";
import { aiSettings, runAi, staffAiOff } from "./usage";
import { checkWeeklyComment, weeklyFacts, type WeeklyFacts } from "./weekly";

type Status = "ok" | "failed" | "off" | "none";

/** The gate (key, switch, cap), then ask → check → ask once more (spec §2). */
async function staffGenerate<T>(kind: "weekly" | "brief", studentId: string, system: string, user: string, maxTokens: number, check: (t: string) => Check<T>): Promise<Generated<T>> {
  const settings = await aiSettings();
  if (await staffAiOff(settings)) return { status: "off" };
  return generateChecked(() => runAi(kind, studentId, { model: settings.staffModel, system, user, maxTokens }), check);
}

function logFailed(what: string, g: Generated<unknown>) {
  if (g.status === "failed") console.error(`${what}: AI text rejected —`, g.reasons.join(" | "));
}

/** S8a: the previous week's report for one student, made from the database; AI adds a checked comment. Overwrites. */
export async function buildWeeklyReport(studentId: string, today: string = vnDate()): Promise<{ ok: true; period: string } | { ok: false }> {
  const admin = createAdminClient();
  const [state, conf, sessions, reviewLog, homework] = await Promise.all([
    loadStudentState(admin, studentId),
    admin.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", studentId).limit(500),
    admin.from("teaching_sessions").select("taught_on").eq("student_id", studentId).order("taught_on", { ascending: false }).limit(200),
    admin.from("review_log").select("created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(300),
    admin.from("homework").select("created_at, done_at, reviewed_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(200),
  ]);
  for (const r of [conf, sessions, reviewLog, homework])
    if (r.error) {
      console.error("buildWeeklyReport", r.error.message);
      return { ok: false };
    }
  const confs = latestByUnit((conf.data ?? []) as ConfirmationRow[]);
  const facts: WeeklyFacts = weeklyFacts({
    today,
    curriculum: curriculum(),
    units: state.units.map((u) => ({
      id: u.unit.id,
      title: u.unit.title,
      history: u.history,
      shown: displayLevel(u.mastery.level, confs.get(u.unit.id), u.history).level,
      reviewDueOn: u.review?.dueOn ?? null,
    })),
    reviewLog: (reviewLog.data ?? []) as { created_at: string }[],
    sessions: (sessions.data ?? []) as { taught_on: string }[],
    homework: (homework.data ?? []) as { created_at: string; done_at: string | null; reviewed_at: string | null }[],
  });
  const g = await staffGenerate<string>("weekly", studentId, WEEKLY_SYSTEM, weeklyUser(facts), 500, (t) => checkWeeklyComment(t, facts));
  logFailed("weekly", g);
  const { error } = await admin.from("ai_reports").upsert(
    {
      kind: "weekly",
      student_id: studentId,
      tutor_id: null,
      period: facts.from,
      facts,
      ai: g.status === "ok" ? { text: g.value } : null,
      comment_status: g.status as Status,
      model: g.status === "ok" ? g.model : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "kind,student_id,period" },
  );
  if (error) {
    console.error("buildWeeklyReport upsert", error.message);
    return { ok: false };
  }
  return { ok: true, period: facts.from };
}

/** S8a: a brief for this tutor from her last session up to today. AI is asked only when there are wrong answers. */
export async function buildBrief(tutorId: string, studentId: string, today: string = vnDate()): Promise<{ ok: true; period: string } | { ok: false }> {
  const admin = createAdminClient();
  const [state, last, hw] = await Promise.all([
    loadStudentState(admin, studentId, { includeDrafts: true }),
    admin.from("teaching_sessions").select("taught_on").eq("student_id", studentId).eq("tutor_id", tutorId).order("taught_on", { ascending: false }).limit(1),
    admin.from("homework").select("done_at, reviewed_at").eq("student_id", studentId).eq("tutor_id", tutorId).order("created_at", { ascending: false }).limit(200),
  ]);
  if (last.error || hw.error) {
    console.error("buildBrief", (last.error ?? hw.error)!.message);
    return { ok: false };
  }
  const since = briefSince((last.data?.[0]?.taught_on as string | undefined) ?? null, today);
  const facts: BriefFacts = briefFacts({
    since,
    today,
    units: state.units.map((u) => ({ id: u.unit.id, title: u.unit.title, level: u.mastery.level, attempts: u.attempts })),
    homework: (hw.data ?? []) as { done_at: string | null; reviewed_at: string | null }[],
  });
  const g: Generated<BriefPoint[]> | { status: "none" } = facts.units.some((u) => u.wrong > 0)
    ? await staffGenerate<BriefPoint[]>("brief", studentId, BRIEF_SYSTEM, briefUser(facts), 600, (t) => checkBrief(t, facts))
    : { status: "none" };
  if (g.status !== "none") logFailed("brief", g);
  const period = `${tutorId}/${since}/${today}`;
  const { error } = await admin.from("ai_reports").upsert(
    {
      kind: "brief",
      student_id: studentId,
      tutor_id: tutorId,
      period,
      facts,
      ai: g.status === "ok" ? { points: g.value } : null,
      comment_status: g.status as Status,
      model: g.status === "ok" ? g.model : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "kind,student_id,period" },
  );
  if (error) {
    console.error("buildBrief upsert", error.message);
    return { ok: false };
  }
  return { ok: true, period };
}
