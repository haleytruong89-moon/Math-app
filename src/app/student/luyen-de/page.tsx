import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { curriculumUnit } from "@/lib/content";
import { studentDrills, type DrillRow } from "@/lib/learning/drills";
import { DRILL_RULES, type DrillStatus } from "@/lib/learning/drill-plan";

export const metadata: Metadata = { title: "Luyện đề hình — App Toán" };

const dm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const LABEL: Record<DrillStatus, { text: string; cls: string }> = {
  redo: { text: "Làm lại", cls: "bg-warn-soft text-warn" },
  doing: { text: "Đang làm", cls: "bg-accent-soft text-accent" },
  new: { text: "Mới", cls: "bg-accent-soft text-accent" },
  later: { text: "Làm lại sau", cls: "bg-bg text-muted" },
  done: { text: "Xong", cls: "bg-good-soft text-good" },
  waiting: { text: "Tuần sau", cls: "bg-bg text-muted" },
  locked: { text: "Chưa mở", cls: "bg-bg text-muted" },
};
const ORDER: DrillStatus[] = ["redo", "doing", "new", "later", "done", "waiting", "locked"];

// Luyện đề 4.2 (23/10): real Bài 4.2 problems, opened by the KUs they need, at most 3 new a week.
export default async function DrillListPage() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");
  const rows = (await studentDrills(supabase, me.id)).sort((a, b) => ORDER.indexOf(a.state.status) - ORDER.indexOf(b.state.status) || a.problem.order - b.problem.order);
  const done = rows.filter((r) => r.state.status === "done").length;
  return (
    <div data-wide="">
      <h1 className="font-display text-2xl font-bold">Luyện đề hình</h1>
      <p className="mt-1 text-sm text-muted">
        Bài 4.2 trong đề thi thật: con tự vẽ hình, phân tích ngược rồi viết lời giải. Mỗi tuần mở tối đa {DRILL_RULES.newPerWeek} bài mới; bài làm sai quay lại sau{" "}
        {DRILL_RULES.redoAfterDays} ngày.
      </p>
      <p className="mt-2 font-mono text-xs text-muted" data-testid="drill-summary">
        Đã xong {done}/{rows.length} bài
      </p>
      {!rows.length && <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Chưa có bài luyện đề nào được duyệt.</p>}
      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((r) => (
          <DrillCard key={r.problem.id} r={r} />
        ))}
      </ul>
    </div>
  );
}

function DrillCard({ r }: { r: DrillRow }) {
  const s = r.state;
  const l = LABEL[s.status];
  const open = !["locked", "waiting"].includes(s.status);
  const note =
    s.status === "locked"
      ? `Mở khi con vững: ${s.missing.map((k) => curriculumUnit(k)?.title ?? k).join(", ")}`
      : s.status === "later"
        ? `Làm lại từ ${dm(s.redoOn!)}`
        : s.status === "waiting"
          ? "Tuần này đã mở đủ bài mới"
          : s.lastOn
            ? `Lần gần nhất ${dm(s.lastOn)}: đúng ${s.right}/${s.total} câu`
            : `${s.total} câu`;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold">{r.problem.title}</span>
        <span className="block text-xs text-muted">{note}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.cls}`}>{l.text}</span>
    </>
  );
  return (
    <li data-testid={`drill-${r.problem.id}`} data-status={s.status}>
      {open ? (
        <Link href={`/student/luyen-de/${r.problem.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:border-accent">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 opacity-70">{body}</div>
      )}
    </li>
  );
}
