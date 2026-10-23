import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { DRILL_MODULE, isDrillId, toPublicUnit } from "@/lib/content";
import { studentUnit } from "@/lib/content/approvals";
import { texToHtml } from "@/lib/content/tex";
import { studentDrills } from "@/lib/learning/drills";
import { drillOpen } from "@/lib/learning/drill-plan";
import { DrillPlayer } from "@/components/drill/drill-player";

export const metadata: Metadata = { title: "Luyện đề hình — App Toán" };

// Luyện đề 4.2 (23/10): one problem, only while it is open for her (needed KUs at M3 or ★, weekly cap).
export default async function DrillPage(props: PageProps<"/student/luyen-de/[id]">) {
  const user = await requireRole("student");
  const { id } = await props.params;
  if (!isDrillId(id)) notFound();
  const found = await studentUnit(id);
  if (!found) notFound();
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");
  const row = (await studentDrills(supabase, me.id)).find((r) => r.problem.id === id);
  if (!row || !drillOpen(row.state)) redirect("/student/luyen-de");
  const p = row.problem;
  // The figure is shown once she has drawn her own; items carry none.
  const unit = toPublicUnit({ ...found.unit, figure: undefined }, DRILL_MODULE);
  return <DrillPlayer unit={unit} figure={p.figure} problemHtml={texToHtml(p.problem)} solutionHtml={texToHtml(p.solution)} backHref="/student/luyen-de" />;
}
