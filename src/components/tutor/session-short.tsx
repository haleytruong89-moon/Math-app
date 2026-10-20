"use client";

import { startTransition, useActionState, useState } from "react";
import { saveTeachingSession, type SaveSessionState } from "@/app/tutor/actions";

export type ChipUnit = { id: string; title: string; group: "priority" | "progress" | "other"; level: number };
const HINT = ["chưa học", "làm được khi có hướng dẫn", "tự làm bài cơ bản", "làm bài dạng đề thi", "vững, chỉ cần ôn"];

/** Mockup artboard 5: date → taught KUs as chips (priority + in progress, search for others) → level only for ticked. */
export function SessionShort({ studentId, today, minDate, units }: { studentId: string; today: string; minDate: string; units: ChipUnit[] }) {
  const [state, formAction, pending] = useActionState<SaveSessionState, FormData>(saveTeachingSession, {});
  const [ticked, setTicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const toggle = (id: string) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const chip = (u: ChipUnit) => (
    <button key={u.id} type="button" onClick={() => toggle(u.id)} aria-pressed={ticked.includes(u.id)}
      className={`rounded-full border px-3 py-1.5 text-sm ${ticked.includes(u.id) ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface"}`}>
      {ticked.includes(u.id) ? "✓ " : ""}{u.title}
    </button>
  );
  const found = q.trim() ? units.filter((u) => u.group === "other" && u.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  return (
    <form key={state.savedAt ?? "new"} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => formAction(fd)); }} className="mx-auto flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="studentId" value={studentId} />
      {ticked.map((id) => <input key={id} type="hidden" name="unit" value={id} />)}
      <section className="rounded-xl border border-border bg-surface p-4">
        <label htmlFor="taughtOn" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">1 · Ngày dạy</label>
        <input id="taughtOn" name="taughtOn" type="date" defaultValue={today} min={minDate} max={today} className="ml-3 rounded-lg border border-border px-3 py-2" />
      </section>
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">2 · Hôm nay dạy bài nào?</p>
        {(["priority", "progress"] as const).map((g) => units.some((u) => u.group === g) && (
          <div key={g}><p className="text-sm text-muted">{g === "priority" ? "Ưu tiên của cô" : "Con đang học dở"}</p><div className="mt-1 flex flex-wrap gap-2">{units.filter((u) => u.group === g).map(chip)}</div></div>
        ))}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm bài khác (${units.length} bài)…`} aria-label="Tìm bài khác" className="rounded-lg border border-border px-3 py-2" />
        {found.length > 0 && <div className="flex flex-wrap gap-2">{found.map(chip)}</div>}
        {ticked.filter((id) => units.find((u) => u.id === id)?.group === "other").length > 0 && (
          <div className="flex flex-wrap gap-2">{units.filter((u) => u.group === "other" && ticked.includes(u.id)).map(chip)}</div>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">3 · Con nắm đến đâu? (chỉ bài đã chọn)</p>
        {ticked.map((id) => {
          const u = units.find((x) => x.id === id)!;
          return (
            <fieldset key={id} className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">{u.title}</legend>
              <span className="min-w-0 flex-[1_1_220px] font-display font-semibold">{u.title} <span className="font-mono text-xs text-muted">hệ thống M{u.level}</span></span>
              {[0, 1, 2, 3, 4].map((n) => (
                <label key={n} title={HINT[n]} className="cursor-pointer">
                  <input type="radio" name={`level:${id}`} value={n} required className="peer sr-only" />
                  <span className="inline-block w-11 rounded-lg border border-border py-1.5 text-center font-mono text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent">M{n}</span>
                </label>
              ))}
            </fieldset>
          );
        })}
        {!ticked.length && <p className="text-sm text-muted">Chọn bài ở bước 2. Buổi chữa đề / không theo bài: ghi chú bên dưới là đủ.</p>}
        <label htmlFor="note" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Ghi chú (tuỳ chọn)</label>
        <textarea id="note" name="note" rows={2} maxLength={500} className="rounded-lg border border-border px-3 py-2" />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-3 font-display font-bold text-on-accent disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu buổi dạy"}</button>
        <a href={`/tutor/${studentId}/giao`} className="font-display font-semibold text-accent">Giao bài về nhà →</a>
        <span aria-live="polite" className="text-sm">{state.error ? <span role="alert" className="text-warn">{state.error}</span> : state.ok ? <span role="status" className="text-good">✓ {state.ok}</span> : null}</span>
      </div>
    </form>
  );
}
