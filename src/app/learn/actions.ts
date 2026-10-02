"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fadedItems, findItem, getUnit } from "@/lib/content";
import { gradeItem } from "@/lib/content/grade";
import { texToHtml } from "@/lib/content/tex";
import type { CheckResult, ExitResult } from "@/lib/content/public";

// Grading always happens here, never in the browser. A student's answers are recorded;
// a parent previewing content (D16) gets the same grading but nothing is written.

type Learner = { kind: "preview" } | { kind: "student"; studentId: string };

const UnitId = z.string().regex(/^[a-z0-9-]+$/).max(60);
const Answer = z.string().max(200);
const Duration = z.number().int().min(0).max(3_600_000).optional();

async function learner(): Promise<Learner | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "parent") return { kind: "preview" };
  if (user.role !== "student") return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, consent_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!data?.consent_at) return null; // D18: nothing is recorded before consent
  return { kind: "student", studentId: data.id };
}

/** Students only ever reach approved units; the parent can preview drafts. */
function loadUnit(who: Learner, unitId: string) {
  const found = getUnit(unitId);
  if (!found) return null;
  if (who.kind === "student" && found.unit.status !== "approved") return null;
  return found;
}

async function progress(studentId: string, unitId: string) {
  const { data } = await createAdminClient()
    .from("unit_progress")
    .select("worked_viewed_at, faded_done_at")
    .eq("student_id", studentId)
    .eq("unit_id", unitId)
    .maybeSingle();
  return data;
}

const DENIED = { ok: false as const, message: "Không mở được bài này." };
const SAVE_FAILED = { ok: false as const, message: "Chưa lưu được câu trả lời. Kiểm tra mạng rồi thử lại." };

// ---------------------------------------------------------------------

