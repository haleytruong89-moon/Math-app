import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Xem trước bài — App Toán" };

// D16: the parent sees a draft exactly as the student will, before approving it.
export default async function PreviewUnitPage(props: PageProps<"/parent/content/[unitId]">) {
  await requireRole("parent");
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Link href="/parent/content" className="text-sm text-accent hover:underline">
        ← Danh sách bài
      </Link>
      <div className="mt-4">
        <LessonPlayer
          unit={toPublicUnit(found.unit, found.module)}
          mode="preview"
          initial={{ workedViewed: false, fadedDone: false }}
          backHref="/parent/content"
        />
      </div>
    </div>
  );
}
