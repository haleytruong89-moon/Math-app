import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { loadMockExams } from "@/lib/learning/mock-data";
import { MockOverview } from "@/components/mock/mock-views";

export const metadata: Metadata = { title: "Thi thử — App Toán" };

// Thi thử (S9, 07/11/2026): the parent schedules and follows the papers; the tutor grades.
export default async function ParentMockPage() {
  await requireRole("parent");
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name, grade").order("created_at");
  const nine = (students ?? []).filter((s) => s.grade === 9);
  const blocks = await Promise.all(nine.map(async (s) => ({ s, exams: await loadMockExams(supabase, s.id) })));
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Thi thử</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Đề 57–68 (để dành từ 06/10). Con làm trên giấy 120 phút — phụ huynh in đề từ sách; gia sư chấm theo phiếu chấm và nhập điểm từng ý.</p>
      {blocks.map(({ s, exams }) => (
        <section key={s.id} className="mt-6" aria-label={s.full_name}>
          {blocks.length > 1 && <h2 className="mb-3 font-display text-lg font-bold">{s.full_name}</h2>}
          <MockOverview studentId={s.id} exams={exams} hrefFor={(p) => `/parent/thi-thu/${s.id}/${p}`} />
        </section>
      ))}
      {!blocks.length && <p className="mt-6 text-sm text-muted">Chưa có học sinh lớp 9.</p>}
    </>
  );
}
