import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { studentModules } from "@/lib/content/approvals";
import { loadStudentState } from "@/lib/learning/state";
import { addDays, vnDate } from "@/lib/learning/rules";
import { HOMEWORK_RULES } from "@/lib/learning/homework";
import { TutorTabs } from "@/components/tutor/tutor-tabs";
import { texToHtml } from "@/lib/content/tex";
import { AssignForm, type PickItem } from "@/components/tutor/assign-form";

export const metadata: Metadata = { title: "Giao bài — App Toán" };
const MODES = [
  { id: "items", label: "Chọn từng câu" },
  { id: "unit", label: "Cả bài" },
  { id: "paper", label: "Bài trên giấy" },
] as const;

// Mockup artboard 4: pick a KU (priorities first) → mode → items → due → Giao.
export default async function AssignPage(props: PageProps<"/tutor/[studentId]/giao">) {
  await requireRole("tutor");
  const [{ studentId }, sp] = await Promise.all([props.params, props.searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) notFound();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("id, full_name").eq("id", studentId).maybeSingle();
  if (!student) notFound();
  const [mods, state] = await Promise.all([studentModules(), loadStudentState(supabase, student.id)]);
  const approved = mods.flatMap((m) => m.unitList);
  const ordered = [...state.priorities.flatMap((id) => approved.filter((u) => u.id === id)), ...approved.filter((u) => !state.priorities.includes(u.id))];
  const mode = MODES.find((m) => m.id === sp.mode)?.id ?? "items";
  const unit = approved.find((u) => u.id === sp.unit) ?? ordered[0] ?? null;
  const attempts = state.units.find((u) => u.unit.id === unit?.id)?.attempts ?? [];
  const wrongs = new Map<string, number>();
  for (const a of attempts) if (!a.correct) wrongs.set(a.item_id, (wrongs.get(a.item_id) ?? 0) + 1);
  const items: PickItem[] = (unit?.practice ?? []).map((it) => ({ id: it.id, level: it.level, promptHtml: texToHtml(it.prompt), oftenWrong: (wrongs.get(it.id) ?? 0) >= 1, examLike: !!it.source }));
  const today = vnDate();
  const q = (o: Record<string, string>) => `?${new URLSearchParams({ unit: unit?.id ?? "", mode, ...o })}`;

  return (
    <>
      <TutorTabs studentId={student.id} studentName={student.full_name} active="giao" />
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="mode" value={mode} />
          <label htmlFor="unit" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Bài</label>
          <select id="unit" name="unit" defaultValue={unit?.id} className="rounded-lg border border-border bg-surface px-3 py-2 font-display font-semibold">
            {ordered.map((u) => <option key={u.id} value={u.id}>{state.priorities.includes(u.id) ? "★ " : ""}{u.title}</option>)}
          </select>
          <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm">Chọn</button>
        </form>
        <nav className="flex flex-wrap gap-2" aria-label="Cách giao">
          {MODES.map((m) => (
            <Link key={m.id} href={q({ mode: m.id })} aria-current={m.id === mode ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 font-display text-sm font-semibold ${m.id === mode ? "border-accent bg-accent text-on-accent" : "border-border bg-surface"}`}>{m.label}</Link>
          ))}
        </nav>
      </div>
      {unit || mode === "paper" ? (
        <AssignForm key={`${unit?.id}-${mode}`} studentId={student.id} studentName={student.full_name} unitId={unit?.id ?? null} mode={mode} items={items}
          today={today} defaultDue={addDays(today, HOMEWORK_RULES.defaultDueDays)} maxDue={addDays(today, HOMEWORK_RULES.dueMaxDays)} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Chưa có bài nào được duyệt — duyệt ở tab Kho bài trước.</p>
      )}
    </>
  );
}
