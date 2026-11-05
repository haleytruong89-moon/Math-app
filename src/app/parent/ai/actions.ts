"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { findItem, getUnit, listModules } from "@/lib/content";
import { generateChecked } from "@/lib/ai/guard";
import { STUDENT_SYSTEM, studentUser } from "@/lib/ai/prompts";
import { isAiModel } from "@/lib/ai/rules";
import { evalAiOff, runAi, studentPromptVersion } from "@/lib/ai/usage";
import {
  aiSupported, checkStudentReply, contextPack, EVAL_PASS, evalSummary, guardInputs, pickEvalCases, QUESTION_AFTER, QUESTION_BEFORE, STUDENT_AI,
  type AiItem, type AiStage,
} from "@/lib/ai/student";
import type { ActionState } from "@/components/action-form";

// S8b (AI_TUTOR §4 layer 4): the test set — build it from real wrong answers, run it per model, score it — and the
// student switch, which only turns on for a model + prompt version that passed.

const PAGE = "/parent/ai/bo-test";
const RUN_BATCH = 6; // calls per click, so a server action stays well under the time limit

function itemOf(unitId: string, itemId: string): { item: AiItem; unit: { title: string; theory: string[] } } | null {
  const f = getUnit(unitId);
  const it = f && findItem(f.unit, itemId, "practice");
  return f && it && aiSupported(it) ? { item: it, unit: f.unit } : null;
}

/** Real wrong answers first (distinct item × error code); topped up from authored mistakes; a few "before" cases. */
export async function buildEvalCases(): Promise<ActionState> {
  const parent = await requireRole("parent");
  const admin = createAdminClient();
  const [wrong, existing] = await Promise.all([
    admin.from("attempts").select("unit_id, item_id, mode, answer, error_code").eq("correct", false).order("created_at", { ascending: false }).limit(1000),
    admin.from("ai_eval_cases").select("item_id, stage, error_code").eq("archived", false).limit(500),
  ]);
  if (wrong.error || existing.error) return { error: "Chưa đọc được dữ liệu, thử lại sau." };
  const have = new Set((existing.data ?? []).map((c) => `${c.item_id}|${c.stage}|${c.error_code ?? ""}`));
  type NewCase = { unit_id: string; item_id: string; mode: "practice"; stage: AiStage; answer: string | null; error_code: string | null; question: string; created_by: string };
  const out: NewCase[] = [];
  const push = (c: Omit<NewCase, "mode" | "created_by">) => {
    const k = `${c.item_id}|${c.stage}|${c.error_code ?? ""}`;
    if (have.has(k) || out.length >= EVAL_PASS.maxCases) return;
    have.add(k);
    out.push({ ...c, mode: "practice", created_by: parent.id });
  };
  // Practice and review answers only (the help never opens in exit or test-out).
  const real = pickEvalCases(
    ((wrong.data ?? []) as { unit_id: string; item_id: string; mode: string; answer: string; error_code: string | null }[]).filter((r) => (r.mode === "practice" || r.mode === "review") && itemOf(r.unit_id, r.item_id)),
  );
  for (const r of real) push({ unit_id: r.unit_id, item_id: r.item_id, stage: "after", answer: r.answer, error_code: r.error_code, question: QUESTION_AFTER });
  // "Before" cases (no answer yet, the answer must not leak): a few items that have written hints.
  const withHints = [...new Set(real.map((r) => `${r.unit_id}|${r.item_id}`))].slice(0, 6);
  for (const k of withHints) {
    const [unitId, itemId] = k.split("|");
    if (itemOf(unitId, itemId)?.item.hints) push({ unit_id: unitId, item_id: itemId, stage: "before", answer: null, error_code: null, question: QUESTION_BEFORE });
  }
  // Top-up from authored mistakes of approved units until there are enough cases.
  for (const unit of listModules().flatMap((m) => m.unitList)) {
    if (out.length >= EVAL_PASS.minCases + 6) break;
    if (unit.status !== "approved") continue;
    const u = { unit };
    for (const it of unit.practice) {
      if (!aiSupported(it) || out.length >= EVAL_PASS.minCases + 6) continue;
      const m = it.type === "numeric" ? it.mistakes?.[0] : it.type === "mcq" ? Object.entries(it.mistakes ?? {})[0] : undefined;
      if (!m) continue;
      const [answer, code] = Array.isArray(m) ? [m[0], m[1].code] : [m.answer, m.code];
      push({ unit_id: u.unit.id, item_id: it.id, stage: "after", answer, error_code: code, question: QUESTION_AFTER });
      if (it.hints && out.filter((c) => c.stage === "before").length < 8) push({ unit_id: u.unit.id, item_id: it.id, stage: "before", answer: null, error_code: null, question: QUESTION_BEFORE });
    }
  }
  if (!out.length) return { ok: "Không có câu mới để thêm." };
  const { error } = await admin.from("ai_eval_cases").insert(out);
  if (error) {
    console.error("buildEvalCases", error.message);
    return { error: "Chưa lưu được bộ test, thử lại sau." };
  }
  revalidatePath(PAGE);
  return { ok: `Đã thêm ${out.length} tình huống (${real.length} từ lỗi thật của con).` };
}

