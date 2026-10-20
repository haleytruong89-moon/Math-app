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
import { rightUnaided, afterReview, exitReachesM3, firstReview, lastExitRun, practiceFirstTries, reviewPassed, runItemKey, systemMastery, vnDate, RULES, type AttemptRow, type Rating, type Stage } from "@/lib/learning/rules";
import { answerHtml, correctHtml } from "@/lib/learning/work";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { exitHistory, findOpenRun, loadStudentState, reviewSession } from "@/lib/learning/state";
import { masteryHistory } from "@/lib/learning/sequence";
import { exitDrawFor } from "@/lib/learning/exit-draw";

/** S6a (LT2): a locked KU can't be started; returns the unit's roadmap state for a student. */
async function roadmapState(studentId: string, unitId: string) {
  const st = await loadStudentState(createAdminClient(), studentId);
  return st.units.find((u) => u.unit.id === unitId) ?? null;
}

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
    .select("worked_viewed_at, faded_done_at, testout_run")
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
    admin.from("attempts").select("item_id, mode, correct, error_code, exit_run, created_at, hint_level").eq("student_id", studentId).eq("unit_id", unitId).order("created_at", { ascending: true }),
    progress(studentId, unitId),
    admin.from("review_queue").select("completed_at").eq("student_id", studentId).eq("unit_id", unitId).maybeSingle(),
    admin.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", studentId).eq("unit_id", unitId),
  ]);
  if (rows.error || q.error) return undefined; // no nudge rather than a wrong one
  const history = masteryHistory((rows.data ?? []) as AttemptRow[], (p?.testout_run as string | null) ?? null, !!p?.worked_viewed_at, !!q.data?.completed_at);
  const m = systemMastery(history);
  const recent = practiceFirstTries(history.attempts).slice(-RULES.practiceWindow);
  const conf = latestByUnit((c.data ?? []) as ConfirmationRow[]).get(unitId);
  const confirmed = displayLevel(m.level, conf, history).confirmed;
  return { level: m.level, practiceCount: recent.length, practiceRight: recent.filter(rightUnaided).length, confirmed };
}
const SAVE_FAILED = { ok: false as const, message: "Chưa lưu được câu trả lời. Kiểm tra mạng rồi thử lại." };

// ---------------------------------------------------------------------

export async function markWorkedViewed(unitIdRaw: string): Promise<{ ok: boolean; message?: string }> {
  const who = await learner();
  const unitId = UnitId.safeParse(unitIdRaw);
  if (!who || !unitId.success || !loadUnit(who, unitId.data)) return DENIED;
  if (who.kind === "preview") return { ok: true };
  const rs = await roadmapState(who.studentId, unitId.data);
  if (rs?.status === "locked") return { ok: false, message: "Bài này chưa mở — con cần đạt M3 ở bài trước." };

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
  if (rs?.testout.tried && !rs.workedViewed) {
    // The row exists from a failed test-out (upsert above ignored it): record the worked example now.
    await createAdminClient()
      .from("unit_progress")
      .update({ worked_viewed_at: new Date().toISOString() })
      .eq("student_id", who.studentId)
      .eq("unit_id", unitId.data)
      .is("worked_viewed_at", null);
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
  /** AI2: highest pre-written hint opened before answering (practice). */
  hintLevel: z.number().int().min(0).max(3).optional(),
  /** LT5, practice: check one step of a multi-step item (not recorded; the whole item is recorded at the end). */
  step: z.number().int().min(0).max(4).optional(),
});

/** LT16: "Ôn lại: …" — only to a KU the viewer can open (approved, or any in the parent preview). */
function reviewLink(who: Learner, unitId: string | undefined) {
  if (!unitId) return undefined;
  const f = getUnit(unitId);
  if (!f || (who.kind === "student" && f.unit.status !== "approved")) return undefined;
  return { unitId, title: f.unit.title };
}

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

  // LT5: one step of a multi-step practice item — feedback for that step, nothing recorded yet.
  if (v.step !== undefined) {
    if (item.type !== "steps" || v.mode !== "practice" || v.step >= item.steps.length) return DENIED;
    const stepItem = item.steps[v.step].item;
    const gs = gradeItem(stepItem, v.answer);
    if (!gs.understood) return { ok: true, understood: false };
    // Practice items are the review pool: while this unit's review is due, a step check gives right / wrong
    // and the feedback, but not the right value (so step checks can't feed answers into the review).
    const reviewDue = who.kind === "student" && !!(await dueQueueRow(who.studentId, v.unitId));
    return {
      ok: true,
      understood: true,
      correct: gs.correct,
      feedbackHtml: gs.feedback ? texToHtml(gs.feedback) : undefined,
      answerHtml: answerHtml(stepItem, v.answer),
      // The right value of this step, so the student can carry on with the next one.
      correctHtml: gs.correct || reviewDue ? undefined : correctHtml(stepItem),
      errorCode: gs.correct ? null : (gs.errorCode ?? null),
      review: gs.correct ? undefined : reviewLink(who, gs.review),
    };
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
      ...(v.mode === "practice" && v.hintLevel ? { hint_level: v.hintLevel } : {}),
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
    steps: g.steps,
    review: g.correct ? undefined : reviewLink(who, g.review),
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
  /** LT13: the drawn items the student was shown (re-drawn and checked on the server). */
  items: z.array(UnitId).min(1).max(20),
  durationMs: Duration,
  /** LT4: the exit test taken directly, once per KU (track B / backfill only). */
  testOut: z.boolean().optional(),
});

