import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { ActionForm } from "@/components/action-form";
import { createClient } from "@/lib/supabase/server";
import { loadStudentState } from "@/lib/learning/state";
import { unlockUnit } from "@/app/parent/actions";

export const metadata: Metadata = { title: "Xem trước bài — App Toán" };

// D16: the parent sees a draft exactly as the student will, before approving it.
export default async function PreviewUnitPage(props: PageProps<"/parent/content/[unitId]">) {
  await requireRole("parent");
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found) notFound();

  // LT2: one "Mở khoá cho con" per child for whom this KU is still locked.
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name").order("created_at");
  const locked = (
    await Promise.all(
      (students ?? []).map(async (s) => {
        const st = await loadStudentState(supabase, s.id as string);
        return st.units.find((u) => u.unit.id === unitId)?.status === "locked" ? s : null;
      }),
    )
  ).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/parent/content" className="text-sm text-accent hover:underline">
        ← Danh sách bài
      </Link>
      {locked.map((s) => (
        <div key={s.id as string} className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm" data-testid="unlock-box">
          <p>
            Bài này đang <b>khoá</b> với {s.full_name as string} (bài tiên quyết chưa đạt M3).
          </p>
          <ActionForm action={unlockUnit} submitLabel="Mở khoá cho con" variant="quiet" className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="studentId" value={s.id as string} />
            <input type="hidden" name="unitId" value={unitId} />
          </ActionForm>
        </div>
      ))}
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
