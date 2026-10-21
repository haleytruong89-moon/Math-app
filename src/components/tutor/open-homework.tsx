import { getUnit } from "@/lib/content";
import { vnDate } from "@/lib/learning/rules";
import { HOMEWORK_RULES, dueLabel, homeworkAppResult } from "@/lib/learning/homework";
import type { StudentState } from "@/lib/learning/state";
import { errorLabel } from "@/lib/content/errors";
import { ActionForm } from "@/components/action-form";
import { reviewHomework } from "@/app/tutor/actions";
import { card, sectionTitle } from "@/components/ui/styles";

export type { OpenHwRow } from "@/lib/tutor/workspace";
import type { OpenHwRow } from "@/lib/tutor/workspace";

const ddmm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");

/** Homework this tutor gave and hasn't corrected: done ones first, then by due date; S9/T9 app result; "Đã chữa". */
export function OpenHomework({ rows, state, today }: { rows: OpenHwRow[]; state: StudentState; today: string }) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => Number(!!b.done_at) - Number(!!a.done_at) || a.due_on.localeCompare(b.due_on));
  return (
    <section className={`${card} p-4`} aria-label="Bài đã giao chưa chữa">
      <h2 className={sectionTitle}>Bài về nhà chờ chữa ({rows.length})</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {sorted.map((h) => {
          // S9 / T9: what the student did in the app since the homework was given (only its items, if hand-picked).
          const u = h.unit_id ? state.units.find((x) => x.unit.id === h.unit_id) : undefined;
          const r = u && u.unit.status === "approved" ? homeworkAppResult(u.attempts, h.created_at, h.items) : undefined;
          return (
            <li key={h.id} className="rounded-lg border border-border p-3 text-sm" data-testid="open-homework">
              <p className="whitespace-pre-line">{h.task}</p>
              <p className="mt-1 font-mono text-xs text-muted">
                {h.unit_id ? `${getUnit(h.unit_id)?.unit.title ?? h.unit_id}${h.items ? ` · ${h.items.length} câu` : ""} · ` : ""}
                {dueLabel(h.due_on, today)} ·{" "}
                {h.done_at ? <span className="text-good">Con đã báo xong ({ddmm(vnDate(h.done_at))})</span> : "Con chưa báo xong"}
              </p>
              {u && u.unit.status === "approved" && (
                <p className="mt-1.5 rounded-lg bg-accent-soft px-2.5 py-1.5 text-xs" data-testid="homework-app-result">
                  <b>Trên app từ khi giao:</b>{" "}
                  {!r
                    ? "con chưa làm."
                    : [
                        r.practice.total ? `luyện tập ${r.practice.right}/${r.practice.total} đúng` : null,
                        r.exit ? `kiểm tra ${r.exit.right}/${r.exit.total}` : null,
                        r.topError ? `lỗi lặp lại: ${errorLabel(r.topError) ?? r.topError}` : null,
                        `mức hiện tại M${u.mastery.level}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              )}
              <ActionForm action={reviewHomework} submitLabel="Đã chữa" variant="quiet" className="mt-2 flex flex-col gap-2">
                <input type="hidden" name="homeworkId" value={h.id} />
                <textarea
                  name="reviewNote"
                  rows={2}
                  maxLength={HOMEWORK_RULES.reviewNoteMax}
                  placeholder="Nhận xét cho con (không bắt buộc)"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
                />
              </ActionForm>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
