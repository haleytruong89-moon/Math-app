import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { drills } from "@/lib/content";
import { DrillBankList } from "@/components/drill/drill-bank-list";

export const metadata: Metadata = { title: "Luyện đề hình — App Toán" };

// Luyện đề 4.2 (23/10): the bank for the parent; approve = tell Claude "duyệt luyện đề" (git).
export default async function ParentDrillPage() {
  await requireRole("parent");
  return (
    <>
      <Link href="/parent/content" className="text-sm text-accent hover:underline">
        ← Nội dung bài học
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold">Luyện đề hình 4.2</h1>
      <p className="mt-1 text-sm text-muted">Bài nháp: soát từng câu, rồi nói &ldquo;duyệt luyện đề&rdquo; với Claude để con thấy.</p>
      <DrillBankList problems={drills()} reviewHref={(id) => `/parent/content/${id}/duyet`} />
    </>
  );
}
