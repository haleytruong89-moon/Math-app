"use client";

import { useActionState, useState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const [show, setShow] = useState(false);

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
        <span className="flex gap-2">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-base"
          />
          {/* Lets a tutor check a password copied from a message before submitting. */}
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={show}
            className="rounded-lg border border-border bg-surface px-3 text-sm text-muted hover:text-ink"
          >
            {show ? "Ẩn" : "Hiện"}
          </button>
        </span>
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
