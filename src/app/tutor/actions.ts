"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { listModules } from "@/lib/content";
import { vnDate } from "@/lib/learning/rules";
import { parseSession } from "@/lib/learning/session";
import { loadStudentState } from "@/lib/learning/state";

export type SaveSessionState = { ok?: string; error?: string; savedAt?: string };

/**
 * "Lưu buổi dạy" (§2.7, D2, D8): requireRole → validate → the tutor must be active and
 * actively assigned to the student → write the session and one proposal per ticked unit,
 * snapshotting the system level the tutor saw.
 */
export async function saveTeachingSession(_p: SaveSessionState, fd: FormData): Promise<SaveSessionState> {
  const tutor = await requireRole("tutor");

  const units = new Map(listModules().flatMap((m) => m.unitList.map((u) => [u.id, u.title] as const)));
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

  const admin = createAdminClient();
  // Ownership: an active tutor profile with an active assignment to this student (D3).
  const [{ data: profile }, { data: assignment }] = await Promise.all([
    admin.from("profiles").select("is_active").eq("id", tutor.id).maybeSingle(),
    admin
      .from("tutor_assignments")
      .select("id")
      .eq("tutor_id", tutor.id)
      .eq("student_id", v.studentId)
      .is("ended_at", null)
      .maybeSingle(),
  ]);
  if (!profile?.is_active || !assignment) return { error: "Bạn không còn được phân công dạy học sinh này. Liên hệ phụ huynh." };

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

  revalidatePath(`/tutor/${v.studentId}`);
  revalidatePath("/tutor");
  const time = new Date(session.created_at as string).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return { ok: `Đã lưu lúc ${time}`, savedAt: session.id as string };
}
