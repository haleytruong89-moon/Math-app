"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/action-form";

/** D18: the student confirms they understand what is recorded and who sees it. */
export async function giveConsent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  if (fd.get("agree") !== "on") return { error: "Con hãy đánh dấu ô đồng ý trước nhé." };

  const { error } = await createAdminClient()
    .from("students")
    .update({ consent_at: new Date().toISOString() })
    .eq("profile_id", user.id) // only the student's own record
    .is("consent_at", null);
  if (error) return { error: "Chưa lưu được, thử lại sau." };

  revalidatePath("/student");
  return { ok: "Cảm ơn con!" };
}
