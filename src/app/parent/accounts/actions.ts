"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/action-form";
import { nameMatches } from "@/lib/accounts/rules";
import { parseWeekdays } from "@/lib/learning/overview";
import { parentOwnsStudent } from "@/lib/parent";

// Every action: (1) requireRole('parent') — redirects anyone else,
// (2) validate input, (3) check the parent owns the target, (4) write with the admin client.

const PAGE = "/parent/accounts";
const LOCK_DURATION = "876000h"; // ~100 years = locked until unlocked

const Password = z.string().min(10, "Mật khẩu tối thiểu 10 ký tự.").max(72);
const Uuid = z.uuid();

function fail(message: string): ActionState {
  return { error: message };
}

/** Only tutor/student accounts are managed here — never another parent. */
async function managedProfile(profileId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", profileId)
    .maybeSingle();
  if (!data || data.role === "parent") return null;
  return data;
}

// ---------------------------------------------------------------------

const CreateAccount = z
  .object({
    role: z.enum(["tutor", "student"]),
    displayName: z.string().trim().min(1, "Nhập tên hiển thị.").max(80),
    email: z.email("Email không hợp lệ."),
    password: Password,
    studentId: z.string().optional(),
  })
  .refine((v) => v.role !== "student" || Uuid.safeParse(v.studentId).success, {
    message: "Chọn học sinh cần gắn với tài khoản này.",
  });

export async function createAccount(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const parsed = CreateAccount.safeParse({
    role: fd.get("role"),
    displayName: fd.get("displayName"),
    email: fd.get("email"),
    password: fd.get("password"),
    studentId: fd.get("studentId") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;

  const admin = createAdminClient();
  if (v.role === "student") {
    if (!(await parentOwnsStudent(parent.id, v.studentId!))) return fail("Không tìm thấy học sinh.");
    const { data: s } = await admin.from("students").select("profile_id").eq("id", v.studentId!).single();
    if (s?.profile_id) return fail("Học sinh này đã có tài khoản đăng nhập.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    app_metadata: { role: v.role }, // role lives in app_metadata: users cannot edit it
    user_metadata: { display_name: v.displayName },
  });
  if (error || !data.user) {
    console.error("createAccount failed:", error?.status, error?.message);
    // This page is parent-only, so showing the provider's message is safe and makes setup problems diagnosable.
    return fail(
      error?.message?.toLowerCase().includes("already")
        ? "Email này đã có tài khoản."
        : `Không tạo được tài khoản: ${error?.message ?? "lỗi không rõ"}`,
    );
  }

  // The DB trigger normally creates the profile; upsert here too so account creation never
  // depends on trigger timing (idempotent).
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: data.user.id, role: v.role, display_name: v.displayName }, { onConflict: "id" });
  if (profileError) {
    console.error("createAccount profile upsert failed:", profileError.code, profileError.message);
    return fail(`Tạo được đăng nhập nhưng chưa tạo được hồ sơ: ${profileError.message}`);
  }

  if (v.role === "student") {
    const { error: linkError } = await admin
      .from("students")
      .update({ profile_id: data.user.id })
      .eq("id", v.studentId!);
    if (linkError) {
      console.error("createAccount student link failed:", linkError.code, linkError.message);
      return fail(`Không gắn được tài khoản với học sinh: ${linkError.message}`);
    }
  }

  revalidatePath(PAGE);
  return { ok: `Đã tạo tài khoản cho ${v.displayName}.` };
}

// ---------------------------------------------------------------------

export async function setAccountLocked(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("parent");
  const id = Uuid.safeParse(fd.get("profileId"));
  const lock = fd.get("lock") === "1";
  if (!id.success) return fail("Tài khoản không hợp lệ.");
  const target = await managedProfile(id.data);
  if (!target) return fail("Không thể thay đổi tài khoản này.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(target.id, {
    ban_duration: lock ? LOCK_DURATION : "none",
  });
  if (error) return fail("Không cập nhật được. Thử lại sau.");
  await admin
    .from("profiles")
    .update({ is_active: !lock, locked_at: lock ? new Date().toISOString() : null })
    .eq("id", target.id);

  // Locking a tutor also ends their active assignments (history is kept).
  if (lock && target.role === "tutor") {
    await admin
      .from("tutor_assignments")
      .update({ ended_at: new Date().toISOString() })
      .eq("tutor_id", target.id)
      .is("ended_at", null);
  }

  revalidatePath(PAGE);
  return { ok: lock ? "Đã khoá." : "Đã mở khoá." };
}

// ---------------------------------------------------------------------

export async function resetPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireRole("parent");
  const id = Uuid.safeParse(fd.get("profileId"));
  const pw = Password.safeParse(fd.get("password"));
  if (!id.success) return fail("Tài khoản không hợp lệ.");
  if (!pw.success) return fail(pw.error.issues[0].message);
  const target = await managedProfile(id.data);
  if (!target) return fail("Không thể thay đổi tài khoản này.");

  const { error } = await createAdminClient().auth.admin.updateUserById(target.id, {
    password: pw.data,
  });
  if (error) return fail("Không đặt lại được mật khẩu.");
  return { ok: "Đã đặt mật khẩu mới." };
}

// ---------------------------------------------------------------------

const CreateStudent = z.object({
  fullName: z.string().trim().min(1, "Nhập họ tên.").max(80),
  grade: z.coerce.number().int().min(1).max(12),
});

