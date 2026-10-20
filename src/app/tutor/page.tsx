import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gia sư — App Toán" };

export default async function TutorHome() {
  const user = await requireRole("tutor");
  const supabase = await createClient();
  // RLS returns only students this tutor is actively assigned to, and only this tutor's sessions.
  const [{ data: students }, { data: sessions }] = await Promise.all([
    supabase.from("students").select("id, full_name, grade"),
    supabase
      .from("teaching_sessions")
      .select("student_id, taught_on")
      .eq("tutor_id", user.id)
      .order("taught_on", { ascending: false })
      .limit(50),
  ]);
  // One student (the usual case): straight into her workspace.
  if (students?.length === 1) redirect(`/tutor/${students[0].id}`);
  const lastLogged = new Map<string, string>();
  for (const s of sessions ?? []) if (!lastLogged.has(s.student_id)) lastLogged.set(s.student_id, s.taught_on);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-bold">Chào {user.displayName}</h1>
      <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Học sinh bạn đang dạy
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {(students ?? []).map((s) => {
          const last = lastLogged.get(s.id);
          return (
            <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-display font-semibold">{s.full_name}</p>
              <p className="mt-1 text-sm text-muted">
                Lớp {s.grade} · {last ? `buổi ghi gần nhất ${last.split("-").reverse().slice(0, 2).join("/")}` : "chưa ghi buổi nào"}
              </p>
              <Link
                href={`/tutor/${s.id}`}
                className="mt-4 block w-full rounded-lg bg-accent px-4 py-3 text-center font-display font-bold text-on-accent"
              >
                Mở bàn làm việc
              </Link>
            </li>
          );
        })}
        {!students?.length && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Bạn chưa được phân công học sinh nào. Liên hệ phụ huynh.
          </li>
        )}
      </ul>
    </div>
  );
}
