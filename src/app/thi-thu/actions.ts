"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { curriculumUnit, examSheet, progressTest } from "@/lib/content";
import { activeAssignment } from "@/lib/access";
import { getCurrentUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, firstReview, vnDate } from "@/lib/learning/rules";
import { checkScores, MOCK_RULES, mockStatus, mockTotals, parseRef, refLabel, type ExamRef, type MockExamRow } from "@/lib/learning/mock";
import type { ActionState } from "@/components/action-form";

// Thi thử (S9, 07/11/2026; docs/superpowers/specs/2026-11-06-thi-thu-design.md). Every write is here, by the server:
// the tutor or the parent schedules, the student starts and hands in (times only), the tutor grades points per part
// against the score sheet in git. Parent choice 06/11: the tutor grades; lost KUs are suggestions (★ / ôn lại).
// Kiểm tra tiến bộ (08/11): the same actions for progress tests KT1–KT20 (`kind = 'progress'`); an exam is named by its
// key ("57" or "kt1", field `exam`), and a progress test may mark parts "chưa học".

const FAILED = { error: "Chưa lưu được, thử lại sau." };
const Exam = z.string().max(4).transform((s, ctx) => parseRef(s) ?? (ctx.addIssue({ code: "custom", message: "exam" }), z.NEVER));
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const EXAM_COLS = "id, student_id, kind, paper, scheduled_on, started_at, finished_at, graded_at, total";
type Admin = ReturnType<typeof createAdminClient>;

function refresh(studentId: string) {
  revalidatePath(`/tutor/${studentId}`, "layout");
  revalidatePath("/parent", "layout");
  revalidatePath("/student", "layout");
}

/** The adult acting on this student: an active tutor of the student, or a parent linked to the student. */
async function adultOf(admin: Admin, studentId: string): Promise<{ id: string; role: "tutor" | "parent" } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "tutor") return (await activeAssignment(admin, user.id, studentId)) ? { id: user.id, role: "tutor" } : null;
  if (user.role !== "parent") return null;
  const { data } = await admin.from("parent_students").select("student_id").eq("parent_id", user.id).eq("student_id", studentId).maybeSingle();
  return data ? { id: user.id, role: "parent" } : null;
}

async function examOf(admin: Admin, studentId: string, ref: ExamRef) {
  const { data, error } = await admin.from("mock_exams").select(EXAM_COLS).eq("student_id", studentId).eq("kind", ref.kind).eq("paper", ref.paper).maybeSingle();
  return { exam: data as (MockExamRow & { student_id: string }) | null, error };
}

/** Schedule a paper (thi thử) or a progress test, or move one that has not been started yet. */
export async function scheduleMock(_p: ActionState, fd: FormData): Promise<ActionState> {
  const v = z.object({ studentId: z.uuid(), exam: Exam, date: IsoDate }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: "Chọn đề và ngày làm bài." };
  const ref = v.data.exam;
  if (ref.kind === "progress" && !progressTest(ref.paper)) return { error: `${refLabel(ref)} chưa có đề.` };
  const admin = createAdminClient();
  const adult = await adultOf(admin, v.data.studentId);
  if (!adult) return { error: "Bạn không có quyền hẹn lịch cho học sinh này." };
  if (v.data.date < vnDate()) return { error: "Ngày làm bài phải từ hôm nay trở đi." };
  const { exam, error } = await examOf(admin, v.data.studentId, ref);
  if (error) return FAILED;
  if (exam && mockStatus(exam) !== "scheduled") return { error: `${refLabel(ref)} con đã bắt đầu làm, không đổi lịch được.` };
  const res = exam
    ? await admin.from("mock_exams").update({ scheduled_on: v.data.date }).eq("id", exam.id)
    : await admin.from("mock_exams").insert({ student_id: v.data.studentId, kind: ref.kind, paper: ref.paper, scheduled_on: v.data.date, created_by: adult.id });
  if (res.error) {
    console.error("scheduleMock", res.error.message);
    return FAILED;
  }
  refresh(v.data.studentId);
  return { ok: `Đã hẹn ${refLabel(ref)} ngày ${v.data.date.slice(8)}/${v.data.date.slice(5, 7)}/${v.data.date.slice(0, 4)}.` };
}

