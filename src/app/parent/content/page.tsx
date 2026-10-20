import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { curriculum, getUnit } from "@/lib/content";
import { loadReviewData, shelf } from "@/lib/content/approvals";
import { fixNotesText, unitReview } from "@/lib/content/review";
import { SHELF_BADGE } from "@/components/review/badges";
import { CopyNotes } from "@/components/review/copy-notes";

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
  // T7: status from the review records (git-approved, approved in the app, waiting, not written yet).
  const [rows, d] = await Promise.all([shelf(), loadReviewData()]);
  const status = new Map(rows.map((r) => [r.id, r]));
  const notes = units.flatMap((c) => {
    const f = getUnit(c.id);
    if (!f || f.unit.status === "approved") return [];
    return unitReview(f.unit, d.rows, d.approvals)
      .items.filter((e) => e.status === "fix" && e.note)
      .map((e) => ({ unitId: c.id, unitTitle: c.title, itemId: e.id, note: e.note!, at: e.reviewedAt! }));
  });

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Nội dung bài học</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Bài <b>Chờ duyệt</b> được gia sư (hoặc phụ huynh) duyệt từng câu trong app; con thấy bài ngay khi duyệt xong,
        trừ những câu &ldquo;cần sửa&rdquo;. &ldquo;Xem trước&rdquo; để bấm thử như học sinh (không ghi dữ liệu).
      </p>
      {notes.length > 0 && (
        <section className="mt-6 max-w-3xl rounded-xl border border-border bg-surface p-4" data-testid="fix-notes">
          <h2 className="font-display font-semibold">Góp ý cần sửa ({notes.length})</h2>
          <p className="mt-1 text-sm text-muted">
            Chép rồi dán cho phiên Claude soạn nội dung. Sửa xong, câu hiện &ldquo;↻ xem lại&rdquo; ở màn duyệt.
          </p>
          <div className="mt-3">
            <CopyNotes text={fixNotesText(notes)} />
          </div>
        </section>
      )}

      {groups.map(({ key, title, list }) => {
        return (
          <section key={key} className="mt-8" data-testid={key}>
            <h2 className="font-display text-base font-semibold">{title}</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
              {list.map((c) => {
                const found = getUnit(c.id);
                const u = found?.unit;
                const st = status.get(c.id);
                const [label, cls] = SHELF_BADGE[st?.status ?? "none"];
                return (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      {c.title}
                      <div className="font-mono text-xs text-muted">
                        {moduleTitle.get(c.module)} · track {c.track}
                        {u && ` · ${u.practice.length} câu luyện · ${u.exit.length} câu kiểm tra · ~${u.estMinutes} phút`}
                        {st && st.total > 0 && ` · đã xem ${st.reviewed}/${st.total}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${cls}`}>
                        {st?.status === "approved" ? `Đã duyệt ${st.approvedOn ?? ""}` : label}
                      </span>
                      {u && (
                        <Link href={`/parent/content/${c.id}`} className="text-sm text-accent hover:underline">
                          Xem trước →
                        </Link>
                      )}
                      {(st?.status === "waiting" || st?.status === "reapprove") && (
                        <Link href={`/parent/content/${c.id}/duyet`} className="text-sm font-semibold text-accent hover:underline">
                          Duyệt →
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
