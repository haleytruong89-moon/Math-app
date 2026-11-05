import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { confirmLevel } from "@/app/parent/actions";
import { loadStudentState } from "@/lib/learning/state";
import { RULES, addDays, vnDate, type AttemptRow, type Level } from "@/lib/learning/rules";
import { needsTutor } from "@/lib/content/curriculum";
import { curriculum } from "@/lib/content";
import { currentPhase, lateUnits, milestoneProgress } from "@/lib/learning/milestones";
import { LateNotice, MilestoneCards } from "@/components/parent/milestones";
import {
  displayLevel, isoWeekday, latestByUnit, mismatchFlags, missedSessions, weekSummary,
  type AssignmentRow, type ConfirmationRow, type ProposalRow,
} from "@/lib/learning/overview";

const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
const DAY_NAME = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật"] as const;

/** One student's "Tổng quan" (S4). Reads through the parent's RLS client. */
export async function StudentOverview({ supabase, student }: { supabase: SupabaseClient; student: { id: string; full_name: string } }) {
  const id = student.id;
  const since = addDays(vnDate(), -14);
  const [state, proposals, confirmations, assignments, sessions, reviewLog, homework, profiles, aiFlags] = await Promise.all([
    loadStudentState(supabase, id),
    supabase.from("tutor_proposals").select("session_id, unit_id, level, tutor_id, created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(500),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(500),
    supabase.from("tutor_assignments").select("id, tutor_id, started_at, ended_at, weekdays").eq("student_id", id),
    supabase.from("teaching_sessions").select("id, tutor_id, taught_on, note").eq("student_id", id).order("taught_on", { ascending: false }).limit(200),
    supabase.from("review_log").select("created_at").eq("student_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("homework").select("created_at, done_at, reviewed_at").eq("student_id", id).order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("id, display_name"),
    // S8b: AI messages the student marked "AI nói sai?" in the last 14 days.
    supabase.from("ai_messages").select("id").eq("student_id", id).eq("flag", "student").gt("flagged_at", since).limit(50),
  ]);
  for (const r of [proposals, confirmations, assignments, sessions, reviewLog, homework]) if (r.error) console.error("StudentOverview", r.error.message);

  const today = state.today;
  const tutorName = new Map((profiles.data ?? []).map((p) => [p.id as string, p.display_name as string]));
  const sessionNote = new Map((sessions.data ?? []).map((s) => [s.id as string, s.note as string | null]));
  const confs = latestByUnit((confirmations.data ?? []) as ConfirmationRow[]);
  const units = state.units.map((u) => ({ u, shown: displayLevel(u.mastery.level, confs.get(u.unit.id), u.history) }));
  const flags = mismatchFlags(
    units.map(({ u, shown }) => ({ id: u.unit.id, system: u.mastery.level, confirmedLevel: shown.confirmed ? shown.level : null })),
    (proposals.data ?? []) as ProposalRow[],
    (confirmations.data ?? []) as ConfirmationRow[],
  );
  const missed = missedSessions((assignments.data ?? []) as AssignmentRow[], (sessions.data ?? []) as { tutor_id: string; taught_on: string }[], today);
  const week = weekSummary({
    attempts: state.units.flatMap((u) => u.attempts) as AttemptRow[],
    reviewLog: (reviewLog.data ?? []) as { created_at: string }[],
    sessions: (sessions.data ?? []) as { taught_on: string }[],
    homework: (homework.data ?? []) as { created_at: string; done_at: string | null; reviewed_at: string | null }[],
    today,
  });
  const m3 = units.filter((x) => x.shown.level >= 3).length;
  const overdue = state.units.filter((u) => u.review?.dueOn && u.review.dueOn < today).length;
  // S4b: milestones over the whole roadmap; a KU the student can't see yet counts at M0.
  const roadmap = curriculum();
  const visible = new Set(state.units.map((u) => u.unit.id));
  const milestoneInput = { levels: new Map(units.map(({ u, shown }) => [u.unit.id, shown.level as Level])), withContent: visible, today };
  const progress = milestoneProgress(roadmap, milestoneInput);
  const late = lateUnits(roadmap, milestoneInput);
  const lateIds = new Set(late.map((u) => u.id));
  const unitOf = (uid: string) => state.units.find((u) => u.unit.id === uid);
  const workHref = (uid?: string) => `/parent/students/${id}/work${uid ? `?unit=${uid}` : ""}`;

  return (
    <section className="mt-6" data-testid={`overview-${id}`} aria-label={`Tổng quan ${student.full_name}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{student.full_name}</h2>
        <Link href="/parent/bao-cao" className="text-sm text-accent hover:underline" data-testid="weekly-link">
          Báo cáo tuần →
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat testid="stat-m3" value={`${m3}/${state.units.length}`} label="Bài đạt M3 trở lên" href="#ban-do" />
        <Stat testid="stat-overdue" value={String(overdue)} label="Bài ôn quá hạn" href="#ban-do" warn={overdue > 0} />
        <Stat testid="stat-flags" value={String(flags.length)} label="Cờ lệch đánh giá cần chốt" href="#can-chu-y" warn={flags.length > 0} />
      </div>

      <MilestoneCards progress={progress} phase={currentPhase(roadmap.phases, today)} />

      <h3 id="can-chu-y" className="mt-8 font-display text-base font-semibold">Cần chú ý</h3>
      <ul className="mt-3 flex flex-col gap-3">
        {(aiFlags.data?.length ?? 0) > 0 && (
          <li className="rounded-xl border border-warn bg-surface p-4" data-testid="ai-flag-notice">
            <p className="font-display font-semibold">Con báo &ldquo;AI nói sai?&rdquo; {aiFlags.data!.length} lần (14 ngày qua)</p>
            <Link href="/parent/ai#bi-bao" className="mt-1 inline-block text-sm text-accent hover:underline">
              Đọc các tin bị báo →
            </Link>
          </li>
        )}
        {flags.map((f) => {
          const u = unitOf(f.unitId)!;
          const m = u.mastery;
          const evidence = [
            m.enoughData ? `${m.answers} câu đã làm` : `chưa đủ dữ liệu (${m.answers} câu)`,
            m.lastExit ? `kiểm tra gần nhất ${m.lastExit.right}/${m.lastExit.total}` : "chưa làm bài kiểm tra",
            m.practiceRate !== null ? `5 câu luyện gần nhất đúng ${Math.round(m.practiceRate * 100)}%` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const note = sessionNote.get(f.proposal.session_id);
          return (
            <li key={f.unitId} className="rounded-xl border border-warn bg-surface p-4" data-testid={`flag-${f.unitId}`}>
              <p className="font-display font-semibold">{u.unit.title}</p>
              <p className="mt-1 text-sm">
                {tutorName.get(f.proposal.tutor_id) ?? "Gia sư"} đề xuất <b>M{f.proposal.level}</b> ({ddmm(vnDate(f.proposal.created_at))}) · Hệ thống{" "}
                <b>M{f.system}</b>
              </p>
              <p className="mt-1 text-sm text-muted">{evidence}</p>
              {note && <p className="mt-1 text-sm text-muted">Ghi chú buổi dạy: “{note}”</p>}
              <Link href={workHref(f.unitId)} className="mt-1 inline-block text-sm text-accent hover:underline">
                Xem bài làm →
              </Link>
              <ActionForm action={confirmLevel} submitLabel="Chốt mức" className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="studentId" value={id} />
                <input type="hidden" name="unitId" value={f.unitId} />
                <label className={`${labelClass} w-28`}>
                  Mức
                  <select name="level" defaultValue={String(f.proposal.level)} className={inputClass}>
                    {[0, 1, 2, 3, 4].map((l) => (
                      <option key={l} value={l}>
                        M{l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${labelClass} min-w-48 flex-1`}>
                  Ghi chú (không bắt buộc)
                  <input name="note" maxLength={300} className={inputClass} />
                </label>
              </ActionForm>
            </li>
          );
        })}
        {missed.map((m) => (
          <li key={`${m.assignmentId}-${m.date}`} className="rounded-xl border border-border bg-surface p-4 text-sm" data-testid="missed">
            <b>
              {DAY_NAME[isoWeekday(m.date) - 1]} {ddmm(m.date)}
            </b>
            : {tutorName.get(m.tutorId) ?? "Gia sư"} chưa ghi buổi dạy.
          </li>
        ))}
        <LateNotice late={late} visible={visible} />
        {!flags.length && !missed.length && !late.length && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có gì cần chú ý.</li>
        )}
      </ul>

      <h3 id="ban-do" className="mt-8 font-display text-base font-semibold">Các bài</h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Bản đồ các bài">
        {units.map(({ u, shown }) => (
          <li key={u.unit.id} data-testid={`unit-${u.unit.id}`}>
            <Link
              href={workHref(u.unit.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 hover:border-accent ${lateIds.has(u.unit.id) ? "border-warn bg-warn-soft" : "border-border bg-surface"}`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[shown.level as Level]} ${shown.level >= 2 ? "text-on-accent" : "text-ink"}`}
              >
                M{shown.level}
              </span>
              <span className="min-w-0 text-sm leading-tight">
                {u.unit.title}
                <span className="block font-mono text-[11px] text-muted">
                  {u.mastery.enoughData ? `${u.mastery.answers} câu đã làm` : "chưa đủ dữ liệu"}
                  {shown.confirmed && " · bố mẹ chốt"}
                  {u.entry && needsTutor(u.entry) && <span className="text-warn" data-testid="tutor-badge"> · cần gia sư xác nhận</span>}
                  {u.review?.dueOn && u.review.dueOn < today && " · ôn quá hạn"}
                  {lateIds.has(u.unit.id) && <span className="text-warn" data-testid="late-badge"> · trễ lịch</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-display text-base font-semibold">Tuần này</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3" data-testid="week">
        <Fact label="Buổi học" value={`${Math.min(week.studyDays, RULES.weeklyGoalDays)}/${RULES.weeklyGoalDays}`} />
        <Fact label="Bài kiểm tra đã nộp" value={week.exits} />
        <Fact label="Lượt ôn đã xong" value={week.reviews} />
        <Fact label="Buổi dạy đã ghi" value={week.sessions} />
        <Fact label="Bài về nhà (giao / xong / chữa)" value={`${week.homeworkGiven} / ${week.homeworkDone} / ${week.homeworkReviewed}`} />
      </dl>
      {(assignments.data ?? []).some((a) => !a.ended_at && !(a.weekdays as number[]).length) && (
        <p className="mt-3 text-xs text-muted">
          Chưa đặt lịch dạy nên app chưa nhắc được buổi dạy chưa ghi — đặt ở{" "}
          <Link href="/parent/accounts" className="text-accent underline">
            Tài khoản
          </Link>
          .
        </p>
      )}
    </section>
  );
}

function Stat({ value, label, href, warn = false, testid }: { value: string; label: string; href: string; warn?: boolean; testid: string }) {
  return (
    <a href={href} className="rounded-xl border border-border bg-surface p-4 hover:border-accent" data-testid={testid}>
      <div className={`font-display text-3xl font-bold tabular-nums ${warn ? "text-warn" : ""}`}>{value}</div>
      <div className="mt-1.5 text-sm text-muted">{label}</div>
    </a>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-base tabular-nums">{value}</dd>
    </div>
  );
}