/** Remove a paper from the schedule (only before the student starts it). */
export async function cancelMock(_p: ActionState, fd: FormData): Promise<ActionState> {
  const v = z.object({ studentId: z.uuid(), exam: Exam }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: "Thiếu thông tin, tải lại trang." };
  const admin = createAdminClient();
  if (!(await adultOf(admin, v.data.studentId))) return { error: "Bạn không có quyền đổi lịch của học sinh này." };
  const { exam, error } = await examOf(admin, v.data.studentId, v.data.exam);
  if (error || !exam) return FAILED;
  if (mockStatus(exam) !== "scheduled") return { error: "Con đã bắt đầu làm đề này, không huỷ được." };
  const { error: dErr } = await admin.from("mock_exams").delete().eq("id", exam.id);
  if (dErr) return FAILED;
  refresh(v.data.studentId);
  return { ok: `Đã huỷ lịch ${refLabel(v.data.exam)}.` };
}

async function studentSelf(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return null;
  const { data } = await createAdminClient().from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  return data?.consent_at ? (data.id as string) : null;
}

/** "Bắt đầu" — from cardDaysBefore days before the date; records the start time only. */
export async function startMock(key: string): Promise<{ ok: boolean; message?: string }> {
  const studentId = await studentSelf();
  const ref = parseRef(String(key));
  if (!studentId || !ref) return { ok: false, message: "Không bắt đầu được." };
  const admin = createAdminClient();
  const { exam, error } = await examOf(admin, studentId, ref);
  if (error || !exam) return { ok: false, message: "Không tìm thấy bài này." };
  if (mockStatus(exam) !== "scheduled") return { ok: true }; // already started: the page shows the timer
  if (exam.scheduled_on > addDays(vnDate(), MOCK_RULES.cardDaysBefore)) return { ok: false, message: "Chưa tới ngày làm bài." };
  const { error: uErr } = await admin.from("mock_exams").update({ started_at: new Date().toISOString() }).eq("id", exam.id).is("started_at", null);
  if (uErr) return { ok: false, message: "Không bắt đầu được, thử lại." };
  refresh(studentId);
  return { ok: true };
}

/** "Nộp bài" — records the finish time; the paper itself goes to the tutor on paper. */
export async function finishMock(key: string): Promise<{ ok: boolean; message?: string }> {
  const studentId = await studentSelf();
  const ref = parseRef(String(key));
  if (!studentId || !ref) return { ok: false, message: "Không nộp được." };
  const admin = createAdminClient();
  const { exam, error } = await examOf(admin, studentId, ref);
  if (error || !exam || mockStatus(exam) !== "running") return { ok: false, message: "Bài này chưa bắt đầu hoặc đã nộp." };
  const { error: uErr } = await admin.from("mock_exams").update({ finished_at: new Date().toISOString() }).eq("id", exam.id).is("finished_at", null);
  if (uErr) return { ok: false, message: "Không nộp được, thử lại." };
  refresh(studentId);
  return { ok: true };
}

/**
 * The tutor's points per part (fields p_<part>, e_<part>, n_<part>) + a comment. Allowed once the paper is handed in,
 * or from its date when the student sat it without the app; grading again replaces the earlier points.
 */
