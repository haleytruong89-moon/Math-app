import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { publicItem } from "@/lib/content";
import { dueReviews, loadStudentState } from "@/lib/learning/state";
import { interleave, pickReviewItems } from "@/lib/learning/rules";
import { ReviewPlayer } from "@/components/lesson/review-player";

export const metadata: Metadata = { title: "Ôn lại — App Toán" };

// D14: one mixed session for every unit due today, questions interleaved across units.
export default async function ReviewPage() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");

  const due = dueReviews(await loadStudentState(supabase, me.id));
  if (!due.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p>Hôm nay không có bài nào đến hạn ôn.</p>
        <Link href="/student" className="mt-3 inline-block text-accent hover:underline">
          ← Về trang chính
        </Link>
      </div>
    );
  }

  const questions = interleave(
    due.map((u) =>
      pickReviewItems([...u.unit.practice, ...u.unit.exit], u.attempts).map((it) => ({
        unitId: u.unit.id,
        unitTitle: u.unit.title,
        item: publicItem(it),
      })),
    ),
  );

  return (
    <ReviewPlayer
      runId={randomUUID()}
      questions={questions}
      units={due.map((u) => ({ id: u.unit.id, title: u.unit.title, stage: u.review!.stage }))}
      hasFigure={due.some((u) => u.unit.figure === "right-triangle-altitude")}
    />
  );
}
