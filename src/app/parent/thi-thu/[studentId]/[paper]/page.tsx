import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { examSheet } from "@/lib/content";
import { loadMockExams, loadMockScores } from "@/lib/learning/mock-data";
import { kindOf, mockStatus, parseRef, refLabel, STATUS_LABEL } from "@/lib/learning/mock";
import { dmy, MockResult, SheetTable } from "@/components/mock/mock-views";

export const metadata: Metadata = { title: "Kết quả — App Toán" };

// Thi thử (S9): one paper for the parent — the result and the tutor's points per part (read only).
export default async function ParentMockPaperPage(props: PageProps<"/parent/thi-thu/[studentId]/[paper]">) {
  await requireRole("parent");
  const { studentId, paper: raw } = await props.params;
  const ref = parseRef(raw);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !ref) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const exam = (await loadMockExams(supabase, student.id)).find((e) => kindOf(e) === ref.kind && e.paper === ref.paper);
  if (!exam) notFound();
  const [scores, prio] = await Promise.all([loadMockScores(supabase, exam.id), supabase.from("tutor_priorities").select("unit_id").eq("student_id", student.id)]);
  const sheet = examSheet(ref);
  return (
    <>
      <Link href="/parent/thi-thu" className="text-sm text-accent hover:underline">← Kiểm tra & thi thử</Link>
      <h1 className="mt-2 font-display text-2xl font-bold">{refLabel(ref)} — {student.full_name}</h1>
      <p className="mt-1 text-sm text-muted">Ngày {dmy(exam.scheduled_on)} · {STATUS_LABEL[mockStatus(exam)]}{sheet?.pages ? ` · trong sách: ${sheet.pages}` : ""}</p>
      <div className="mt-5 flex flex-col gap-6">
        {exam.graded_at ? (
          <MockResult studentId={student.id} exam={exam} scores={scores} priorities={new Set((prio.data ?? []).map((r) => r.unit_id as string))} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Gia sư chưa chấm bài này.</p>
        )}
        <section aria-label="Phiếu chấm">
          <h2 className="mb-2 font-display text-base font-bold">Phiếu chấm</h2>
          <SheetTable exam={ref} scores={scores} editable={false} />
        </section>
      </div>
    </>
  );
}
