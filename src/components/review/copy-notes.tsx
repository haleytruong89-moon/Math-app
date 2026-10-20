"use client";

import { useState } from "react";

/** T7: every "Cần sửa" note as one block, to paste to a Claude content session. */
export function CopyNotes({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <textarea readOnly value={text} rows={Math.min(10, text.split("\n").length + 1)} className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs" aria-label="Góp ý cần sửa" />
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); } catch { setDone(false); } }}
        className="self-start rounded-lg border border-border bg-surface px-3.5 py-2 font-display text-sm font-semibold">
        {done ? "Đã chép ✓" : "Chép để gửi Claude"}
      </button>
    </div>
  );
}
