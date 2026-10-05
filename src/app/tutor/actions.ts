"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculum } from "@/lib/content";
import { vnDate } from "@/lib/learning/rules";
import { parseSession } from "@/lib/learning/session";
import { parseHomework, readHomeworkForm, reviewNote } from "@/lib/learning/homework";
import type { ActionState } from "@/components/action-form";
import { z } from "zod";
import { loadStudentState } from "@/lib/learning/state";

export type SaveSessionState = { ok?: string; error?: string; savedAt?: string };

/** D3: an active tutor profile with an active assignment to this student. */
async function activeAssignment(admin: ReturnType<typeof createAdminClient>, tutorId: string, studentId: string) {
  const [{ data: profile }, { data: assignment }] = await Promise.all([
    admin.from("profiles").select("is_active").eq("id", tutorId).maybeSingle(),
    admin
      .from("tutor_assignments")
      .select("id")
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .is("ended_at", null)
      .maybeSingle(),
  ]);
  return !!profile?.is_active && !!assignment;
}
const NOT_ASSIGNED = "Bạn không còn được phân công dạy học sinh này. Liên hệ phụ huynh.";

/**
 * "Lưu buổi dạy" (§2.7, D2, D8): requireRole → validate → the tutor must be active and
 * actively assigned to the student → write the session and one proposal per ticked unit,
 * snapshotting the system level the tutor saw.
 */
export async function saveTeachingSession(_p: SaveSessionState, fd: FormData): Promise<SaveSessionState> {
  const tutor = await requireRole("tutor");

  const units = new Map(curriculum().units.map((u) => [u.id, u.title] as const)); // S6a: every roadmap KU
  const ticked = fd.getAll("unit");
  const levels: Record<string, unknown> = {};
  for (const id of ticked) levels[String(id)] = fd.get(`level:${String(id)}`);
  const parsed = parseSession(
    { studentId: fd.get("studentId"), taughtOn: fd.get("taughtOn"), note: fd.get("note"), units: ticked, levels },
    vnDate(),
    units,
  );
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.value;
  const hw = parseHomework(readHomeworkForm(fd), {
    taughtOn: v.taughtOn,
    today: vnDate(),
    ticked: new Set(v.proposals.map((p) => p.unitId)),
  });
  if (!hw.ok) return { error: hw.error };

  const admin = createAdminClient();
  if (!(await activeAssignment(admin, tutor.id, v.studentId))) return { error: NOT_ASSIGNED };

  const state = v.proposals.length ? await loadStudentState(admin, v.studentId, { includeDrafts: true }) : null;
  const sys = new Map(state?.units.map((u) => [u.unit.id, u.mastery]) ?? []);

  const { data: session, error } = await admin
    .from("teaching_sessions")
    .insert({ student_id: v.studentId, tutor_id: tutor.id, taught_on: v.taughtOn, note: v.note })
    .select("id, created_at")
    .single();
  if (error || !session) {
    console.error("saveTeachingSession", error?.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }

  if (v.proposals.length) {
    const { error: pErr } = await admin.from("tutor_proposals").insert(
      v.proposals.map((p) => ({
        session_id: session.id,
        student_id: v.studentId,
        tutor_id: tutor.id,
        unit_id: p.unitId,
        level: p.level,
        system_level: sys.get(p.unitId)?.level ?? 0,
        answers: sys.get(p.unitId)?.answers ?? 0,
      })),
    );
    if (pErr) {
      console.error("saveTeachingSession proposals", pErr.message);
      await admin.from("teaching_sessions").delete().eq("id", session.id); // keep it all-or-nothing
      return { error: "Chưa lưu được, thử lại sau." };
    }
  }

  if (hw.value.length) {
    const { error: hErr } = await admin.from("homework").insert(
      hw.value.map((h) => ({
        session_id: session.id,
        student_id: v.studentId,
        tutor_id: tutor.id,
        unit_id: h.unitId,
        task: h.task,
        links: h.links,
        due_on: h.dueOn,
      })),
    );
    if (hErr) {
      console.error("saveTeachingSession homework", hErr.message);
      await admin.from("teaching_sessions").delete().eq("id", session.id); // cascade: proposals too
      return { error: "Chưa lưu được, thử lại sau." };
    }
  }

  revalidatePath(`/tutor/${v.studentId}`);
  revalidatePath("/tutor");
  const time = new Date(session.created_at as string).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const given = hw.value.length ? ` · giao ${hw.value.length} bài về nhà` : "";
  return { ok: `Đã lưu lúc ${time}${given}`, savedAt: session.id as string };
}

/** "Đã chữa": the tutor who gave the homework, still assigned, marks it corrected (T4: the student sees the note). */
export async function reviewHomework(_p: ActionState, fd: FormData): Promise<ActionState> {
  const tutor = await requireRole("tutor");
  const id = z.uuid().safeParse(fd.get("homeworkId"));
  const note = reviewNote(fd.get("reviewNote"));
  if (!id.success) return { error: "Không tìm thấy bài này." };
  if (!note.ok) return { error: note.error };

  const admin = createAdminClient();
  const { data: hw } = await admin
    .from("homework")
    .select("id, student_id")
    .eq("id", id.data)
    .eq("tutor_id", tutor.id)
    .is("reviewed_at", null)
    .maybeSingle();
  if (!hw) return { error: "Không tìm thấy bài này (có thể đã chữa rồi)." };
  if (!(await activeAssignment(admin, tutor.id, hw.student_id as string))) return { error: NOT_ASSIGNED };

  const { error } = await admin
    .from("homework")
    .update({ reviewed_at: new Date().toISOString(), review_note: note.value })
    .eq("id", hw.id)
    .is("reviewed_at", null);
  if (error) {
    console.error("reviewHomework", error.message);
    return { error: "Chưa lưu được, thử lại sau." };
  }
  revalidatePath(`/tutor/${hw.student_id}`);
  return { ok: "Đã chữa" };
}
