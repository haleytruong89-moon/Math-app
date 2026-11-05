"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findItem, isDrillId } from "@/lib/content";
import { studentUnit } from "@/lib/content/approvals";
import { texToHtml } from "@/lib/content/tex";
import { vnDate } from "@/lib/learning/rules";
import { generateChecked } from "@/lib/ai/guard";
import { STUDENT_SYSTEM, studentUser } from "@/lib/ai/prompts";
import { aiSettings, runAi, studentAiOff, type StudentAiOff } from "@/lib/ai/usage";
import {
  aiStage, aiSupported, checkStudentReply, contextPack, fallbackFor, guardInputs, limitReached, OFF_TOPIC_REPLY, STUDENT_AI, type Turn,
} from "@/lib/ai/student";

// S8b (01/11/2026): "Hỏi thêm" for the student. Everything is decided here, never in the browser: whether AI is on,
// the stage (before / after answering), the limits, the guard and the fallback. AI_TUTOR §3–§4.

export type AiMessageView = { id: number; role: "student" | "ai" | "fallback"; html: string; flagged: boolean; note?: string };
export type AskResult =
  | { ok: true; thread: string; messages: AiMessageView[]; left: { item: number; day: number } }
  | { ok: false; message: string; off?: StudentAiOff | "limit" };

const OFF_MESSAGE: Record<StudentAiOff, string> = {
  "no-key": "Hỏi thêm chưa bật. Con dùng gợi ý viết sẵn nhé.",
  disabled: "Hỏi thêm chưa bật. Con dùng gợi ý viết sẵn nhé.",
  version: "Hỏi thêm đang tạm tắt để bố mẹ kiểm tra lại. Con dùng gợi ý viết sẵn nhé.",
  budget: "Hỏi thêm tạm nghỉ đến tháng sau. Con dùng gợi ý viết sẵn nhé.",
};

const Ask = z.object({
  unitId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  itemId: z.string().regex(/^[a-z0-9-]+$/).max(80),
  mode: z.enum(["practice", "review"]),
  question: z.string().trim().min(1).max(STUDENT_AI.questionMaxChars),
  /** Highest written hint opened (practice, before answering: AI opens after H3). */
  shownHints: z.number().int().min(0).max(3),
  thread: z.uuid().optional(),
});

async function student(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return null;
  const { data } = await (await createClient()).from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  return data?.consent_at ? (data.id as string) : null;
}

const view = (r: { id: number; role: string; content: string; flag: string | null }, note?: string): AiMessageView => ({
  id: r.id,
  role: r.role as AiMessageView["role"],
  html: texToHtml(r.content),
  flagged: r.flag === "student",
  note,
});

