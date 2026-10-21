import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { soTay } from "@/lib/content";
import { SoTayView } from "@/components/so-tay/so-tay-view";

export const metadata: Metadata = { title: "Sổ tay suy ngược — App Toán" };

/** S5: read-only handbook; the student sees it only once approved. Records nothing. */
export default async function StudentSoTayPage() {
  await requireRole("student");
  const data = soTay();
  if (!data || data.status !== "approved")
    return <p className="rounded-lg border border-border bg-surface p-4">Sổ tay suy ngược đang được soạn — thầy cô duyệt xong là con xem được.</p>;
  return (
    <>
      <h1 className="mb-4 font-display text-2xl font-bold">Sổ tay suy ngược</h1>
      <SoTayView data={data} />
    </>
  );
}
