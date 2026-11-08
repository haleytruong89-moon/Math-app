import { texToHtml } from "@/lib/content/tex";
import type { ProgressProblem } from "@/lib/content/progress";
import { Rich } from "@/components/lesson/rich";
import { SvgFigure } from "@/components/lesson/figure";

// Kiểm tra tiến bộ (08/11): the problem text of a progress test, as on a printed paper (Bài 1, Bài 3, …). Server
// component; used on the print page (adults) and on the student's page once she has started. Bài keep the real exam's
// numbers (KT1 has Bài 1, 3, 4) so the points map onto the 8,5 target.
export const pointsByBai = (parts: { part: string; max: number }[]) => {
  const m = new Map<number, number>();
  for (const p of parts) m.set(Number(p.part[0]), Math.round(((m.get(Number(p.part[0])) ?? 0) + p.max) * 100) / 100);
  return m;
};
export function ProblemsView({ problems, points }: { problems: ProgressProblem[]; points?: Map<number, number> }) {
  return (
    <ol className="flex flex-col gap-5" data-testid="progress-problems">
      {problems.map((q, i) => (
        <li key={i} className="break-inside-avoid">
          <p className="font-display font-bold">
            Bài {q.bai}.{points?.get(q.bai) ? <span className="font-normal"> ({String(points.get(q.bai)).replace(".", ",")} điểm)</span> : null}
          </p>
          {q.text.map((t, j) => (
            <Rich key={j} as="p" html={texToHtml(t)} className="mt-1.5 overflow-x-auto leading-relaxed" />
          ))}
          {q.figure && <SvgFigure figure={q.figure} className="mt-3" />}
        </li>
      ))}
    </ol>
  );
}