export async function askAi(input: z.input<typeof Ask>): Promise<AskResult> {
  const studentId = await student();
  const parsed = Ask.safeParse(input);
  if (!studentId || !parsed.success) return { ok: false, message: "Không hỏi được lúc này." };
  const v = parsed.data;
  if (isDrillId(v.unitId)) return { ok: false, message: "Hỏi thêm chưa dùng cho bài luyện đề." };
  const found = await studentUnit(v.unitId);
  const item = found && findItem(found.unit, v.itemId, "practice");
  if (!found || !item || !aiSupported(item)) return { ok: false, message: "Hỏi thêm chưa dùng cho câu này." };

  const settings = await aiSettings();
  const off = await studentAiOff(settings);
  if (off) return { ok: false, message: OFF_MESSAGE[off], off };

  const admin = createAdminClient();
  const day = vnDate();
  const [last, mine, thread] = await Promise.all([
    admin.from("attempts").select("correct, answer, error_code, created_at").eq("student_id", studentId).eq("item_id", v.itemId).eq("mode", v.mode).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("ai_messages").select("item_id").eq("student_id", studentId).eq("day", day).eq("role", "student").limit(200),
    v.thread
      ? admin.from("ai_messages").select("role, content").eq("student_id", studentId).eq("item_id", v.itemId).eq("thread", v.thread).order("id", { ascending: true }).limit(40)
      : Promise.resolve({ data: [] as { role: string; content: string }[], error: null }),
  ]);
  if (last.error || mine.error || thread.error) return { ok: false, message: "Không hỏi được lúc này. Con thử lại sau nhé." };

  const stage = aiStage(last.data as { correct: boolean; created_at: string } | null, new Date());
  // Review: only after a wrong answer. Practice before answering: only once H3 is open (AI_TUTOR §3).
  if (v.mode === "review" && stage === "before") return { ok: false, message: "Trong phiên ôn, Hỏi thêm mở sau khi con trả lời." };
  if (v.mode === "practice" && stage === "before" && v.shownHints < (item.hints?.length ?? 0)) return { ok: false, message: "Con mở hết gợi ý viết sẵn trước nhé." };

  const asked = (mine.data ?? []) as { item_id: string }[];
  const limit = limitReached(asked.filter((r) => r.item_id === v.itemId).length, asked.length);
  if (limit) return { ok: false, off: "limit", message: limit === "day" ? "Hôm nay con đã hỏi đủ 20 lượt. Mai hỏi tiếp nhé." : "Câu này con đã hỏi đủ 6 lượt. Con xem lời giải hoặc hỏi thầy/cô nhé." };

  const turns = ((thread.data ?? []) as Turn[]).map((t) => ({ role: t.role, content: t.content }));
  const pack = contextPack(item, found.unit, { stage, answer: last.data?.answer as string | undefined, errorCode: last.data?.error_code as string | undefined, thread: turns });
  const gin = guardInputs(item, pack, v.question, stage);
  const res = await generateChecked(
    () => runAi("student", studentId, { model: settings.studentModel, system: STUDENT_SYSTEM, user: studentUser(pack, v.question), maxTokens: STUDENT_AI.maxTokens }),
    (t) => checkStudentReply(t, gin),
  );
  if (res.status === "off") return { ok: false, message: "Hỏi thêm đang bận. Con dùng gợi ý viết sẵn nhé." };

  const threadId = v.thread ?? randomUUID();
  const base = { student_id: studentId, unit_id: v.unitId, item_id: v.itemId, mode: v.mode, thread: threadId, day };
  let reply: { role: "ai" | "fallback"; content: string; guard: unknown; model: string | null; flag: "guard" | null };
  let note: string | undefined;
  if (res.status === "ok") {
    reply = { role: "ai", content: res.value.offTopic ? OFF_TOPIC_REPLY : res.value.reply, guard: { ok: true, offTopic: res.value.offTopic }, model: res.model, flag: null };
  } else {
    const fb = fallbackFor(item, v.shownHints);
    reply = { role: "fallback", content: fb.text, guard: { ok: false, reasons: res.reasons }, model: null, flag: "guard" };
    note = fb.kind === "hint" ? `Gợi ý ${fb.level} (viết sẵn)` : "Lời giải đã duyệt";
  }
  const { data: rows, error } = await admin
    .from("ai_messages")
    .insert([
      // Same keys in both rows (bulk insert takes the columns of the first row).
      { ...base, role: "student", content: v.question, guard: null, model: null, flag: null, flagged_at: null },
      { ...base, role: reply.role, content: reply.content, guard: reply.guard, model: reply.model, flag: reply.flag, flagged_at: reply.flag ? new Date().toISOString() : null },
    ])
    .select("id, role, content, flag");
  if (error || !rows || rows.length !== 2) {
    console.error("askAi insert", error?.message);
    return { ok: false, message: "Không lưu được câu hỏi. Con thử lại nhé." };
  }
  const ordered = [...rows].sort((a, b) => (a.id as number) - (b.id as number)) as { id: number; role: string; content: string; flag: string | null }[];
  return {
    ok: true,
    thread: threadId,
    messages: [view(ordered[0]), { ...view(ordered[1], note), flagged: false }],
    left: { item: STUDENT_AI.turnsPerItem - (asked.filter((r) => r.item_id === v.itemId).length + 1), day: STUDENT_AI.turnsPerDay - (asked.length + 1) },
  };
}

/** "AI nói sai?" — the student flags an AI (or fallback) message; adults see it on Tổng quan and the AI page. */
export async function flagAiMessage(id: number): Promise<{ ok: boolean }> {
  const studentId = await student();
  if (!studentId || !Number.isInteger(id) || id <= 0) return { ok: false };
  const { error } = await createAdminClient()
    .from("ai_messages")
    .update({ flag: "student", flagged_at: new Date().toISOString() })
    .eq("id", id)
    .eq("student_id", studentId)
    .in("role", ["ai", "fallback"]);
  if (error) console.error("flagAiMessage", error.message);
  return { ok: !error };
}
