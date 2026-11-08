import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { loadMockExams } from "@/lib/learning/mock-data";
import { MockOverview, ProgressOverview } from "@/components/mock/mock-views";
import { loadTargetBoard, TargetBoard } from "@/components/mock/target-board";
import { loadStudentState } from "@/lib/learning/state";

export const metadata: Metadata = { title: "Kiểm tra & thi thử — App Toán" };

// Thi thử (S9, 07/11/2026): the parent schedules and follows the papers; the tutor grades.
export default async function ParentMockPage() {
  await requireRole("parent");
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name, grade").order("created_at");
  const nine = (students ?? []).filter((s) => s.grade === 9);
  const blocks = await Promise.all(
    nine.map(async (s) => {
      const [exams, state] = await Promise.all([loadMockExams(supabase, s.id), loadStudentState(supabase, s.id)]);
      return { s, exams, board: await loadTargetBoard(supabase, s.id, new Map(state.units.map((u) => [u.unit.id, u.mastery.level]))) };
    }),
  );
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Kiểm tra tiến bộ & thi thử</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Kiểm tra tiến bộ 2 tuần/lần (đề in từ app). Thi thử Đề 57–68 (để dành từ 06/10): con làm trên giấy 120 phút — phụ huynh in đề từ sách. Gia sư chấm theo phiếu chấm và nhập điểm từng ý.</p>
      {blocks.map(({ s, exams, board }) => (
        <section key={s.id} className="mt-6" aria-label={s.full_name}>
          {blocks.length > 1 && <h2 className="mb-3 font-display text-lg font-bold">{s.full_name}</h2>}
          <div className="flex flex-col gap-6">
            <TargetBoard board={board} />
            <ProgressOverview studentId={s.id} exams={exams} hrefFor={(k) => `/parent/thi-thu/${s.id}/${k}`} />
            <div>
              <h2 className="mb-3 font-display text-lg font-bold">Thi thử — Đề 57–68</h2>
              <MockOverview studentId={s.id} exams={exams} hrefFor={(k) => `/parent/thi-thu/${s.id}/${k}`} />
            </div>
          </div>
        </section>
      ))}
      {!blocks.length && <p className="mt-6 text-sm text-muted">Chưa có học sinh lớp 9.</p>}
    </>
  );
}
