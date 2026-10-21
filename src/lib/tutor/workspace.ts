import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { shelf } from "@/lib/content/approvals";
import { vnDate } from "@/lib/learning/rules";
import { sessionDue } from "@/lib/learning/tutor-today";

/** The student as this tutor may see it (RLS: only while actively assigned). Once per request. */
export const tutorStudent = cache(async (studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("students").select("id, full_name, grade").eq("id", studentId).maybeSingle();
  return data as { id: string; full_name: string; grade: number | null } | null;
});

export type OpenHwRow = { id: string; unit_id: string | null; items: string[] | null; task: string; due_on: string; done_at: string | null; created_at: string };

/** What the tabs' counts and the Hôm nay page share: review shelf, open homework, an unlogged teaching day. */
export const tutorToday = cache(async (tutorId: string, studentId: string) => {
  const supabase = await createClient();
  const [rows, hw, last, assign] = await Promise.all([
    shelf(),
    supabase.from("homework").select("id, unit_id, items, task, due_on, done_at, created_at").eq("student_id", studentId).eq("tutor_id", tutorId).is("reviewed_at", null).order("due_on", { ascending: true }).limit(20),
    supabase.from("teaching_sessions").select("taught_on").eq("student_id", studentId).eq("tutor_id", tutorId).order("taught_on", { ascending: false }).limit(1),
    supabase.from("tutor_assignments").select("weekdays").eq("student_id", studentId).eq("tutor_id", tutorId).is("ended_at", null).maybeSingle(),
  ]);
  const homework = (hw.data ?? []) as OpenHwRow[];
  const waiting = rows.filter((r) => r.status === "waiting" || r.status === "reapprove");
  return {
    shelf: rows,
    waiting,
    homework,
    homeworkDone: homework.filter((h) => h.done_at).length,
    sessionDue: sessionDue(((last.data ?? [])[0]?.taught_on as string | undefined) ?? null, (assign.data?.weekdays as number[] | null) ?? [], vnDate()),
  };
});
