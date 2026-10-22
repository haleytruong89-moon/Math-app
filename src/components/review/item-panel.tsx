import { texToHtml } from "@/lib/content/tex";
import { errorLabel } from "@/lib/content/errors";
import type { Item, Unit } from "@/lib/content/schema";
import { Rich } from "@/components/lesson/rich";
import { RightTriangleAltitude, SvgFigure } from "@/components/lesson/figure";
import { afterOf } from "@/lib/content/grade";

const Html = ({ html, className = "" }: { html: string; className?: string }) => <Rich as="div" html={html} className={className} />;
const Label = ({ children }: { children: React.ReactNode }) => <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>;
const ABC = "ABCDEF";
const TYPE_LABEL: Record<Item["type"], string> = {
  mcq: "trắc nghiệm",
  numeric: "điền số",
  steps: "nhiều bước",
  analysis: "phân tích ngược",
  proof: "điền lời giải (C3)",
  order: "sắp xếp bước (C2)",
};

function Answer({ item }: { item: Item }) {
  if (item.type === "mcq")
    return (
      <ol className="flex flex-col gap-1.5">
        {item.options.map((o, i) => (
          <li key={i} className={`flex gap-2 rounded-lg border px-3 py-2 ${i === item.correct ? "border-good bg-good-soft" : "border-border"}`}>
            <b className="font-mono">{ABC[i]}</b>
            <Html html={texToHtml(o)} />
            {i === item.correct && <span className="ml-auto font-mono text-xs text-good">đúng</span>}
          </li>
        ))}
      </ol>
    );
  if (item.type === "numeric") return <p className="font-mono text-xl font-semibold text-good">{item.answer}{item.unit ? ` ${item.unit}` : ""}</p>;
  if (item.type === "analysis")
    return (
      <ol className="flex flex-col gap-3">
        <li className="rounded-lg border-2 border-accent bg-accent-soft px-3 py-2">
          <b className="text-xs text-accent">CẦN CHỨNG MINH</b>
          <Html html={texToHtml(item.goal)} className="font-body" />
        </li>
        {item.steps.map((s, i) => (
          <li key={i} className="rounded-lg border border-border p-3">
            <p className="font-mono text-[11px] text-muted">Tầng {i + 1}</p>
            <Html html={texToHtml(s.ask)} className="text-sm font-semibold" />
            <div className="mt-2"><Answer item={s.item} /></div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">→ con thấy:</span>
              <Html html={texToHtml(s.node)} className="font-body" />
              {s.given && <span className="rounded-full bg-good-soft px-2 text-xs text-good">giả thiết</span>}
            </div>
          </li>
        ))}
        <li className="rounded-lg border border-border p-3">
          <b className="text-xs text-muted">DÀN Ý (con thấy sau khi xong)</b>
          <ol className="mt-1 list-decimal pl-5 font-body">{item.outline.map((o, i) => <li key={i}><Html html={texToHtml(o)} /></li>)}</ol>
        </li>
      </ol>
    );
  if (item.type === "proof")
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 font-body">
          {item.lines.map((l, i) => (
            <Html key={i} html={texToHtml(l.replace(/\[\[(\d)\]\]/g, (_, n: string) => `【${n}: ${item.bank[item.blanks[Number(n) - 1].correct]}】`))} />
          ))}
        </div>
        <p className="text-xs text-muted">
          Lựa chọn con thấy (xáo thứ tự):{" "}
          {item.bank.map((b, i) => (
            <span key={i}>{i > 0 && " · "}<Rich html={texToHtml(b)} /></span>
          ))}
        </p>
      </div>
    );
  if (item.type === "order")
    return (
      <div className="flex flex-col gap-2">
        <ol className="flex flex-col gap-1.5">
          {item.lines.map((l, i) => {
            const swap = [i - 1, i + 1].filter((j) => j >= 0 && j < item.lines.length && !afterOf(item.lines, i).includes(j) && !afterOf(item.lines, j).includes(i));
            return (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-good bg-good-soft px-3 py-2">
                <b className="font-mono">{i + 1}</b>
                <Html html={texToHtml(l.text)} className="font-body" />
                {swap.length > 0 && <span className="ml-auto font-mono text-xs text-good">có thể đổi chỗ với dòng {swap.map((j) => j + 1).join(", ")}</span>}
              </li>
            );
          })}
        </ol>
        {item.distractors.map((d, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm">
            <span className="font-mono text-xs text-muted">bước thừa</span>
            <Html html={texToHtml(d.text)} className="font-body" />
          </div>
        ))}
      </div>
    );
  return (
    <ol className="flex flex-col gap-3">
      {item.steps.map((s, i) => (
        <li key={i} className="rounded-lg border border-border p-3">
          <Html html={texToHtml(s.prompt)} className="text-sm" />
          <div className="mt-2"><Answer item={s.item} /></div>
        </li>
      ))}
    </ol>
  );
}

