import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Học bài — App Toán" };

export default async function LearnPage(props: PageProps<"/student/learn/[unitId]">) {
  const user = await requireRole("student");
  const { unitId } = await props.params;

  const found = getUnit(unitId);
  if (!found || found.unit.status !== "approved") notFound(); // drafts never reach students (D16)

  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student"); // D18 consent screen first

  const { data: p } = await supabase
    .from("unit_progress")
    .select("worked_viewed_at, faded_done_at")
    .eq("student_id", me.id)
    .eq("unit_id", unitId)
    .maybeSingle();

  return (
    <LessonPlayer
      unit={toPublicUnit(found.unit, found.module)}
      mode="student"
      initial={{ workedViewed: !!p?.worked_viewed_at, fadedDone: !!p?.faded_done_at }}
      backHref="/student"
    />
  );
}
