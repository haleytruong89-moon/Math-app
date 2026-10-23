import Link from "next/link";
import { curriculumUnit } from "@/lib/content";
import type { DrillProblem } from "@/lib/content/drill";
import type { DrillState } from "@/lib/learning/drill-plan";

const STATE: Record<DrillState["status"], string> = {
  locked: "chưa mở",
  waiting: "chờ tuần sau",
  new: "mở, chưa làm",
  doing: "đang làm",
  later: "làm lại sau",
  redo: "đến hạn làm lại",
  done: "xong",
};
const dm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

/** Luyện đề 4.2 for the tutor and the parent: every problem, its review link and (with `states`) the student's state. */
export function DrillBankList({ problems, reviewHref, states }: { problems: DrillProblem[]; reviewHref: (id: string) => string; states?: Map<string, DrillState> }) {
  if (!problems.length) return <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Chưa có bài luyện đề nào.</p>;
  return (
    <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface" data-testid="drill-bank">
      {problems.map((p) => {
        const s = states?.get(p.id);
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid={`bank-${p.id}`}>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold">{p.title}</span>
              <span className="block font-mono text-xs text-muted">
                {p.items.length} câu · cần {p.needs.map((k) => curriculumUnit(k)?.title ?? k).join(", ")}
                {s ? ` · con: ${STATE[s.status]}${s.lastOn ? ` (${dm(s.lastOn)}, đúng ${s.right}/${s.total})` : ""}` : ""}
              </span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${p.status === "approved" ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>
              {p.status === "approved" ? `Đã duyệt ${p.approvedOn}` : "Nháp"}
            </span>
            <Link href={reviewHref(p.id)} className="text-sm font-semibold text-accent hover:underline">
              Xem đáp án · soát →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
