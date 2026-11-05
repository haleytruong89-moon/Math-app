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
import { PriorityButton } from "@/components/tutor/priority-button";

export const metadata: Metadata = { title: "Xem trước bài — App Toán" };

// D16: the parent sees a draft exactly as the student will, before approving it.
export default async function PreviewUnitPage(props: PageProps<"/parent/content/[unitId]">) {
  await requireRole("parent");
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found) notFound();

  // LT2: "Mở khoá cho con" per locked child; "★ Cần tập trung" per child (focus = tutor_priorities, parent allowed).
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id, full_name").order("created_at");
  const children = (
    await Promise.all(
      (students ?? []).map(async (s) => {
        const st = await loadStudentState(supabase, s.id as string);
        return { id: s.id as string, name: s.full_name as string, status: st.units.find((u) => u.unit.id === unitId)?.status, starred: st.priorities.includes(unitId) };
      }),
    )
  ).filter((c) => c.status); // only children who have this unit on their roadmap

  return (
    <div className="mx-auto max-w-md">
      <Link href="/parent/content" className="text-sm text-accent hover:underline">
        ← Danh sách bài
      </Link>
      {children.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-sm" data-testid="focus-box">
          <p className="font-display font-semibold">Chủ đề này cho con</p>
          <p className="mt-0.5 text-xs text-muted">
            Đánh dấu <span className="text-star">★</span> &ldquo;cần tập trung&rdquo; để bài hiện trong mục <b>&ldquo;Cần tập trung&rdquo;</b> ở trang của con (con vẫn tự chọn, không bắt buộc).
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {children.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 first:border-t-0 first:pt-0">
                <span className="min-w-0 flex-1 font-medium">{c.name}</span>
                {c.status === "locked" && (
                  <ActionForm action={unlockUnit} submitLabel="Mở khoá" variant="quiet">
                    <input type="hidden" name="studentId" value={c.id} />
                    <input type="hidden" name="unitId" value={unitId} />
                  </ActionForm>
                )}
                <PriorityButton
                  studentId={c.id}
                  unitId={unitId}
                  op="toggle"
                  on={c.starred}
                  wide
                  label={c.starred ? "★ Đang tập trung" : "☆ Cần tập trung"}
                  title={c.starred ? "Bỏ cần tập trung" : "Đánh dấu cần tập trung"}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
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
