import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { giveConsent } from "./actions";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };

export default async function StudentHome() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("students")
    .select("full_name, consent_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Acceptance criterion (§2.7): no way past this screen until consent is recorded.
  if (!me?.consent_at) return <ConsentScreen name={user.displayName} />;

  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" });
  return (
    <>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold">Chào {user.displayName}</h1>
        <span className="font-mono text-xs text-muted">{today}</span>
      </div>
      <h2 className="mt-8 font-display text-base font-semibold">Hôm nay cần làm</h2>
      <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Chưa có bài nào. Bài học và lịch ôn sẽ xuất hiện ở đây khi module Hệ thức lượng được mở (P1).
      </div>
    </>
  );
}

function ConsentScreen({ name }: { name: string }) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Chào {name} 👋</h1>
      <p className="mt-3">Trước khi bắt đầu, con đọc kỹ mấy điều này nhé:</p>
      <ul className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 text-[15px] leading-relaxed">
        <li><b>App ghi lại</b> bài con làm, điểm, thời gian làm bài và các câu con hỏi AI.</li>
        <li><b>Ai xem được:</b> bố mẹ và gia sư đang dạy con. Không ai khác.</li>
        <li><b>Để làm gì:</b> biết con đã hiểu phần nào, phần nào cần ôn — không phải để chấm điểm hay so sánh con với ai.</li>
        <li><b>Không có</b> bảng xếp hạng hay chuỗi ngày học liên tục. Nghỉ một hôm cũng không sao.</li>
        <li>Con có thắc mắc hoặc không muốn ghi điều gì, cứ nói với bố mẹ.</li>
      </ul>
      <ActionForm action={giveConsent} submitLabel="Bắt đầu" className="mt-6 flex flex-col gap-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="agree" className="mt-1 size-5 accent-[var(--accent)]" />
          <span>Con đã đọc và đồng ý dùng app như trên.</span>
        </label>
      </ActionForm>
    </>
  );
}
