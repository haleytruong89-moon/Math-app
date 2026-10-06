import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { curriculum, getUnit } from "@/lib/content";

export const metadata: Metadata = { title: "Nội dung — App Toán" };

// S6a: the 48-KU roadmap grouped by content batch, P2 KUs last (LT17) (CURRICULUM.md H6), with Nháp / Đã duyệt / Chưa soạn.
export default async function ContentPage() {
  await requireRole("parent");
  const { units, modules } = curriculum();
  const moduleTitle = new Map(modules.map((m) => [m.id, m.title]));
  const byTrackSeq = (x: (typeof units)[number], y: (typeof units)[number]) => x.track.localeCompare(y.track) || x.seq - y.seq;
  const core = units.filter((u) => u.priority !== "P2");
  // Core KUs by content batch; LT17's P2 KUs in their own group at the end.
  const groups = [
    ...[...new Set(core.map((u) => u.batch))]
      .sort((a, b) => a - b)
      .map((b) => ({ key: `batch-${b}`, title: b === 0 ? "Đợt 0 — đã có" : `Đợt ${b}`, list: core.filter((u) => u.batch === b).sort(byTrackSeq) })),
    { key: "extra", title: "Học thêm khi dư thời gian (P2 — ít ra trong đề)", list: units.filter((u) => u.priority === "P2").sort(byTrackSeq) },
  ].filter((g) => g.list.length);

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Nội dung bài học</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Bài <b>Nháp</b> chỉ phụ huynh thấy. Mở từng bài, bấm thử như học sinh (không ghi dữ liệu). Bài ổn thì nói với
        Claude <i>&ldquo;duyệt bài …&rdquo;</i>; chỗ nào sai thì ghi lại để sửa. Học sinh chỉ thấy bài <b>Đã duyệt</b>.
      </p>

      {groups.map(({ key, title, list }) => {
        return (
          <section key={key} className="mt-8" data-testid={key}>
            <h2 className="font-display text-base font-semibold">{title}</h2>
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
