import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Làm thử — App Toán" };

// T7: the tutor tries a draft exactly as the student will; checkAnswer grades it as a preview and records nothing.
export default async function TutorTryPage(props: PageProps<"/tutor/[studentId]/bai/[unitId]/thu">) {
  await requireRole("tutor");
  const { studentId, unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found || !/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const back = `/tutor/${studentId}/bai/${unitId}`;
  return (
    <div className="mx-auto max-w-md">
      <LessonPlayer unit={toPublicUnit(found.unit, found.module)} mode="preview" initial={{ workedViewed: false, fadedDone: false }} backHref={back} previewBase={`/tutor/${studentId}/bai`} />
    </div>
  );
}
