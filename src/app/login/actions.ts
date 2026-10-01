"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type AppRole } from "@/lib/dal";

export type LoginState = { error?: string; email?: string };

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khoá.";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: GENERIC_ERROR, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: GENERIC_ERROR, email };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: GENERIC_ERROR, email };
  }

  redirect(ROLE_HOME[profile.role as AppRole]);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
