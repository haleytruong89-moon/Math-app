import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { dueReviews, loadStudentState, type StudentState, type UnitState } from "@/lib/learning/state";
import { RULES, daysBetween } from "@/lib/learning/rules";
import { giveConsent, setHomeworkDone } from "./actions";
import { dueLabel, visibleHomework, type HomeworkRow } from "@/lib/learning/homework";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };

// Mockup "Hôm nay cần làm" (§2.7): weekly goal, progress map, then today's list —
// reviews first, then units in progress, then the next new unit. No streaks (D17).
export default async function StudentHome() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("students")
    .select("id, full_name, consent_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Acceptance criterion (§2.7): no way past this screen until consent is recorded.
  if (!me?.consent_at) return <ConsentScreen name={user.displayName} />;

  const [state, hw] = await Promise.all([
    loadStudentState(supabase, me.id),
    supabase
      .from("homework")
      .select("id, task, links, due_on, done_at, reviewed_at, review_note")
      .eq("student_id", me.id)
      .order("due_on", { ascending: true })
      .limit(50),
  ]);
  if (hw.error) console.error("StudentHome homework", hw.error.message);
  const homework = visibleHomework((hw.data ?? []) as HomeworkRow[], new Date());
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold">Chào {user.displayName}</h1>
        <span className="font-mono text-xs text-muted">{today}</span>
      </div>
      <WeeklyGoal days={state.studyDays} />
      <ProgressMap units={state.units} />
      <h2 className="mt-8 font-display text-base font-semibold">Hôm nay cần làm</h2>
      <TodayList state={state} homework={homework} />
    </>
  );
}

