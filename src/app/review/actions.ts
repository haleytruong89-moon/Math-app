"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { curriculumUnit, getUnit } from "@/lib/content";
import { FIX_PART_MAX, LESSON, REVIEW_RULES, fixNote, nextToReview, reviewables, unitReview } from "@/lib/content/review";
import { loadReviewData } from "@/lib/content/approvals";
import { editPriorityList } from "@/lib/learning/priorities";
import { activeAssignment, reviewerOf } from "@/lib/access";
import { getCurrentUser } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/action-form";

const UnitId = z.string().regex(/^[a-z0-9-]+$/).max(60);
const ItemId = z.union([UnitId, z.literal(LESSON)]);
// Where to go back to: the tutor's or the parent's review screen of this unit.
const Back = z.string().regex(/^\/(tutor\/[0-9a-f-]{36}\/bai\/[a-z0-9-]+|parent\/content\/[a-z0-9-]+\/duyet)$/);
const Note = z.string().trim().max(REVIEW_RULES.noteMax);
const NO_RIGHT = { error: "Bạn không có quyền duyệt bài (cần tài khoản phụ huynh hoặc gia sư đang dạy)." };
const FAILED = { error: "Chưa lưu được, thử lại sau." };

function refresh(unitId: string) {
  revalidatePath("/parent/content");
  revalidatePath(`/parent/content/${unitId}/duyet`);
  revalidatePath("/tutor", "layout");
}

/** "Đạt" / "Cần sửa" on one item (or the lesson block); hashes come from the content now on the server. */
export async function reviewItem(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const Part = z.string().trim().max(FIX_PART_MAX).optional();
  const v = z.object({ unitId: UnitId, itemId: ItemId, verdict: z.enum(["ok", "fix"]), reason: Part, how: Part, back: Back }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: `Thiếu thông tin hoặc ghi quá ${FIX_PART_MAX} ký tự một ô.` };
  const f = getUnit(v.data.unitId);
  const r = f && reviewables(f.unit).find((x) => x.id === v.data.itemId);
  if (!f || !r) return { error: "Không tìm thấy câu này." };
  // 23/10: "Cần sửa" needs both why it is wrong and how Claude should fix it.
  if (v.data.verdict === "fix" && (!v.data.reason || !v.data.how)) return { error: "Ghi cả lý do và hướng dẫn sửa để Claude sửa đúng." };
  const note = v.data.verdict === "fix" ? Note.parse(fixNote(v.data.reason!, v.data.how!)) : null;
  const { error } = await createAdminClient().from("item_reviews").insert({
    unit_id: f.unit.id, item_id: r.id, verdict: v.data.verdict, note,
    grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: who.id,
  });
  if (error) {
    console.error("reviewItem", error.message);
    return FAILED;
  }
  refresh(f.unit.id);
  const d = await loadReviewData(); // cached before the insert in this request: add the new verdict by hand
  const rv = unitReview(f.unit, [...d.rows, { unit_id: f.unit.id, item_id: r.id, verdict: v.data.verdict, note, grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: who.id, created_at: new Date().toISOString() }], d.approvals);
  redirect(`${v.data.back}?item=${encodeURIComponent(nextToReview(rv, r.id) ?? r.id)}`);
}

export async function approveUnit(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const id = UnitId.safeParse(fd.get("unitId"));
  const f = id.success ? getUnit(id.data) : null;
  if (!f || f.unit.status === "approved") return { error: "Bài này không duyệt trên app được." };
  const d = await loadReviewData();
  const rv = unitReview(f.unit, d.rows, d.approvals);
  if (!rv.canApprove.ok) return { error: rv.canApprove.reason };
  const { error } = await createAdminClient().from("unit_approvals").insert({ unit_id: f.unit.id, action: "approve", actor_id: who.id });
  if (error) {
    console.error("approveUnit", error.message);
    return FAILED;
  }
  refresh(f.unit.id);
  return { ok: "Đã duyệt — con thấy bài này ngay." };
}

export async function returnUnit(_p: ActionState, fd: FormData): Promise<ActionState> {
  const who = await reviewerOf();
  if (!who) return NO_RIGHT;
  const v = z.object({ unitId: UnitId, note: Note.min(1, "Ghi lý do trả lại.") }).safeParse(Object.fromEntries(fd));
  if (!v.success) return { error: v.error.issues[0]?.message ?? "Thiếu thông tin." };
  const { error } = await createAdminClient().from("unit_approvals").insert({ unit_id: v.data.unitId, action: "return", note: v.data.note, actor_id: who.id });
  if (error) {
    console.error("returnUnit", error.message);
    return FAILED;
  }
  refresh(v.data.unitId);
  return { ok: "Đã trả lại — con không thấy bài này nữa." };
}

/** T8: ⭐ / ↑ / ↓ on the student's priority list (assigned tutor or parent). */
export async function editPriorities(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  const v = z.object({ studentId: z.uuid(), unitId: UnitId, op: z.enum(["toggle", "up", "down"]) }).safeParse(Object.fromEntries(fd));
  if (!user || !v.success || !curriculumUnit(v.data.unitId)) return { error: "Thiếu thông tin, tải lại trang." };
  const admin = createAdminClient();
  if (user.role === "tutor" ? !(await activeAssignment(admin, user.id, v.data.studentId)) : user.role !== "parent")
    return { error: "Bạn không còn được phân công dạy học sinh này." };
  if (user.role === "parent") {
    const { data: link } = await admin.from("parent_students").select("student_id").eq("parent_id", user.id).eq("student_id", v.data.studentId).maybeSingle();
    if (!link) return { error: "Không tìm thấy học sinh." };
  }
  const { data: rows, error: rErr } = await admin.from("tutor_priorities").select("unit_id, position").eq("student_id", v.data.studentId).order("position", { ascending: true });
  if (rErr) return FAILED;
  const next = editPriorityList((rows ?? []).map((r) => r.unit_id as string), v.data.op, v.data.unitId);
  // Replace the whole list (≤ 20 rows): positions stay 1..n without gaps.
  const { error: dErr } = await admin.from("tutor_priorities").delete().eq("student_id", v.data.studentId);
  const { error: iErr } = next.length
    ? await admin.from("tutor_priorities").insert(next.map((unit_id, i) => ({ student_id: v.data.studentId, unit_id, position: i + 1, set_by: user.id })))
    : { error: null };
  if (dErr || iErr) {
    console.error("editPriorities", dErr?.message ?? iErr?.message);
    return FAILED;
  }
  revalidatePath(`/tutor/${v.data.studentId}`, "layout");
  revalidatePath("/student");
  return { ok: "Đã lưu thứ tự ưu tiên." };
}
