// Homework the tutor gives in "Ghi buổi dạy" (spec 2026-10-05 part B, T1–T4).
// Pure, so `node --test` covers it. Never graded; not part of mastery or the weekly goal.
import { addDays, daysBetween } from "./rules.ts";

export const HOMEWORK_RULES = {
  taskMax: 300,
  linksMax: 3,
  linkMax: 500,
  itemsMax: 5,
  dueMaxDays: 30, // due date: from the taught day up to today + 30
  defaultDueDays: 3, // T3
  reviewNoteMax: 300,
  shownAfterReviewDays: 7, // a corrected homework stays on the student's list this long
} as const;

export type RawHomework = { unit: string; task: string; links: string[]; due: string };
export type Homework = { unitId: string | null; task: string; links: string[]; dueOn: string };
export type HomeworkRow = {
  id: string;
  unit_id?: string | null;
  task: string;
  links: string[];
  due_on: string;
  done_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  /** T9 (0013): practice items of unit_id to do in the app; null = whole unit / paper. */
  items?: string[] | null;
};

// Forms submit line breaks as CRLF while a textarea counts them as one character.
const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\r\n?/g, "\n").trim() : "");
const isIsoDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;
const LINK = /^https:\/\/\S+$/;

/** Reads the `hw.<i>.*` fields of the session form, in index order. */
export function readHomeworkForm(fd: FormData): RawHomework[] {
  const idx = new Set<number>();
  for (const k of fd.keys()) {
    const m = /^hw\.(\d+)\./.exec(k);
    if (m) idx.add(Number(m[1]));
  }
  return [...idx]
    .sort((a, b) => a - b)
    .map((i) => ({
      unit: String(fd.get(`hw.${i}.unit`) ?? ""),
      task: String(fd.get(`hw.${i}.task`) ?? ""),
      links: fd.getAll(`hw.${i}.link`).map(String),
      due: String(fd.get(`hw.${i}.due`) ?? ""),
    }));
}

export function parseHomework(
  raw: RawHomework[],
  /** ticked = units logged in this session; assignable (S9) = any approved unit the student can practise in the app. */
  ctx: { taughtOn: string; today: string; ticked: Set<string>; assignable?: Set<string> },
): { ok: true; value: Homework[] } | { ok: false; error: string } {
  const R = HOMEWORK_RULES;
  const rows = raw
    .map((r, i) => ({ n: i + 1, task: clean(r.task), links: r.links.map((l) => l.trim()).filter(Boolean), unit: r.unit.trim(), due: r.due.trim() }))
    .filter((r) => r.task || r.links.length);
  if (rows.length > R.itemsMax) return { ok: false, error: `Mỗi buổi giao tối đa ${R.itemsMax} bài về nhà.` };

  const value: Homework[] = [];
  const maxDue = addDays(ctx.today, R.dueMaxDays);
  for (const r of rows) {
    const at = `Bài về nhà ${r.n}`;
    if (!r.task || r.task.length > R.taskMax) return { ok: false, error: `${at}: ghi yêu cầu (tối đa ${R.taskMax} ký tự).` };
    if (r.unit && !ctx.ticked.has(r.unit) && !ctx.assignable?.has(r.unit))
      return { ok: false, error: `${at}: chọn một bài đã tick ở trên, một bài có trong app, hoặc “Khác”.` };
    if (r.links.length > R.linksMax) return { ok: false, error: `${at}: tối đa ${R.linksMax} link.` };
    if (r.links.some((l) => !LINK.test(l) || l.length > R.linkMax))
      return { ok: false, error: `${at}: link phải bắt đầu bằng https:// và không có dấu cách.` };
    if (!isIsoDate(r.due) || r.due < ctx.taughtOn || r.due > maxDue)
      return { ok: false, error: `${at}: hạn làm từ ngày dạy đến tối đa ${R.dueMaxDays} ngày tới.` };
    value.push({ unitId: r.unit || null, task: r.task, links: r.links, dueOn: r.due });
  }
  return { ok: true, value };
}

export function reviewNote(raw: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  const note = clean(raw);
  if (note.length > HOMEWORK_RULES.reviewNoteMax) return { ok: false, error: `Nhận xét tối đa ${HOMEWORK_RULES.reviewNoteMax} ký tự.` };
  return { ok: true, value: note || null };
}

export function isDriveLink(url: string): boolean {
  return /^https:\/\/(drive|docs)\.google\.com\//.test(url.trim());
}

const WEEKDAY = ["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"] as const;
const ddmm = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export function dueLabel(dueOn: string, today: string): string {
  const d = daysBetween(today, dueOn);
  if (d < 0) return `quá hạn (${ddmm(dueOn)})`;
  if (d === 0) return "hạn hôm nay";
  if (d === 1) return "hạn ngày mai";
  return `hạn ${WEEKDAY[new Date(`${dueOn}T00:00:00Z`).getUTCDay()]} ${ddmm(dueOn)}`;
}

/** Open homework, plus corrected homework for 7 days so the student can read the note. */
export function visibleHomework(rows: HomeworkRow[], now: Date): HomeworkRow[] {
  const cutoff = now.getTime() - HOMEWORK_RULES.shownAfterReviewDays * 86_400_000;
  return rows.filter((r) => !r.reviewed_at || Date.parse(r.reviewed_at) >= cutoff);
}