export async function gradeMock(_p: ActionState, fd: FormData): Promise<ActionState> {
  const v = z.object({ studentId: z.uuid(), exam: Exam, comment: z.string().trim().max(500).optional() }).safeParse({ studentId: fd.get("studentId"), exam: fd.get("exam"), comment: fd.get("comment") ?? undefined });
  if (!v.success) return { error: "Thiếu thông tin, tải lại trang." };
  const ref = v.data.exam;
  const user = await getCurrentUser();
  const admin = createAdminClient();
  if (!user || user.role !== "tutor" || !(await activeAssignment(admin, user.id, v.data.studentId))) return { error: "Chỉ gia sư đang dạy con chấm bài." };
  const sheet = examSheet(ref);
  if (!sheet) return { error: `${refLabel(ref)} chưa có phiếu chấm.` };
  const { exam, error } = await examOf(admin, v.data.studentId, ref);
  if (error || !exam) return { error: "Bài này chưa được hẹn lịch." };
  if (!exam.finished_at && exam.scheduled_on > vnDate()) return { error: "Chưa tới ngày làm bài — chấm sau khi con làm." };

  const progress = ref.kind === "progress";
  const scores = sheet.parts.map((p) => {
    const skipped = progress && fd.get(`s_${p.part}`) === "on";
    const raw = String(fd.get(`p_${p.part}`) ?? "").trim().replace(",", ".");
    const code = String(fd.get(`e_${p.part}`) ?? "").trim();
    const note = String(fd.get(`n_${p.part}`) ?? "").trim().slice(0, 300);
    return skipped
      ? { part: p.part, points: 0, error_code: null, note: note || null, skipped: true }
      : { part: p.part, points: raw === "" ? NaN : Number(raw), error_code: /^E\d{2}$/.test(code) ? code : null, note: note || null, skipped: false };
  });
  const issues = checkScores(sheet, scores, progress);
  if (issues.length) return { error: issues.slice(0, 3).join(" · ") };

  const t = mockTotals(sheet, scores);
  const total = t.total;
  const { error: dErr } = await admin.from("mock_scores").delete().eq("exam_id", exam.id);
  const { error: iErr } = dErr ? { error: dErr } : await admin.from("mock_scores").insert(scores.map((s) => ({ exam_id: exam.id, ...s })));
  const { error: uErr } = iErr
    ? { error: iErr }
    : await admin.from("mock_exams").update({ graded_at: new Date().toISOString(), graded_by: user.id, total, comment: v.data.comment || null }).eq("id", exam.id);
  if (uErr) {
    console.error("gradeMock", uErr.message);
    return FAILED;
  }
  refresh(v.data.studentId);
  return { ok: `Đã lưu điểm ${refLabel(ref)}: ${String(total).replace(".", ",")}/${String(progress ? t.max : 10).replace(".", ",")}.` };
}

/** "Ôn lại" for a KU that lost points: its review comes back to D+1 (only for a KU the student has passed). */
export async function reviewAgain(_p: ActionState, fd: FormData): Promise<ActionState> {
  const v = z.object({ studentId: z.uuid(), unitId: z.string().regex(/^[a-z0-9-]+$/).max(60) }).safeParse(Object.fromEntries(fd));
  if (!v.success || !curriculumUnit(v.data.unitId)) return { error: "Thiếu thông tin, tải lại trang." };
  const admin = createAdminClient();
  if (!(await adultOf(admin, v.data.studentId))) return { error: "Bạn không có quyền với học sinh này." };
  const { data: row, error } = await admin.from("review_queue").select("stage").eq("student_id", v.data.studentId).eq("unit_id", v.data.unitId).maybeSingle();
  if (error) return FAILED;
  if (!row) return { error: "Con chưa qua bài này — dùng ★ để con học." };
  const first = firstReview(vnDate());
  const { error: uErr } = await admin
    .from("review_queue")
    .update({ stage: first.stage, due_on: first.dueOn, completed_at: null, updated_at: new Date().toISOString() })
    .eq("student_id", v.data.studentId)
    .eq("unit_id", v.data.unitId);
  if (uErr) return FAILED;
  refresh(v.data.studentId);
  return { ok: "Đã đưa vào ôn ngày mai." };
}
