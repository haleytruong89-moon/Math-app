import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { toPublicUnit } from "@/lib/content";
import { studentUnit } from "@/lib/content/approvals";
import { HomeworkPractice } from "@/components/lesson/homework-practice";

export const metadata: Metadata = { title: "Bài về nhà — App Toán" };

// T9: the items the tutor picked, as practice (graded on the server, counted toward mastery).
export default async function HomeworkPage(props: PageProps<"/student/homework/[id]">) {
  const user = await requireRole("student");
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");
  const { data: hw } = await supabase.from("homework").select("id, unit_id, items, task, reviewed_at").eq("id", id).eq("student_id", me.id).maybeSingle();
  if (!hw?.unit_id || !Array.isArray(hw.items) || !hw.items.length || hw.reviewed_at) notFound();
  const found = await studentUnit(hw.unit_id as string);
  if (!found) notFound();
  const pub = toPublicUnit(found.unit, found.module);
  const items = (hw.items as string[]).flatMap((x) => pub.practice.filter((p) => p.id === x));
  if (!items.length) notFound();
  return (
    <div className="flex flex-col gap-3">
      <Link href="/student" className="text-sm text-accent hover:underline">← Trang chính</Link>
      <p className="font-mono text-xs text-muted">Bài về nhà · {found.unit.title} · {items.length} câu</p>
      <p className="whitespace-pre-line">{hw.task as string}</p>
      <HomeworkPractice unit={{ ...pub, practice: items }} homeworkId={hw.id as string} />
    </div>
  );
}