/**
 * The student's list from two reads: every open homework, plus the newest rows (for ones
 * corrected in the last 7 days). Reading both keeps new homework from being pushed out of a
 * single limited query by old corrected rows. Sorted by due date.
 */
export function studentHomework(open: HomeworkRow[], recent: HomeworkRow[], now: Date): HomeworkRow[] {
  const byId = new Map<string, HomeworkRow>();
  for (const r of [...open, ...visibleHomework(recent, now)]) byId.set(r.id, r);
  return [...byId.values()].sort((a, b) => a.due_on.localeCompare(b.due_on) || a.id.localeCompare(b.id));
}

/**
 * S9: what the student did in the app on a homework's unit since it was given — shown to the
 * tutor beside the homework. Faded steps don't count (same as "Bài làm của con").
 */
export type HomeworkAppResult = {
  practice: { right: number; total: number };
  exit: { right: number; total: number } | null; // the latest exit run since the homework was given
  topError: string | null; // most frequent error code among wrong answers, if any repeats
};

export function homeworkAppResult(
  attempts: { item_id: string; mode: string; correct: boolean; error_code: string | null; exit_run: string | null; created_at: string }[],
  sinceIso: string,
  /** T9: only these items (hand-picked homework); null/undefined = the whole unit. */
  items?: string[] | null,
): HomeworkAppResult | null {
  const since = Date.parse(sinceIso);
  const only = items ? new Set(items) : null;
  const rows = attempts.filter((a) => Date.parse(a.created_at) >= since && a.mode !== "faded" && (!only || only.has(a.item_id)));
  if (!rows.length) return null;
  const practice = rows.filter((a) => a.mode === "practice");
  const exits = rows.filter((a) => a.mode === "exit" && a.exit_run);
  const lastRun = exits.reduce<{ run: string; at: number } | null>((best, a) => {
    const at = Date.parse(a.created_at);
    return !best || at > best.at ? { run: a.exit_run!, at } : best;
  }, null);
  const run = lastRun ? exits.filter((a) => a.exit_run === lastRun.run) : [];
  const counts = new Map<string, number>();
  for (const a of rows) if (!a.correct && a.error_code) counts.set(a.error_code, (counts.get(a.error_code) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    practice: { right: practice.filter((a) => a.correct).length, total: practice.length },
    exit: run.length ? { right: run.filter((a) => a.correct).length, total: run.length } : null,
    topError: top && top[1] >= 2 ? top[0] : null,
  };
}

export type RawAssignment = { mode: string; unit: string; items: string[]; task: string; links: string[]; due: string };
export type Assignment = { unitId: string | null; items: string[] | null; task: string; links: string[]; dueOn: string };

/** T9, "Giao bài" tab: whole KU, hand-picked practice items, or paper homework (no session needed). */
export function parseAssignment(
  raw: RawAssignment,
  ctx: { today: string; units: Map<string, { title: string; practice: string[] }> },
): { ok: true; value: Assignment } | { ok: false; error: string } {
  const R = HOMEWORK_RULES;
  const task = clean(raw.task);
  const links = raw.links.map((l) => l.trim()).filter(Boolean);
  const due = raw.due.trim();
  if (!isIsoDate(due) || due < ctx.today || due > addDays(ctx.today, R.dueMaxDays)) return { ok: false, error: `Hạn nộp từ hôm nay đến ${R.dueMaxDays} ngày tới.` };
  if (task.length > R.taskMax) return { ok: false, error: `Lời dặn tối đa ${R.taskMax} ký tự.` };
  if (links.length > R.linksMax || links.some((l) => !LINK.test(l) || l.length > R.linkMax)) return { ok: false, error: `Tối đa ${R.linksMax} link, mỗi link bắt đầu bằng https://.` };
  if (raw.mode === "paper") {
    if (!task && !links.length) return { ok: false, error: "Ghi yêu cầu bài làm hoặc dán link đề." };
    const unit = raw.unit.trim();
    if (unit && !ctx.units.has(unit)) return { ok: false, error: "Bài này chưa có trong app." };
    return { ok: true, value: { unitId: unit || null, items: null, task: task || "Làm theo đề trong link.", links, dueOn: due } };
  }
  const u = ctx.units.get(raw.unit.trim());
  if (!u) return { ok: false, error: "Chọn một bài đã duyệt." };
  if (raw.mode === "unit") return { ok: true, value: { unitId: raw.unit.trim(), items: null, task: task || `Làm cả bài "${u.title}" trên app.`, links, dueOn: due } };
  if (raw.mode !== "items") return { ok: false, error: "Chọn cách giao." };
  const items = [...new Set(raw.items)];
  if (!items.length || items.length > 20) return { ok: false, error: "Chọn từ 1 đến 20 câu." };
  if (items.some((id) => !u.practice.includes(id))) return { ok: false, error: "Có câu không thuộc phần luyện tập của bài này." };
  return { ok: true, value: { unitId: raw.unit.trim(), items, task: task || `Làm ${items.length} câu "${u.title}" trên app.`, links, dueOn: due } };
}
