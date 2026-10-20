import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/dal";

type Admin = ReturnType<typeof createAdminClient>;

/** D3: an active tutor profile with an active assignment to this student. */
export async function activeAssignment(admin: Admin, tutorId: string, studentId: string): Promise<boolean> {
  const [{ data: profile }, { data: assignment }] = await Promise.all([
    admin.from("profiles").select("is_active").eq("id", tutorId).maybeSingle(),
    admin.from("tutor_assignments").select("id").eq("tutor_id", tutorId).eq("student_id", studentId).is("ended_at", null).maybeSingle(),
  ]);
  return !!profile?.is_active && !!assignment;
}

/** T7: who may review content — the parent, or an active tutor who still teaches someone. */
export async function reviewerOf(): Promise<{ id: string; role: "parent" | "tutor" } | null> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "parent" && user.role !== "tutor")) return null;
  if (user.role === "parent") return { id: user.id, role: "parent" };
  const { data } = await createAdminClient().from("tutor_assignments").select("id").eq("tutor_id", user.id).is("ended_at", null).limit(1);
  return data?.length ? { id: user.id, role: "tutor" } : null;
}
