"use client";

import { useRouter } from "next/navigation";

/** Giao bài: changing the KU reloads the page for it (no extra "Chọn" click). */
export function UnitPicker({ units, value, mode }: { units: { id: string; title: string; star: boolean }[]; value: string | null; mode: string }) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-2">
      <span className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Bài</span>
      <select
        name="unit"
        defaultValue={value ?? undefined}
        onChange={(e) => router.push(`?${new URLSearchParams({ unit: e.target.value, mode })}`)}
        className="max-w-full rounded-lg border border-border bg-surface px-3 py-2 font-display font-semibold"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.star ? "★ " : ""}
            {u.title}
          </option>
        ))}
      </select>
    </label>
  );
}
