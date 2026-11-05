import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { vnDate } from "@/lib/learning/rules";
import { callClaude, hasAiKey } from "./client";
import type { AiRequest } from "./messages";
import { budget, costMicros, isAiModel, monthKey, type AiModel } from "./rules";
import { promptVersion, STUDENT_SYSTEM } from "./prompts";

export type AiKind = "weekly" | "brief" | "student" | "eval";
export type AiOff = "no-key" | "disabled" | "budget";
export type StudentAiOff = AiOff | "version";

/** S8b: the version of the student prompt the test set is run against. */
export const studentPromptVersion = () => promptVersion(STUDENT_SYSTEM);
export type AiSettings = {
  staffEnabled: boolean;
  staffModel: AiModel;
  studentEnabled: boolean;
  studentModel: AiModel;
  studentPromptVersion: string | null;
};

/** The settings row; if it can't be read, AI counts as off (safe side). */
export async function aiSettings(): Promise<AiSettings> {
  const { data, error } = await createAdminClient()
    .from("ai_settings")
    .select("staff_enabled, staff_model, student_enabled, student_model, student_prompt_version")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("aiSettings", error.message);
    return { staffEnabled: false, staffModel: "claude-haiku-5-5", studentEnabled: false, studentModel: "claude-haiku-5-5", studentPromptVersion: null };
  }
  return {
    staffEnabled: !!data.staff_enabled,
    staffModel: isAiModel(data.staff_model) ? data.staff_model : "claude-haiku-5-5",
    studentEnabled: !!data.student_enabled,
    studentModel: isAiModel(data.student_model) ? data.student_model : "claude-haiku-5-5",
    studentPromptVersion: (data.student_prompt_version as string | null) ?? null,
  };
}

/** Every call of a month (paged: the API returns at most 1000 rows per request). */
export async function monthSpendRows(month: string): Promise<{ kind: string; cost_micros: number }[]> {
  const admin = createAdminClient();
  const out: { kind: string; cost_micros: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from("ai_usage").select("kind, cost_micros").eq("month", month).order("id", { ascending: true }).range(from, from + 999);
    if (error) {
      console.error("monthSpendRows", error.message);
      // A spend we can't read must not let AI run past the cap.
      return [{ kind: "unknown", cost_micros: Number.MAX_SAFE_INTEGER }];
    }
    out.push(...((data ?? []) as { kind: string; cost_micros: number }[]));
    if (!data || data.length < 1000) return out;
  }
}

/** Why the adults' AI (weekly report, tutor brief) can't run now; null when it can. */
export async function staffAiOff(settings: AiSettings): Promise<AiOff | null> {
  if (!hasAiKey()) return "no-key";
  if (!settings.staffEnabled) return "disabled";
  const rows = await monthSpendRows(monthKey(vnDate()));
  return budget(rows.reduce((s, r) => s + r.cost_micros, 0)).paused ? "budget" : null;
}

/** S8b: why the student's AI can't run now (no key, switch off, prompt changed since the test set passed, cap). */
export async function studentAiOff(settings: AiSettings): Promise<StudentAiOff | null> {
  if (!hasAiKey()) return "no-key";
  if (!settings.studentEnabled) return "disabled";
  if (settings.studentPromptVersion !== studentPromptVersion()) return "version";
  const rows = await monthSpendRows(monthKey(vnDate()));
  return budget(rows.reduce((s, r) => s + r.cost_micros, 0)).paused ? "budget" : null;
}

/** The test set runs whenever there is a key and budget, even with the switch off. */
export async function evalAiOff(): Promise<"no-key" | "budget" | null> {
  if (!hasAiKey()) return "no-key";
  const rows = await monthSpendRows(monthKey(vnDate()));
  return budget(rows.reduce((s, r) => s + r.cost_micros, 0)).paused ? "budget" : null;
}

/** Call + record the spend. The caller has checked the gate. null when the call failed. */
export async function runAi(kind: AiKind, studentId: string | null, req: AiRequest): Promise<{ text: string; model: AiModel } | null> {
  const r = await callClaude(req);
  if (!r) return null;
  const { error } = await createAdminClient().from("ai_usage").insert({
    kind,
    student_id: studentId,
    model: req.model,
    input_tokens: r.inputTokens,
    output_tokens: r.outputTokens,
    cost_micros: costMicros(req.model, r.inputTokens, r.outputTokens),
    month: monthKey(vnDate()),
  });
  if (error) console.error("ai_usage insert", error.message);
  return { text: r.text, model: req.model };
}
