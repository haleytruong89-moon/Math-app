"use client";

import { useRef } from "react";
import type { PublicItem } from "@/lib/content/public";
import { Rich } from "./rich";

/** Multiple choice (value = option index as string) or numeric answer box with √ and / helpers. */
export function ItemInput({
  item,
  value,
  onChange,
  disabled,
  onEnter,
}: {
  item: PublicItem;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onEnter?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

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

export const FORMAT_HINT = "Chưa đọc được đáp số. Cách ghi: 12 · 4,8 · 12/5 · 2√3 · √3/2";
