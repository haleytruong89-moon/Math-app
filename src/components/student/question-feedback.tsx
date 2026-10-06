"use client";

import type { CheckResult } from "@/lib/content/public";
import { errorLabel } from "@/lib/content/errors";
import { practiceNudge, praise } from "@/lib/learning/student-ux";
import { Rich } from "@/components/lesson/rich";
import { PrimaryButton } from "@/components/lesson/parts";
import { masteryOf } from "./mastery";

type Result = Extract<CheckResult, { understood: true }>;

/**
 * Two-state card after a practice or review answer (spec 2026-10-05 §4). Only "Câu tiếp" — no retry (U1);
 * the count is a session total, never consecutive (U2).
 */
export function QuestionFeedback({ result, mode, tally, index, requeued = false, nextLabel, onNext, recapHref = (id) => `/student/recap/${id}` }: {
  result: Result;
  mode: "practice" | "review";
  tally: { right: number; total: number };
  index: number;
  requeued?: boolean;
  nextLabel: string;
  onNext: () => void;
  /** LT16: where "Ôn lại" opens the earlier KU (the parent preview passes its own route). */
  recapHref?: (unitId: string) => string;
}) {
  const chip = (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-[13px] font-semibold" data-testid="session-tally">
      ✅ Đúng {tally.right}/{tally.total} câu lượt này
    </span>
  );
  const nudge = mode === "practice" && result.mastery ? practiceNudge(result.mastery, result.mastery.confirmed) : null;
  const label = errorLabel(result.errorCode);

  return (
    <div className="mt-4 flex flex-col gap-3" data-testid="question-feedback" data-correct={result.correct}>
      {result.correct ? (
        <div className="rounded-2xl px-5 py-6 text-center text-[#065F46]" style={{ background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)" }}>
          <div aria-hidden className="text-5xl leading-none">🎉</div>
          <p className="mt-2 text-[22px] font-bold">Chính xác!</p>
          <p className="mt-1 text-sm font-medium text-[#047857]">{praise(index)}</p>
          {chip}
        </div>
      ) : (
        <div className="rounded-2xl px-5 py-5 text-center text-[#92400E]" style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
          <div aria-hidden className="text-4xl leading-none">💡</div>
          <p className="mt-2 text-xl font-bold">{result.feedbackHtml ? "Gần đúng rồi!" : "Chưa đúng"}</p>
          {result.feedbackHtml && <Rich as="p" html={result.feedbackHtml} className="mt-1 text-sm font-medium text-[#B45309]" />}
          {chip}
        </div>
      )}

      {!result.correct && (result.answerHtml || result.correctHtml) && (
        <div className="rounded-xl border border-border bg-surface p-4">
          {label && <span className="mb-2.5 inline-flex rounded-full bg-warn-soft px-2.5 py-0.5 font-mono text-[11px] font-bold text-warn">{label}</span>}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-[#FEF2F2] p-2.5 text-[#991B1B]">
              <p className="text-[11px] font-semibold text-[#DC2626]">Con trả lời</p>
              {result.answerHtml && <Rich as="div" html={result.answerHtml} className="mt-1 font-semibold" />}
            </div>
            <div className="rounded-lg bg-[#F0FDF4] p-2.5 text-[#065F46]">
              <p className="text-[11px] font-semibold text-[#16A34A]">Đáp án đúng</p>
              {result.correctHtml && <Rich as="div" html={result.correctHtml} className="mt-1 font-semibold" />}
            </div>
          </div>
        </div>
      )}

      {result.review && (
        <a
          href={recapHref(result.review.unitId)}
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm font-semibold text-accent"
          data-testid="review-link"
        >
          📖 Ôn lại: {result.review.title} ↗
        </a>
      )}

      {result.solutionHtml && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Lời giải</p>
          <Rich as="div" html={result.solutionHtml} className="mt-2 leading-relaxed" />
        </div>
      )}

      {mode === "review" && result.hintsHtml && (
        <details className="rounded-xl border border-border bg-surface px-4 py-3 text-sm" data-testid="review-hints">
          <summary className="cursor-pointer font-semibold">💡 Xem gợi ý (để hiểu, không đổi kết quả)</summary>
          <ol className="mt-2 flex flex-col gap-1.5">
            {result.hintsHtml.map((h, i) => (
              <li key={i}>
                <span className="font-mono text-[11px] font-bold text-accent">H{i + 1}</span> <Rich html={h} />
              </li>
            ))}
          </ol>
        </details>
      )}

      {nudge && result.mastery && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5" data-testid="mastery-nudge">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: `linear-gradient(135deg,${masteryOf(result.mastery.level).from},${masteryOf(result.mastery.level).to})` }}>
            {masteryOf(result.mastery.level).emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">{nudge.text}</p>
            {nudge.progress && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full" style={{ width: `${(nudge.progress.done / nudge.progress.total) * 100}%`, background: "linear-gradient(90deg,#34D399,#0D9488)" }} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-accent">
                  {nudge.progress.done}/{nudge.progress.total}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "practice" && !result.correct && requeued && <p className="text-center text-sm text-muted">Câu này sẽ quay lại cuối bài.</p>}

      <PrimaryButton className="w-full" onClick={onNext}>
        {nextLabel} →
      </PrimaryButton>
    </div>
  );
}
