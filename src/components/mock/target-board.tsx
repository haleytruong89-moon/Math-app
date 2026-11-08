import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { examSheet, progressBank } from "@/lib/content";
import { loadMockExams, loadScoresFor } from "@/lib/learning/mock-data";
import { pts, refLabel, refOf } from "@/lib/learning/mock";
import { targetBoard, type BoardExam, type BoardStatus } from "@/lib/learning/target";
import { card, sectionTitle } from "@/components/ui/styles";

// Mục tiêu 8,5 (08/11/2026): the target board for adults (tutor, parent). Server component. Parent choice 08/11:
// 8,5 is the target; the student sees her points per test, not this board.

const STATUS: Record<BoardStatus, { text: string; cls: string }> = {
  ok: { text: "đạt", cls: "bg-good-soft text-good" },
  near: { text: "gần đạt", cls: "bg-star-soft text-ink" },
  low: { text: "cần cố gắng", cls: "bg-warn-soft text-warn" },
  none: { text: "chưa đo", cls: "bg-bg text-muted" },
  skip: { text: "chấp nhận bỏ", cls: "bg-bg text-muted" },
};
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export async function loadTargetBoard(supabase: SupabaseClient, studentId: string, levels: Map<string, number>) {
  const bank = progressBank();
  if (!bank) return null;
  const graded = (await loadMockExams(supabase, studentId)).filter((e) => e.graded_at);
  const scores = await loadScoresFor(supabase, graded.map((e) => e.id));
  const exams: BoardExam[] = graded.flatMap((e) => {
    const sheet = examSheet(refOf(e));
    return sheet ? [{ label: refLabel(refOf(e)), date: e.scheduled_on, parts: sheet.parts, scores: scores.get(e.id) ?? [] }] : [];
  });
  return { total: bank.target.total, ...targetBoard(bank.target.groups, exams, levels) };
}

type Board = NonNullable<Awaited<ReturnType<typeof loadTargetBoard>>>;

/** Full table (Kiểm tra tab, parent) or a compact card (tutor Hôm nay). */
export function TargetBoard({ board, compact = false, href }: { board: Board | null; compact?: boolean; href?: string }) {
  if (!board) return null;
  const m = board.measured;
  return (
    <section className={`${card} p-4`} data-testid="target-board" aria-label={`Mục tiêu ${pts(board.total)}`}>
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className={sectionTitle}>Mục tiêu {pts(board.total)} điểm</h2>
        {href && <Link href={href} className="ml-auto font-display text-sm font-semibold text-accent hover:underline">Kiểm tra →</Link>}
      </div>
      {compact ? (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {board.rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2" data-testid={`target-${r.key}`}>
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="font-mono text-xs text-muted">{r.scaled !== null ? `${pts(r.scaled)}/${pts(r.target)}` : `—/${pts(r.target)}`}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] ${STATUS[r.status].cls}`}>{STATUS[r.status].text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-xs uppercase tracking-wider text-muted">
              <tr><th className="py-2 pr-3">Phần đề</th><th className="px-3 py-2">Mục tiêu</th><th className="px-3 py-2">Lần đo gần nhất</th><th className="px-3 py-2">Quy ra</th><th className="px-3 py-2">Bài vững</th><th className="px-3 py-2" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {board.rows.map((r) => (
                <tr key={r.key} data-testid={`target-${r.key}`}>
                  <td className="py-2 pr-3 font-semibold">{r.label}</td>
                  <td className="px-3 py-2 font-mono">{pts(r.target)}/{pts(r.max)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.measured ? `${pts(r.measured.got)}/${pts(r.measured.max)} · ${r.measured.label} ${dm(r.measured.date)}` : "—"}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{r.scaled !== null ? pts(r.scaled) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.solid}/{r.units}</td>
                  <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${STATUS[r.status].cls}`}>{STATUS[r.status].text}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted" data-testid="target-summary">
        {m.max > 0
          ? `Trên ${pts(m.max)} điểm của đề đã đo: quy ra ${pts(m.scaled)}, mục tiêu cho phần này ${pts(m.target)}.`
          : "Chưa có bài kiểm tra nào được chấm."}{" "}
        &ldquo;Quy ra&rdquo; = tỉ lệ đúng ở lần đo gần nhất × điểm phần đó trong đề thật — một lần đo ngắn, chưa phải dự báo. Bài vững = M3 trở lên.
      </p>
    </section>
  );
}
