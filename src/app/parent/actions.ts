"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculumUnit, getUnit } from "@/lib/content";
import { reviewNote } from "@/lib/learning/homework";
import { latestByUnit, type ProposalRow } from "@/lib/learning/overview";
import { loadStudentState } from "@/lib/learning/state";
import { parentOwnsStudent } from "@/lib/parent";
import { buildWeeklyReport } from "@/lib/ai/reports";
import { isAiModel } from "@/lib/ai/rules";
import type { ActionState } from "@/components/action-form";

/** "Chốt mức" (D8): display only (P2) — snapshots the current system level and the proposal it answers. */
export async function confirmLevel(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  const unitId = String(fd.get("unitId") ?? "");
  const level = String(fd.get("level") ?? "");
  const note = reviewNote(fd.get("note"));
  if (!studentId.success || !getUnit(unitId)) return { error: "Không tìm thấy bài này." };
  if (!/^[0-4]$/.test(level)) return { error: "Chọn mức M0–M4." };
  if (!note.ok) return { error: note.error };
  if (!(await parentOwnsStudent(parent.id, studentId.data))) return { error: "Không tìm thấy học sinh." };

  const admin = createAdminClient();
  const [state, proposals] = await Promise.all([
    loadStudentState(admin, studentId.data, { includeDrafts: true }),
    admin.from("tutor_proposals").select("session_id, unit_id, level, tutor_id, created_at").eq("student_id", studentId.data).eq("unit_id", unitId),
  ]);
  const system = state.units.find((u) => u.unit.id === unitId)?.mastery.level ?? 0;
  const latest = latestByUnit((proposals.data ?? []) as ProposalRow[]).get(unitId);

  const { error } = await admin.from("parent_confirmations").insert({
    student_id: studentId.data,
    parent_id: parent.id,
    unit_id: unitId,
    level: Number(level),
    system_level: system,
    proposal_session_id: latest?.session_id ?? null,
    note: note.value,
  });
  if (error) {
    console.error("confirmLevel", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent");
  return { ok: `Đã chốt M${level}.` };
}

/** LT2: "Mở khoá cho con" — the parent opens a locked KU by hand. */
export async function unlockUnit(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  const unitId = String(fd.get("unitId") ?? "");
  if (!studentId.success || !curriculumUnit(unitId)) return { error: "Không tìm thấy bài này." };
  if (!(await parentOwnsStudent(parent.id, studentId.data))) return { error: "Không tìm thấy học sinh." };
  const { error } = await createAdminClient()
    .from("unit_unlocks")
    .upsert({ student_id: studentId.data, unit_id: unitId, unlocked_by: parent.id }, { onConflict: "student_id,unit_id", ignoreDuplicates: true });
  if (error) {
    console.error("unlockUnit", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent/content");
  revalidatePath(`/parent/content/${unitId}`);
  return { ok: "Đã mở khoá cho con." };
}

/** S8a: make the previous week's report again (overwrites; also used when the Monday run missed). */
export async function regenerateWeekly(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const studentId = z.uuid().safeParse(fd.get("studentId"));
  if (!studentId.success || !(await parentOwnsStudent(parent.id, studentId.data))) return { error: "Không tìm thấy học sinh." };
  const r = await buildWeeklyReport(studentId.data);
  if (!r.ok) return { error: "Chưa tạo được báo cáo, thử lại sau." };
  revalidatePath("/parent/bao-cao");
  return { ok: "Đã tạo báo cáo tuần trước." };
}

/** S8a: AI for reports and briefs on/off + their model (the student's AI comes with S8b). */
export async function saveAiSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const model = fd.get("staffModel");
  if (!isAiModel(model)) return { error: "Chọn một model trong danh sách." };
  const { error } = await createAdminClient()
    .from("ai_settings")
    .update({ staff_enabled: fd.get("staffEnabled") === "on", staff_model: model, updated_by: parent.id, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    console.error("saveAiSettings", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath("/parent/ai");
  return { ok: "Đã lưu." };
}