export async function submitExit(input: z.input<typeof ExitInput>): Promise<ExitResult> {
  const who = await learner();
  const parsed = ExitInput.safeParse(input);
  if (!who || !parsed.success) return DENIED;
  const v = parsed.data;
  const found = loadUnit(who, v.unitId);
  if (!found) return DENIED;

  if (who.kind === "student") {
    if (v.testOut) {
      const rs = await roadmapState(who.studentId, v.unitId);
      if (!rs || !rs.entry?.testOut || rs.status !== "open" || rs.started)
        return { ok: false, message: "Bài này không làm kiểm tra vượt được (chỉ một lần, trước khi học)." };
    } else {
      const p = await progress(who.studentId, v.unitId);
      if (!p?.faded_done_at) return { ok: false, message: "Con cần học xong các phần trước rồi mới làm bài kiểm tra." };
    }
  }

  // LT13: a student answers the 5 items drawn for this run — the server draws again and must agree.
  // The parent preview may answer any items of the bank.
  const bankIds = new Set(found.unit.exit.map((i) => i.id));
  if (v.items.some((id) => !bankIds.has(id)) || new Set(v.items).size !== v.items.length) return DENIED;
  if (who.kind === "student") {
    const past = await exitHistory(createAdminClient(), who.studentId, v.unitId);
    if (!past) return SAVE_FAILED;
    const drawn = exitDrawFor(who.studentId, found.unit, past);
    if (drawn.length !== v.items.length || drawn.some((id) => !v.items.includes(id)))
      return { ok: false, message: "Bộ câu kiểm tra đã đổi (có thể con vừa nộp ở tab khác). Tải lại trang để làm bộ mới nhé." };
  }

  let nextReviewOn: string | undefined;
  // Unanswered or unreadable answers count as wrong in a test.
  const shown = new Set(v.items);
  const graded = found.unit.exit.filter((item) => shown.has(item.id)).map((item) => {
    const answer = (v.answers[item.id] ?? "").trim();
    const g = gradeItem(item, answer, { blanksWrong: true });
    return { item, answer, correct: g.understood && g.correct, errorCode: g.errorCode, feedback: g.feedback };
  });
  const exitScore = lastExitRun(graded.map((r) => ({ item_id: r.item.id, mode: "exit", correct: r.correct, error_code: r.errorCode ?? null, exit_run: "this", created_at: "" })));
  const reachedM3 = !!exitScore && exitReachesM3(exitScore);

  if (who.kind === "student") {
    const run = randomUUID();
    const admin = createAdminClient();
    if (v.testOut) {
      // Claim the one test-out before saving answers: the conditional update lets only one of two
      // simultaneous submissions through (the other changes no row and is refused).
      await admin
        .from("unit_progress")
        .upsert({ student_id: who.studentId, unit_id: v.unitId }, { onConflict: "student_id,unit_id", ignoreDuplicates: true });
      const { data: claimed, error: cErr } = await admin
        .from("unit_progress")
        .update({ testout_run: run, testout_at: new Date().toISOString() })
        .eq("student_id", who.studentId)
        .eq("unit_id", v.unitId)
        .is("testout_at", null)
        .is("worked_viewed_at", null)
        .select("unit_id");
      if (cErr) {
        console.error("submitExit testout claim", cErr.message);
        return SAVE_FAILED;
      }
      if (!claimed?.length) return { ok: false, message: "Bài này không làm kiểm tra vượt được (chỉ một lần, trước khi học)." };
    }
    const { error } = await admin
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
      // Nothing was saved: give the test-out back so the student can submit again.
      if (v.testOut) await admin.from("unit_progress").update({ testout_run: null, testout_at: null }).eq("student_id", who.studentId).eq("unit_id", v.unitId).eq("testout_run", run);
      return SAVE_FAILED;
    }
    // Reaching M3 the first time starts the D+1/D+7/D+21 review cycle (D14).
    if (reachedM3) {
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
      answerHtml: answerHtml(r.item, r.answer),
      feedbackHtml: r.feedback ? texToHtml(r.feedback) : undefined,
      solutionHtml: texToHtml(r.item.solution),
    })),
    nextReviewOn,
    // Passed = the same M3 rule as the system level (the review row may fail to save separately).
    testOut: v.testOut ? { passed: reachedM3 } : undefined,
  };
}

// ---------------------------------------------------------------------
// Mixed review (D14). H1 (audit 19/10, 0011): the server plans each run. The first answer saves
// today's plan as the student's one open run; only its planned questions are accepted, each once;
// the run is scored only when every planned question has an answer.

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

