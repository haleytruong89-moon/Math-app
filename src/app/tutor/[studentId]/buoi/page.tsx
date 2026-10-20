import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit } from "@/lib/content";
import { addDays, vnDate } from "@/lib/learning/rules";
import { SESSION_RULES } from "@/lib/learning/session";
import { loadStudentState } from "@/lib/learning/state";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { SessionShort, type ChipUnit } from "@/components/tutor/session-short";

export const metadata: Metadata = { title: "Buổi dạy — App Toán" };

const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

// Mockup artboard 5 (S11): the short session form + the tutor's recent sessions.
export default async function SessionPage(props: PageProps<"/tutor/[studentId]/buoi">) {
  const tutor = await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  // RLS: only returns the student while this tutor is actively assigned.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

  const [state, sessions, confRows] = await Promise.all([
    loadStudentState(supabase, student.id, { includeDrafts: true }),
    supabase.from("teaching_sessions").select("id, taught_on, note, created_at").eq("student_id", student.id).eq("tutor_id", tutor.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", student.id).limit(500),
  ]);
  const confs = latestByUnit((confRows.data ?? []) as ConfirmationRow[]);
  const ids = (sessions.data ?? []).map((s) => s.id as string);
  const { data: proposals } = ids.length
    ? await supabase.from("tutor_proposals").select("session_id, unit_id, level, system_level").in("session_id", ids)
    : { data: [] };

  const units: ChipUnit[] = state.roadmap.map(({ entry, state: u, level }) => {
    const last = u?.attempts.filter((a) => a.mode !== "faded").at(-1);
    const c = confs.get(entry.id);
    return {
      id: entry.id,
      title: entry.title,
      group: state.priorities.includes(entry.id) ? "priority" : u?.inProgress ? "progress" : "other",
      level,
      answers: u?.mastery.answers ?? 0,
      enoughData: !!u?.mastery.enoughData,
      lastExit: u?.mastery.lastExit ? `${u.mastery.lastExit.right}/${u.mastery.lastExit.total}` : null,
      practiceRate: u?.mastery.practiceRate ?? null,
      lastActive: last ? ddmm(vnDate(last.created_at)) : null,
      confirmed: u && c && displayLevel(u.mastery.level, c, u.history).confirmed ? `M${c.level} (${ddmm(vnDate(c.created_at))})` : null,
      needsTutor: entry.grading === "partial" || entry.grading === "tutor",
      inApp: !!u && u.unit.status === "approved",
    };
  });
  const order = (u: ChipUnit) => (u.group === "priority" ? state.priorities.indexOf(u.id) : 0);
  units.sort((a, b) => order(a) - order(b));
  const today = vnDate();

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="buoi" />
      <SessionShort studentId={student.id} today={today} minDate={addDays(today, -SESSION_RULES.maxBackdateDays)} units={units} />
      <section className="mx-auto mt-8 max-w-3xl">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Buổi bạn đã ghi gần đây</h2>
        <ul className="mt-3 flex flex-col gap-2" aria-label="Buổi đã ghi">
          {(sessions.data ?? []).map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-surface p-3.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-display font-semibold">Ngày {ddmm(s.taught_on as string)}</span>
                <span className="font-mono text-xs text-muted">
                  ghi lúc {new Date(s.created_at as string).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })} {ddmm(vnDate(s.created_at as string))}
                </span>
              </div>
              {(proposals ?? [])
                .filter((p) => p.session_id === s.id)
                .map((p) => (
                  <p key={p.unit_id} className="mt-1">
                    {getUnit(p.unit_id)?.unit.title ?? p.unit_id}: <span className="font-mono">đề xuất M{p.level} · hệ thống M{p.system_level}</span>
                  </p>
                ))}
              {s.note && <p className="mt-1 text-muted">“{s.note}”</p>}
            </li>
          ))}
          {!sessions.data?.length && <li className="rounded-xl border border-dashed border-border p-3.5 text-sm text-muted">Chưa có buổi nào.</li>}
        </ul>
        <Link href={`/tutor/${student.id}/work`} className="mt-3 inline-block text-sm text-accent hover:underline">Xem bài làm của con →</Link>
      </section>
    </>
  );
}
