import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { TutorTabs } from "@/components/tutor/tutor-tabs";

export const metadata: Metadata = { title: "Làm thử — App Toán" };

// T7: the tutor tries a draft exactly as the student will (phone width); checkAnswer grades it as a preview and records nothing.
export default async function TutorTryPage(props: PageProps<"/tutor/[studentId]/bai/[unitId]/thu">) {
  await requireRole("tutor");
  const { studentId, unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found || !/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const { data: student } = await (await createClient()).from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const back = `/tutor/${student.id}/bai/${unitId}`;
  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="bai" />
      <div className="mx-auto max-w-md">
        <Link href={back} className="text-sm text-accent hover:underline">
          ← Về màn duyệt
        </Link>
        <div className="mt-3">
          <LessonPlayer unit={toPublicUnit(found.unit, found.module)} mode="preview" initial={{ workedViewed: false, fadedDone: false }} backHref={back} previewBase={`/tutor/${student.id}/bai`} />
        </div>
      </div>
    </>
  );
}
