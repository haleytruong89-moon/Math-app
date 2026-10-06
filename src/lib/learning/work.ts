// "Bài làm của con" view model for tutors and the parent (spec 2026-10-05, part A).
// Pure, so `node --test` covers it. Faded steps are never shown (T5).
import type { Item } from "../content/schema.ts";
import { STEP_SEPARATOR, gradeItem } from "../content/grade.ts";
import { texToHtml } from "../content/tex.ts";
import type { AttemptRow } from "./rules.ts";

export type WorkAttempt = AttemptRow & { answer: string; duration_ms: number | null };
export type WorkMode = "practice" | "exit" | "review";

export type WorkEntry = {
  key: string;
  itemId: string;
  mode: WorkMode;
  at: string; // ISO timestamp
  durationMs: number | null;
  correct: boolean;
  errorCode: string | null;
  laterCorrect: boolean; // a later answer to the same item was right
  promptHtml: string;
  answerHtml: string; // what the student entered (escaped; MCQ → option text)
  correctHtml: string;
  feedbackHtml: string | null; // targeted feedback for this wrong answer, from the content
  solutionHtml: string;
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Generic so filtering WorkAttempt[] keeps `answer` / `duration_ms`.
const graded = <T extends AttemptRow>(a: T): a is T & { mode: WorkMode } => a.mode !== "faded";

/** Error codes seen at least `min` times in practice, exit and review, most frequent first. */
export function commonErrors(attempts: AttemptRow[], min = 2): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const a of attempts) if (graded(a) && a.error_code) counts.set(a.error_code, (counts.get(a.error_code) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count >= min)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

/** What the student entered: escaped text, or the chosen MCQ option rendered. */
export function answerHtml(item: Item, raw: string): string {
  if (item.type === "steps") {
    const parts = raw.split(STEP_SEPARATOR);
    return item.steps.map((st, i) => `Bước ${i + 1}: ${answerHtml(st.item, parts[i] ?? "")}`).join(" · ");
  }
  const answer = raw.trim();
  if (!answer) return "(bỏ trống)";
  if (item.type === "mcq") {
    const i = /^\d$/.test(answer) ? Number(answer) : -1;
    return i >= 0 && i < item.options.length ? texToHtml(item.options[i]) : "(không đọc được)";
  }
  return escapeHtml(answer);
}

export function correctHtml(item: Item): string {
  if (item.type === "steps") return item.steps.map((st, i) => `Bước ${i + 1}: ${correctHtml(st.item)}`).join(" · ");
  return item.type === "mcq" ? texToHtml(item.options[item.correct]) : texToHtml(item.unit ? `${item.answer} ${item.unit}` : item.answer);
}

/** Newest first. Items that are no longer in the content are skipped. */
export function workEntries(
  attempts: WorkAttempt[],
  lookup: (itemId: string) => Item | null,
  opts: { wrongOnly: boolean },
): WorkEntry[] {
  const rows = attempts.filter(graded);
  const out: WorkEntry[] = [];
  for (const a of rows) {
    if (opts.wrongOnly && a.correct) continue;
    const item = lookup(a.item_id);
    if (!item) continue;
    const g = a.correct ? null : gradeItem(item, a.answer);
    out.push({
      key: `${a.item_id}|${a.created_at}`,
      itemId: a.item_id,
      mode: a.mode,
      at: a.created_at,
      durationMs: a.duration_ms,
      correct: a.correct,
      errorCode: a.error_code,
      laterCorrect: !a.correct && rows.some((b) => b.item_id === a.item_id && b.correct && b.created_at > a.created_at),
      promptHtml: texToHtml(item.prompt),
      answerHtml: answerHtml(item, a.answer),
      correctHtml: correctHtml(item),
      feedbackHtml: g?.feedback ? texToHtml(g.feedback) : null,
      solutionHtml: texToHtml(item.solution),
    });
  }
  return out.sort((x, y) => y.at.localeCompare(x.at));
}

export function durationLabel(ms: number | null): string | null {
  if (ms === null) return null;
  return ms < 60_000 ? `${Math.round(ms / 1000)} giây` : `${Math.round(ms / 60_000)} phút`;
}
