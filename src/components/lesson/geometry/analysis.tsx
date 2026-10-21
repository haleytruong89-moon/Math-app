"use client";

import { useState } from "react";
import type { CheckResult, PublicItem } from "@/lib/content/public";
import { checkAnswer } from "@/app/learn/actions";
import { errorLabel } from "@/lib/content/errors";
import { Rich } from "../rich";
import { ErrorLine, PrimaryButton, useAction, useStartTime } from "../parts";
import { stepParts } from "../answer-parts";

// S5 Phân tích ngược: a ladder that grows from the goal ("CẦN CHỨNG MINH") down to a given.

const Goal = ({ html }: { html: string }) => (
  <div className="rounded-xl border-2 border-accent bg-accent-soft px-4 py-3" data-testid="analysis-goal">
    <p className="font-display text-xs font-bold text-accent">CẦN CHỨNG MINH</p>
    <Rich as="div" html={html} className="mt-0.5 font-body text-lg font-semibold" />
  </div>
);

const Ask = ({ html }: { html: string }) => (
  <p className="my-2 ml-4 flex items-center gap-2 font-display text-sm font-semibold">
    <span className="text-lg text-accent" aria-hidden>
      ⇑
    </span>
    <Rich html={html} />
  </p>
);

const Node = ({ html, given }: { html: string; given?: boolean }) => (
  <div className="rounded-xl border border-border bg-surface px-4 py-3" data-testid="analysis-node">
    <Rich as="div" html={html} className="font-body text-lg" />
    {given && <span className="mt-1.5 inline-block rounded-full bg-good-soft px-2.5 py-0.5 text-xs font-bold text-good">Chạm giả thiết ✓</span>}
  </div>
);

const optionClass = (selected: boolean) =>
  `min-h-11 rounded-lg border px-3 py-2 text-left font-body hover:border-accent disabled:cursor-default ${
    selected ? "border-accent bg-accent-soft" : "border-border bg-surface"
  }`;

/** The worked example's ladder (read-only). */
export function LadderStatic({ goalHtml, steps }: { goalHtml: string; steps: { askHtml: string; nodeHtml: string }[] }) {
  return (
    <div className="flex flex-col" data-testid="worked-analysis">
      <Goal html={goalHtml} />
      {steps.map((s, i) => (
        <div key={i}>
          <Ask html={s.askHtml} />
          <Node html={s.nodeHtml} given={i === steps.length - 1} />
        </div>
      ))}
    </div>
  );
}

/** Practice: each level checked on the server (not recorded); a wrong pick shows why and the right node, then she climbs on. */
export function AnalysisPractice({
  unitId,
  item,
  homeworkId,
  pending: submitting,
  onComplete,
}: {
  unitId: string;
  item: PublicItem;
  homeworkId?: string;
  pending: boolean;
  onComplete: (answer: string) => void;
}) {
  const steps = item.steps!;
  const [k, setK] = useState(0);
  const [picks, setPicks] = useState<string[]>(steps.map(() => ""));
  const [res, setRes] = useState<(Extract<CheckResult, { understood: true }> | null)[]>(steps.map(() => null));
  const { pending, error, run } = useAction();
  const startedAtRef = useStartTime();

  const pick = (j: number) =>
    run(async () => {
      const answer = String(j);
      const r = await checkAnswer({ unitId, itemId: item.id, mode: "practice", answer, step: k, durationMs: Date.now() - startedAtRef.current, homeworkId });
      if (!r.ok) return r.message;
      if (!r.understood) return "Chưa đọc được lựa chọn, thử lại.";
      setPicks((x) => x.map((y, i) => (i === k ? answer : y)));
      setRes((x) => x.map((y, i) => (i === k ? r : y)));
    });

  return (
    <div className="mt-3 flex flex-col" data-testid="analysis-practice">
      <Goal html={item.goalHtml!} />
      {steps.slice(0, k + 1).map((st, i) => {
        const r = res[i];
        return (
          <div key={st.item.id} data-testid={`level-${i + 1}`}>
            <Ask html={st.promptHtml} />
            {!r ? (
              <div className="flex flex-col gap-2">
                {st.item.optionsHtml!.map((h, j) => (
                  <button key={j} type="button" disabled={pending} onClick={() => pick(j)} className={optionClass(false)} data-testid="analysis-option">
                    <Rich html={h} />
                  </button>
                ))}
              </div>
            ) : (
              <>
                {!r.correct && (
                  <div className="mb-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn" data-testid="level-feedback">
                    <b>{errorLabel(r.errorCode) ?? "Chưa đúng hướng"}</b>
                    {r.feedbackHtml && <Rich as="p" html={r.feedbackHtml} className="mt-0.5" />}
                  </div>
                )}
                {r.nodeHtml && <Node html={r.nodeHtml} given={i === steps.length - 1} />}
              </>
            )}
          </div>
        );
      })}
      {res[k] && k < steps.length - 1 && (
        <PrimaryButton className="mt-3 w-full" onClick={() => setK(k + 1)}>
          Tầng tiếp theo ⇑
        </PrimaryButton>
      )}
      {res.every(Boolean) && (
        <PrimaryButton className="mt-3 w-full" disabled={submitting} onClick={() => onComplete(picks.join("|"))}>
          {submitting ? "Đang chấm…" : "Hoàn thành — lật thành dàn ý lời giải"}
        </PrimaryButton>
      )}
      <ErrorLine text={error} />
    </div>
  );
}

/** Exit test / review: levels appear one by one and a pick is final (a later ask names the right node). */
export function AnalysisInput({ item, value, onChange, disabled }: { item: PublicItem; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const parts = stepParts(item, value);
  const firstEmpty = parts.findIndex((p) => !p);
  const shown = firstEmpty < 0 ? parts.length : firstEmpty + 1;
  return (
    <div className="mt-3 flex flex-col" data-testid="analysis-input">
      <Goal html={item.goalHtml!} />
      {item.steps!.slice(0, shown).map((st, i) => (
        <div key={st.item.id}>
          <Ask html={st.promptHtml} />
          <div className="flex flex-col gap-2">
            {st.item.optionsHtml!.map((h, j) => (
              <button
                key={j}
                type="button"
                disabled={disabled || !!parts[i]}
                onClick={() => onChange(parts.map((p, x) => (x === i ? String(j) : p)).join("|"))}
                className={optionClass(parts[i] === String(j))}
                data-testid="analysis-option"
              >
                <Rich html={h} />
              </button>
            ))}
          </div>
        </div>
      ))}
      {!disabled && <p className="mt-2 text-xs text-muted">Mỗi tầng chọn một lần, không đổi lại được.</p>}
    </div>
  );
}
