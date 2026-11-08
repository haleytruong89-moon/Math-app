import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { examSheet } from "@/lib/content";
import { tutorStudent } from "@/lib/tutor/workspace";
import { loadMockExams, loadMockScores } from "@/lib/learning/mock-data";
import { kindOf, mockStatus, parseRef, refKey, refLabel, STATUS_LABEL } from "@/lib/learning/mock";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { dmy, MockResult, SheetTable } from "@/components/mock/mock-views";
import { gradeMock } from "@/app/thi-thu/actions";

export const metadata: Metadata = { title: "Chấm bài — App Toán" };

// Thi thử (S9): the score sheet of one paper with the tutor's points per part; after grading, the result.
export default async function TutorMockPaperPage(props: PageProps<"/tutor/[studentId]/thi-thu/[paper]">) {
  await requireRole("tutor");
  const { studentId, paper: raw } = await props.params;
  const ref = parseRef(raw);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !ref) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const supabase = await createClient();
  const exam = (await loadMockExams(supabase, student.id)).find((e) => kindOf(e) === ref.kind && e.paper === ref.paper);
  if (!exam) notFound();
  const [scores, prio] = await Promise.all([
    loadMockScores(supabase, exam.id),
    supabase.from("tutor_priorities").select("unit_id").eq("student_id", student.id),
  ]);
  const sheet = examSheet(ref);
  const st = mockStatus(exam);
  const took = exam.started_at && exam.finished_at ? Math.round((new Date(exam.finished_at).getTime() - new Date(exam.started_at).getTime()) / 60000) : null;
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="thi-thu" />
      <Link href={`/tutor/${student.id}/thi-thu`} className="text-sm text-accent hover:underline">← Kiểm tra & thi thử</Link>
      <h1 className="mt-2 font-display text-xl font-bold">{refLabel(ref)}</h1>
      <p className="mt-1 text-sm text-muted">
        Ngày {dmy(exam.scheduled_on)} · {STATUS_LABEL[st]}{took !== null ? ` · con làm ${took} phút` : ""}{sheet?.pages ? ` · trong sách: ${sheet.pages}` : ""}
        {ref.kind === "progress" && <> · <Link href={`/in/kiem-tra/${ref.paper}`} target="_blank" className="text-accent hover:underline">In đề</Link></>}
      </p>
      {sheet?.covers && <p className="mt-1 text-xs text-muted">{sheet.covers}</p>}
      <div className="mt-5 flex flex-col gap-6">
        {exam.graded_at && <MockResult studentId={student.id} exam={exam} scores={scores} priorities={new Set((prio.data ?? []).map((r) => r.unit_id as string))} />}
        <section aria-label="Phiếu chấm">
          <h2 className="mb-2 font-display text-base font-bold">{exam.graded_at ? "Sửa điểm" : "Chấm bài"}</h2>
          {sheet ? (
            <ActionForm action={gradeMock} submitLabel={exam.graded_at ? "Lưu lại điểm" : "Lưu điểm"} className="flex flex-col gap-3">
              <input type="hidden" name="studentId" value={student.id} />
              <input type="hidden" name="exam" value={refKey(ref)} />
              {ref.kind === "progress" && <p className="text-sm text-muted">Ý nào con chưa học tới thì tích &ldquo;Chưa học&rdquo; — ý đó không tính vào điểm.</p>}
              <SheetTable exam={ref} scores={scores} editable />
              <label className={labelClass}>
                Nhận xét chung (con đọc được)
                <textarea name="comment" maxLength={500} rows={2} defaultValue={exam.comment ?? ""} className={inputClass} />
              </label>
            </ActionForm>
          ) : (
            <SheetTable exam={ref} scores={scores} editable={false} />
          )}
        </section>
      </div>
    </>
  );
}
