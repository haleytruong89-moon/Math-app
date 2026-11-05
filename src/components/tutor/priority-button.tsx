"use client";

import { useActionState } from "react";
import { editPriorities } from "@/app/review/actions";

/**
 * T8 controls, one small form per button. `star`: a Gmail-like star (filled amber when on, grey outline when off,
 * 40 px target); `up` / `down`: small icon buttons for the order.
 */
export function PriorityButton({ studentId, unitId, op, label, title, on, wide }: { studentId: string; unitId: string; op: "toggle" | "up" | "down"; label: string; title: string; on?: boolean; wide?: boolean }) {
  const [state, action, pending] = useActionState(editPriorities, {});
  const cls = wide
    ? `inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${on ? "border-star bg-star-soft text-star" : "border-border bg-surface text-muted hover:border-star hover:text-star"}`
    : op === "toggle"
      ? `grid size-10 place-items-center rounded-lg text-[22px] leading-none transition hover:bg-star-soft disabled:opacity-50 ${on ? "text-star" : "text-muted/50 hover:text-star"}`
      : "grid size-8 place-items-center rounded-md border border-border bg-surface text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-50";
  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" disabled={pending} title={state.error ?? title} aria-label={title} aria-pressed={op === "toggle" ? !!on : undefined} className={cls}>
        {label}
      </button>
    </form>
  );
}
