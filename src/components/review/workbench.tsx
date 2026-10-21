import Link from "next/link";
import { notFound } from "next/navigation";
import { getUnit } from "@/lib/content";
import { reviewOf } from "@/lib/content/approvals";
import { LESSON, nextToReview, type ItemStatus } from "@/lib/content/review";
import { ActionForm } from "@/components/action-form";
import { approveUnit, returnUnit } from "@/app/review/actions";
import { ItemPanel, LessonPanel } from "./item-panel";
import { VerdictForm } from "./verdict-form";

const MARK: Record<ItemStatus, [string, string]> = { ok: ["✓", "text-good"], fix: ["!", "text-warn"], changed: ["↻", "text-accent"], unseen: ["·", "text-muted"] };

/** Mockup artboard 3 — shared by the tutor (/tutor/[id]/bai/[unit]) and the parent (/parent/content/[unit]/duyet). */
export async function ReviewWorkbench({ unitId, base, selected, tryHref, backHref }: { unitId: string; base: string; selected?: string; tryHref: string; backHref: string }) {
  const f = getUnit(unitId);
  const rv = await reviewOf(unitId);
  if (!f || !rv) notFound();
  const gitApproved = f.unit.status === "approved";
  const current = rv.items.find((e) => e.id === selected) ?? rv.items.find((e) => e.id === nextToReview(rv)) ?? rv.items[0];
  const label = (id: string) => (id === LESSON ? "Lý thuyết & bài mẫu" : id.replace(`${unitId}-`, ""));

  const progress = `đã xem ${rv.counts.ok + rv.counts.fix}/${rv.items.length} · ${rv.counts.fix} cần sửa`;
  return (
    // Bottom padding: the verdict bar is fixed to the bottom of the screen.
    <div className={gitApproved ? "" : "pb-32"}>
      <header className="flex flex-wrap items-center gap-3">
        <Link href={backHref} className="text-sm text-accent hover:underline">← Kho bài</Link>
        <h1 className="font-display text-xl font-bold">{f.unit.title}</h1>
        <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${gitApproved || rv.approved ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>
          {gitApproved ? `Đã duyệt ${f.unit.approvedOn}` : rv.approved ? "Đã duyệt trên app" : "Chờ duyệt"}
        </span>
        <span className="font-mono text-xs text-muted" data-testid="review-progress">{progress}</span>
        <Link href={tryHref} className="ml-auto text-sm font-semibold text-accent hover:underline">Làm thử như con ↗</Link>
      </header>
      {!gitApproved && (
        <div className="mt-3 flex flex-wrap gap-3">
          {rv.canApprove.ok && !rv.approved ? (
            <ActionForm action={approveUnit} submitLabel="Duyệt cả bài"><input type="hidden" name="unitId" value={unitId} /></ActionForm>
          ) : !rv.approved ? (
            <p className="rounded-lg bg-bg px-3 py-2 text-sm text-muted" data-testid="approve-blocked">Chưa duyệt cả bài được: {(rv.canApprove as { reason: string }).reason}</p>
          ) : (
            <ActionForm action={returnUnit} submitLabel="Trả lại để sửa" variant="warn" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="unitId" value={unitId} />
              <input name="note" required maxLength={500} placeholder="Lý do (con sẽ không thấy bài này)" className="rounded-lg border border-border px-3 py-2 text-sm" />
            </ActionForm>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-start gap-5">
        <nav aria-label="Các câu" className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5 rounded-xl border border-border bg-surface p-2">
          {rv.items.map((e) => {
            const [m, cls] = MARK[e.status];
            return (
              <Link key={e.id} href={`${base}?item=${encodeURIComponent(e.id)}`} aria-current={e.id === current.id ? "true" : undefined}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${e.id === current.id ? "bg-accent-soft font-semibold" : "hover:bg-bg"}`} data-status={e.status}>
                <span className={`w-4 text-center font-mono ${cls}`}>{m}</span>
                <span className="font-mono text-xs text-muted">{e.kind === "lesson" ? "" : e.kind === "practice" ? "LT" : "KT"}</span>
                {label(e.id)}{e.item ? ` · ${e.item.level}` : ""}
              </Link>
            );
          })}
        </nav>
        <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-4" aria-label="Câu đang xem" data-item={current.id}>
          <article className="rounded-xl border border-border bg-surface p-5">
            {current.item ? <ItemPanel item={current.item} kind={current.kind as "practice" | "exit"} /> : <LessonPanel unit={f.unit} />}
            {current.status === "changed" && <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">Câu này đã được sửa sau lần xem trước — xem lại.</p>}
          </article>
          {!gitApproved && <VerdictForm key={current.id} unitId={unitId} itemId={current.id} back={base} note={current.status === "fix" ? current.note : null} progress={progress} />}
        </section>
      </div>
    </div>
  );
}