function Mistakes({ item }: { item: Item }) {
  type Row = { key: string; code: string; feedback: string; review?: string };
  const list: Row[] =
    item.type === "analysis"
      ? item.steps.flatMap((s, i) => Object.entries(s.item.mistakes ?? {}).map(([k, m]) => ({ key: `T${i + 1}·${ABC[Number(k)]}`, ...m })))
      : item.type === "proof"
        ? item.blanks.flatMap((b, i) => Object.entries(b.mistakes ?? {}).map(([k, m]) => ({ key: `Ô${i + 1}`, ...m, feedback: `«${item.bank[Number(k)]}»: ${m.feedback}` })))
        : item.type === "order"
          ? item.distractors.map((d) => ({ key: "thừa", code: d.code, feedback: `${d.text} — ${d.feedback}` }))
          : item.type === "mcq"
      ? Object.entries(item.mistakes ?? {}).map(([k, m]) => ({ key: ABC[Number(k)], ...m }))
      : item.type === "numeric"
        ? (item.mistakes ?? []).map((m) => ({ key: m.answer, ...m }))
        : item.steps.flatMap((s, i) => (s.item.type === "mcq" ? Object.entries(s.item.mistakes ?? {}).map(([k, m]) => ({ key: `B${i + 1}·${ABC[Number(k)]}`, ...m })) : (s.item.mistakes ?? []).map((m) => ({ key: `B${i + 1}·${m.answer}`, ...m }))));
  if (!list.length) return <p className="text-sm text-muted">Không có phản hồi riêng cho câu sai.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border text-sm">
      {list.map((m, i) => (
        <li key={i} className="flex flex-wrap gap-3 px-3 py-2">
          <b className="w-16 font-mono">{m.key}</b>
          <span className="rounded-full bg-warn-soft px-2 font-mono text-xs text-warn" title={errorLabel(m.code) ?? m.code}>{m.code}</span>
          <Html html={texToHtml(m.feedback)} className="min-w-0 flex-1" />
          {m.review && <span className="font-mono text-xs text-muted">ôn: {m.review}</span>}
        </li>
      ))}
    </ul>
  );
}

/** One item in full for the reviewer: prompt, answer, hints, solution, wrong answers with codes, source. */
export function ItemPanel({ item, kind }: { item: Item; kind: "practice" | "exit" }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="flex flex-wrap gap-2 font-mono text-xs">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{kind === "practice" ? "Luyện tập" : "Kiểm tra"}</span>
        <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.level} · {TYPE_LABEL[item.type]}</span>
        {item.source && <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.source}</span>}
      </p>
      {item.figure && (
        <div className="flex flex-col gap-1">
          <SvgFigure figure={item.figure} className="max-w-sm" />
          {item.drawFirst && <p className="text-center font-mono text-xs text-muted">hình ẩn cho tới khi con bấm &ldquo;Đã vẽ xong&rdquo;</p>}
        </div>
      )}
      <Html html={texToHtml(item.prompt)} className="font-body text-lg leading-relaxed" />
      <div className="flex flex-col gap-2"><Label>Đáp án đúng</Label><Answer item={item} /></div>
      {item.hints && (
        <div className="flex flex-col gap-2"><Label>Gợi ý con mở dần</Label>
          <ol className="list-decimal pl-5 font-body text-sm">{item.hints.map((h, i) => <li key={i}><Html html={texToHtml(h)} /></li>)}</ol>
        </div>
      )}
      <div className="flex flex-col gap-2"><Label>Lời giải (con xem sau khi làm)</Label><Html html={texToHtml(item.solution)} className="font-body text-sm" /></div>
      <div className="flex flex-col gap-2"><Label>Con trả lời sai thì app nói gì</Label><Mistakes item={item} /></div>
    </div>
  );
}

/** The lesson block: theory, worked example, faded example with the blanks' answers. */
export function LessonPanel({ unit }: { unit: Unit }) {
  return (
    <div className="flex flex-col gap-5 font-body text-sm">
      {unit.figure === "right-triangle-altitude" && <RightTriangleAltitude className="max-w-sm" />}
      {unit.figure && unit.figure !== "right-triangle-altitude" && <SvgFigure figure={unit.figure} className="max-w-sm" />}
      <div className="flex flex-col gap-2"><Label>Lý thuyết</Label>{unit.theory.map((t, i) => <Html key={i} html={texToHtml(t)} />)}</div>
      <div className="flex flex-col gap-2"><Label>Bài mẫu</Label><Html html={texToHtml(unit.worked.problem)} />
        {unit.worked.analysis && (
          <div className="rounded-lg border border-border p-3" data-testid="lesson-analysis">
            <p className="text-xs font-semibold text-muted">Phân tích ngược: cần chứng minh <Rich html={texToHtml(unit.worked.analysis.goal)} /></p>
            <ol className="mt-1 list-decimal pl-5">{unit.worked.analysis.steps.map((s, i) => <li key={i}><Html html={texToHtml(s.ask)} className="text-muted" /><Html html={`⇑ ${texToHtml(s.node)}`} /></li>)}</ol>
          </div>
        )}
        <ol className="list-decimal pl-5">{unit.worked.steps.map((s, i) => <li key={i}><Html html={texToHtml(s.text)} />{s.why && <Html html={texToHtml(s.why)} className="text-muted" />}</li>)}</ol>
        <Html html={texToHtml(unit.worked.selfExplain)} className="text-muted" />
      </div>
      <div className="flex flex-col gap-2"><Label>Bài khuyết (con điền chỗ trống)</Label><Html html={texToHtml(unit.faded.problem)} />
        <ol className="list-decimal pl-5">{unit.faded.steps.map((s, i) => <li key={i}>{"item" in s ? <><Html html={texToHtml(s.prompt)} /><div className="mt-1"><Answer item={s.item} /></div></> : <Html html={texToHtml(s.text)} />}</li>)}</ol>
      </div>
    </div>
  );
}
