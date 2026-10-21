import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { soTay } from "@/lib/content";
import { SoTayView } from "@/components/so-tay/so-tay-view";

export const metadata: Metadata = { title: "Sổ tay suy ngược — App Toán" };

/** S5: the parent previews the handbook, draft included. */
export default async function ParentSoTayPage() {
  await requireRole("parent");
  const data = soTay();
  return (
    <>
      <Link href="/parent/content" className="text-sm text-accent hover:underline">
        ← Nội dung bài học
      </Link>
      <h1 className="mb-4 mt-2 font-display text-2xl font-bold">Sổ tay suy ngược</h1>
      {!data ? (
        <p>Chưa có sổ tay.</p>
      ) : (
        <>
          {data.status === "draft" && (
            <p className="mb-4 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-warn" data-testid="so-tay-draft">
              Bản nháp — học sinh chưa thấy. Duyệt: đổi &ldquo;status&rdquo; thành &ldquo;approved&rdquo; (kèm &ldquo;approvedOn&rdquo;) trong một PR.
            </p>
          )}
          <SoTayView data={data} />
        </>
      )}
    </>
  );
}
