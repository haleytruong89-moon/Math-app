"use client";

import { useState } from "react";
import { HOMEWORK_RULES, isDriveLink } from "@/lib/learning/homework";

type Row = { key: number; unit: string; task: string; links: string[]; due: string };
const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink";

/** "Giao bài về nhà" rows inside the session form; submitted with it as hw.<i>.* fields. */
export function HomeworkFields({ units, defaultDue, minDue, maxDue }: {
  units: { id: string; title: string }[]; // the units ticked above
  defaultDue: string;
  minDue: string; // the taught day
  maxDue: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [next, setNext] = useState(0);
  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Giao bài về nhà (không bắt buộc)</legend>
      <ul className="mt-2 flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={r.key} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5" data-testid="homework-row">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Bài về nhà {i + 1}</span>
              <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="text-sm text-muted hover:text-warn">
                Bỏ bài này
              </button>
            </div>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Cho phần
              <select name={`hw.${i}.unit`} value={r.unit} onChange={(e) => set(r.key, { unit: e.target.value })} className={input}>
                <option value="">Khác</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              <span className="flex justify-between">
                <span>Yêu cầu</span>
                <span className="font-mono text-xs tabular-nums">{r.task.length}/{HOMEWORK_RULES.taskMax}</span>
              </span>
              <textarea
                name={`hw.${i}.task`}
                rows={2}
                maxLength={HOMEWORK_RULES.taskMax}
                value={r.task}
                onChange={(e) => set(r.key, { task: e.target.value })}
                placeholder="Ví dụ: Làm bài 3, 5, 7 trang 72 SGK."
                className={input}
              />
            </label>
            <div className="flex flex-col gap-1.5 text-sm text-muted">
              <span>Link đề / ảnh (Google Drive)</span>
              {r.links.map((l, j) => (
                <div key={j}>
                  <input
                    name={`hw.${i}.link`}
                    inputMode="url"
                    value={l}
                    onChange={(e) => set(r.key, { links: r.links.map((x, k) => (k === j ? e.target.value : x)) })}
                    placeholder="https://drive.google.com/…"
                    className={input}
                  />
                  {l.trim() && !isDriveLink(l) && (
                    <span className="mt-0.5 block text-xs text-warn">Đây không phải link Google Drive — con có mở được không?</span>
                  )}
                </div>
              ))}
              {r.links.length < HOMEWORK_RULES.linksMax && (
                <button type="button" onClick={() => set(r.key, { links: [...r.links, ""] })} className="self-start text-sm text-accent hover:underline">
                  + thêm link
                </button>
              )}
              <span className="text-xs">Nhớ để chế độ chia sẻ “Bất kỳ ai có đường liên kết”.</span>
            </div>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Hạn làm
              <input type="date" name={`hw.${i}.due`} value={r.due} min={minDue} max={maxDue} onChange={(e) => set(r.key, { due: e.target.value })} className={input} />
            </label>
          </li>
        ))}
      </ul>
      {rows.length < HOMEWORK_RULES.itemsMax && (
        <button
          type="button"
          onClick={() => {
            setRows((rs) => [...rs, { key: next, unit: units[0]?.id ?? "", task: "", links: [""], due: defaultDue }]);
            setNext((n) => n + 1);
          }}
          className="mt-2 w-full rounded-lg border border-dashed border-border px-4 py-2.5 font-display text-sm"
        >
          + Giao bài về nhà
        </button>
      )}
    </fieldset>
  );
}
