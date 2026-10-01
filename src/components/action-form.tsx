"use client";

import { useActionState } from "react";

export type ActionState = { ok?: string; error?: string };
type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** Small wrapper so server actions can show a success/error line inline. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "flex flex-col gap-3",
  variant = "primary",
}: {
  action: ServerAction;
  submitLabel: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "primary" | "quiet" | "warn";
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const btn = {
    primary: "bg-accent text-on-accent font-bold",
    quiet: "border border-border bg-surface text-ink",
    warn: "border border-warn bg-transparent text-warn",
  }[variant];

  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-3.5 py-2 font-display text-sm disabled:opacity-60 ${btn}`}
        >
          {pending ? "Đang lưu…" : submitLabel}
        </button>
        {state.ok && <span className="text-sm text-good">{state.ok}</span>}
        {state.error && (
          <span role="alert" className="text-sm text-warn">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-base";
export const labelClass = "flex flex-col gap-1.5 text-sm text-muted";
