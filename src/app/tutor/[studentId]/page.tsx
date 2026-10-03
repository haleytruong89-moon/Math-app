import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit } from "@/lib/content";
import { addDays, vnDate } from "@/lib/learning/rules";
import { SESSION_RULES } from "@/lib/learning/session";
import { loadStudentState } from "@/lib/learning/state";
import { SessionForm, type UnitEvidence } from "@/components/tutor/session-form";

export const metadata: Metadata = { title: "Ghi buổi dạy — App Toán" };

const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

// Mockup "Ghi buổi dạy" (§2.7): one phone screen — date → tick units → evidence → level → note → save.
export default async function LogSessionPage(props: PageProps<"/tutor/[studentId]">) {
  const tutor = await requireRole("tutor");
  const { studentId } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();

  const supabase = await createClient();
  // RLS: only returns the student while this tutor is actively assigned.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

  const [state, sessions] = await Promise.all([
    loadStudentState(supabase, student.id, { includeDrafts: true }),
    supabase
      .from("teaching_sessions")
      .select("id, taught_on, note, created_at")
      .eq("student_id", student.id)
      .eq("tutor_id", tutor.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const ids = (sessions.data ?? []).map((s) => s.id as string);
  const { data: proposals } = ids.length
    ? await supabase.from("tutor_proposals").select("session_id, unit_id, level, system_level").in("session_id", ids)
    : { data: [] };

  const units: UnitEvidence[] = state.units.map((u) => {
    const last = u.attempts.filter((a) => a.mode !== "faded").at(-1);
    return {
      id: u.unit.id,
      title: u.unit.title,
      moduleTitle: u.moduleTitle,
      draft: u.unit.status !== "approved",
      level: u.mastery.level,
      answers: u.mastery.answers,
      enoughData: u.mastery.enoughData,
      lastExit: u.mastery.lastExit ? `${u.mastery.lastExit.right}/${u.mastery.lastExit.total}` : null,
      practiceRate: u.mastery.practiceRate,
      lastActive: last ? ddmm(vnDate(last.created_at)) : null,
    };
  });

  const today = vnDate();
  return (
    <>
      <Link href="/tutor" className="text-sm text-accent hover:underline">← Học sinh</Link>
      <h1 className="mt-2 font-display text-2xl font-bold">Ghi buổi dạy</h1>
      <p className="mt-1 text-muted">{student.full_name}</p>

      <SessionForm studentId={student.id} today={today} minDate={addDays(today, -SESSION_RULES.maxBackdateDays)} units={units} />

      <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-muted">Buổi bạn đã ghi gần đây</h2>
      <ul className="mt-3 flex flex-col gap-2" aria-label="Buổi đã ghi">
        {(sessions.data ?? []).map((s) => {
          const ps = (proposals ?? []).filter((p) => p.session_id === s.id);
          return (
            <li key={s.id} className="rounded-xl border border-border bg-surface p-3.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-display font-semibold">Ngày {ddmm(s.taught_on as string)}</span>
                <span className="font-mono text-xs text-muted">
                  ghi lúc{" "}
                  {new Date(s.created_at as string).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}{" "}
                  {ddmm(vnDate(s.created_at as string))}
                </span>
              </div>
              {ps.map((p) => (
                <p key={p.unit_id} className="mt-1">
                  {getUnit(p.unit_id)?.unit.title ?? p.unit_id}:{" "}
                  <span className="font-mono">
                    đề xuất M{p.level} · hệ thống M{p.system_level}
                  </span>
                </p>
              ))}
              {s.note && <p className="mt-1 text-muted">“{s.note}”</p>}
            </li>
          );
        })}
        {!sessions.data?.length && (
          <li className="rounded-xl border border-dashed border-border p-3.5 text-sm text-muted">Chưa có buổi nào.</li>
        )}
      </ul>
    </>
  );
}
