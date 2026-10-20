"use client";

import { startTransition, useActionState, useState } from "react";
import { saveTeachingSession, type SaveSessionState } from "@/app/tutor/actions";

/** One KU the tutor may tick, with the evidence shown before she proposes a level (§2.7, D8). */
export type ChipUnit = {
  id: string;
  title: string;
  group: "priority" | "progress" | "other";
  level: number;
  answers: number;
  enoughData: boolean;
  lastExit: string | null; // "4/5"
  practiceRate: number | null; // 0..1 over the last 5 practice first-tries
  lastActive: string | null; // dd/mm
  confirmed: string | null; // parent-confirmed level still in effect, e.g. "M3 (05/10)"
  needsTutor: boolean; // LT6
  inApp: boolean; // has approved content the student can open
};

const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
// Wording from the master plan's mastery scale (PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER §2).
const LEVEL_HINT = ["Chưa biết / chưa nhận dạng", "Hiểu khi được hướng dẫn", "Tự làm bài chuẩn", "Vận dụng bài biến thể", "Sẵn sàng thi, nhớ lâu"] as const;
const NOTE_MAX = 500;

type Props = { studentId: string; today: string; minDate: string; units: ChipUnit[] };

/** Mockup artboard 5: date → taught KUs as chips (priority + in progress, search for the rest) → evidence + level only for ticked. */
export function SessionShort(props: Props) {
  const [state, formAction, pending] = useActionState<SaveSessionState, FormData>(async (prev, fd) => {
    // Block a missing level before the round trip; the server checks again.
    const missing = fd
      .getAll("unit")
      .map(String)
      .filter((id) => !fd.get(`level:${id}`))
      .map((id) => props.units.find((u) => u.id === id)?.title ?? id);
    if (missing.length) return { error: `Chọn mức đề xuất cho: ${missing.map((t) => `“${t}”`).join(", ")}.` };
    return saveTeachingSession(prev, fd);
  }, {});
  return (
    // onSubmit rather than `action`: React resets a form after an action runs, which would wipe the choices when a save is refused.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className="mx-auto flex max-w-3xl flex-col gap-4"
    >
      <input type="hidden" name="studentId" value={props.studentId} />
      {/* Remount after each successful save so the form is empty again. */}
      <Fields key={state.savedAt ?? "new"} {...props} />
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 pb-4 pt-3 backdrop-blur">
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-5 py-3 font-display font-bold text-on-accent disabled:opacity-60">
          {pending ? "Đang lưu…" : "Lưu buổi dạy"}
        </button>
        <a href={`/tutor/${props.studentId}/giao`} className="font-display font-semibold text-accent">Giao bài về nhà →</a>
        <span aria-live="polite" className="text-sm">
          {state.error ? <span role="alert" className="text-warn">{state.error}</span> : state.ok ? <span role="status" className="text-good">✓ {state.ok}</span> : null}
        </span>
      </div>
    </form>
  );
}

