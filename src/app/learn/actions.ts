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
import type { CheckResult, ExitResult, ReviewSummary } from "@/lib/content/public";
import { afterReview, exitReachesM3, firstReview, lastExitRun, practiceFirstTries, reviewPassed, systemMastery, vnDate, RULES, type AttemptRow, type Rating, type Stage } from "@/lib/learning/rules";
import { answerHtml, correctHtml } from "@/lib/learning/work";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";

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

/** Mastery of one unit right after a practice answer (feeds the student's level nudge). */
async function practiceMastery(studentId: string, unitId: string) {
  const admin = createAdminClient();
  const [rows, p, q, c] = await Promise.all([
    admin.from("attempts").select("item_id, mode, correct, error_code, exit_run, created_at").eq("student_id", studentId).eq("unit_id", unitId).order("created_at", { ascending: true }),
    progress(studentId, unitId),
    admin.from("review_queue").select("completed_at").eq("student_id", studentId).eq("unit_id", unitId).maybeSingle(),
    admin.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", studentId).eq("unit_id", unitId),
  ]);
  if (rows.error || q.error) return undefined; // no nudge rather than a wrong one
  const attempts = (rows.data ?? []) as AttemptRow[];
  const m = systemMastery({ workedViewed: !!p?.worked_viewed_at, attempts, reviewsCompleted: !!q.data?.completed_at });
  const recent = practiceFirstTries(attempts).slice(-RULES.practiceWindow);
  const conf = latestByUnit((c.data ?? []) as ConfirmationRow[]).get(unitId);
  const confirmed = displayLevel(m.level, conf, { attempts, workedViewed: !!p?.worked_viewed_at, reviewsCompleted: !!q.data?.completed_at }).confirmed;
  return { level: m.level, practiceCount: recent.length, practiceRight: recent.filter((a) => a.correct).length, confirmed };
}
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
    answerHtml: answerHtml(item, v.answer),
    correctHtml: showSolution ? correctHtml(item) : undefined,
    errorCode: g.correct ? null : (g.errorCode ?? null),
    mastery: who.kind === "student" && v.mode === "practice" ? await practiceMastery(who.studentId, v.unitId) : undefined,
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

  let nextReviewOn: string | undefined;
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
    // Reaching M3 the first time starts the D+1/D+7/D+21 review cycle (D14).
    const exitScore = lastExitRun(graded.map((r) => ({ item_id: r.item.id, mode: "exit", correct: r.correct, error_code: r.errorCode ?? null, exit_run: run, created_at: new Date().toISOString() })));
    if (exitScore && exitReachesM3(exitScore)) {
      const first = firstReview(vnDate());
      const { data: inserted, error: qErr } = await createAdminClient()
        .from("review_queue")
        .upsert(
          { student_id: who.studentId, unit_id: v.unitId, stage: first.stage, due_on: first.dueOn },
          { onConflict: "student_id,unit_id", ignoreDuplicates: true },
        )
        .select("due_on");
      if (qErr) console.error("submitExit queue", qErr.message);
      else if (inserted?.length) nextReviewOn = first.dueOn;
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
    nextReviewOn,
  };
}

// ---------------------------------------------------------------------
// Mixed review (D14). The run id comes from the review page; answers are
// grouped by it so each review is scored once.

async function dueQueueRow(studentId: string, unitId: string) {
  const { data } = await createAdminClient()
    .from("review_queue")
    .select("stage, due_on, completed_at")
    .eq("student_id", studentId)
    .eq("unit_id", unitId)
    .maybeSingle();
  if (!data?.due_on || data.due_on > vnDate()) return null; // maintenance (stage 4) is due like any other review
  return data as { stage: Stage; due_on: string; completed_at: string | null };
}

const ReviewCheck = z.object({ runId: z.uuid(), unitId: UnitId, itemId: UnitId, answer: Answer, durationMs: Duration });

