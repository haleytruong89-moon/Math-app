import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { StudentWork } from "@/components/work/student-work";

export const metadata: Metadata = { title: "Bài làm của con — App Toán" };

export default async function ParentWorkPage(props: PageProps<"/parent/students/[studentId]/work">) {
  await requireRole("parent");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  // RLS: a parent only reads their own children.
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  return (
    <div className="mx-auto max-w-md">
      <StudentWork
        supabase={supabase}
        student={student}
        basePath={`/parent/students/${student.id}/work`}
        back={{ href: "/parent", label: "← Tổng quan" }}
        unitId={typeof sp.unit === "string" ? sp.unit : null}
        all={sp.all === "1"}
        proposer="Gia sư"
      />
    </div>
  );
}
