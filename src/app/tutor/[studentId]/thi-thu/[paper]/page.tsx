import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { mockSheet } from "@/lib/content";
import { tutorStudent } from "@/lib/tutor/workspace";
import { loadMockExams, loadMockScores } from "@/lib/learning/mock-data";
import { mockStatus, STATUS_LABEL } from "@/lib/learning/mock";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { dmy, MockResult, SheetTable } from "@/components/mock/mock-views";
import { gradeMock } from "@/app/thi-thu/actions";

export const metadata: Metadata = { title: "Chấm thi thử — App Toán" };

// Thi thử (S9): the score sheet of one paper with the tutor's points per part; after grading, the result.
export default async function TutorMockPaperPage(props: PageProps<"/tutor/[studentId]/thi-thu/[paper]">) {
  await requireRole("tutor");
  const { studentId, paper: raw } = await props.params;
  const paper = Number(raw);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !Number.isInteger(paper) || paper < 57 || paper > 68) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const supabase = await createClient();
  const exam = (await loadMockExams(supabase, student.id)).find((e) => e.paper === paper);
  if (!exam) notFound();
  const [scores, prio] = await Promise.all([
    loadMockScores(supabase, exam.id),
    supabase.from("tutor_priorities").select("unit_id").eq("student_id", student.id),
  ]);
  const sheet = mockSheet(paper);
  const st = mockStatus(exam);
  const took = exam.started_at && exam.finished_at ? Math.round((new Date(exam.finished_at).getTime() - new Date(exam.started_at).getTime()) / 60000) : null;
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="thi-thu" />
      <Link href={`/tutor/${student.id}/thi-thu`} className="text-sm text-accent hover:underline">← Thi thử</Link>
      <h1 className="mt-2 font-display text-xl font-bold">Đề {paper}</h1>
      <p className="mt-1 text-sm text-muted">
        Ngày {dmy(exam.scheduled_on)} · {STATUS_LABEL[st]}{took !== null ? ` · con làm ${took} phút` : ""}{sheet ? ` · trong sách: ${sheet.pages}` : ""}
      </p>
      {sheet?.note && <p className="mt-2 text-sm">{sheet.note}</p>}
      <div className="mt-5 flex flex-col gap-6">
        {exam.graded_at && <MockResult studentId={student.id} exam={exam} scores={scores} priorities={new Set((prio.data ?? []).map((r) => r.unit_id as string))} />}
        <section aria-label="Phiếu chấm">
          <h2 className="mb-2 font-display text-base font-bold">{exam.graded_at ? "Sửa điểm" : "Chấm bài"}</h2>
          {sheet ? (
            <ActionForm action={gradeMock} submitLabel={exam.graded_at ? "Lưu lại điểm" : "Lưu điểm"} className="flex flex-col gap-3">
              <input type="hidden" name="studentId" value={student.id} />
              <input type="hidden" name="paper" value={paper} />
              <SheetTable paper={paper} scores={scores} editable />
              <label className={labelClass}>
                Nhận xét chung (con đọc được)
                <textarea name="comment" maxLength={500} rows={2} defaultValue={exam.comment ?? ""} className={inputClass} />
              </label>
            </ActionForm>
          ) : (
            <SheetTable paper={paper} scores={scores} editable={false} />
          )}
        </section>
      </div>
    </>
  );
}