function WeeklyGoal({ days }: { days: number }) {
  const goal = RULES.weeklyGoalDays;
  const pct = Math.min(100, Math.round((days / goal) * 100));
  return (
    <div className="mt-5 rounded-xl border border-border bg-surface p-4">
      <div className="flex justify-between text-sm">
        <span>Mục tiêu tuần này</span>
        <span className="font-mono tabular-nums">
          {Math.min(days, goal)}/{goal} buổi{days > goal ? ` (+${days - goal})` : ""}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent-soft" role="progressbar" aria-valuenow={days} aria-valuemin={0} aria-valuemax={goal} aria-label="Mục tiêu tuần">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;

function ProgressMap({ units }: { units: UnitState[] }) {
  if (!units.length) return null;
  return (
    <div className="mt-4 grid grid-cols-2 gap-2" role="list" aria-label="Bản đồ tiến độ">
      {units.map((u) => (
        <div key={u.unit.id} role="listitem" className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-2.5">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[u.mastery.level]} ${u.mastery.level >= 2 ? "text-on-accent" : "text-ink"}`}
          >
            M{u.mastery.level}
          </span>
          <span className="min-w-0 text-sm leading-tight">
            {u.unit.title}
            <span className="block font-mono text-[11px] text-muted">
              {u.mastery.enoughData ? `${u.mastery.answers} câu đã làm` : "chưa đủ dữ liệu"}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function TodayCard({ title, badge, badgeCls, note, minutes, href, cta }: {
  title: string; badge: string; badgeCls: string; note: string; minutes: number; href: string; cta: string;
}) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-semibold leading-snug">{title}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs ${badgeCls}`}>{badge}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted">~{minutes} phút</span>
        <Link href={href} className="rounded-lg bg-accent px-4 py-2 font-display text-sm font-bold text-on-accent">
          {cta}
        </Link>
      </div>
    </li>
  );
}

function TodayList({ state, homework }: { state: StudentState; homework: HomeworkRow[] }) {
  if (!state.units.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Chưa có bài nào được mở. Bố mẹ sẽ mở bài mới sau khi duyệt nội dung.
      </div>
    );
  }

  const due = dueReviews(state);
  const inProgress = state.units.filter((u) => u.workedViewed && u.mastery.level < 3 && !u.review);
  const nextNew = state.units.find((u) => !u.workedViewed);
  const questions = due.length * RULES.reviewItemsPerUnit;
  const overdue = due.filter((u) => daysBetween(u.review!.dueOn!, state.today) > 0).length;

  const cards: React.ReactNode[] = [];
  if (due.length) {
    cards.push(
      <TodayCard
        key="review"
        title={due.length === 1 ? due[0].unit.title : `Ôn lại ${due.length} bài`}
        badge="Ôn lại"
        badgeCls="bg-accent-soft text-accent"
        note={`${questions} câu${due.length > 1 ? `, trộn ${due.map((u) => `“${u.unit.title}”`).join(", ")}` : ""}${overdue ? ` · ${overdue} bài quá hạn` : ""}`}
        minutes={Math.ceil(questions * 1.5)}
        href="/student/review"
        cta="Bắt đầu ôn"
      />,
    );
  }
  for (const h of homework) cards.push(<HomeworkCard key={h.id} h={h} today={state.today} />);
  for (const u of inProgress) {
    cards.push(
      <TodayCard
        key={u.unit.id}
        title={u.unit.title}
        badge="Đang học"
        badgeCls="bg-m1 text-ink"
        note={!u.fadedDone ? "Tiếp tục phần điền bước" : u.mastery.lastExit ? "Làm lại luyện tập rồi kiểm tra lại" : "Luyện tập rồi làm bài kiểm tra"}
        minutes={u.unit.estMinutes}
        href={`/student/learn/${u.unit.id}`}
        cta="Học tiếp"
      />,
    );
  }
  if (nextNew) {
    cards.push(
      <TodayCard
        key={nextNew.unit.id}
        title={nextNew.unit.title}
        badge="Bài mới"
        badgeCls="bg-warn-soft text-warn"
        note="Xem lời giải mẫu trước khi tự làm"
        minutes={nextNew.unit.estMinutes}
        href={`/student/learn/${nextNew.unit.id}`}
        cta="Học bài mới"
      />,
    );
  }

  if (!cards.length) {
    const upcoming = state.units
      .map((u) => u.review?.dueOn)
      .filter((d): d is string => !!d)
      .sort()[0];
    return (
      <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm">
        Hôm nay không có bài bắt buộc. Nghỉ ngơi cũng được!
        {upcoming && <span className="text-muted"> Lượt ôn tiếp theo: {upcoming.split("-").reverse().join("/")}.</span>}
      </div>
    );
  }
  return <ul className="mt-3 flex flex-col gap-3">{cards}</ul>;
}

function HomeworkCard({ h, today }: { h: HomeworkRow; today: string }) {
  const due = dueLabel(h.due_on, today);
  const late = !h.done_at && !h.reviewed_at && due.startsWith("quá hạn");
  return (
    <li className="rounded-xl border border-border bg-surface p-4" data-testid="homework-card">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-semibold leading-snug">Bài về nhà của thầy/cô</p>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-xs text-accent">
          {h.reviewed_at ? "Đã chữa" : h.done_at ? "Con đã làm xong" : "Bài về nhà"}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line">{h.task}</p>
      {h.links.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-3 text-sm">
          {h.links.map((l, i) => (
            <a key={l + i} href={l} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Mở đề{h.links.length > 1 ? ` ${i + 1}` : ""} ↗
            </a>
          ))}
        </p>
      )}
      <p className={`mt-2 font-mono text-xs ${late ? "text-warn" : "text-muted"}`}>{due}</p>
      {h.reviewed_at ? (
        <p className="mt-2 text-sm">
          <b className="text-good">Thầy/cô đã chữa</b>
          {h.review_note && <span className="whitespace-pre-line">: “{h.review_note}”</span>}
        </p>
      ) : (
        <ActionForm
          action={setHomeworkDone}
          submitLabel={h.done_at ? "Bỏ đánh dấu xong" : "Con làm xong rồi"}
          variant={h.done_at ? "quiet" : "primary"}
          className="mt-3"
        >
          <input type="hidden" name="homeworkId" value={h.id} />
          <input type="hidden" name="done" value={h.done_at ? "0" : "1"} />
        </ActionForm>
      )}
    </li>
  );
}

function ConsentScreen({ name }: { name: string }) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Chào {name} 👋</h1>
      <p className="mt-3">Trước khi bắt đầu, con đọc kỹ mấy điều này nhé:</p>
      <ul className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-[15px] leading-relaxed">
        <li><b>App ghi lại</b> bài con làm, điểm, thời gian làm bài và các câu con hỏi AI.</li>
        <li><b>Ai xem được:</b> bố mẹ và gia sư đang dạy con. Không ai khác.</li>
        <li><b>Để làm gì:</b> biết con đã hiểu phần nào, phần nào cần ôn — không phải để chấm điểm hay so sánh con với ai.</li>
        <li><b>Không có</b> bảng xếp hạng hay chuỗi ngày học liên tục. Nghỉ một hôm cũng không sao.</li>
        <li>Con có thắc mắc hoặc không muốn ghi điều gì, cứ nói với bố mẹ.</li>
      </ul>
      <ActionForm action={giveConsent} submitLabel="Bắt đầu" className="mt-6 flex flex-col gap-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="agree" className="mt-1 size-5 accent-[var(--accent)]" />
          <span>Con đã đọc và đồng ý dùng app như trên.</span>
        </label>
      </ActionForm>
    </>
  );
}
