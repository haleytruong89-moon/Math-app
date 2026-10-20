import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { shelf, type ShelfRow } from "@/lib/content/approvals";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { PriorityButton } from "@/components/tutor/priority-button";
import { SHELF_BADGE } from "@/components/review/badges";

export const metadata: Metadata = { title: "Kho bài — App Toán" };

const FILTERS = [
  { id: "cho", label: "Chờ duyệt", test: (r: ShelfRow) => r.status === "waiting" || r.status === "reapprove" },
  { id: "da", label: "Đã duyệt", test: (r: ShelfRow) => r.status === "approved" },
  { id: "chua", label: "Chưa soạn", test: (r: ShelfRow) => r.status === "none" },
  { id: "tat", label: "Tất cả", test: () => true },
] as const;

// T7 + T8 (mockup artboard 2): every KU's status, review progress, and this student's priority list.
export default async function ShelfPage(props: PageProps<"/tutor/[studentId]/bai">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();

  const [rows, prio] = await Promise.all([
    shelf(),
    supabase.from("tutor_priorities").select("unit_id, position").eq("student_id", studentId).order("position", { ascending: true }),
  ]);
  const priority = (prio.data ?? []).map((p) => p.unit_id as string);
  const filter = FILTERS.find((f) => f.id === sp.loc) ?? FILTERS[0];
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const shown = rows.filter((r) => filter.test(r) && (!q || r.title.toLowerCase().includes(q)));
  const modules = [...new Set(shown.map((r) => r.module))];
  const title = new Map(rows.map((r) => [r.id, r.title]));

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="min-w-0 flex-[999_1_560px]" aria-label="Kho bài">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Link key={f.id} href={`?loc=${f.id}`} aria-current={f.id === filter.id ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-display text-sm font-semibold ${f.id === filter.id ? "border-accent bg-accent text-on-accent" : "border-border bg-surface"}`}>
                {f.label} <span className="font-mono text-xs">{rows.filter(f.test).length}</span>
              </Link>
            ))}
            <form className="ml-auto">
              <input type="hidden" name="loc" value={filter.id} />
              <input name="q" defaultValue={q} placeholder="Tìm bài…" aria-label="Tìm bài" className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm" />
            </form>
          </div>
          {modules.map((m) => (
            <div key={m} className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              <h2 className="bg-bg px-4 py-2 font-display text-sm font-semibold text-muted">{shown.find((r) => r.module === m)!.moduleTitle}</h2>
              <ul className="divide-y divide-border">
                {shown.filter((r) => r.module === m).map((r) => {
                  const [label, cls] = SHELF_BADGE[r.status];
                  const starred = priority.includes(r.id);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5" data-testid={`shelf-${r.id}`}>
                      <PriorityButton studentId={student.id} unitId={r.id} op="toggle" label={starred ? "★" : "☆"} title={starred ? "Bỏ ưu tiên" : "Ưu tiên luyện trước"} />
                      <span className="min-w-0 flex-1 font-display">{r.title}</span>
                      {r.total > 0 && <span className="font-mono text-xs text-muted">đã xem {r.reviewed}/{r.total}{r.fix ? ` · ${r.fix} cần sửa` : ""}</span>}
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${cls}`}>{label}</span>
                      {r.status !== "none" && (
                        <Link href={`/tutor/${student.id}/bai/${r.id}`} className="text-sm font-semibold text-accent hover:underline">
                          {r.status === "approved" ? "Xem" : "Duyệt"} →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {!shown.length && <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có bài nào.</p>}
        </section>

        <aside className="min-w-0 flex-[1_1_280px] rounded-xl border border-border bg-surface p-4" aria-label="Ưu tiên luyện trước">
          <h2 className="font-display font-semibold">Ưu tiên luyện trước</h2>
          <p className="mt-1 text-sm text-muted">Bài ⭐ mở ngay cho {student.full_name} và hiện đầu tiên ở &ldquo;Bài mới&rdquo;.</p>
          <ol className="mt-3 flex flex-col gap-1" data-testid="priority-list">
            {priority.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg">
                <span className="w-5 font-mono text-xs text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 text-sm">{title.get(id) ?? id}</span>
                <PriorityButton studentId={student.id} unitId={id} op="up" label="↑" title="Lên" />
                <PriorityButton studentId={student.id} unitId={id} op="down" label="↓" title="Xuống" />
              </li>
            ))}
            {!priority.length && <li className="text-sm text-muted">Chưa có — bấm ☆ cạnh bài.</li>}
          </ol>
          <p className="mt-4 text-xs text-muted">Phụ huynh cũng duyệt được bài. Gia sư là người duyệt chính.</p>
        </aside>
      </div>
    </>
  );
}
