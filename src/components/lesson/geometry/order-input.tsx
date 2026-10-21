"use client";

import type { PublicItem } from "@/lib/content/public";
import { Rich } from "../rich";
import { orderPicked } from "../answer-parts";

/** S5 C2: click a step to append it to "Lời giải của con"; ↑ ↓ × to fix it. `at` = first wrong line after a check. */
export function OrderInput({
  item,
  value,
  onChange,
  disabled,
  at,
}: {
  item: PublicItem;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  at?: number;
}) {
  const picked = orderPicked(value);
  const lines = item.orderLinesHtml!;
  const set = (next: number[]) => onChange(next.join(","));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= picked.length) return;
    const n = [...picked];
    [n[i], n[j]] = [n[j], n[i]];
    set(n);
  };
  const pool = lines.map((html, p) => ({ html, p })).filter((x) => !picked.includes(x.p));
  const btn = "grid size-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted hover:text-ink";
  return (
    <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]" data-testid="order-input">
      <section aria-label="Các bước">
        <p className="font-mono text-xs text-muted">
          Các bước ({pool.length}){item.extraCount ? ` · có ${item.extraCount} bước thừa, không dùng` : ""}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {pool.map(({ html, p }) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => set([...picked, p])}
              data-testid="order-pool"
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left font-body hover:border-accent disabled:opacity-60"
            >
              <span className="font-display font-bold text-accent" aria-hidden>
                +
              </span>
              <Rich html={html} />
            </button>
          ))}
          {!pool.length && <p className="text-sm text-muted">Đã dùng hết các bước.</p>}
        </div>
      </section>
      <section aria-label="Lời giải của con">
        <p className="font-mono text-xs text-muted">Lời giải của con</p>
        <ol className="mt-2 flex flex-col gap-1.5" data-testid="order-chosen">
          {picked.map((p, i) => {
            const tone =
              at === undefined ? "border-border" : i < at ? "border-good bg-good-soft" : i === at ? "border-2 border-warn bg-warn-soft" : "border-border";
            return (
              <li key={p} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-1.5 ${tone}`} data-wrong={i === at ? "true" : undefined}>
                <span className="w-5 font-mono text-xs text-muted">{i + 1}</span>
                <Rich html={lines[p]} className="min-w-0 flex-1 font-body" />
                {!disabled && (
                  <>
                    <button type="button" aria-label="Đưa lên" onClick={() => move(i, -1)} className={btn}>
                      ↑
                    </button>
                    <button type="button" aria-label="Đưa xuống" onClick={() => move(i, 1)} className={btn}>
                      ↓
                    </button>
                    <button type="button" aria-label="Bỏ bước này" onClick={() => set(picked.filter((x) => x !== p))} className={btn}>
                      ×
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ol>
        {!picked.length && (
          <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">Bấm các bước bên trái theo thứ tự lời giải.</p>
        )}
      </section>
    </div>
  );
}
