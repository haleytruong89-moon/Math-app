import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { shelf } from "@/lib/content/approvals";
import { loadStudentState } from "@/lib/learning/state";
import { vnDate } from "@/lib/learning/rules";
import { sessionDue, weekSummary } from "@/lib/learning/tutor-today";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { OpenHomework, type OpenHwRow } from "@/components/tutor/open-homework";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };
const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

// Mockup artboard 1: what needs the tutor today, for one student.
export default async function TodayPage(props: PageProps<"/tutor/[studentId]">) {
  const tutor = await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const [state, rows, hw, last, assign] = await Promise.all([
    loadStudentState(supabase, student.id),
    shelf(),
    supabase.from("homework").select("id, unit_id, items, task, due_on, done_at, created_at").eq("student_id", student.id).eq("tutor_id", tutor.id).is("reviewed_at", null).order("due_on", { ascending: true }).limit(20),
    supabase.from("teaching_sessions").select("taught_on").eq("student_id", student.id).eq("tutor_id", tutor.id).order("taught_on", { ascending: false }).limit(1),
    supabase.from("tutor_assignments").select("weekdays").eq("student_id", student.id).eq("tutor_id", tutor.id).is("ended_at", null).maybeSingle(),
  ]);
  const today = vnDate();
  const waiting = rows.filter((r) => r.status === "waiting" || r.status === "reapprove");
  const due = sessionDue((last.data ?? [])[0]?.taught_on ?? null, (assign.data?.weekdays as number[] | null) ?? [], today);
  const week = weekSummary(state.units.flatMap((u) => u.attempts), today);
  const title = new Map(rows.map((r) => [r.id, r.title]));

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="today" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Việc hôm nay">
          {waiting.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4" data-testid="todo-review">
              <p className="font-display font-semibold">{waiting.length} bài chờ cô duyệt</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {waiting.slice(0, 3).map((r) => <li key={r.id}><Link href={`/tutor/${student.id}/bai/${r.id}`} className="text-accent hover:underline">{r.title}</Link> <span className="font-mono text-xs text-muted">đã xem {r.reviewed}/{r.total}</span></li>)}
              </ul>
              {waiting.length > 3 && <Link href={`/tutor/${student.id}/bai?loc=cho`} className="mt-2 inline-block text-sm text-accent">Xem tất cả →</Link>}
            </div>
          )}
          <OpenHomework rows={(hw.data ?? []) as OpenHwRow[]} state={state} today={today} />
          {due && (
            <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm" data-testid="todo-session">
              Chưa ghi buổi dạy ngày {ddmm(due)}. <Link href={`/tutor/${student.id}/buoi`} className="font-semibold underline">Ghi buổi dạy →</Link>
            </div>
          )}
          {!waiting.length && !hw.data?.length && !due && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có việc gì đang chờ. <Link href={`/tutor/${student.id}/giao`} className="text-accent">Giao bài mới →</Link></p>}
        </section>
        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display font-semibold">Ưu tiên luyện trước</p>
            <ol className="mt-2 list-decimal pl-5 text-sm">{state.priorities.map((id) => <li key={id}>{title.get(id) ?? id}</li>)}</ol>
            {!state.priorities.length && <p className="mt-1 text-sm text-muted">Chưa đặt.</p>}
            <Link href={`/tutor/${student.id}/bai`} className="mt-2 inline-block text-sm text-accent">Sửa ở Kho bài →</Link>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 text-sm" data-testid="week-summary">
            <p className="font-display font-semibold">Tuần này của con</p>
            <p className="mt-2">Buổi học: <b>{week.studyDays}/4</b></p>
            <p>Luyện tập: <b>{week.practice.right}/{week.practice.total}</b> câu đúng</p>
            <p>Lượt ôn: <b>{week.reviews}</b></p>
          </div>
        </aside>
      </div>
    </>
  );
}
