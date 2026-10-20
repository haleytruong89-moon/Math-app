"use client";

import { useActionState } from "react";
import { reviewItem } from "@/app/review/actions";

export function VerdictForm({ unitId, itemId, back, note }: { unitId: string; itemId: string; back: string; note: string | null }) {
  const [state, action, pending] = useActionState(reviewItem, {});
  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="back" value={back} />
      <label htmlFor="note" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Góp ý (bắt buộc khi cần sửa)</label>
      <textarea id="note" name="note" rows={2} maxLength={500} defaultValue={note ?? ""} placeholder="Ví dụ: đổi số cho dễ nhẩm; thêm phương án sai khi con quên đổi dấu…" className="rounded-lg border border-border px-3 py-2 text-base" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" name="verdict" value="ok" disabled={pending} className="rounded-lg bg-good px-4 py-2.5 font-display font-bold text-white disabled:opacity-60">✓ Đạt — câu tiếp</button>
        <button type="submit" name="verdict" value="fix" disabled={pending} className="rounded-lg border border-warn px-4 py-2.5 font-display font-bold text-warn disabled:opacity-60">! Cần sửa</button>
        {state.error && <span role="alert" className="text-sm text-warn">{state.error}</span>}
      </div>
      <p className="text-xs text-muted">Câu &ldquo;cần sửa&rdquo; vẫn duyệt cả bài được: câu đó ẩn với con tới khi sửa xong và được xem lại.</p>
    </form>
  );
}
