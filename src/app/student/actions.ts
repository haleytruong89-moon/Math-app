"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

/** "Con làm xong rồi" on a homework card (T1: the tutor corrects it next session; no grading). */
export async function setHomeworkDone(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("student");
  const id = z.uuid().safeParse(fd.get("homeworkId"));
  if (!id.success) return { error: "Không tìm thấy bài này." };
  const done = fd.get("done") === "1";

  const admin = createAdminClient();
  const { data: me } = await admin.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) return { error: "Không tìm thấy bài này." };

  const { data, error } = await admin
    .from("homework")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", id.data)
    .eq("student_id", me.id) // only the student's own homework
    .is("reviewed_at", null) // a corrected homework can no longer change
    .select("id");
  if (error || !data?.length) return { error: "Bài này thầy/cô đã chữa rồi, hoặc chưa lưu được. Tải lại trang nhé." };

  revalidatePath("/student");
  return { ok: done ? "Đã báo thầy/cô" : "Đã bỏ đánh dấu" };
}
