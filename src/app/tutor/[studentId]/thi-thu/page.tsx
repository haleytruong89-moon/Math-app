import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { tutorStudent } from "@/lib/tutor/workspace";
import { loadMockExams } from "@/lib/learning/mock-data";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { MockOverview } from "@/components/mock/mock-views";

export const metadata: Metadata = { title: "Thi thử — App Toán" };

// Thi thử (S9, 07/11/2026): the 12 papers Đề 57–68 — schedule, then grade each one on its score sheet.
export default async function TutorMockPage(props: PageProps<"/tutor/[studentId]/thi-thu">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const exams = await loadMockExams(await createClient(), student.id);
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="thi-thu" />
      <h1 className="font-display text-xl font-bold">Thi thử — Đề 57–68</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Con làm trên giấy như thi thật; gia sư chấm theo phiếu chấm và nhập điểm từng ý. Con chỉ thấy điểm và bài cần ôn, không thấy đáp số.</p>
      <MockOverview studentId={student.id} exams={exams} hrefFor={(p) => `/tutor/${student.id}/thi-thu/${p}`} />
    </>
  );
}
