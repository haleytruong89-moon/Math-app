import { texToHtml } from "@/lib/content/tex";
import { errorLabel } from "@/lib/content/errors";
import type { Item, Unit } from "@/lib/content/schema";
import { Rich } from "@/components/lesson/rich";

const Html = ({ html, className = "" }: { html: string; className?: string }) => <Rich as="div" html={html} className={className} />;
const Label = ({ children }: { children: React.ReactNode }) => <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>;
const ABC = "ABCDEF";

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
  const list =
    item.type === "mcq"
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
        <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.level} · {item.type === "mcq" ? "trắc nghiệm" : item.type === "numeric" ? "điền số" : "nhiều bước"}</span>
        {item.source && <span className="rounded-full bg-bg px-2 py-0.5 text-muted">{item.source}</span>}
      </p>
      <Html html={texToHtml(item.prompt)} className="text-lg leading-relaxed" />
      <div className="flex flex-col gap-2"><Label>Đáp án đúng</Label><Answer item={item} /></div>
      {item.hints && (
        <div className="flex flex-col gap-2"><Label>Gợi ý con mở dần</Label>
          <ol className="list-decimal pl-5 text-sm">{item.hints.map((h, i) => <li key={i}><Html html={texToHtml(h)} /></li>)}</ol>
        </div>
      )}
      <div className="flex flex-col gap-2"><Label>Lời giải (con xem sau khi làm)</Label><Html html={texToHtml(item.solution)} className="text-sm" /></div>
      <div className="flex flex-col gap-2"><Label>Con trả lời sai thì app nói gì</Label><Mistakes item={item} /></div>
    </div>
  );
}

/** The lesson block: theory, worked example, faded example with the blanks' answers. */
export function LessonPanel({ unit }: { unit: Unit }) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="flex flex-col gap-2"><Label>Lý thuyết</Label>{unit.theory.map((t, i) => <Html key={i} html={texToHtml(t)} />)}</div>
      <div className="flex flex-col gap-2"><Label>Bài mẫu</Label><Html html={texToHtml(unit.worked.problem)} />
        <ol className="list-decimal pl-5">{unit.worked.steps.map((s, i) => <li key={i}><Html html={texToHtml(s.text)} />{s.why && <Html html={texToHtml(s.why)} className="text-muted" />}</li>)}</ol>
        <Html html={texToHtml(unit.worked.selfExplain)} className="text-muted" />
      </div>
      <div className="flex flex-col gap-2"><Label>Bài khuyết (con điền chỗ trống)</Label><Html html={texToHtml(unit.faded.problem)} />
        <ol className="list-decimal pl-5">{unit.faded.steps.map((s, i) => <li key={i}>{"item" in s ? <><Html html={texToHtml(s.prompt)} /><div className="mt-1"><Answer item={s.item} /></div></> : <Html html={texToHtml(s.text)} />}</li>)}</ol>
      </div>
    </div>
  );
}
