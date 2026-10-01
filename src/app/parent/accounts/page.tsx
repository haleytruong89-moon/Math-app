import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import {
  assignTutor,
  createAccount,
  createStudent,
  endAssignment,
  resetPassword,
  setAccountLocked,
} from "./actions";

export const metadata: Metadata = { title: "Tài khoản — App Toán" };

const ROLE_LABEL: Record<string, string> = { parent: "Phụ huynh", tutor: "Gia sư", student: "Học sinh" };
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function AccountsPage() {
  await requireRole("parent");
  const supabase = await createClient();

  const [{ data: profiles }, { data: students }, { data: assignments }, users] = await Promise.all([
    supabase.from("profiles").select("id, role, display_name, is_active").order("created_at"),
    supabase.from("students").select("id, full_name, grade, profile_id").order("created_at"),
    supabase
      .from("tutor_assignments")
      .select("id, tutor_id, student_id, started_at, ended_at")
      .order("started_at", { ascending: false }),
    createAdminClient().auth.admin.listUsers({ perPage: 200 }),
  ]);

  const emailOf = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const nameOf = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
  const studentName = new Map((students ?? []).map((s) => [s.id, s.full_name]));
  const tutors = (profiles ?? []).filter((p) => p.role === "tutor" && p.is_active);
  const studentsWithoutLogin = (students ?? []).filter((s) => !s.profile_id);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-display text-2xl font-bold">Tài khoản</h1>
        <p className="mt-2 text-sm text-muted">
          Mỗi gia sư một tài khoản riêng. Gia sư nghỉ thì <b>khoá</b> tài khoản (lịch sử dạy vẫn giữ),
          gia sư mới thì tạo tài khoản mới.
        </p>

        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border font-mono text-xs text-muted">
              <tr>
                <th className="px-4 py-2.5 font-normal">Tên</th>
                <th className="px-4 py-2.5 font-normal">Vai trò</th>
                <th className="px-4 py-2.5 font-normal">Email đăng nhập</th>
                <th className="px-4 py-2.5 font-normal">Trạng thái</th>
                <th className="px-4 py-2.5 font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(profiles ?? []).map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="px-4 py-3">{p.display_name}</td>
                  <td className="px-4 py-3">{ROLE_LABEL[p.role]}</td>
                  <td className="px-4 py-3 font-mono text-xs">{emailOf.get(p.id)}</td>
                  <td className={`px-4 py-3 ${p.is_active ? "text-good" : "text-warn"}`}>
                    {p.is_active ? "Đang dùng" : "Đã khoá"}
                  </td>
                  <td className="px-4 py-3">
                    {p.role === "parent" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <ActionForm
                          action={setAccountLocked}
                          submitLabel={p.is_active ? "Khoá" : "Mở khoá"}
                          variant={p.is_active ? "warn" : "quiet"}
                        >
                          <input type="hidden" name="profileId" value={p.id} />
                          <input type="hidden" name="lock" value={p.is_active ? "1" : "0"} />
                        </ActionForm>
                        <details>
                          <summary className="cursor-pointer text-accent">Đặt lại mật khẩu</summary>
                          <ActionForm action={resetPassword} submitLabel="Lưu mật khẩu" variant="quiet" className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="profileId" value={p.id} />
                            <input name="password" type="text" minLength={10} required placeholder="Mật khẩu mới (≥ 10 ký tự)" className={inputClass} autoComplete="off" />
                          </ActionForm>
                        </details>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Tạo tài khoản mới</h2>
          <ActionForm action={createAccount} submitLabel="Tạo tài khoản" className="mt-4 flex flex-col gap-3">
            <label className={labelClass}>
              Vai trò
              <select name="role" className={inputClass} defaultValue="tutor">
                <option value="tutor">Gia sư</option>
                <option value="student">Học sinh</option>
              </select>
            </label>
            <label className={labelClass}>
              Tên hiển thị
              <input name="displayName" required maxLength={80} placeholder="Vd: Cô Trang" className={inputClass} />
            </label>
            <label className={labelClass}>
              Email đăng nhập
              <input name="email" type="email" required placeholder="vd: co.trang@gmail.com" className={inputClass} autoComplete="off" />
            </label>
            <label className={labelClass}>
              Mật khẩu ban đầu
              <input name="password" type="text" required minLength={10} placeholder="≥ 10 ký tự" className={inputClass} autoComplete="off" />
            </label>
            <label className={labelClass}>
              Gắn với học sinh (chỉ khi tạo tài khoản học sinh)
              <select name="studentId" className={inputClass} defaultValue="">
                <option value="">—</option>
                {studentsWithoutLogin.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </label>
          </ActionForm>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Gán gia sư cho học sinh</h2>
          <ActionForm action={assignTutor} submitLabel="Gán" className="mt-4 flex flex-col gap-3">
            <label className={labelClass}>
              Gia sư
              <select name="tutorId" required className={inputClass} defaultValue="">
                <option value="" disabled>Chọn gia sư</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>{t.display_name}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Học sinh
              <select name="studentId" required className={inputClass} defaultValue="">
                <option value="" disabled>Chọn học sinh</option>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </label>
          </ActionForm>

          <h3 className="mt-8 font-display text-sm font-semibold">Lịch sử phân công</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
            {(assignments ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  {nameOf.get(a.tutor_id)} → {studentName.get(a.student_id)}
                  <span className="ml-2 font-mono text-xs text-muted">
                    {fmt(a.started_at)} – {a.ended_at ? fmt(a.ended_at) : "nay"}
                  </span>
                </span>
                {!a.ended_at && (
                  <ActionForm action={endAssignment} submitLabel="Kết thúc" variant="quiet" className="flex">
                    <input type="hidden" name="assignmentId" value={a.id} />
                  </ActionForm>
                )}
              </li>
            ))}
            {!assignments?.length && <li className="py-2.5 text-muted">Chưa có phân công.</li>}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:col-span-2">
          <h2 className="font-display text-base font-semibold">Thêm học sinh</h2>
          <p className="mt-1 text-sm text-muted">Dùng khi bắt đầu cho An dùng app (D11).</p>
          <ActionForm action={createStudent} submitLabel="Thêm" className="mt-4 flex flex-wrap items-end gap-3">
            <label className={`${labelClass} min-w-56 flex-1`}>
              Họ tên
              <input name="fullName" required maxLength={80} className={inputClass} />
            </label>
            <label className={`${labelClass} w-24`}>
              Lớp
              <input name="grade" type="number" min={1} max={12} required className={inputClass} />
            </label>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
