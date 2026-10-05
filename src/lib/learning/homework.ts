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
  task: string;
  links: string[];
  due_on: string;
  done_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
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
  ctx: { taughtOn: string; today: string; ticked: Set<string> },
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
    if (r.unit && !ctx.ticked.has(r.unit)) return { ok: false, error: `${at}: chọn một bài đã tick ở trên, hoặc “Khác”.` };
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
