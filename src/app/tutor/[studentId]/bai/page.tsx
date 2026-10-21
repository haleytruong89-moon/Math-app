import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { shelf, type ShelfRow } from "@/lib/content/approvals";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { PriorityButton } from "@/components/tutor/priority-button";
import { SHELF_BADGE } from "@/components/review/badges";
import { Progress } from "@/components/ui/progress";
import { btn, card, sectionTitle } from "@/components/ui/styles";

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
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-4" aria-label="Kho bài">
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-0.5 rounded-xl bg-border/70 p-1" aria-label="Lọc">
              {FILTERS.map((f) => (
                <Link key={f.id} href={`?loc=${f.id}`} aria-current={f.id === filter.id ? "page" : undefined}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 font-display text-sm font-semibold ${f.id === filter.id ? "bg-surface text-accent shadow-sm" : "text-ink hover:bg-surface/60"}`}>
                  {f.label} <span className="font-mono text-xs text-muted">{rows.filter(f.test).length}</span>
                </Link>
              ))}
            </nav>
            <form className="ml-auto">
              <input type="hidden" name="loc" value={filter.id} />
              <input name="q" defaultValue={q} placeholder="Tìm bài…" aria-label="Tìm bài" className="h-10 w-60 rounded-lg border border-border bg-surface px-3 font-display text-sm" />
            </form>
          </div>
          <p className="font-display text-sm text-muted">
            Bấm <span className="text-star">★</span> để ưu tiên: bài mở ngay cho {student.full_name} và đứng đầu &ldquo;Bài mới&rdquo;. Bấm tên bài để mở.
          </p>
          {modules.map((m) => (
            <div key={m} className={`${card} overflow-hidden`}>
              <h2 className="bg-bg px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-muted">{shown.find((r) => r.module === m)!.moduleTitle}</h2>
              <ul>
                {shown.filter((r) => r.module === m).map((r) => {
                  const [label, cls] = SHELF_BADGE[r.status];
                  const starred = priority.includes(r.id);
                  const href = `/tutor/${student.id}/bai/${r.id}`;
                  return (
                    <li key={r.id} data-testid={`shelf-${r.id}`}
                      className={`flex flex-wrap items-center gap-3 border-t border-l-4 border-t-border/60 py-1.5 pl-1.5 pr-4 ${starred ? "border-l-star bg-star-soft" : "border-l-transparent hover:bg-bg"}`}>
                      <PriorityButton studentId={student.id} unitId={r.id} op="toggle" on={starred} label={starred ? "★" : "☆"} title={starred ? "Bỏ ưu tiên" : "Ưu tiên luyện trước"} />
                      {r.status === "none" ? (
                        <span className="min-w-0 flex-1 font-display text-[15px] text-muted">{r.title}</span>
                      ) : (
                        <Link href={href} className="min-w-0 flex-1 font-display text-[15px] font-semibold hover:text-accent">{r.title}</Link>
                      )}
                      {r.total > 0 && <Progress value={r.reviewed} total={r.total} label="câu đã xem" />}
                      {r.fix > 0 && <span className="font-mono text-xs text-warn">{r.fix} cần sửa</span>}
                      <span className={`rounded-full px-2.5 py-0.5 font-display text-xs font-semibold ${cls}`}>{r.status === "approved" && r.approvedOn ? "Đã duyệt" : label}</span>
                      {r.status === "approved" ? (
                        <Link href={href} className={btn.outlineSm}>Xem</Link>
                      ) : r.status !== "none" ? (
                        <Link href={href} className={btn.primarySm}>{r.reviewed ? "Duyệt tiếp" : "Duyệt"}</Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {!shown.length && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Không có bài nào.</p>}
        </section>

        <aside className={`${card} min-w-0 flex-[1_1_300px] p-4`} aria-label="Ưu tiên luyện trước">
          <div className="flex items-center">
            <h2 className={sectionTitle}>Ưu tiên luyện trước</h2>
            <span className="ml-auto font-mono text-xs text-muted">{priority.length} bài</span>
          </div>
          <p className="mt-1 text-sm text-muted">Sắp thứ tự bằng ↑ ↓. Bài số 1 hiện ở &ldquo;Việc tiếp theo&rdquo;.</p>
          <ol className="mt-3 flex flex-col gap-1.5" data-testid="priority-list">
            {priority.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-lg border border-border/70 px-2 py-1.5">
                <span className="w-4 font-mono text-xs text-muted">{i + 1}</span>
                <span className="text-star" aria-hidden>★</span>
                <span className="min-w-0 flex-1 font-display text-sm font-semibold">{title.get(id) ?? id}</span>
                <PriorityButton studentId={student.id} unitId={id} op="up" label="↑" title="Lên" />
                <PriorityButton studentId={student.id} unitId={id} op="down" label="↓" title="Xuống" />
              </li>
            ))}
            {!priority.length && <li className="text-sm text-muted">Chưa có — bấm ☆ cạnh bài.</li>}
          </ol>
          <p className="mt-4 text-xs text-muted">Phụ huynh cũng duyệt được bài; gia sư là người duyệt chính.</p>
        </aside>
      </div>
    </>
  );
}
