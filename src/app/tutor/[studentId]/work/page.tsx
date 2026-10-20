import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { StudentWork } from "@/components/work/student-work";
import { TutorTabs } from "@/components/tutor/tutor-tabs";

export const metadata: Metadata = { title: "Bài làm của con — App Toán" };

export default async function TutorWorkPage(props: PageProps<"/tutor/[studentId]/work">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  // RLS: only returns the student while this tutor is actively assigned.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  return (
    <>
    <TutorTabs studentId={student.id} studentName={student.full_name} active="work" />
    <StudentWork
      supabase={supabase}
      student={student}
      basePath={`/tutor/${student.id}/work`}
      unitId={typeof sp.unit === "string" ? sp.unit : null}
      all={sp.all === "1"}
      proposer="Bạn"
    />
    </>
  );
}
