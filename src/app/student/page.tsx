import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { loadStudentState, todaysReview, type StudentState, type UnitState } from "@/lib/learning/state";
import { RULES, addDays, daysBetween, vnDate } from "@/lib/learning/rules";
import { giveConsent, setHomeworkDone } from "./actions";
import { dueLabel, studentHomework, type HomeworkRow } from "@/lib/learning/homework";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { HomeHeader } from "@/components/student/home-header";
import { needsTutor } from "@/lib/content/curriculum";
import { masteryOf } from "@/components/student/mastery";
import { studentDrills } from "@/lib/learning/drills";
import { loadMockExams } from "@/lib/learning/mock-data";
import { pts, upcomingForStudent, type MockExamRow } from "@/lib/learning/mock";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };

// Mockup "Hôm nay cần làm" (§2.7, student UX 2026-10-05): greeting header with the weekly ring,
// grouped list (reviews → homework → in progress → next new unit), journey teaser. No streaks (D17).
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

  const cols = "id, unit_id, items, task, links, due_on, done_at, reviewed_at, review_note";
  const [state, open, recent, confRows, drillRows, mocks] = await Promise.all([
    loadStudentState(supabase, me.id),
    supabase.from("homework").select(cols).eq("student_id", me.id).is("reviewed_at", null).limit(50),
    supabase.from("homework").select(cols).eq("student_id", me.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", me.id).limit(500),
    studentDrills(supabase, me.id),
    loadMockExams(supabase, me.id),
  ]);
  const confs = latestByUnit((confRows.data ?? []) as ConfirmationRow[]);
  for (const r of [open, recent]) if (r.error) console.error("StudentHome homework", r.error.message);
  const homework = studentHomework((open.data ?? []) as HomeworkRow[], (recent.data ?? []) as HomeworkRow[], new Date());
  const shown = new Map(
    state.units.map((u) => [
      u.unit.id,
      displayLevel(u.mastery.level, confs.get(u.unit.id), u.history).level,
    ]),
  );
  const m3 = [...shown.values()].filter((l) => l >= 3).length;
  return (
    <>
      <HomeHeader name={user.displayName} days={state.studyDays} now={new Date()} />
      <MockCard exams={mocks} today={vnDate()} />
      <h2 className="mt-6 text-base font-semibold">Hôm nay cần làm</h2>
      <TodayList state={state} homework={homework} shown={shown} />
      {state.units.length > 0 && <JourneyTeaser m3={m3} total={state.units.length} />}
      {drillRows.length > 0 && <DrillTeaser rows={drillRows.map((r) => r.state.status)} />}
    </>
  );
}

const WEEKDAY = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** Thi thử (S9): the paper coming up (from 3 days before) or running; else a recent result (14 days). */
function MockCard({ exams, today }: { exams: MockExamRow[]; today: string }) {
  const up = upcomingForStudent(exams, today);
  if (up) {
    const d = up.scheduled_on;
    return (
      <Link href={`/student/thi-thu/${up.paper}`} className="mt-5 flex items-center gap-3.5 rounded-2xl border-2 border-accent bg-accent-soft px-4 py-3.5" data-testid="mock-card">
        <span className="min-w-0 flex-1">
          <span className="block font-display font-bold">{up.started_at ? `Đang làm Đề ${up.paper}` : `Thi thử Đề ${up.paper}`}</span>
          <span className="block text-sm text-muted">
            {up.started_at ? "Mở để xem đồng hồ và nộp bài" : `${WEEKDAY[new Date(`${d}T00:00:00Z`).getUTCDay()]} ${d.slice(8)}/${d.slice(5, 7)} · 120 phút · làm trên giấy`}
          </span>
        </span>
        <span aria-hidden className="text-accent">→</span>
      </Link>
    );
  }
  const last = exams.filter((e) => e.graded_at && e.graded_at.slice(0, 10) >= addDays(today, -14)).sort((a, b) => (b.graded_at ?? "").localeCompare(a.graded_at ?? ""))[0];
  if (!last) return null;
  return (
    <Link href={`/student/thi-thu/${last.paper}`} className="mt-5 flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5" data-testid="mock-result-card">
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold">Kết quả thi thử Đề {last.paper}: {pts(last.total ?? 0)}/10</span>
        <span className="block text-sm text-muted">Xem điểm từng ý và bài cần ôn</span>
      </span>
      <span aria-hidden className="text-accent">→</span>
    </Link>
  );
}

