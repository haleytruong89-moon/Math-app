import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tổng quan — App Toán" };

// P0 shell of the parent dashboard (mockup "Tổng quan"). The three numbers
// get real data in P1 once modules, attempts and mastery exist.
const STATS = [
  { label: "Bài đạt M3 trở lên", warn: false },
  { label: "Bài ôn quá hạn", warn: false },
  { label: "Cờ lệch đánh giá cần chốt", warn: true },
];

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

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className={`font-display text-3xl font-bold tabular-nums ${s.warn ? "text-warn" : ""}`}>—</div>
            <div className="mt-1.5 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-muted">
        Số liệu sẽ có khi module Hệ thức lượng được đưa vào (P1).
      </p>

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
