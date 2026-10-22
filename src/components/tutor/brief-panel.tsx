import { ActionForm } from "@/components/action-form";
import { createBrief } from "@/app/tutor/actions";
import { fallbackPoints, type BriefFacts, type BriefPoint } from "@/lib/ai/brief";

export type BriefRow = { period: string; facts: BriefFacts; ai: { points: BriefPoint[] } | null; comment_status: "ok" | "failed" | "off" | "none"; created_at: string };

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

/** S8a: "Tóm tắt trước buổi dạy" — facts from the database; "Nên chữa" by AI (checked) or built from the data. */
export function BriefPanel({ studentId, row }: { studentId: string; row: BriefRow | null }) {
  const f = row?.facts;
  const points = row ? (row.ai?.points ?? fallbackPoints(row.facts)) : [];
  const title = new Map((f?.units ?? []).map((u) => [u.id, u.title]));
  return (
    <section className="rounded-xl border border-border bg-surface p-4" data-testid="brief" aria-label="Tóm tắt trước buổi dạy">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Tóm tắt trước buổi dạy</h2>
        <ActionForm action={createBrief} submitLabel={row ? "Tạo lại tóm tắt" : "Tạo tóm tắt trước buổi dạy"} variant={row ? "quiet" : "primary"} className="flex items-center gap-3">
          <input type="hidden" name="studentId" value={studentId} />
        </ActionForm>
      </div>
      {!row && <p className="mt-2 text-sm text-muted">Bấm để xem con đã làm gì từ buổi trước và 2–3 điểm nên chữa.</p>}
      {f && (
        <>
          <p className="mt-2 font-mono text-xs text-muted">
            Từ {dm(f.since)} đến {dm(f.today)} · bài về nhà: {f.homework.open} chưa làm, {f.homework.toReview} chờ chữa
          </p>
          {f.units.length ? (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {f.units.map((u) => (
                <li key={u.id}>
                  <b>{u.title}</b>{" "}
                  <span className="font-mono text-xs text-muted">
                    · M{u.level} · {u.answers} câu, sai {u.wrong}
                    {u.errors.length ? ` · ${u.errors.map((e) => `${e.code}×${e.count}`).join(", ")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">Từ buổi trước đến nay con chưa làm câu nào trong app.</p>
          )}
          {points.length > 0 && (
            <div className="mt-3 rounded-lg bg-accent-soft p-3">
              <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Nên chữa</p>
              <ol className="mt-1 list-decimal pl-5 text-sm">
                {points.map((p, i) => (
                  <li key={i} data-testid="brief-point">
                    <span className="text-muted">{title.get(p.unit)}:</span> {p.text}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs text-muted">{row?.ai ? "AI viết, máy chủ đã đối chiếu với dữ liệu." : "Tự động từ dữ liệu (không dùng AI)."}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
