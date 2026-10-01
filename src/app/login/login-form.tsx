"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Email</span>
        <input
          name="email"
          type="email"
          key={state.email}
          defaultValue={state.email}
          autoComplete="username"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-base"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Mật khẩu</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-base"
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent disabled:opacity-60"
      >
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
