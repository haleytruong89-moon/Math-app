"use client";

import { useState, useTransition } from "react";
import { askAi, flagAiMessage, type AiMessageView } from "@/app/learn/ai-actions";
import { Rich } from "./rich";

// S8b "Hỏi thêm" (AI_TUTOR §3): opens after H3 (before answering) or after a wrong answer. Folded until she asks;
// every AI message has "AI nói sai?". The server decides everything (stage, limits, guard, fallback).

const QUESTION = {
  before: "Con đọc hết gợi ý rồi mà vẫn chưa biết bắt đầu từ đâu.",
  after: "Con chưa hiểu vì sao con sai ở câu này. Giải thích giúp con với?",
} as const;

export function AiHelp({ unitId, itemId, mode, stage, shownHints }: { unitId: string; itemId: string; mode: "practice" | "review"; stage: "before" | "after"; shownHints: number }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<string>(QUESTION[stage]);
  const [thread, setThread] = useState<string | undefined>();
  const [messages, setMessages] = useState<AiMessageView[]>([]);
  const [left, setLeft] = useState<{ item: number; day: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full rounded-xl border border-dashed border-accent px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent-soft" data-testid="ai-open">
        {stage === "before" ? "Vẫn chưa hiểu? Hỏi thêm" : "Con chưa hiểu chỗ sai? Hỏi thêm"}
      </button>
    );

  const ask = () =>
    start(async () => {
      setError(null);
      if (!question.trim()) {
        setError("Con viết câu hỏi trước nhé.");
        return;
      }
      const r = await askAi({ unitId, itemId, mode, question, shownHints, thread });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setThread(r.thread);
      setMessages((m) => [...m, ...r.messages]);
      setLeft(r.left);
      setQuestion("");
    });

  const flag = (id: number) =>
    start(async () => {
      const r = await flagAiMessage(id);
      if (r.ok) setMessages((m) => m.map((x) => (x.id === id ? { ...x, flagged: true } : x)));
    });

  const done = left !== null && (left.item <= 0 || left.day <= 0);
  return (
    <section className="mt-3 rounded-xl border border-border bg-surface p-3" aria-label="Hỏi thêm" data-testid="ai-help">
      <p className="text-xs text-muted">Hỏi thêm: trợ lý gợi mở theo lời giải đã duyệt{stage === "before" ? ", không nói đáp số" : ""}. Thấy lạ thì bấm &ldquo;AI nói sai?&rdquo;.</p>
      {messages.length > 0 && (
        <ol className="mt-2 flex flex-col gap-2">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.role === "student" ? "ml-8 bg-bg" : "mr-4 bg-accent-soft"}`} data-testid={`ai-msg-${m.role}`}>
              {m.note && <p className="mb-1 font-mono text-[11px] text-muted">{m.note}</p>}
              <Rich as="div" html={m.html} className="leading-relaxed" />
              {m.role !== "student" && (
                <button type="button" disabled={m.flagged || pending} onClick={() => flag(m.id)} className="mt-1 text-xs font-semibold text-warn underline disabled:no-underline disabled:opacity-70" data-testid="ai-flag">
                  {m.flagged ? "Đã báo — bố mẹ và thầy/cô sẽ xem" : "AI nói sai?"}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {!done && (
        <div className="mt-2 flex flex-col gap-2">
          <label htmlFor={`ai-q-${itemId}`} className="sr-only">Câu hỏi của con</label>
          <textarea
            id={`ai-q-${itemId}`}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
            rows={2}
            placeholder="Con chưa hiểu bước nào?"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
          />
          <button type="button" disabled={pending} onClick={ask} className="self-end rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60" data-testid="ai-ask">
            {pending ? "Đang nghĩ…" : "Hỏi"}
          </button>
        </div>
      )}
      {left && <p className="mt-1 text-right font-mono text-[11px] text-muted">còn {Math.max(0, left.item)} lượt cho câu này · {Math.max(0, left.day)} lượt hôm nay</p>}
      {error && <p className="mt-1 text-sm text-warn" role="alert">{error}</p>}
    </section>
  );
}
