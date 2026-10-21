"use client";

import { useState } from "react";
import type { PublicItem } from "@/lib/content/public";
import { Rich } from "../rich";
import { proofParts } from "../answer-parts";

/** S5 C3: click a blank, then a choice; the next empty blank becomes active. `marks` = right / wrong per blank after a check. */
export function ProofInput({
  item,
  value,
  onChange,
  disabled,
  marks,
}: {
  item: PublicItem;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  marks?: boolean[];
}) {
  const parts = proofParts(item, value);
  const [active, setActive] = useState(() => Math.max(0, parts.findIndex((p) => !p)));
  const fill = (k: number) => {
    const next = parts.map((p, i) => (i === active ? String(k) : p));
    onChange(next.join("|"));
    const empty = next.findIndex((p) => !p);
    if (empty >= 0) setActive(empty);
  };
  const tone = (b: number) => {
    if (marks) return marks[b] ? "border border-good bg-good-soft" : "border-2 border-warn bg-warn-soft";
    const ring = active === b && !disabled ? " ring-2 ring-accent/30" : "";
    return (parts[b] ? "border border-accent bg-accent-soft" : "border-2 border-dashed border-border text-muted") + ring;
  };
  return (
    <div className="mt-3" data-testid="proof-input">
      <div className="flex flex-col gap-1.5 font-body text-lg leading-relaxed">
        {item.proofLines!.map((line, li) => (
          <div key={li} className="flex flex-wrap items-center gap-1">
            {line.map((seg, si) =>
              "blank" in seg ? (
                <button
                  key={si}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActive(seg.blank)}
                  aria-label={`Ô trống số ${seg.blank + 1}`}
                  data-testid={`blank-${seg.blank + 1}`}
                  data-right={marks ? String(marks[seg.blank]) : undefined}
                  className={`min-h-9 rounded-md px-2.5 text-base ${tone(seg.blank)}`}
                >
                  {parts[seg.blank] ? <Rich html={item.bankHtml![Number(parts[seg.blank])]} /> : `(${seg.blank + 1}) chọn…`}
                </button>
              ) : (
                <Rich key={si} html={seg.html} />
              ),
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="mt-4 rounded-lg border border-border bg-bg p-3">
          <p className="text-sm font-semibold text-muted">
            Chọn cho ô số {active + 1} <span className="font-normal">(một lựa chọn có thể dùng nhiều lần)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.bankHtml!.map((h, k) => (
              <button
                key={k}
                type="button"
                onClick={() => fill(k)}
                data-testid="bank-choice"
                className="min-h-10 rounded-full border border-border bg-surface px-3 font-body hover:border-accent"
              >
                <Rich html={h} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
