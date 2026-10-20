"use client";

import { useActionState } from "react";
import { editPriorities } from "@/app/review/actions";

/** ⭐ / ↑ / ↓ — one small form per button (T8). */
export function PriorityButton({ studentId, unitId, op, label, title }: { studentId: string; unitId: string; op: "toggle" | "up" | "down"; label: string; title: string }) {
  const [state, action, pending] = useActionState(editPriorities, {});
  return (
    <form action={action} className="inline">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="unitId" value={unitId} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" disabled={pending} title={state.error ?? title} aria-label={title} className="rounded-md px-2 py-1 font-mono text-sm hover:bg-accent-soft disabled:opacity-50">
        {label}
      </button>
    </form>
  );
}
