import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { publicItem } from "@/lib/content";
import { dueReviews, loadStudentState } from "@/lib/learning/state";
import { planReview } from "@/lib/learning/rules";
import { ReviewPlayer } from "@/components/lesson/review-player";

export const metadata: Metadata = { title: "Ôn lại — App Toán" };

// D14: one mixed session for every unit due today, questions interleaved across units.
export default async function ReviewPage() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");

  const [state, log] = await Promise.all([
    loadStudentState(supabase, me.id),
    supabase.from("review_log").select("run_id, unit_id").eq("student_id", me.id),
  ]);
  if (log.error) console.error("ReviewPage review_log", log.error.message);
  const due = dueReviews(state);
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

  // Review questions come from practice only: exit-test solutions must stay unseen
  // until the student retakes the test. Reloading resumes the unfinished run.
  const plan = planReview(
    due.map((u) => ({ unitId: u.unit.id, pool: u.unit.practice, attempts: u.attempts })),
    new Set((log.data ?? []).map((r) => `${r.run_id}|${r.unit_id}`)),
  );
  const title = new Map(due.map((u) => [u.unit.id, u.unit.title]));

  return (
    <ReviewPlayer
      runId={plan.runId ?? randomUUID()}
      questions={plan.remaining.map((q) => ({ unitId: q.unitId, unitTitle: title.get(q.unitId)!, item: publicItem(q.item) }))}
      answered={plan.answered.map(({ unitId, correct }) => ({ unitId, correct }))}
      units={due.map((u) => ({ id: u.unit.id, title: u.unit.title, stage: u.review!.stage }))}
      hasFigure={due.some((u) => u.unit.figure === "right-triangle-altitude")}
    />
  );
}
