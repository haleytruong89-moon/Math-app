import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { progressTest } from "@/lib/content";
import { pointsByBai, ProblemsView } from "@/components/mock/problems";
import { PrintButton } from "@/components/mock/print-button";

export const metadata: Metadata = { title: "In đề kiểm tra — App Toán" };

// Kiểm tra tiến bộ (08/11/2026): the problems of a progress test on an A4 page, for the parent or the tutor to print.
// No answers here (they are on the score sheet). The student reads the same problems on her page once she starts.
export default async function PrintProgressTest(props: PageProps<"/in/kiem-tra/[n]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "parent" && user.role !== "tutor") notFound();
  const n = Number((await props.params).n);
  const t = Number.isInteger(n) ? progressTest(n) : null;
  if (!t) notFound();
  return (
    <main className="mx-auto max-w-[760px] bg-white px-8 py-8 text-[15px] text-black print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-gray-600">Khổ A4 · in một mặt. Đáp án nằm ở phiếu chấm của gia sư, không in ở đây.</p>
        <PrintButton />
      </div>
      <header className="border-b border-black pb-3 text-center">
        <p className="font-display text-lg font-bold">KIỂM TRA TIẾN BỘ KT{t.n} — MÔN TOÁN</p>
        <p className="text-sm">Thời gian làm bài: {t.minutes} phút · Tổng {String(t.parts.reduce((a, p) => a + p.max, 0)).replace(".", ",")} điểm · Họ tên: ……………………………… · Ngày: ……/……/………</p>
        <p className="mt-1 text-xs italic">Các bài đánh số như đề thi vào 10 (bài nào chưa học thì chưa có trong đề này).</p>
      </header>
      <div className="mt-5" data-testid="print-problems">
        <ProblemsView problems={t.problems} points={pointsByBai(t.parts)} />
      </div>
      <p className="mt-8 text-center text-sm italic">— Hết —</p>
    </main>
  );
}
