import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { publicItem } from "@/lib/content";
import { findOpenRun, loadStudentState, reviewSession } from "@/lib/learning/state";
import { ReviewPlayer } from "@/components/lesson/review-player";

export const metadata: Metadata = { title: "Ôn lại — App Toán" };

// D14: one mixed session for every unit due today, questions interleaved across units.
export default async function ReviewPage() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");

  const [state, run] = await Promise.all([loadStudentState(supabase, me.id), findOpenRun(supabase, me.id)]);
  // H1: an open run keeps its server-planned questions; otherwise the first answer saves this plan as a run.
  const session = reviewSession(state, run === "error" ? null : run);
  const due = session.units;
  // An open run with every question answered but not saved yet opens on its rating screen.
  if (!due.length || (!session.remaining.length && !session.runId)) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p>{session.later ? `Hôm nay con đã ôn xong rồi. Còn ${session.later} bài, ôn ngày mai nhé.` : "Hôm nay không có bài nào đến hạn ôn."}</p>
        <Link href="/student" className="mt-3 inline-block text-accent hover:underline">
          ← Về trang chính
        </Link>
      </div>
    );
  }
  const title = new Map(due.map((u) => [u.unit.id, u.unit.title]));

  return (
    <ReviewPlayer
      questions={session.remaining.map((q) => {
        const f = due.find((u) => u.unit.id === q.unitId)?.unit.figure;
        return { unitId: q.unitId, unitTitle: title.get(q.unitId)!, item: publicItem(q.item), figure: f && typeof f !== "string" ? f : undefined };
      })}
      answered={session.answered.map(({ unitId, correct }) => ({ unitId, correct }))}
      units={due.map((u) => ({ id: u.unit.id, title: u.unit.title, stage: u.review!.stage }))}
      hasFigure={due.some((u) => u.unit.figure === "right-triangle-altitude")}
    />
  );
}
