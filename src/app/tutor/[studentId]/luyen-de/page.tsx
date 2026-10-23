import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { drills } from "@/lib/content";
import { studentDrills } from "@/lib/learning/drills";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { DrillBankList } from "@/components/drill/drill-bank-list";

export const metadata: Metadata = { title: "Luyện đề hình — App Toán" };

// Luyện đề 4.2 (23/10): the drill bank with the student's state; review = the Kho bài workbench.
export default async function TutorDrillPage(props: PageProps<"/tutor/[studentId]/luyen-de">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const rows = await studentDrills(supabase, student.id);
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <h1 className="font-display text-xl font-bold">Luyện đề hình 4.2</h1>
      <p className="mt-1 text-sm text-muted">Bài 4.2 thật (Đề 1–56). Con thấy bài khi các bài học nó cần đạt M3 hoặc được gắn ★; tối đa 3 bài mới mỗi tuần.</p>
      <DrillBankList problems={drills()} states={new Map(rows.map((r) => [r.problem.id, r.state]))} reviewHref={(id) => `/tutor/${student.id}/bai/${id}`} />
    </>
  );
}