function Fields({ studentId, today, minDate, units }: Props) {
  const [ticked, setTicked] = useState<string[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [note, setNote] = useState("");
  const toggle = (id: string) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const chip = (u: ChipUnit) => {
    const on = ticked.includes(u.id);
    return (
      <label key={u.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${on ? "border-accent bg-accent-soft font-semibold text-accent" : "border-border bg-surface"}`}>
        <input type="checkbox" name="unit" value={u.id} checked={on} onChange={() => toggle(u.id)} className="sr-only" />
        {on ? "✓ " : ""}
        {u.title}
      </label>
    );
  };
  const others = units.filter((u) => u.group === "other");
  const found = q.trim() ? others.filter((u) => !ticked.includes(u.id) && u.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  return (
    <>
      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <label htmlFor="taughtOn" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">1 · Ngày dạy</label>
        <input id="taughtOn" name="taughtOn" type="date" defaultValue={today} min={minDate} max={today} className="rounded-lg border border-border bg-surface px-3 py-2" />
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">2 · Hôm nay dạy bài nào?</p>
        {(["priority", "progress"] as const).map(
          (g) =>
            units.some((u) => u.group === g) && (
              <div key={g}>
                <p className="text-sm text-muted">{g === "priority" ? "Ưu tiên của cô" : "Con đang học dở"}</p>
                <div className="mt-1 flex flex-wrap gap-2">{units.filter((u) => u.group === g).map(chip)}</div>
              </div>
            ),
        )}
        {others.some((u) => ticked.includes(u.id)) && <div className="flex flex-wrap gap-2">{others.filter((u) => ticked.includes(u.id)).map(chip)}</div>}
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm bài khác (${units.length} bài)…`} aria-label="Tìm bài khác" className="rounded-lg border border-border bg-surface px-3 py-2" />
        {found.length > 0 && <div className="flex flex-wrap gap-2">{found.map(chip)}</div>}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted">3 · Con nắm đến đâu? (chỉ bài đã chọn)</p>
        {ticked.map((id) => {
          const u = units.find((x) => x.id === id)!;
          return <Evidence key={id} u={u} studentId={studentId} level={levels[id]} onLevel={(l) => setLevels((x) => ({ ...x, [id]: l }))} />;
        })}
        {!ticked.length && <p className="text-sm text-muted">Chọn bài ở bước 2. Buổi chữa đề / không theo bài: ghi chú bên dưới là đủ.</p>}
        <div className="flex items-baseline justify-between">
          <label htmlFor="note" className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Ghi chú (tuỳ chọn)</label>
          <span className="font-mono text-xs tabular-nums">{note.length}/{NOTE_MAX}</span>
        </div>
        <textarea id="note" name="note" rows={2} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-base" />
      </section>
    </>
  );
}

function Evidence({ u, studentId, level, onLevel }: { u: ChipUnit; studentId: string; level: number | undefined; onLevel: (l: number) => void }) {
  const facts = [
    u.lastExit ? `Kiểm tra gần nhất ${u.lastExit}` : "Chưa làm bài kiểm tra",
    u.practiceRate !== null ? `5 câu luyện gần nhất đúng ${Math.round(u.practiceRate * 100)}%` : null,
    u.lastActive ? `Làm bài lần cuối ${u.lastActive}` : null,
    u.confirmed ? `Bố mẹ chốt ${u.confirmed}` : null,
  ].filter(Boolean);
  return (
    <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 font-display font-semibold">
        {u.title}
        {u.needsTutor && <span className="ml-2 font-mono text-xs text-warn">cần gia sư xác nhận</span>}
        {!u.inApp && <span className="ml-2 font-mono text-xs text-muted">chưa có bài trên app</span>}
      </legend>
      <div className="flex flex-wrap items-center gap-2.5" data-testid={`evidence-${u.id}`}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[u.level]} ${u.level >= 2 ? "text-on-accent" : "text-ink"}`}>M{u.level}</span>
        <span className="text-sm leading-tight">
          Hệ thống tính: <b>M{u.level}</b>
          <span className="block font-mono text-[11px] text-muted">{u.enoughData ? `${u.answers} câu đã làm` : `chưa đủ dữ liệu (${u.answers} câu)`}</span>
        </span>
        {/* New tab, so the ticks and levels chosen so far are not lost. */}
        <a href={`/tutor/${studentId}/work?unit=${u.id}`} target="_blank" rel="noopener" className="ml-auto text-sm text-accent hover:underline">
          Xem câu sai →
        </a>
      </div>
      <p className="mt-2 text-sm text-muted">{facts.join(" · ")}</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Mức đề xuất cho ${u.title}`}>
        {LEVEL_HINT.map((hint, lvl) => (
          <label key={lvl} className="cursor-pointer" title={hint}>
            <input type="radio" name={`level:${u.id}`} value={lvl} checked={level === lvl} onChange={() => onLevel(lvl)} className="peer sr-only" aria-label={`M${lvl} — ${hint}`} />
            <span className="inline-block w-12 rounded-lg border border-border py-2 text-center font-mono text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              M{lvl}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
