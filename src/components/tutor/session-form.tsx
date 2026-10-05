"use client";

import { startTransition, useActionState, useState } from "react";
import { saveTeachingSession, type SaveSessionState } from "@/app/tutor/actions";

/** What the tutor sees for one unit before proposing a level (§2.7: evidence first). */
export type UnitEvidence = {
  id: string;
  title: string;
  moduleTitle: string;
  draft: boolean;
  level: number;
  answers: number;
  enoughData: boolean;
  lastExit: string | null; // "4/5"
  practiceRate: number | null; // 0..1 over the last 5 practice first-tries
  lastActive: string | null; // dd/mm
};

const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
// Wording from the master plan's mastery scale (PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER §2).
const LEVEL_HINT = [
  "Chưa biết / chưa nhận dạng",
  "Hiểu khi được hướng dẫn",
  "Tự làm bài chuẩn",
  "Vận dụng bài biến thể",
  "Sẵn sàng thi, nhớ lâu",
] as const;
const NOTE_MAX = 500;

export function SessionForm(props: { studentId: string; today: string; minDate: string; units: UnitEvidence[] }) {
  const [state, formAction, pending] = useActionState<SaveSessionState, FormData>(async (prev, fd) => {
    // Block an empty proposal before the round trip; the server checks again.
    const missing = fd
      .getAll("unit")
      .map(String)
      .filter((id) => !fd.get(`level:${id}`))
      .map((id) => props.units.find((u) => u.id === id)?.title ?? id);
    if (missing.length) return { error: `Chọn mức đề xuất cho: ${missing.map((t) => `“${t}”`).join(", ")}.` };
    return saveTeachingSession(prev, fd);
  }, {});

  return (
    // Submitted via onSubmit rather than the `action` prop: React resets a form after an
    // `action` runs, which would wipe the tutor's choices when a save is refused.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="mt-5 flex flex-col gap-5"
    >
      {/* Remount the fields after each successful save so the form is empty again. */}
      <Fields key={state.savedAt ?? "new"} {...props} />
      <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/95 px-4 pb-4 pt-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu buổi dạy"}
        </button>
        <p className="mt-2 min-h-5 text-center text-sm" aria-live="polite">
          {state.error ? (
            <span role="alert" className="text-warn">{state.error}</span>
          ) : state.ok ? (
            <span role="status" className="text-good">✓ {state.ok}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}

function Fields({ studentId, today, minDate, units }: { studentId: string; today: string; minDate: string; units: UnitEvidence[] }) {
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [day, setDay] = useState(today);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const toggle = (id: string, on: boolean) =>
    setTicked((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  return (
    <>
      <input type="hidden" name="studentId" value={studentId} />
      <label className="flex flex-col gap-1.5 text-sm text-muted">
        Ngày dạy
        <input
          type="date"
          name="taughtOn"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          min={minDate}
          max={today}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
        />
      </label>

      <fieldset>
        <legend className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Bài đã dạy</legend>
        <ul className="mt-2 flex flex-col gap-2">
          {units.map((u) => {
            const on = ticked.has(u.id);
            return (
              <li key={u.id} className={`rounded-xl border bg-surface ${on ? "border-accent" : "border-border"}`}>
                <label className="flex cursor-pointer items-start gap-3 p-3.5">
                  <input
                    type="checkbox"
                    name="unit"
                    value={u.id}
                    checked={on}
                    onChange={(e) => toggle(u.id, e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block font-display font-semibold leading-snug">{u.title}</span>
                    <span className="font-mono text-xs text-muted">
                      {u.moduleTitle}
                      {u.draft && " · chưa mở cho học sinh"}
                    </span>
                  </span>
                </label>
                {on && <Evidence u={u} studentId={studentId} level={levels[u.id]} onLevel={(l) => setLevels((m) => ({ ...m, [u.id]: l }))} />}
              </li>
            );
          })}
        </ul>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm text-muted">
        <span className="flex justify-between">
          <span>Ghi chú (không bắt buộc)</span>
          <span className="font-mono text-xs tabular-nums">{note.length}/{NOTE_MAX}</span>
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: còn nhầm hình chiếu, cần thêm bài tập dạng tính AH."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
        />
      </label>
    </>
  );
}

function Evidence({ u, studentId, level, onLevel }: { u: UnitEvidence; studentId: string; level: number | undefined; onLevel: (l: number) => void }) {
  const facts = [
    u.lastExit ? `Kiểm tra gần nhất ${u.lastExit}` : "Chưa làm bài kiểm tra",
    u.practiceRate !== null ? `5 câu luyện gần nhất đúng ${Math.round(u.practiceRate * 100)}%` : null,
    u.lastActive ? `Làm bài lần cuối ${u.lastActive}` : null,
  ].filter(Boolean);
  return (
    <div className="border-t border-border px-3.5 pb-3.5 pt-3">
      <div className="flex items-center gap-2.5" data-testid={`evidence-${u.id}`}>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[u.level]} ${u.level >= 2 ? "text-on-accent" : "text-ink"}`}
        >
          M{u.level}
        </span>
        <span className="text-sm leading-tight">
          Hệ thống tính: <b>M{u.level}</b>
          <span className="block font-mono text-[11px] text-muted">
            {u.enoughData ? `${u.answers} câu đã làm` : `chưa đủ dữ liệu (${u.answers} câu)`}
          </span>
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">{facts.join(" · ")}</p>
      {/* New tab, so the ticks and levels chosen so far are not lost. */}
      <a
        href={`/tutor/${studentId}/work?unit=${u.id}`}
        target="_blank"
        rel="noopener"
        className="mt-1 inline-block text-sm text-accent hover:underline"
      >
        Xem câu sai →
      </a>

      <fieldset className="mt-3">
        <legend className="text-sm">Mức bạn đề xuất</legend>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {LEVEL_HINT.map((hint, lvl) => (
            <label key={lvl} className="cursor-pointer">
              <input
                type="radio"
                name={`level:${u.id}`}
                value={lvl}
                checked={level === lvl}
                onChange={() => onLevel(lvl)}
                className="peer sr-only"
                aria-label={`M${lvl} — ${hint}`}
              />
              <span className="block rounded-lg border border-border py-2 text-center font-mono text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                M{lvl}
              </span>
            </label>
          ))}
        </div>
        <details className="mt-1.5 font-mono text-[11px] leading-relaxed text-muted">
          <summary className="cursor-pointer">Ý nghĩa M0–M4</summary>
          <ul className="mt-1">
            {LEVEL_HINT.map((hint, lvl) => (
              <li key={lvl}>M{lvl} · {hint}</li>
            ))}
          </ul>
        </details>
      </fieldset>
    </div>
  );
}