export async function createStudent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const parsed = CreateStudent.safeParse({ fullName: fd.get("fullName"), grade: fd.get("grade") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .insert({ full_name: parsed.data.fullName, grade: parsed.data.grade })
    .select("id")
    .single();
  if (error || !data) return fail("Không thêm được học sinh.");
  await admin.from("parent_students").insert({ parent_id: parent.id, student_id: data.id });

  revalidatePath(PAGE);
  return { ok: `Đã thêm ${parsed.data.fullName}.` };
}

const UpdateStudent = CreateStudent.extend({ studentId: Uuid });

/** Rename a student profile or change the grade; learning data is untouched. */
export async function updateStudent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const parsed = UpdateStudent.safeParse({ studentId: fd.get("studentId"), fullName: fd.get("fullName"), grade: fd.get("grade") });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;
  if (!(await parentOwnsStudent(parent.id, v.studentId))) return fail("Không tìm thấy học sinh.");

  const { error } = await createAdminClient().from("students").update({ full_name: v.fullName, grade: v.grade }).eq("id", v.studentId);
  if (error) return fail("Chưa lưu được, thử lại sau.");
  revalidatePath(PAGE);
  return { ok: "Đã lưu." };
}

/**
 * Delete a student profile and everything attached to it (attempts, reviews, sessions,
 * homework cascade in the DB), plus its login account. The parent must type the name again.
 */
export async function deleteStudent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const id = Uuid.safeParse(fd.get("studentId"));
  if (!id.success) return fail("Không tìm thấy học sinh.");
  if (!(await parentOwnsStudent(parent.id, id.data))) return fail("Không tìm thấy học sinh.");

  const admin = createAdminClient();
  const { data: s } = await admin.from("students").select("full_name, profile_id").eq("id", id.data).maybeSingle();
  if (!s) return fail("Không tìm thấy học sinh.");
  if (!nameMatches(fd.get("confirmName"), s.full_name as string)) return fail(`Gõ đúng họ tên “${s.full_name}” để xác nhận xoá.`);

  const { error } = await admin.from("students").delete().eq("id", id.data);
  if (error) {
    console.error("deleteStudent", error.message);
    return fail("Chưa xoá được, thử lại sau.");
  }
  // Only ever delete a *student* login (never a parent/tutor account linked by mistake).
  const login = s.profile_id ? await managedProfile(s.profile_id as string) : null;
  if (login?.role === "student") {
    const { error: authError } = await admin.auth.admin.deleteUser(login.id as string);
    if (authError) {
      console.error("deleteStudent login", authError.message);
      revalidatePath(PAGE);
      return fail("Đã xoá hồ sơ, nhưng chưa xoá được tài khoản đăng nhập. Khoá tài khoản đó ở bảng trên.");
    }
  }
  revalidatePath(PAGE);
  return { ok: `Đã xoá ${s.full_name}.` };
}

// ---------------------------------------------------------------------

export async function assignTutor(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const tutorId = Uuid.safeParse(fd.get("tutorId"));
  const studentId = Uuid.safeParse(fd.get("studentId"));
  if (!tutorId.success || !studentId.success) return fail("Chọn gia sư và học sinh.");
  const weekdays = parseWeekdays(fd.getAll("weekday"));
  if (!weekdays) return fail("Ngày dạy không hợp lệ.");
  if (!(await parentOwnsStudent(parent.id, studentId.data))) return fail("Không tìm thấy học sinh.");

  const admin = createAdminClient();
  const { data: tutor } = await admin
    .from("profiles")
    .select("role, is_active")
    .eq("id", tutorId.data)
    .maybeSingle();
  if (!tutor || tutor.role !== "tutor" || !tutor.is_active) return fail("Gia sư không hợp lệ hoặc đã bị khoá.");

  const { error } = await admin
    .from("tutor_assignments")
    .insert({ tutor_id: tutorId.data, student_id: studentId.data, weekdays });
  if (error) {
    return fail(error.code === "23505" ? "Gia sư này đang dạy học sinh này rồi." : "Không gán được.");
  }
  revalidatePath(PAGE);
  return { ok: "Đã gán gia sư." };
}

export async function endAssignment(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const id = Uuid.safeParse(fd.get("assignmentId"));
  if (!id.success) return fail("Không hợp lệ.");

  const admin = createAdminClient();
  const { data: a } = await admin
    .from("tutor_assignments")
    .select("student_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!a || !(await parentOwnsStudent(parent.id, a.student_id))) return fail("Không tìm thấy.");

  await admin
    .from("tutor_assignments")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("ended_at", null);
  revalidatePath(PAGE);
  return { ok: "Đã kết thúc." };
}

/** Edit the weekly teaching days of an active assignment (S4 "buổi dạy chưa ghi"). */
export async function setAssignmentWeekdays(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parent = await requireRole("parent");
  const id = Uuid.safeParse(fd.get("assignmentId"));
  const weekdays = parseWeekdays(fd.getAll("weekday"));
  if (!id.success) return fail("Không hợp lệ.");
  if (!weekdays) return fail("Ngày dạy không hợp lệ.");

  const admin = createAdminClient();
  const { data: a } = await admin.from("tutor_assignments").select("student_id").eq("id", id.data).is("ended_at", null).maybeSingle();
  if (!a || !(await parentOwnsStudent(parent.id, a.student_id as string))) return fail("Không tìm thấy.");
  const { error } = await admin.from("tutor_assignments").update({ weekdays }).eq("id", id.data);
  if (error) return fail("Chưa lưu được, thử lại sau.");
  revalidatePath(PAGE);
  revalidatePath("/parent");
  return { ok: "Đã lưu lịch." };
}
