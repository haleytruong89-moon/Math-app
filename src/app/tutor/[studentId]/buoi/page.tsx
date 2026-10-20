import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { addDays, vnDate } from "@/lib/learning/rules";
import { SESSION_RULES } from "@/lib/learning/session";
import { loadStudentState } from "@/lib/learning/state";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { SessionShort, type ChipUnit } from "@/components/tutor/session-short";

export const metadata: Metadata = { title: "Buổi dạy — App Toán" };

export default async function SessionPage(props: PageProps<"/tutor/[studentId]/buoi">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const state = await loadStudentState(supabase, student.id, { includeDrafts: true });
  const units: ChipUnit[] = state.roadmap.map(({ entry, state: u, level }) => ({
    id: entry.id,
    title: entry.title,
    level,
    group: state.priorities.includes(entry.id) ? "priority" : u?.inProgress ? "progress" : "other",
  }));
  units.sort((a, b) => (a.group === "priority" && b.group === "priority" ? state.priorities.indexOf(a.id) - state.priorities.indexOf(b.id) : 0));
  const today = vnDate();
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="buoi" />
      <SessionShort studentId={student.id} today={today} minDate={addDays(today, -SESSION_RULES.maxBackdateDays)} units={units} />
    </>
  );
}
