import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gia sư — App Toán" };

// P0 shell. "Ghi buổi dạy" (mockup) arrives in P1 together with the module's KU list.
export default async function TutorHome() {
  const user = await requireRole("tutor");
  const supabase = await createClient();
  // RLS returns only students this tutor is actively assigned to.
  const { data: students } = await supabase.from("students").select("id, full_name, grade");

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Chào {user.displayName}</h1>
      <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Học sinh bạn đang dạy
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {(students ?? []).map((s) => (
          <li key={s.id} className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display font-semibold">{s.full_name}</p>
            <p className="mt-1 text-sm text-muted">Lớp {s.grade}</p>
            <button
              disabled
              className="mt-4 w-full rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent opacity-50"
            >
              Ghi buổi dạy
            </button>
            <p className="mt-2 text-center font-mono text-xs text-muted">Mở khi có module Hệ thức lượng (P1)</p>
          </li>
        ))}
        {!students?.length && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Bạn chưa được phân công học sinh nào. Liên hệ phụ huynh.
          </li>
        )}
      </ul>
    </>
  );
}
