"use client";

import { useRef, useState } from "react";
import type { PublicItem } from "@/lib/content/public";
import { Rich } from "./rich";
import { proofParts, stepParts } from "./answer-parts";
import { OrderInput } from "./geometry/order-input";
import { ProofInput } from "./geometry/proof-input";
import { AnalysisInput } from "./geometry/analysis";

export { stepParts } from "./answer-parts";

/** Multiple choice (value = option index as string) or numeric answer box with √ and / helpers. */
export function ItemInput({
  item,
  value,
  onChange,
  disabled,
  onEnter,
  marks,
  at,
}: {
  item: PublicItem;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onEnter?: () => void;
  /** S5 C3, after a check: right / wrong per blank. */
  marks?: boolean[];
  /** S5 C2, after a check: the first wrong line. */
  at?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  if (item.type === "analysis") return <AnalysisInput item={item} value={value} onChange={onChange} disabled={disabled} />;
  if (item.type === "proof") return <ProofInput item={item} value={value} onChange={onChange} disabled={disabled} marks={marks} />;
  if (item.type === "order") return <OrderInput item={item} value={value} onChange={onChange} disabled={disabled} at={at} />;

  if (item.type === "steps") return <StepsInput item={item} value={value} onChange={onChange} disabled={disabled} />;

  if (item.type === "mcq") {
    return (
      <div role="radiogroup" className="mt-3 flex flex-col gap-2">
        {item.optionsHtml!.map((html, i) => {
          const selected = value === String(i);
          return (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                selected ? "border-accent bg-accent-soft" : "border-border bg-surface"
              } ${disabled ? "cursor-default opacity-80" : ""}`}
            >
              <input
                type="radio"
                name={item.id}
                value={i}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(String(i))}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <Rich html={html} />
            </label>
          );
        })}
      </div>
    );
  }

  const insert = (s: string) => {
    const el = ref.current;
    if (!el) return onChange(value + s);
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + s + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + s.length, start + s.length);
    });
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        disabled={disabled}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={40}
        aria-label="Đáp số"
        placeholder="Đáp số"
        className="w-40 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-lg"
      />
      {item.unit && <span className="text-muted">{item.unit}</span>}
      {!disabled && (
        <span className="flex gap-1.5">
          {["√", "/"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => insert(s)}
              className="size-10 rounded-lg border border-border bg-surface font-mono text-lg"
              aria-label={s === "√" ? "Chèn dấu căn" : "Chèn dấu phân số"}
            >
              {s}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// LT5: a multi-step item answered at once (exit test, review). Value = step answers joined by "|".

const SEP = "|";

/** Empty answer (multi-step / analysis: any empty level; C3: any empty blank). */
export function isBlank(item: PublicItem, value: string): boolean {
  if (item.type === "steps" || item.type === "analysis") return stepParts(item, value).some((p) => !p.trim());
  if (item.type === "proof") return proofParts(item, value).some((p) => !p);
  return !value.trim();
}

/** Numeric boxes that can't be read (format check only — the grading happens on the server). */
export function unreadable(item: PublicItem, value: string, parse: (s: string) => number | null): boolean {
  if (item.type === "steps") return item.steps!.some((st, i) => unreadable(st.item, stepParts(item, value)[i], parse));
  return item.type === "numeric" && !!value.trim() && parse(value) === null;
}

/**
 * Multi-step answer for the exit test and the review session. Steps open one at a time (audit 08/11): a later step's
 * prompt or options can name an earlier step's answer, so step k+1 shows only after "Bước tiếp" and step k is then
 * locked. Once the item is answered (disabled) every step shows. An answer typed earlier (restored value) opens as
 * many steps as it fills.
 */
function StepsInput({ item, value, onChange, disabled }: { item: PublicItem; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const parts = stepParts(item, value);
  const steps = item.steps!;
  const filled = parts.findIndex((p, i) => isBlank(steps[i].item, p));
  const [open, setOpen] = useState(() => Math.max(1, filled === -1 ? steps.length : filled + 1));
  const shown = disabled ? steps.length : Math.min(open, steps.length);
  return (
    <ol className="mt-3 flex flex-col gap-3" data-testid="steps-input">
      {steps.slice(0, shown).map((st, i) => (
        <li key={st.item.id} className="rounded-lg border border-border p-3">
          <p className="font-mono text-[11px] text-muted">Bước {i + 1}</p>
          <Rich as="div" html={st.promptHtml} className="mt-1 leading-relaxed" />
          <ItemInput
            item={st.item}
            value={parts[i]}
            disabled={disabled || i < shown - 1}
            onChange={(v) => onChange(parts.map((p, j) => (j === i ? v.replaceAll(SEP, "") : p)).join(SEP))}
          />
        </li>
      ))}
      {!disabled && shown < steps.length && (
        <li className="list-none">
          <button
            type="button"
            disabled={isBlank(steps[shown - 1].item, parts[shown - 1])}
            onClick={() => setOpen(shown + 1)}
            className="rounded-lg border border-accent px-3 py-1.5 text-sm font-semibold text-accent disabled:opacity-50"
            data-testid="step-next"
          >
            Bước tiếp → (bước {shown} sẽ khoá lại)
          </button>
        </li>
      )}
    </ol>
  );
}

/**
 * AI2: pre-written hints, opened one at a time (H1 goal → H2 recognise → H3 tool). `onLevel` reports the
 * highest one opened; from H2 on, a right answer doesn't count as right first time.
 */
export function HintBox({ hintsHtml, onLevel, disabled }: { hintsHtml: string[]; onLevel?: (n: number) => void; disabled?: boolean }) {
  const [shown, setShown] = useState(0);
  const NAMES = ["Mục tiêu", "Nhận dạng", "Công cụ"];
  return (
    <div className="mt-3" data-testid="hints">
      {shown > 0 && (
        <ol className="flex flex-col gap-1.5">
          {hintsHtml.slice(0, shown).map((h, i) => (
            <li key={i} className="rounded-lg border border-border bg-accent-soft px-3 py-2 text-sm" data-testid={`hint-${i + 1}`}>
              <span className="font-mono text-[11px] font-bold text-accent">
                H{i + 1} · {NAMES[i]}
              </span>
              <Rich as="div" html={h} className="mt-0.5" />
            </li>
          ))}
        </ol>
      )}
      {shown < hintsHtml.length && !disabled && (
        <button
          type="button"
          onClick={() => {
            setShown(shown + 1);
            onLevel?.(shown + 1);
          }}
          className="mt-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
        >
          {shown === 0 ? "💡 Gợi ý" : "Gợi ý tiếp"}
        </button>
      )}
      {shown >= 2 && !disabled && <p className="mt-1 text-xs text-muted">Đã xem gợi ý H2: câu này sẽ quay lại cuối bài để con tự làm lại.</p>}
    </div>
  );
}

export const FORMAT_HINT = "Chưa đọc được đáp số. Cách ghi: 12 · 4,8 · 12/5 · 2√3 · √3/2";
