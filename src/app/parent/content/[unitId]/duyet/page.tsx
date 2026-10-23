import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { ReviewWorkbench } from "@/components/review/workbench";
import { isDrillId } from "@/lib/content";

export const metadata: Metadata = { title: "Duyệt bài — App Toán" };

// T7: the parent reviews in parallel with the tutor, same screen.
export default async function ParentReviewPage(props: PageProps<"/parent/content/[unitId]/duyet">) {
  await requireRole("parent");
  const [{ unitId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[a-z0-9-]+$/.test(unitId)) notFound();
  return <ReviewWorkbench unitId={unitId} base={`/parent/content/${unitId}/duyet`} selected={typeof sp.item === "string" ? sp.item : undefined} tryHref={isDrillId(unitId) ? "/parent/content/luyen-de" : `/parent/content/${unitId}`} backHref={isDrillId(unitId) ? "/parent/content/luyen-de" : "/parent/content"} />;
}
