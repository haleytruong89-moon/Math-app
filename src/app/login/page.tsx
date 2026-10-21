import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasPublicEnv } from "@/lib/env";
import { getCurrentUser, ROLE_HOME } from "@/lib/dal";
import { SetupNotice } from "@/components/setup-notice";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập — App Toán" };

// Mockup "v2 · Đăng nhập" (21/10): logo, who it is for, a white card with the form.
export default async function LoginPage() {
  await connection(); // env + session are read per request, never at build time
  if (!hasPublicEnv()) return <SetupNotice />;

  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-4 py-12 font-display">
      <div className="flex items-center justify-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-xl bg-accent text-xl font-bold text-on-accent" aria-hidden>∑</span>
        <h1 className="text-2xl font-bold tracking-tight">App Toán</h1>
      </div>
      <p className="mt-2 text-center text-muted">Dành cho phụ huynh, gia sư và học sinh</p>
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[0_4px_16px_rgba(16,24,40,0.06)]">
        <h2 className="text-lg font-bold">Đăng nhập</h2>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted">Dùng email và mật khẩu phụ huynh đã gửi. Quên mật khẩu? Nhắn phụ huynh để đặt lại.</p>
      </div>
      <p className="mt-4 text-center text-xs text-muted">Đăng nhập một lần — lần sau mở app là vào thẳng.</p>
    </main>
  );
}
