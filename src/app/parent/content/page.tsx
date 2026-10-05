import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { curriculum, getUnit } from "@/lib/content";

export const metadata: Metadata = { title: "Nội dung — App Toán" };

// S6a: the 48-KU roadmap grouped by content batch (CURRICULUM.md H6), with Nháp / Đã duyệt / Chưa soạn.
export default async function ContentPage() {
  await requireRole("parent");
  const { units, modules } = curriculum();
  const moduleTitle = new Map(modules.map((m) => [m.id, m.title]));
  const batches = [...new Set(units.map((u) => u.batch))].sort((a, b) => a - b);

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Nội dung bài học</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Bài <b>Nháp</b> chỉ phụ huynh thấy. Mở từng bài, bấm thử như học sinh (không ghi dữ liệu). Bài ổn thì nói với
        Claude <i>&ldquo;duyệt bài …&rdquo;</i>; chỗ nào sai thì ghi lại để sửa. Học sinh chỉ thấy bài <b>Đã duyệt</b>.
      </p>

      {batches.map((b) => {
        const list = units.filter((u) => u.batch === b).sort((x, y) => x.track.localeCompare(y.track) || x.seq - y.seq);
        return (
          <section key={b} className="mt-8" data-testid={`batch-${b}`}>
            <h2 className="font-display text-base font-semibold">{b === 0 ? "Đợt 0 — đã có" : `Đợt ${b}`}</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
              {list.map((c) => {
                const found = getUnit(c.id);
                const u = found?.unit;
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      {c.title}
                      <div className="font-mono text-xs text-muted">
                        {moduleTitle.get(c.module)} · track {c.track}
                        {u && ` · ${u.practice.length} câu luyện · ${u.exit.length} câu kiểm tra · ~${u.estMinutes} phút`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                          !u ? "border border-border text-muted" : u.status === "approved" ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
                        }`}
                      >
                        {!u ? "Chưa soạn" : u.status === "approved" ? `Đã duyệt ${u.approvedOn}` : "Nháp"}
                      </span>
                      {u && (
                        <Link href={`/parent/content/${c.id}`} className="text-sm text-accent hover:underline">
                          Xem trước →
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
