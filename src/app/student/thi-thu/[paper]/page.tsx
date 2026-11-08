import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { curriculumUnit, examSheet } from "@/lib/content";
import { loadMockExams, loadMockScores } from "@/lib/learning/mock-data";
import { countedParts, kindOf, lostByUnit, MOCK_RULES, mockStatus, mockTotals, parseRef, pts, refKey, refLabel, type ExamRef } from "@/lib/learning/mock";
import { addDays, vnDate } from "@/lib/learning/rules";
import { MockTimer } from "@/components/mock/mock-timer";
import { pointsByBai, ProblemsView } from "@/components/mock/problems";

export const metadata: Metadata = { title: "Kiểm tra — App Toán" };

const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

// Thi thử (S9, 07/11/2026): the student's page for one paper — start, timer, hand in; after grading her points per
// part and the KUs to review. Parent choice 06/11: no answers here (the tutor goes through the solution with her).
// Kiểm tra tiến bộ (08/11): the same page for KT1…; the problems show once she has started (or on the printed paper).
export default async function StudentMockPage(props: PageProps<"/student/thi-thu/[paper]">) {
  const user = await requireRole("student");
  const ref = parseRef((await props.params).paper);
  if (!ref) notFound();
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");
  const exam = (await loadMockExams(supabase, me.id)).find((e) => kindOf(e) === ref.kind && e.paper === ref.paper);
  if (!exam) notFound();
  const sheet = examSheet(ref);
  const minutes = sheet?.minutes ?? MOCK_RULES.minutes;
  const progress = ref.kind === "progress";
  const st = mockStatus(exam);
  const today = vnDate();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/student" className="text-sm text-accent hover:underline">← Hôm nay</Link>
      <h1 className="mt-2 font-display text-2xl font-bold">{progress ? `Kiểm tra tiến bộ ${refLabel(ref)}` : `Thi thử ${refLabel(ref)}`}</h1>

      {st === "scheduled" && (
        <section className="mt-3" data-testid="mock-before">
          <p className="text-muted">Ngày làm: {dmy(exam.scheduled_on)} · {minutes} phút · làm trên giấy.</p>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm">
            {progress ? (
              <li>Chuẩn bị giấy làm bài, giấy nháp, bút, thước, máy tính cầm tay. Đề hiện ở đây sau khi con bấm &ldquo;Bắt đầu&rdquo; (hoặc làm trên đề bố mẹ / thầy cô đã in).</li>
            ) : (
              <li>Lấy đề bố mẹ đã in, giấy nháp, bút, thước, compa. Không dùng điện thoại hay máy tính để tra.</li>
            )}
            <li>Bấm &ldquo;Bắt đầu&rdquo; rồi làm bài như thi thật.</li>
            <li>Hết giờ hoặc làm xong thì bấm &ldquo;Nộp bài&rdquo; và đưa bài cho thầy/cô chấm.</li>
          </ol>
          {exam.scheduled_on <= addDays(today, MOCK_RULES.cardDaysBefore) ? (
            <MockTimer exam={refKey(ref)} minutes={minutes} startedAt={null} />
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted">Chưa tới ngày làm bài.</p>
          )}
        </section>
      )}

      {st === "running" && (
        <section className="mt-3" data-testid="mock-running">
          <p className="text-muted">Thời gian còn lại</p>
          <MockTimer exam={refKey(ref)} minutes={minutes} startedAt={exam.started_at} />
          {progress && sheet?.problems && (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <p className="mb-3 text-xs italic text-muted">Các bài đánh số như đề thi vào 10 (bài nào chưa học thì chưa có trong đề này).</p>
              <ProblemsView problems={sheet.problems} points={pointsByBai(sheet.parts)} />
            </div>
          )}
        </section>
      )}

      {st === "finished" && (
        <p className="mt-4 rounded-xl border border-border bg-surface p-4" data-testid="mock-finished">
          Con đã nộp bài. Thầy/cô sẽ chấm và con sẽ thấy điểm ở đây.
        </p>
      )}

      {st === "graded" && <StudentResult exam={ref} examId={exam.id} comment={exam.comment ?? null} supabase={supabase} />}
    </div>
  );
}

async function StudentResult({ exam: ref, examId, comment, supabase }: { exam: ExamRef; examId: number; comment: string | null; supabase: Awaited<ReturnType<typeof createClient>> }) {
  const sheet = examSheet(ref);
  const scores = await loadMockScores(supabase, examId);
  if (!sheet) return null;
  const t = mockTotals(sheet, scores);
  const shown = countedParts(sheet, scores);
  const got = new Map(scores.map((s) => [s.part, Number(s.points)]));
  const lost = lostByUnit(sheet, scores);
  return (
    <section className="mt-4 flex flex-col gap-4" data-testid="mock-student-result">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-display text-4xl font-bold" data-testid="mock-total">{pts(t.total)}<span className="text-xl text-muted">/{pts(ref.kind === "progress" ? t.max : 10)}</span></p>
        {comment && <p className="mt-2 text-sm"><span className="text-muted">Thầy/cô nhận xét:</span> {comment}</p>}
      </div>
      <table className="w-full overflow-hidden rounded-2xl border border-border bg-surface text-sm">
        <thead className="text-left font-mono text-xs uppercase tracking-wider text-muted">
          <tr><th className="px-4 py-2">Ý</th><th className="px-4 py-2">Điểm</th><th className="px-4 py-2">Bài học</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {shown.map((p) => (
            <tr key={p.part}>
              <td className="px-4 py-2 font-mono font-semibold">{p.part}</td>
              <td className={`px-4 py-2 font-mono ${(got.get(p.part) ?? 0) < p.max ? "text-warn" : "text-good"}`}>{pts(got.get(p.part) ?? 0)}/{pts(p.max)}</td>
              <td className="px-4 py-2 text-xs text-muted">{p.units.map((u) => curriculumUnit(u)?.title ?? u).join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lost.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-display font-bold">Bài nên ôn lại</h2>
          <ul className="mt-2 flex flex-col gap-1.5" data-testid="mock-review-links">
            {lost.map((l) => (
              <li key={l.unitId}>
                <Link href={`/student/learn/${l.unitId}`} className="text-accent hover:underline">{curriculumUnit(l.unitId)?.title ?? l.unitId}</Link>
                <span className="ml-2 font-mono text-xs text-muted">−{pts(l.lost)} điểm</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Lời giải đầy đủ con chữa cùng thầy/cô.</p>
        </div>
      )}
    </section>
  );
}
