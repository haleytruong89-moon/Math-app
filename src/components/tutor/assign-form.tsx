"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { assignHomework } from "@/app/tutor/actions";

export type PickItem = { id: string; level: "L1" | "L2" | "L3"; promptText: string; oftenWrong: boolean; examLike: boolean };

export function AssignForm(p: { studentId: string; studentName: string; unitId: string | null; mode: "unit" | "items" | "paper"; items: PickItem[]; defaultDue: string; maxDue: string; today: string }) {
  const [state, action, pending] = useActionState(assignHomework, {});
  const list = useRef<HTMLDivElement>(null);
  const pick = (level?: string) =>
    list.current?.querySelectorAll<HTMLInputElement>('input[name="item"]').forEach((b) => { b.checked = !level ? false : b.dataset.level === level || b.checked; });
  return (
    <form action={action} className="flex flex-wrap items-start gap-5">
      <input type="hidden" name="studentId" value={p.studentId} />
      <input type="hidden" name="mode" value={p.mode} />
      {p.unitId && <input type="hidden" name="unit" value={p.unitId} />}
      <section className="min-w-0 flex-[999_1_560px]">
        {p.mode === "items" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface" ref={list}>
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg px-4 py-2 text-sm">
              <b className="font-display">Câu luyện tập</b>
              <span className="ml-auto text-muted">Chọn nhanh:</span>
              {(["L1", "L2", "L3"] as const).map((l) => <button key={l} type="button" onClick={() => pick(l)} className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-xs">+ {l}</button>)}
              <button type="button" onClick={() => pick()} className="rounded-full px-2.5 py-0.5 text-xs text-muted">Bỏ chọn</button>
            </div>
            {p.items.map((it) => (
              <label key={it.id} className="flex cursor-pointer items-start gap-3 border-t border-border px-4 py-3 first:border-t-0">
                <input type="checkbox" name="item" value={it.id} data-level={it.level} className="mt-1 size-[18px] accent-[var(--accent)]" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap gap-2 font-mono text-xs">
                    <b>{it.id.split("-").at(-1)}</b><span className="text-muted">{it.level}</span>
                    {it.oftenWrong && <span className="rounded-full bg-warn-soft px-2 text-warn">con hay sai</span>}
                    {it.examLike && <span className="rounded-full bg-accent-soft px-2 text-accent">giống đề thi</span>}
                  </span>
                  <span className="mt-1 block text-[15px]">{it.promptText}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {p.mode === "unit" && <p className="rounded-xl border border-border bg-surface p-4 text-sm">Con làm cả bài theo thứ tự của app (luyện tập rồi kiểm tra). Bài mở ngay cho con.</p>}
        {p.mode === "paper" && <p className="rounded-xl border border-border bg-surface p-4 text-sm">Bài làm trên giấy: ghi yêu cầu và/hoặc dán link đề (Google Drive). Không chấm trên app.</p>}
      </section>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="font-display text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="due">Hạn nộp</label>
        <input id="due" name="due" type="date" defaultValue={p.defaultDue} min={p.today} max={p.maxDue} className="rounded-lg border border-border px-3 py-2" />
        <label className="font-display text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="task">{p.mode === "paper" ? "Yêu cầu" : "Lời dặn con (tuỳ chọn)"}</label>
        <textarea id="task" name="task" rows={3} maxLength={300} className="rounded-lg border border-border px-3 py-2" />
        {[0, 1, 2].map((i) => <input key={i} name="link" type="url" placeholder={i ? "Link khác (tuỳ chọn)" : "Link đề Google Drive (tuỳ chọn)"} className="rounded-lg border border-border px-3 py-2 text-sm" />)}
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent disabled:opacity-60">{pending ? "Đang giao…" : `Giao cho ${p.studentName}`}</button>
        {state.error && <p role="alert" className="text-sm text-warn">{state.error}</p>}
        {state.ok && <p role="status" className="text-sm text-good">✓ {state.ok} <Link href={`/tutor/${p.studentId}`} className="underline">Về Hôm nay</Link></p>}
        <p className="text-xs text-muted">Câu làm trên app được chấm và tính như luyện tập; cô thấy đúng/sai ở tab Hôm nay.</p>
      </aside>
    </form>
  );
}