export async function markWorkedViewed(unitIdRaw: string): Promise<{ ok: boolean; message?: string }> {
  const who = await learner();
  const unitId = UnitId.safeParse(unitIdRaw);
  if (!who || !unitId.success || !loadUnit(who, unitId.data)) return DENIED;
  if (who.kind === "preview") return { ok: true };

  const { error } = await createAdminClient()
    .from("unit_progress")
    .upsert(
      { student_id: who.studentId, unit_id: unitId.data, worked_viewed_at: new Date().toISOString() },
      { onConflict: "student_id,unit_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("markWorkedViewed", error.message);
    return SAVE_FAILED;
  }
  revalidatePath("/student");
  return { ok: true };
}

// ---------------------------------------------------------------------

const CheckInput = z.object({
  unitId: UnitId,
  itemId: UnitId,
  mode: z.enum(["faded", "practice"]),
  answer: Answer,
  durationMs: Duration,
  /** Faded steps: after two wrong tries the client may ask to see the solution. */
  reveal: z.boolean().optional(),
});

export async function checkAnswer(input: z.input<typeof CheckInput>): Promise<CheckResult> {
  const who = await learner();
  const parsed = CheckInput.safeParse(input);
  if (!who || !parsed.success) return DENIED;
  const v = parsed.data;
  const found = loadUnit(who, v.unitId);
  if (!found) return DENIED;
  const item = findItem(found.unit, v.itemId, v.mode);
  if (!item) return DENIED;

  if (who.kind === "student") {
    // §2.7: no self-solving before the worked example has been viewed in full.
    const p = await progress(who.studentId, v.unitId);
    if (!p?.worked_viewed_at) return { ok: false, message: "Con cần xem hết lời giải mẫu trước." };
    if (v.mode === "practice" && !p.faded_done_at) return { ok: false, message: "Con cần làm xong phần điền bước trước." };
  }

  const g = gradeItem(item, v.answer);
  if (!g.understood) return { ok: true, understood: false };

  if (who.kind === "student") {
    const { error } = await createAdminClient().from("attempts").insert({
      student_id: who.studentId,
      unit_id: v.unitId,
      item_id: v.itemId,
      mode: v.mode,
      answer: v.answer.trim(),
      correct: g.correct,
      error_code: g.errorCode ?? null,
      duration_ms: v.durationMs ?? null,
    });
    if (error) {
      console.error("checkAnswer insert", error.message);
      return SAVE_FAILED;
    }
  }

  // Practice: one graded try per item, so the solution is always shown.
  // Faded steps: retry allowed; the solution only when correct or explicitly revealed.
  const showSolution = v.mode === "practice" || g.correct || v.reveal === true;
  return {
    ok: true,
    understood: true,
    correct: g.correct,
    feedbackHtml: g.feedback ? texToHtml(g.feedback) : undefined,
    solutionHtml: showSolution ? texToHtml(item.solution) : undefined,
  };
}

// ---------------------------------------------------------------------

export async function completeFaded(unitIdRaw: string): Promise<{ ok: boolean; message?: string }> {
  const who = await learner();
  const unitId = UnitId.safeParse(unitIdRaw);
  if (!who || !unitId.success) return DENIED;
  const found = loadUnit(who, unitId.data);
  if (!found) return DENIED;
  if (who.kind === "preview") return { ok: true };

  const admin = createAdminClient();
  const ids = fadedItems(found.unit).map((i) => i.id);
  const { data: done } = await admin
    .from("attempts")
    .select("item_id")
    .eq("student_id", who.studentId)
    .eq("unit_id", unitId.data)
    .eq("mode", "faded")
    .eq("correct", true)
    .in("item_id", ids);
  const solved = new Set((done ?? []).map((r) => r.item_id));
  if (!ids.every((id) => solved.has(id))) return { ok: false, message: "Còn chỗ trống chưa điền đúng." };

  const { error } = await admin
    .from("unit_progress")
    .update({ faded_done_at: new Date().toISOString() })
    .eq("student_id", who.studentId)
    .eq("unit_id", unitId.data)
    .is("faded_done_at", null);
  if (error) {
    console.error("completeFaded", error.message);
    return SAVE_FAILED;
  }
  return { ok: true };
}

// ---------------------------------------------------------------------

const ExitInput = z.object({
  unitId: UnitId,
  answers: z.record(UnitId, Answer),
  durationMs: Duration,
});

export async function submitExit(input: z.input<typeof ExitInput>): Promise<ExitResult> {
  const who = await learner();
  const parsed = ExitInput.safeParse(input);
  if (!who || !parsed.success) return DENIED;
  const v = parsed.data;
  const found = loadUnit(who, v.unitId);
  if (!found) return DENIED;

  if (who.kind === "student") {
    const p = await progress(who.studentId, v.unitId);
    if (!p?.faded_done_at) return { ok: false, message: "Con cần học xong các phần trước rồi mới làm bài kiểm tra." };
  }

  // Unanswered or unreadable answers count as wrong in a test.
  const graded = found.unit.exit.map((item) => {
    const answer = (v.answers[item.id] ?? "").trim();
    const g = gradeItem(item, answer);
    return { item, answer, correct: g.understood && g.correct, errorCode: g.errorCode, feedback: g.feedback };
  });

  if (who.kind === "student") {
    const run = randomUUID();
    const { error } = await createAdminClient()
      .from("attempts")
      .insert(
        graded.map((r) => ({
          student_id: who.studentId,
          unit_id: v.unitId,
          item_id: r.item.id,
          mode: "exit" as const,
          answer: r.answer,
          correct: r.correct,
          error_code: r.errorCode ?? null,
          duration_ms: v.durationMs ?? null,
          exit_run: run,
        })),
      );
    if (error) {
      console.error("submitExit insert", error.message);
      return SAVE_FAILED;
    }
    revalidatePath("/student");
  }

  return {
    ok: true,
    score: graded.filter((r) => r.correct).length,
    total: graded.length,
    items: graded.map((r) => ({
      id: r.item.id,
      correct: r.correct,
      answer: r.answer,
      feedbackHtml: r.feedback ? texToHtml(r.feedback) : undefined,
      solutionHtml: texToHtml(r.item.solution),
    })),
  };
}
