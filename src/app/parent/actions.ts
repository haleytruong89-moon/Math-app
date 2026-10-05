"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUnit } from "@/lib/content";
import { reviewNote } from "@/lib/learning/homework";
import { latestByUnit, type ProposalRow } from "@/lib/learning/overview";
import { loadStudentState } from "@/lib/learning/state";
import { parentOwnsStudent } from "@/lib/parent";
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
