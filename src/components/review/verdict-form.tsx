"use client";

import { useActionState, useState } from "react";
import { reviewItem } from "@/app/review/actions";
import { FIX_PART_MAX, splitFixNote } from "@/lib/content/review";

/**
 * Laptop audit 20/10: the verdict lives in a bar fixed to the bottom of the screen, so the reviewer reads the item
 * and decides without scrolling. "Cần sửa" first opens two boxes (23/10: why it is wrong + how Claude should fix it,
 * both required), then "Gửi góp ý" sends them.
 */
export function VerdictForm({ unitId, itemId, back, note, progress }: { unitId: string; itemId: string; back: string; note: string | null; progress: string }) {
  const [state, action, pending] = useActionState(reviewItem, {});
  const [fixing, setFixing] = useState(!!note);
  const prev = splitFixNote(note);
  const box = "min-w-0 flex-[1_1_280px] rounded-lg border border-border px-3 py-2 text-base";
  return (
    <form action={action} className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur" aria-label="Nhận xét câu này">
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="back" value={back} />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
        {fixing && (
          <div className="flex flex-wrap items-start gap-2">
            <label htmlFor="fix-reason" className="sr-only">Lý do cần sửa</label>
            <textarea
              id="fix-reason"
              name="reason"
              rows={2}
              maxLength={FIX_PART_MAX}
              required
              autoFocus
              defaultValue={prev.reason}
              placeholder="Lý do: sai ở đâu? Ví dụ: phương án C cũng đúng vì …"
              className={box}
            />
            <label htmlFor="fix-how" className="sr-only">Hướng dẫn Claude sửa</label>
            <textarea
              id="fix-how"
              name="how"
              rows={2}
              maxLength={FIX_PART_MAX}
              required
              defaultValue={prev.how}
              placeholder="Hướng dẫn sửa: Claude cần đổi gì? Ví dụ: đổi C thành …; thêm điều kiện x ≠ 4"
              className={box}
            />
            <button type="submit" name="verdict" value="fix" disabled={pending} className="rounded-lg bg-warn px-4 py-2.5 font-display font-bold text-white disabled:opacity-60">
              Gửi góp ý
            </button>
            <button type="button" onClick={() => setFixing(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted hover:text-ink">
              Thôi
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" name="verdict" value="ok" disabled={pending} formNoValidate className="rounded-lg bg-good px-4 py-2.5 font-display font-bold text-white disabled:opacity-60">
            ✓ Đạt — câu tiếp
          </button>
          {!fixing && (
            <button type="button" onClick={() => setFixing(true)} className="rounded-lg border border-warn px-4 py-2.5 font-display font-bold text-warn">
              ! Cần sửa
            </button>
          )}
          {state.error && <span role="alert" className="text-sm text-warn">{state.error}</span>}
          <span className="ml-auto font-mono text-xs text-muted">{progress}</span>
        </div>
      </div>
    </form>
  );
}
