import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { tutorStudent } from "@/lib/tutor/workspace";
import { loadMockExams } from "@/lib/learning/mock-data";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { MockOverview, ProgressOverview } from "@/components/mock/mock-views";
import { loadTargetBoard, TargetBoard } from "@/components/mock/target-board";
import { loadStudentState } from "@/lib/learning/state";

export const metadata: Metadata = { title: "Kiểm tra & thi thử — App Toán" };

// Thi thử (S9, 07/11/2026): the 12 papers Đề 57–68 — schedule, then grade each one on its score sheet.
// Kiểm tra tiến bộ (08/11): the progress tests first (2-weekly until thi thử starts), same grading.
export default async function TutorMockPage(props: PageProps<"/tutor/[studentId]/thi-thu">) {
  await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const supabase = await createClient();
  const [exams, state] = await Promise.all([loadMockExams(supabase, student.id), loadStudentState(supabase, student.id)]);
  const board = await loadTargetBoard(supabase, student.id, new Map(state.units.map((u) => [u.unit.id, u.mastery.level])));
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="thi-thu" />
      <h1 className="font-display text-xl font-bold">Kiểm tra tiến bộ & thi thử</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Gia sư chấm theo phiếu chấm và nhập điểm từng ý. Con chỉ thấy điểm và bài cần ôn, không thấy đáp số.</p>
      <div className="flex flex-col gap-6">
        <TargetBoard board={board} />
        <ProgressOverview studentId={student.id} exams={exams} hrefFor={(k) => `/tutor/${student.id}/thi-thu/${k}`} />
        <div>
          <h2 className="mb-3 font-display text-lg font-bold">Thi thử — Đề 57–68</h2>
          <MockOverview studentId={student.id} exams={exams} hrefFor={(k) => `/tutor/${student.id}/thi-thu/${k}`} />
        </div>
      </div>
    </>
  );
}
