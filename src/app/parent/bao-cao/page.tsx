import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { regenerateWeekly } from "@/app/parent/actions";
import { WeeklyReportView, type WeeklyRow } from "@/components/parent/weekly-report";

export const metadata: Metadata = { title: "Báo cáo tuần — App Toán" };

const dm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export const maxDuration = 60; // server action "Tạo lại" waits for AI (2 tries × ≤ 25 s)

// S8a (spec §5.1): reports made on Monday ~07:00 for the previous week; RLS = the parent's own students.
export default async function WeeklyReportsPage(props: PageProps<"/parent/bao-cao">) {
  await requireRole("parent");
  const sp = await props.searchParams;
  const week = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : null;
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name").order("created_at");

  const blocks = await Promise.all(
    (students ?? []).map(async (s) => {
      const { data, error } = await supabase
        .from("ai_reports")
        .select("period, facts, ai, comment_status, created_at")
        .eq("kind", "weekly")
        .eq("student_id", s.id)
        .order("period", { ascending: false })
        .limit(12);
      if (error) console.error("WeeklyReportsPage", error.message);
      const rows = (data ?? []) as WeeklyRow[];
      return { s, rows, shown: rows.find((r) => r.period === week) ?? rows[0] ?? null };
    }),
  );

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Báo cáo tuần</h1>
      <p className="mt-1 text-sm text-muted">App tự tạo sáng thứ Hai (~07:00) cho tuần trước. Số liệu lấy từ dữ liệu học; AI chỉ viết phần nhận xét.</p>
      {blocks.map(({ s, rows, shown }) => (
        <section key={s.id} className="mt-6" aria-label={`Báo cáo của ${s.full_name}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{s.full_name}</h2>
            <ActionForm action={regenerateWeekly} submitLabel="Tạo lại báo cáo tuần trước" variant="quiet" className="flex items-center gap-3">
              <input type="hidden" name="studentId" value={s.id} />
            </ActionForm>
          </div>
          {shown ? (
            <div className="mt-3">
              <WeeklyReportView row={shown} />
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted" data-testid="no-report">
              Chưa có báo cáo nào. Báo cáo đầu tiên sẽ có sáng thứ Hai, hoặc bấm &ldquo;Tạo lại báo cáo tuần trước&rdquo;.
            </p>
          )}
          {rows.length > 1 && (
            <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Các tuần trước">
              {rows.map((r) => (
                <Link
                  key={r.period}
                  href={`/parent/bao-cao?week=${r.period}`}
                  className={`rounded-full border px-3 py-1 ${r.period === shown?.period ? "border-accent text-accent" : "border-border text-muted hover:text-ink"}`}
                >
                  Tuần {dm(r.period)}
                </Link>
              ))}
            </nav>
          )}
        </section>
      ))}
    </>
  );
}
