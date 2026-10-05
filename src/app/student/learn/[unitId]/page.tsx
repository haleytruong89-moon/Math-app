import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit, toPublicUnit } from "@/lib/content";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { loadStudentState } from "@/lib/learning/state";

export const metadata: Metadata = { title: "Học bài — App Toán" };

export default async function LearnPage(props: PageProps<"/student/learn/[unitId]">) {
  const user = await requireRole("student");
  const [{ unitId }, sp] = await Promise.all([props.params, props.searchParams]);

  const found = getUnit(unitId);
  if (!found || found.unit.status !== "approved") notFound(); // drafts never reach students (D16)

  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student"); // D18 consent screen first

  // S6a (LT2): a locked KU can't be opened; LT4: ?testout=1 offers the exit test once, before learning.
  const state = await loadStudentState(supabase, me.id);
  const u = state.units.find((x) => x.unit.id === unitId);
  if (!u) notFound();
  if (u.status === "locked") redirect("/student");
  const testOut = sp.testout === "1" && !!u.entry?.testOut && !u.started;

  return (
    <LessonPlayer
      unit={toPublicUnit(found.unit, found.module)}
      mode="student"
      initial={{ workedViewed: u.workedViewed, fadedDone: u.fadedDone }}
      backHref="/student"
      testOut={testOut}
    />
  );
}
