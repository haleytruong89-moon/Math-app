import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { loadStudentState } from "@/lib/learning/state";
import { vnDate } from "@/lib/learning/rules";
import { nextAction, weekSummary } from "@/lib/learning/tutor-today";
import { tutorStudent, tutorToday } from "@/lib/tutor/workspace";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { OpenHomework } from "@/components/tutor/open-homework";
import { Progress } from "@/components/ui/progress";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { loadMockExams } from "@/lib/learning/mock-data";
import { mockStatus, refKey, refLabel, refOf } from "@/lib/learning/mock";
import { loadTargetBoard, TargetBoard } from "@/components/mock/target-board";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };

const WEEKDAY = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"];
const dayLabel = (iso: string) => `${WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()]} ${iso.slice(8)}/${iso.slice(5, 7)}`;

// Mockup "v2 · Hôm nay" (21/10): one "Việc tiếp theo" with a big button, then what waits, then the week.
export default async function TodayPage(props: PageProps<"/tutor/[studentId]">) {
  const tutor = await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const student = await tutorStudent(studentId);
  if (!student) notFound();
  const supabase = await createClient();
  const [state, t, exams] = await Promise.all([loadStudentState(supabase, student.id), tutorToday(tutor.id, student.id), loadMockExams(supabase, student.id)]);
  const today = vnDate();
  const base = `/tutor/${student.id}`;
  // 08/11: a progress test / thi thử handed in and waiting for grading is the next thing to do.
  const handedIn = exams.filter((e) => mockStatus(e) === "finished").sort((a, b) => (a.finished_at ?? "").localeCompare(b.finished_at ?? ""))[0];
  const toGrade = handedIn ? { key: refKey(refOf(handedIn)), label: refLabel(refOf(handedIn)) } : null;
  const next = nextAction({ priorities: state.priorities, shelf: t.shelf, homeworkDone: t.homeworkDone, sessionDue: t.sessionDue, toGrade });
  const board = await loadTargetBoard(supabase, student.id, new Map(state.units.map((u) => [u.unit.id, u.mastery.level])));
  const week = weekSummary(state.units.flatMap((u) => u.attempts), today);
  const byId = new Map(t.shelf.map((r) => [r.id, r]));

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="today" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Việc hôm nay">
          <div className={`${card} border-l-4 border-l-accent p-5`} data-testid="next-action">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Việc tiếp theo</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {next.kind === "review" && (
                <>
                  <div className="min-w-0 flex-[1_1_320px]">
                    <p className="font-display text-xl font-bold">
                      {next.priority && <span className="text-star">★ </span>}
                      {next.priority ? `Duyệt bài ưu tiên số ${next.priority}: ` : "Duyệt bài: "}
                      {next.title}
                    </p>
                    <Progress className="mt-2" value={next.reviewed} total={next.total} label="câu đã xem" />
                  </div>
                  <Link href={`${base}/bai/${next.unitId}`} className={btn.primary}>
                    {next.reviewed ? "Duyệt tiếp →" : "Bắt đầu duyệt →"}
                  </Link>
                  <Link href={`${base}/bai/${next.unitId}/thu`} className="font-display text-sm font-semibold text-accent hover:underline">
                    Làm thử như con
                  </Link>
                </>
              )}
              {next.kind === "grade" && (
                <>
                  <p className="min-w-0 flex-[1_1_320px] font-display text-xl font-bold">Con đã nộp {next.label} — chấm bài</p>
                  <Link href={`${base}/thi-thu/${next.key}`} className={btn.primary}>Chấm bài →</Link>
                </>
              )}
              {next.kind === "correct" && (
                <>
                  <p className="min-w-0 flex-[1_1_320px] font-display text-xl font-bold">Con đã làm xong {next.count} bài về nhà — chữa bài</p>
                  <a href="#bai-ve-nha" className={btn.primary}>Xem bài cần chữa ↓</a>
                </>
              )}
              {next.kind === "session" && (
                <>
                  <p className="min-w-0 flex-[1_1_320px] font-display text-xl font-bold">Ghi buổi dạy {dayLabel(next.date)}</p>
                  <Link href={`${base}/buoi`} className={btn.primary}>Ghi buổi dạy →</Link>
                </>
              )}
              {next.kind === "assign" && (
                <>
                  <p className="min-w-0 flex-[1_1_320px] font-display text-xl font-bold">Không có việc đang chờ — giao bài cho con luyện</p>
                  <Link href={`${base}/giao`} className={btn.primary}>Giao bài →</Link>
                </>
              )}
            </div>
          </div>

          {t.waiting.length > 0 && (
            <div className={card} data-testid="todo-review">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
                <h2 className={sectionTitle}>
                  Chờ cô duyệt <span className="font-medium text-muted">({t.waiting.length} bài)</span>
                </h2>
                <Link href={`${base}/bai?loc=cho`} className="ml-auto font-display text-sm font-semibold text-accent hover:underline">
                  Xem tất cả trong Kho bài →
                </Link>
              </div>
              <ul>
                {[...t.waiting]
                  .sort((a, b) => rank(state.priorities, a.id) - rank(state.priorities, b.id))
                  .slice(0, 4)
                  .map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 border-t border-border/60 px-4 py-2.5 hover:bg-bg">
                      <span className={state.priorities.includes(r.id) ? "text-lg text-star" : "text-lg text-border"} aria-hidden>
                        {state.priorities.includes(r.id) ? "★" : "☆"}
                      </span>
                      <Link href={`${base}/bai/${r.id}`} className="min-w-0 flex-1 font-display font-semibold hover:text-accent">
                        {r.title}
                      </Link>
                      <Progress value={r.reviewed} total={r.total} label="câu đã xem" />
                      <Link href={`${base}/bai/${r.id}`} className={btn.outlineSm}>
                        {r.reviewed ? "Duyệt tiếp" : "Duyệt"}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div id="bai-ve-nha">
            {t.homework.length ? (
              <OpenHomework rows={t.homework} state={state} today={today} />
            ) : (
              <div className={`${card} flex flex-wrap items-center gap-4 p-4`}>
                <span className="text-2xl" aria-hidden>📝</span>
                <div className="min-w-[200px] flex-1">
                  <p className="font-display font-bold">Chưa có bài về nhà nào đang chờ</p>
                  <p className="text-sm text-muted">Giao vài câu của bài ưu tiên để con luyện giữa hai buổi.</p>
                </div>
                <Link href={`${base}/giao`} className={btn.outline}>Giao bài</Link>
              </div>
            )}
          </div>

          <div className={`${card} flex flex-wrap items-center gap-4 p-4 ${t.sessionDue ? "border-star bg-star-soft" : ""}`} data-testid={t.sessionDue ? "todo-session" : undefined}>
            <span className="text-2xl" aria-hidden>🗓️</span>
            <div className="min-w-[200px] flex-1">
              <p className="font-display font-bold">{t.sessionDue ? `Chưa ghi buổi dạy ${dayLabel(t.sessionDue)}` : "Buổi dạy"}</p>
              <p className="text-sm text-muted">Sau buổi học: ghi bài đã dạy và mức con nắm — khoảng 1 phút.</p>
            </div>
            <Link href={`${base}/buoi`} className={t.sessionDue ? btn.primary : btn.outline}>Ghi buổi dạy</Link>
          </div>
        </section>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <TargetBoard board={board} compact href={`${base}/thi-thu`} />
          <div className={`${card} p-4`}>
            <div className="flex items-center">
              <h2 className={sectionTitle}>Ưu tiên luyện trước</h2>
              <Link href={`${base}/bai`} className="ml-auto font-display text-sm font-semibold text-accent hover:underline">Sửa</Link>
            </div>
            <ol className="mt-3 flex flex-col gap-2.5">
              {state.priorities.map((id) => {
                const r = byId.get(id);
                return (
                  <li key={id} className="flex items-start gap-2.5">
                    <span className="text-star" aria-hidden>★</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold leading-snug">{r?.title ?? id}</p>
                      <p className="font-mono text-xs text-muted">
                        {!r || r.status === "none" ? (
                          "chưa soạn"
                        ) : r.status === "approved" ? (
                          <>đã mở cho con · <Link href={`${base}/giao?unit=${id}&mode=items`} className="text-accent">Giao bài</Link></>
                        ) : (
                          <span className="text-warn">chờ cô duyệt · <Link href={`${base}/bai/${id}`} className="text-accent">Duyệt</Link></span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
              {!state.priorities.length && <li className="text-sm text-muted">Chưa đặt — bấm ☆ ở Kho bài.</li>}
            </ol>
          </div>
          <div className={`${card} p-4`} data-testid="week-summary">
            <h2 className={sectionTitle}>Tuần này của con</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Stat value={`${week.studyDays}/4`} label="buổi học" />
              <Stat value={`${week.practice.right}/${week.practice.total}`} label="câu luyện đúng" />
              <Stat value={String(week.reviews)} label="lượt ôn" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

const rank = (priorities: string[], id: string) => {
  const i = priorities.indexOf(id);
  return i < 0 ? 999 : i;
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-bg px-2 py-2.5">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="font-display text-xs text-muted">{label}</p>
    </div>
  );
}
