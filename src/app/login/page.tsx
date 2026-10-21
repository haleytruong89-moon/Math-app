import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { hasPublicEnv } from "@/lib/env";
import { getCurrentUser, ROLE_HOME } from "@/lib/dal";
import { SetupNotice } from "@/components/setup-notice";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập — App Toán" };

export default async function LoginPage() {
  await connection(); // env + session are read per request, never at build time
  if (!hasPublicEnv()) return <SetupNotice />;

  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">App Toán</h1>
      <p className="mt-2 text-muted">Dùng email và mật khẩu phụ huynh đã gửi cho bạn.</p>
      <LoginForm />
      <p className="mt-6 text-sm text-muted">
        Quên mật khẩu? Nhắn phụ huynh để được đặt lại.
      </p>
    </main>
  );
}