export async function updateEvalCase(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("parent");
  const v = z.object({ id: z.coerce.number().int().positive(), question: z.string().trim().min(1).max(300), archive: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: "Câu hỏi cần 1–300 ký tự." };
  const { error } = await createAdminClient().from("ai_eval_cases").update({ question: v.data.question, archived: v.data.archive === "on" }).eq("id", v.data.id);
  if (error) return { error: "Chưa lưu được." };
  revalidatePath(PAGE);
  return { ok: v.data.archive === "on" ? "Đã bỏ tình huống." : "Đã lưu." };
}

/** Runs up to RUN_BATCH cases still without a result for this model and the current prompt version. */
export async function runEval(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("parent");
  const model = fd.get("model");
  if (!isAiModel(model)) return { error: "Chọn model." };
  const off = await evalAiOff();
  if (off) return { error: off === "no-key" ? "Chưa có khoá API trên máy chủ." : "Đã chạm hạn mức tháng." };
  const admin = createAdminClient();
  const version = studentPromptVersion();
  const [cases, done] = await Promise.all([
    admin.from("ai_eval_cases").select("id, unit_id, item_id, stage, answer, error_code, question").eq("archived", false).order("id", { ascending: true }).limit(200),
    admin.from("ai_eval_results").select("case_id").eq("model", model).eq("prompt_version", version).limit(500),
  ]);
  if (cases.error || done.error) return { error: "Chưa đọc được bộ test." };
  const doneIds = new Set((done.data ?? []).map((r) => r.case_id as number));
  const todo = (cases.data ?? []).filter((c) => !doneIds.has(c.id as number)).slice(0, RUN_BATCH);
  if (!todo.length) return { ok: "Mọi tình huống đã có kết quả cho model và bản lệnh này." };
  const rows = await Promise.all(
    todo.map(async (c) => {
      const found = itemOf(c.unit_id as string, c.item_id as string);
      if (!found) return { case_id: c.id, model, prompt_version: version, output: "(câu không còn trong nội dung)", guard: { ok: false, reasons: ["missing"] } };
      const stage = c.stage as AiStage;
      const pack = contextPack(found.item, found.unit, { stage, answer: c.answer as string | null, errorCode: c.error_code as string | null, thread: [] });
      const gin = guardInputs(found.item, pack, c.question as string, stage);
      let raw = "";
      const res = await generateChecked(
        async () => {
          const r = await runAi("eval", null, { model, system: STUDENT_SYSTEM, user: studentUser(pack, c.question as string), maxTokens: STUDENT_AI.maxTokens });
          if (r) raw = r.text;
          return r;
        },
        (t) => checkStudentReply(t, gin),
      );
      const output = res.status === "ok" ? res.value.reply : raw || "(không có trả lời)";
      return { case_id: c.id, model, prompt_version: version, output: output.slice(0, 2000), guard: res.status === "ok" ? { ok: true, offTopic: res.value.offTopic } : { ok: false, reasons: res.status === "failed" ? res.reasons : ["off"] } };
    }),
  );
  const { error } = await admin.from("ai_eval_results").upsert(rows, { onConflict: "case_id,model,prompt_version" });
  if (error) {
    console.error("runEval", error.message);
    return { error: "Chưa lưu được kết quả." };
  }
  revalidatePath(PAGE);
  const left = (cases.data ?? []).length - doneIds.size - todo.length;
  return { ok: left > 0 ? `Đã chạy ${todo.length} tình huống, còn ${left} — bấm chạy tiếp.` : `Đã chạy xong ${todo.length} tình huống cuối.` };
}

export async function scoreEval(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const id = z.coerce.number().int().positive().safeParse(fd.get("id"));
  const scores = [0, 1, 2, 3, 4, 5].map((i) => Number(fd.get(`s${i}`)));
  if (!id.success || scores.some((x) => !Number.isInteger(x) || x < 0 || x > 2)) return { error: "Chấm đủ 6 tiêu chí (0–2)." };
  const { error } = await createAdminClient()
    .from("ai_eval_results")
    .update({ scores, math_wrong: fd.get("mathWrong") === "on", scored_by: parent.id, scored_at: new Date().toISOString() })
    .eq("id", id.data);
  if (error) return { error: "Chưa lưu được." };
  revalidatePath(PAGE);
  return { ok: "Đã chấm." };
}

/** Pass status of a model for the current student prompt version (not-archived cases only). */
export async function evalStatus(model: string) {
  const admin = createAdminClient();
  const version = studentPromptVersion();
  const [cases, results] = await Promise.all([
    admin.from("ai_eval_cases").select("id").eq("archived", false).limit(500),
    admin.from("ai_eval_results").select("case_id, scores, math_wrong").eq("model", model).eq("prompt_version", version).limit(500),
  ]);
  const live = new Set((cases.data ?? []).map((c) => c.id as number));
  return evalSummary(((results.data ?? []) as { case_id: number; scores: number[] | null; math_wrong: boolean | null }[]).filter((r) => live.has(r.case_id)));
}

/** The student's switch: on only for a model + prompt version that passed the test set. */
export async function saveStudentAi(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const model = fd.get("studentModel");
  if (!isAiModel(model)) return { error: "Chọn một model trong danh sách." };
  const on = fd.get("studentEnabled") === "on";
  if (on && !(await evalStatus(model)).passed) return { error: "Model này chưa đạt bộ test với bản lệnh hiện tại — chấm bộ test trước." };
  const { error } = await createAdminClient()
    .from("ai_settings")
    .update({ student_enabled: on, student_model: model, student_prompt_version: on ? studentPromptVersion() : null, updated_by: parent.id, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    console.error("saveStudentAi", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent/ai");
  return { ok: on ? "Đã bật Hỏi thêm cho con." : "Đã tắt Hỏi thêm cho con." };
}
