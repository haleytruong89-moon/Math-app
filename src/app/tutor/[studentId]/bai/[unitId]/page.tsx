import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { ReviewWorkbench } from "@/components/review/workbench";
import { isDrillId } from "@/lib/content";

export const metadata: Metadata = { title: "Duyệt bài — App Toán" };

export default async function TutorReviewPage(props: PageProps<"/tutor/[studentId]/bai/[unitId]">) {
  await requireRole("tutor");
  const [{ studentId, unitId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !/^[a-z0-9-]+$/.test(unitId)) notFound();
  const { data: student } = await (await createClient()).from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const base = `/tutor/${student.id}/bai/${unitId}`;
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <ReviewWorkbench unitId={unitId} base={base} selected={typeof sp.item === "string" ? sp.item : undefined} tryHref={isDrillId(unitId) ? `/tutor/${student.id}/luyen-de` : `${base}/thu`} backHref={isDrillId(unitId) ? `/tutor/${student.id}/luyen-de` : `/tutor/${student.id}/bai`} />
    </>
  );
}
