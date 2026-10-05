import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { StudentOverview } from "@/components/parent/student-overview";

export const metadata: Metadata = { title: "Tổng quan — App Toán" };

// Mockup "Tổng quan" (§2.7, S4): one overview per student, then the student list.

export default async function ParentHome() {
  await requireRole("parent");
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, grade, consent_at")
    .order("created_at");

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Tổng quan</h1>

      {(students ?? []).map((s) => (
        <StudentOverview key={s.id} supabase={supabase} student={s} />
      ))}

      <h2 className="mt-10 font-display text-base font-semibold">Học sinh</h2>
      <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
        {(students ?? []).map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span>
              {s.full_name} <span className="text-sm text-muted">· lớp {s.grade}</span>
            </span>
            <span className={`font-mono text-xs ${s.consent_at ? "text-good" : "text-warn"}`}>
              {s.consent_at ? "Đã đồng ý dùng app" : "Chưa xác nhận đồng ý (D18)"}
            </span>
            <Link href={`/parent/students/${s.id}/work`} className="text-sm text-accent hover:underline">
              Xem bài làm
            </Link>
          </li>
        ))}
        {!students?.length && <li className="px-4 py-3 text-sm text-muted">Chưa có học sinh.</li>}
      </ul>
    </>
  );
}
