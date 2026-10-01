import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "parent" | "tutor" | "student";

export type CurrentUser = {
  id: string;
  role: AppRole;
  displayName: string;
};

export const ROLE_HOME: Record<AppRole, string> = {
  parent: "/parent",
  tutor: "/tutor",
  student: "/student",
};

/**
 * Verified current user, or null. Memoized per request.
 * getClaims() verifies the JWT; the profile row is read through RLS,
 * so a locked (is_active = false) account is treated as signed out.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;
  return {
    id: profile.id,
    role: profile.role as AppRole,
    displayName: profile.display_name,
  };
});

/** Use at the top of every protected page, layout and server action. */
export async function requireRole(role: AppRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
