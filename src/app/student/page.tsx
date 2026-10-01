import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { listModules } from "@/lib/content";
import { giveConsent } from "./actions";

export const metadata: Metadata = { title: "Hôm nay — App Toán" };

export default async function StudentHome() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase
    .from("students")
    .select("id, full_name, consent_at")
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
      <TodayList studentId={me.id} />
    </>
  );
}

// Slice 1: approved units in order with their status. Review sessions, interleaving and the
// weekly goal arrive in slice 2 (docs/P1_PLAN.md).
async function TodayList({ studentId }: { studentId: string }) {
  const supabase = await createClient();
  const [{ data: progress }, { data: exits }] = await Promise.all([
    supabase.from("unit_progress").select("unit_id, worked_viewed_at, faded_done_at").eq("student_id", studentId),
    supabase
      .from("attempts")
      .select("unit_id, exit_run, correct, created_at")
      .eq("student_id", studentId)
      .eq("mode", "exit")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // Latest exit-test run per unit → score.
  const lastExit = new Map<string, { run: string; right: number; total: number }>();
  for (const a of exits ?? []) {
    const cur = lastExit.get(a.unit_id);
    if (!cur) lastExit.set(a.unit_id, { run: a.exit_run!, right: a.correct ? 1 : 0, total: 1 });
    else if (cur.run === a.exit_run) {
      cur.total += 1;
      if (a.correct) cur.right += 1;
    }
  }
  const prog = new Map((progress ?? []).map((p) => [p.unit_id, p]));
  const units = listModules().flatMap((m) => m.unitList.filter((u) => u.status === "approved"));

  if (!units.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted">
        Chưa có bài nào được mở. Bố mẹ sẽ mở bài mới sau khi duyệt nội dung.
      </div>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-3">
      {units.map((u) => {
        const p = prog.get(u.id);
        const ex = lastExit.get(u.id);
        const badge = ex
          ? { text: `Kiểm tra ${ex.right}/${ex.total}`, cls: "bg-good-soft text-good" }
          : p?.worked_viewed_at
            ? { text: "Đang học", cls: "bg-accent-soft text-accent" }
            : { text: "Bài mới", cls: "bg-warn-soft text-warn" };
        const note = !p?.worked_viewed_at
          ? "Xem lời giải mẫu trước khi tự làm"
          : !p.faded_done_at
            ? "Tiếp tục phần điền bước"
            : ex
              ? "Làm lại luyện tập hoặc kiểm tra nếu muốn"
              : "Luyện tập rồi làm bài kiểm tra";
        return (
          <li key={u.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display font-semibold leading-snug">{u.title}</p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs ${badge.cls}`}>{badge.text}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{note}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-xs text-muted">~{u.estMinutes} phút</span>
              <Link
                href={`/student/learn/${u.id}`}
                className="rounded-lg bg-accent px-4 py-2 font-display text-sm font-bold text-on-accent"
              >
                {p?.worked_viewed_at ? "Học tiếp" : "Học bài mới"}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
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
