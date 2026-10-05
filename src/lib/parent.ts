import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** The parent owns this student (parent_students link). */
export async function parentOwnsStudent(parentId: string, studentId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .maybeSingle();
  return Boolean(data);
}