/** Today's review for a student, with its run saved (created from the plan if none is open). */
async function reviewRun(studentId: string, create: boolean) {
  const admin = createAdminClient();
  const [state, run] = await Promise.all([loadStudentState(admin, studentId), findOpenRun(admin, studentId)]);
  if (run === "error") return "error" as const;
  const s = reviewSession(state, run);
  if (s.runId || !create || !s.planned.length) return s;
  // Nothing of the open run is due any more (e.g. content changed): close it, then start today's.
  if (s.staleRunId) await admin.from("review_runs").update({ finished_at: new Date().toISOString() }).eq("id", s.staleRunId).is("finished_at", null);
  const { data, error } = await admin
    .from("review_runs")
    .insert({ student_id: studentId, items: s.planned.map((q) => runItemKey(q.unitId, q.item.id)) })
    .select("id")
    .maybeSingle();
  if (!error && data?.id) return { ...s, runId: data.id as string };
  // One open run per student: another tab saved its run first — use that one.
  const again = await findOpenRun(admin, studentId);
  if (again === "error" || !again) {
    console.error("reviewRun create", error?.message);
    return "error" as const;
  }
  return reviewSession(state, again);
}

const ReviewCheck = z.object({ unitId: UnitId, itemId: UnitId, answer: Answer, durationMs: Duration });

export async function checkReview(input: z.input<typeof ReviewCheck>): Promise<CheckResult> {
  const who = await learner();
  const parsed = ReviewCheck.safeParse(input);
  if (!who || who.kind !== "student" || !parsed.success) return DENIED;
  const v = parsed.data;
  const found = loadUnit(who, v.unitId);
  const item = found && findItem(found.unit, v.itemId, "review");
  if (!item || !(await dueQueueRow(who.studentId, v.unitId))) return { ok: false, message: "Bài này chưa đến hạn ôn." };

  // A typo in one step gets the format hint, like any other answer (not a wrong review); nothing is saved.
  const g = gradeItem(item, v.answer);
  if (!g.understood) return { ok: true, understood: false };

  const s = await reviewRun(who.studentId, true);
  if (s === "error" || !s.runId) return SAVE_FAILED;
  if (!s.planned.some((q) => q.unitId === v.unitId && q.item.id === v.itemId))
    return { ok: false, message: "Câu này không thuộc lượt ôn hôm nay. Tải lại trang để làm tiếp nhé." };
  if (s.answered.some((a) => a.unitId === v.unitId && a.itemId === v.itemId))
    return { ok: false, message: "Câu này con đã trả lời rồi. Tải lại trang để làm câu tiếp." };

  const { error } = await createAdminClient().from("attempts").insert({
    student_id: who.studentId,
    unit_id: v.unitId,
    item_id: v.itemId,
    mode: "review",
    answer: v.answer.trim(),
    correct: g.correct,
    error_code: g.errorCode ?? null,
    duration_ms: v.durationMs ?? null,
    exit_run: s.runId,
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
    steps: g.steps,
    review: g.correct ? undefined : reviewLink(who, g.review),
    // AI2: in a review, hints open only after answering (to understand, not to change the result).
    hintsHtml: item.hints?.map(texToHtml),
  };
}

const ReviewFinish = z.object({ ratings: z.record(UnitId, z.enum(["easy", "normal"])) });

export async function finishReview(input: z.input<typeof ReviewFinish>): Promise<ReviewSummary> {
  const who = await learner();
  const parsed = ReviewFinish.safeParse(input);
  if (!who || who.kind !== "student" || !parsed.success) return DENIED;
  const { ratings } = parsed.data;
  const admin = createAdminClient();

  const s = await reviewRun(who.studentId, false);
  if (s === "error") return SAVE_FAILED;
  if (!s.runId) return { ok: false, message: "Không tìm thấy lượt ôn này. Tải lại trang nhé." };
  if (s.remaining.length) return { ok: false, message: `Con còn ${s.remaining.length} câu chưa làm. Tải lại trang để làm nốt rồi lưu.` };

  // Close the run first: of two simultaneous saves only one scores it.
  const { data: claimed, error: cErr } = await admin
    .from("review_runs")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", s.runId)
    .eq("student_id", who.studentId)
    .is("finished_at", null)
    .select("id");
  if (cErr) {
    console.error("finishReview claim", cErr.message);
    return SAVE_FAILED;
  }
  if (!claimed?.length) return { ok: false, message: "Lượt ôn này đã được lưu rồi." };

  const perUnit = new Map<string, { correct: number; total: number }>();
  for (const a of s.answered) {
    const u = perUnit.get(a.unitId) ?? { correct: 0, total: 0 };
    u.total += 1;
    if (a.correct) u.correct += 1;
    perUnit.set(a.unitId, u);
  }

  const today = vnDate();
  const units: Extract<ReviewSummary, { ok: true }>["units"] = [];
  for (const [unitId, score] of perUnit) {
    const due = await dueQueueRow(who.studentId, unitId);
    if (!due) continue; // not due any more
    const passed = reviewPassed(score.correct, score.total);
    const rating: Rating = ratings[unitId] ?? "normal";
    const next = afterReview(due.stage, passed, rating, today);

    const { error: logErr } = await admin.from("review_log").insert({
      student_id: who.studentId,
      unit_id: unitId,
      run_id: s.runId,
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