/** Luyện đề 4.2: how many problems wait for her now (new, started, due again). */
function DrillTeaser({ rows }: { rows: string[] }) {
  const now = rows.filter((s) => s === "new" || s === "doing" || s === "redo").length;
  const done = rows.filter((s) => s === "done").length;
  return (
    <Link href="/student/luyen-de" className="mt-3 flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5" data-testid="drill-teaser">
      <span aria-hidden>📐</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">Luyện đề hình</span>
        <span className="block text-xs text-muted">{now ? `${now} bài đang chờ con` : "Chưa có bài mới"} · đã xong {done}</span>
      </span>
      <span className="text-[11px] font-medium text-accent">Mở →</span>
    </Link>
  );
}

function JourneyTeaser({ m3, total }: { m3: number; total: number }) {
  return (
    <Link href="/student/journey" className="mt-5 flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5" data-testid="journey-teaser">
      <span className="flex flex-1 items-center gap-1.5">
        <span aria-hidden>🌱</span>
        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${total ? (m3 / total) * 100 : 0}%`, background: "linear-gradient(90deg,#34D399,#0D9488)" }} />
        </span>
        <span aria-hidden>⭐</span>
      </span>
      <span className="text-right">
        <span className="block text-xs font-semibold">
          {m3}/{total} bài đạt M3+
        </span>
        <span className="block text-[11px] font-medium text-accent">Xem hành trình →</span>
      </span>
    </Link>
  );
}

const GROUP = {
  review: { label: "Ôn lại", cls: "bg-warn-soft text-warn" },
  homework: { label: "Bài về nhà", cls: "bg-good-soft text-good" },
  progress: { label: "Đang học", cls: "bg-accent-soft text-accent" },
  new: { label: "Bài mới", cls: "bg-[#DBEAFE] text-[#1D4ED8]" },
} as const;

function Group({ kind, note, children }: { kind: keyof typeof GROUP; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-3" aria-label={GROUP[kind].label}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${GROUP[kind].cls}`}>{GROUP[kind].label}</span>
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function TodayCard({ title, level, note, minutes, href, cta, extra, tutor }: {
  title: string; level: number; note: string; minutes: number; href: string; cta: string;
  extra?: { href: string; label: string };
  /** LT6: part of this KU is checked on paper by the tutor. */
  tutor?: boolean;
}) {
  const m = masteryOf(level);
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl text-lg" style={{ background: `linear-gradient(135deg,${m.from},${m.to})` }}>
          {m.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug">{title}</span>
          {tutor && <span className="mt-0.5 inline-block rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn" data-testid="tutor-badge">Cần gia sư xác nhận</span>}
          <span className="block text-xs text-muted">
            {note} · ~{minutes} phút
          </span>
        </span>
        <span className="font-mono text-[11px] font-semibold text-muted">M{level}</span>
      </div>
      <Link href={href} className="mt-3 block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-on-accent">
        {cta}
      </Link>
      {extra && (
        <Link href={extra.href} className="mt-2 block rounded-xl border border-accent px-4 py-2 text-center text-sm font-semibold text-accent">
          {extra.label}
        </Link>
      )}
    </li>
  );
}

function TodayList({ state, homework, shown }: { state: StudentState; homework: HomeworkRow[]; shown: Map<string, number> }) {
  if (!state.units.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Chưa có bài nào được mở. Bố mẹ sẽ mở bài mới sau khi duyệt nội dung.
      </div>
    );
  }

  // LT8: at most 5 units, one session a day. LT3: up to 2 suggestions (track A + track B/C), none with 2 in progress.
  const { units: due, later } = todaysReview(state);
  const inProgress = state.units.filter((u) => u.inProgress);
  // Order 01/11: "Cần tập trung" — every open, not-yet-mastered KU the tutor/parent starred (★), grouped by
  // chủ đề. The child picks one; nothing is forced. Shown above "Bài mới" and deduped from it.
  const focusIds = new Set(state.priorities);
  const focus = state.priorities
    .map((id) => state.units.find((u) => u.unit.id === id))
    .filter((u): u is UnitState => !!u && u.status === "open" && !u.inProgress && (shown.get(u.unit.id) ?? u.mastery.level) < 3);
  const suggestions = state.suggestions.filter((u) => !focusIds.has(u.unit.id));
  const questions = due.length * RULES.reviewItemsPerUnit;
  const overdue = due.filter((u) => daysBetween(u.review!.dueOn!, state.today) > 0).length;

  const levelOf = (u: UnitState) => shown.get(u.unit.id) ?? u.mastery.level;
  const cards: React.ReactNode[] = [];
  if (due.length) {
    cards.push(
      <Group key="g-review" kind="review" note={`${due.length} bài đến hạn${later ? ` · còn ${later} bài, ôn ngày mai` : ""}`}>
        <TodayCard
          title={due.length === 1 ? due[0].unit.title : `Ôn lại ${due.length} bài`}
          level={Math.min(...due.map(levelOf))}
          note={`${questions} câu${due.length > 1 ? `, trộn ${due.map((u) => `“${u.unit.title}”`).join(", ")}` : ""}${overdue ? ` · ${overdue} bài quá hạn` : ""}`}
          minutes={Math.ceil(questions * 1.5)}
          href="/student/review"
          cta="Bắt đầu ôn"
        />
      </Group>,
    );
  }
  if (!due.length && later)
    cards.push(
      <Group key="g-review-later" kind="review" note={`Hôm nay con đã ôn xong. Còn ${later} bài, ôn ngày mai.`}>
        {null}
      </Group>,
    );
  if (homework.length)
    cards.push(
      <Group key="g-homework" kind="homework">
        {homework.map((h) => <HomeworkCard key={h.id} h={h} today={state.today} unit={h.unit_id ? state.units.find((u) => u.unit.id === h.unit_id && (u.status === "open" || !!h.items?.length)) : undefined} />)}
      </Group>,
    );
  if (inProgress.length)
    cards.push(
      <Group key="g-progress" kind="progress">
        {inProgress.map((u) => (
          <TodayCard
            key={u.unit.id}
            title={u.unit.title}
            level={levelOf(u)}
            note={!u.fadedDone ? "Tiếp tục phần điền bước" : u.mastery.lastExit ? "Làm lại luyện tập rồi kiểm tra lại" : "Luyện tập rồi làm bài kiểm tra"}
            minutes={u.unit.estMinutes}
            href={`/student/learn/${u.unit.id}`}
            cta="Học tiếp"
            tutor={!!u.entry && needsTutor(u.entry)}
          />
        ))}
      </Group>,
    );
  if (focus.length) {
    const byModule: { title: string; list: UnitState[] }[] = [];
    for (const u of focus) {
      const g = byModule.find((x) => x.title === u.moduleTitle);
      if (g) g.list.push(u);
      else byModule.push({ title: u.moduleTitle, list: [u] });
    }
    cards.push(
      <section key="g-focus" className="mt-3" aria-label="Cần tập trung" data-testid="focus-group">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-star-soft px-2.5 py-0.5 text-[11px] font-bold text-star">★ Cần tập trung</span>
          <span className="text-xs text-muted">Thầy/cô và bố mẹ gợi ý · con chọn bài để học, không bắt buộc</span>
        </div>
        <div className="flex flex-col gap-3">
          {byModule.map((g) => (
            <div key={g.title}>
              {byModule.length > 1 && <p className="mb-1 text-xs font-semibold text-muted">{g.title}</p>}
              <ul className="flex flex-col gap-2">
                {g.list.map((u) => (
                  <TodayCard
                    key={u.unit.id}
                    title={u.unit.title}
                    level={levelOf(u)}
                    note="Xem lời giải mẫu trước khi tự làm"
                    minutes={u.unit.estMinutes}
                    href={`/student/learn/${u.unit.id}`}
                    cta="Học bài này"
                    tutor={!!u.entry && needsTutor(u.entry)}
                    extra={u.entry?.testOut && !u.testout.tried ? { href: `/student/learn/${u.unit.id}?testout=1`, label: "Đã biết rồi? Làm bài kiểm tra luôn" } : undefined}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>,
    );
  }
  if (suggestions.length)
    cards.push(
      <Group key="g-new" kind="new" note={suggestions.length > 1 ? "Chọn 1 bài" : undefined}>
        {suggestions.map((u) => (
          <TodayCard
            key={u.unit.id}
            title={u.unit.title}
            level={levelOf(u)}
            note="Xem lời giải mẫu trước khi tự làm"
            minutes={u.unit.estMinutes}
            href={`/student/learn/${u.unit.id}`}
            cta="Học bài mới"
            tutor={!!u.entry && needsTutor(u.entry)}
            extra={u.entry?.testOut && !u.testout.tried ? { href: `/student/learn/${u.unit.id}?testout=1`, label: "Đã biết rồi? Làm bài kiểm tra luôn" } : undefined}
          />
        ))}
      </Group>,
    );

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
  return <div>{cards}</div>;
}

function HomeworkCard({ h, today, unit }: { h: HomeworkRow; today: string; unit?: UnitState }) {
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
      {unit && !h.reviewed_at && (
        <Link
          href={h.items?.length ? `/student/homework/${h.id}` : `/student/learn/${unit.unit.id}`}
          className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm"
          data-testid="homework-app-link"
        >
          <span>
            {/* T9: hand-picked items open on their own page, no worked example needed first. */}
            <span className="block text-xs text-muted">{h.items?.length ? `Làm ${h.items.length} câu trên app` : "Làm trên app"}</span>
            <b className="font-display">{unit.unit.title}</b>
          </span>
          <span aria-hidden className="text-accent">→</span>
        </Link>
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