export async function checkReview(input: z.input<typeof ReviewCheck>): Promise<CheckResult> {
  const who = await learner();
  const parsed = ReviewCheck.safeParse(input);
  if (!who || who.kind !== "student" || !parsed.success) return DENIED;
  const v = parsed.data;
  const found = loadUnit(who, v.unitId);
  const item = found && findItem(found.unit, v.itemId, "review");
  if (!item || !(await dueQueueRow(who.studentId, v.unitId))) return { ok: false, message: "Bài này chưa đến hạn ôn." };

  const g = gradeItem(item, v.answer);
  if (!g.understood) return { ok: true, understood: false };
  const { error } = await createAdminClient().from("attempts").insert({
    student_id: who.studentId,
    unit_id: v.unitId,
    item_id: v.itemId,
    mode: "review",
    answer: v.answer.trim(),
    correct: g.correct,
    error_code: g.errorCode ?? null,
    duration_ms: v.durationMs ?? null,
    exit_run: v.runId,
  });
  if (error) {
    console.error("checkReview insert", error.message);
    return SAVE_FAILED;
  }
  return {
    ok: true,
    understood: true,
    correct: g.correct,
    feedbackHtml: g.feedback ? texToHtml(g.feedback) : undefined,
    solutionHtml: texToHtml(item.solution),
    answerHtml: answerHtml(item, v.answer),
    correctHtml: correctHtml(item),
    errorCode: g.correct ? null : (g.errorCode ?? null),
  };
}

const ReviewFinish = z.object({ runId: z.uuid(), ratings: z.record(UnitId, z.enum(["easy", "normal"])) });

export async function finishReview(input: z.input<typeof ReviewFinish>): Promise<ReviewSummary> {
  const who = await learner();
  const parsed = ReviewFinish.safeParse(input);
  if (!who || who.kind !== "student" || !parsed.success) return DENIED;
  const { runId, ratings } = parsed.data;
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("attempts")
    .select("unit_id, item_id, correct, created_at")
    .eq("student_id", who.studentId)
    .eq("mode", "review")
    .eq("exit_run", runId)
    .order("created_at", { ascending: true });
  if (error || !rows?.length) return { ok: false, message: "Không tìm thấy câu trả lời của lượt ôn này." };

  // Score = first answer to each question of the run, per unit.
  const first = new Map<string, { unit: string; correct: boolean }>();
  for (const r of rows) if (!first.has(r.item_id)) first.set(r.item_id, { unit: r.unit_id, correct: r.correct });
  const perUnit = new Map<string, { correct: number; total: number }>();
  for (const { unit, correct } of first.values()) {
    const u = perUnit.get(unit) ?? { correct: 0, total: 0 };
    u.total += 1;
    if (correct) u.correct += 1;
    perUnit.set(unit, u);
  }

  const today = vnDate();
  const units: Extract<ReviewSummary, { ok: true }>["units"] = [];
  for (const [unitId, score] of perUnit) {
    const due = await dueQueueRow(who.studentId, unitId);
    if (!due) continue; // already scored (double submit) or not due
    const passed = reviewPassed(score.correct, score.total);
    const rating: Rating = ratings[unitId] ?? "normal";
    const next = afterReview(due.stage, passed, rating, today);

    const { error: logErr } = await admin.from("review_log").insert({
      student_id: who.studentId,
      unit_id: unitId,
      run_id: runId,
      stage: due.stage,
      correct: score.correct,
      total: score.total,
      passed,
      rating: passed ? rating : null,
      due_on: due.due_on,
      next_due_on: next.dueOn,
    });
    if (logErr) {
      console.error("finishReview log", logErr.message);
      continue; // unique (run_id, unit_id): this unit was already scored
    }
    const { error: qErr } = await admin
      .from("review_queue")
      .update({
        stage: next.stage,
        due_on: next.dueOn,
        // Keep the date M4 was first reached; a failed review clears it.
        completed_at: next.completed ? (due.completed_at ?? new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("student_id", who.studentId)
      .eq("unit_id", unitId);
    if (qErr) console.error("finishReview queue", qErr.message);
    units.push({ unitId, ...score, passed, nextDueOn: next.dueOn, completed: next.completed });
  }

  // No revalidatePath here: it would re-render /student/review (now with nothing due)
  // and wipe the summary the student is looking at. /student is dynamic anyway.
  return { ok: true, units };
}
