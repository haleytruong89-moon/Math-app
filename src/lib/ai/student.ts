// S8b (01/11/2026): the student's AI help — stage, context pack, guard, fallback, test-set pass rule. Pure, so
// `node --test` covers it. Design: docs/AI_TUTOR.md §3–§4, spec 2026-10-22-s8-ai-design.md §6, plan 2026-11-01-s8b.
import { z } from "zod";
import type { Item } from "../content/schema.ts";
import { parseAnswer } from "../content/grade.ts";
import { allowedNumbers, bannedWords, jsonPart, numbersIn, unknownNumbers, type Check } from "./guard.ts";

export const STUDENT_AI = {
  turnsPerItem: 6, // AI_TUTOR §6: per item per day
  turnsPerDay: 20,
  replyMaxWords: 80,
  maxQuestionMarks: 1, // one guiding question per turn
  questionMaxChars: 300,
  afterWindowMs: 30 * 60 * 1000, // a wrong answer older than this no longer opens "after" help
  maxTokens: 400,
} as const;

/** Test set (layer 4): at least 20 scored cases, no "sai toán", mean of the 6 scores ≥ 1.6. */
export const EVAL_PASS = { minScored: 20, meanMin: 1.6, maxCases: 30, minCases: 20 } as const;

export const EVAL_CRITERIA = ["Đúng toán", "Không lộ đáp án sớm", "Đúng nấc gợi ý", "Ngắn, dễ hiểu", "Khiến con tự nghĩ", "Tiếng Việt tự nhiên"] as const;

export const QUESTION_AFTER = "Con chưa hiểu vì sao con sai ở câu này. Giải thích giúp con với?";
export const QUESTION_BEFORE = "Con đọc hết gợi ý rồi mà vẫn chưa biết bắt đầu từ đâu.";
export const OFF_TOPIC_REPLY = "Mình chỉ giúp được câu con đang làm thôi. Con muốn hỏi chỗ nào trong câu này?";

export type AiStage = "before" | "after";
export type AiItem = Extract<Item, { type: "mcq" | "numeric" | "steps" }>;
export type Turn = { role: "student" | "ai" | "fallback"; content: string };

/** v1: answers the guard can check. Geometry proof items and drills have their own scaffolding. */
export const aiSupported = (it: Item): it is AiItem => it.type === "mcq" || it.type === "numeric" || it.type === "steps";

/** "after" only when her latest attempt on this item is wrong and recent; the browser's claim is never trusted. */
export function aiStage(latest: { correct: boolean; created_at: string } | null, now: Date): AiStage {
  if (!latest || latest.correct) return "before";
  return now.getTime() - new Date(latest.created_at).getTime() <= STUDENT_AI.afterWindowMs ? "after" : "before";
}

/** Which limit is reached, if any (turns = her questions already asked). */
export function limitReached(turnsItemToday: number, turnsToday: number): "item" | "day" | null {
  if (turnsToday >= STUDENT_AI.turnsPerDay) return "day";
  if (turnsItemToday >= STUDENT_AI.turnsPerItem) return "item";
  return null;
}

const feedbacks = (it: AiItem): string[] => {
  if (it.type === "mcq") return Object.values(it.mistakes ?? {}).map((m) => m.feedback);
  if (it.type === "numeric") return (it.mistakes ?? []).map((m) => m.feedback);
  return it.steps.flatMap((s) => feedbacks(s.item as AiItem));
};

/** Layer 2: only approved content + her answer and question. No name, school or other data. */
export function contextPack(
  it: AiItem,
  unit: { title: string; theory: string[] },
  o: { stage: AiStage; answer?: string | null; errorCode?: string | null; thread: Turn[] },
) {
  return {
    bai: unit.title,
    lyThuyet: unit.theory,
    de: it.prompt,
    ...(it.type === "mcq" ? { phuongAn: it.options } : {}),
    ...(it.type === "steps" ? { cacBuoc: it.steps.map((s) => ({ buoc: s.prompt, hoi: s.item.prompt, ...(s.item.type === "mcq" ? { phuongAn: s.item.options } : {}) })) } : {}),
    loiGiaiDaDuyet: it.solution,
    goiYVietSan: it.hints ?? [],
    nhacLoiKhiSai: feedbacks(it),
    giaiDoan: o.stage === "before" ? "trước khi con trả lời" : "sau khi con trả lời sai",
    ...(o.stage === "after" ? { traLoiCuaCon: o.answer ?? "", maLoi: o.errorCode ?? null } : {}),
    hoiThoaiTruoc: o.thread.map((t) => ({ ai: t.role === "student" ? "con" : "trợ lý", noiDung: t.content })),
  };
}

/** What must not appear before she answers: right option texts and right values (every step of a multi-step item). */
export function hiddenAnswers(it: AiItem): { values: number[]; texts: string[] } {
  const out = { values: [] as number[], texts: [] as string[] };
  const add = (x: Extract<Item, { type: "mcq" | "numeric" }>) => {
    if (x.type === "mcq") out.texts.push(x.options[x.correct]);
    else {
      const v = parseAnswer(x.answer);
      if (v !== null) out.values.push(v);
      out.texts.push(x.answer);
    }
  };
  if (it.type === "steps") for (const s of it.steps) add(s.item);
  else add(it);
  return out;
}

/** For comparisons: TeX fractions as a/b, no $, spaces, braces or case. */
export function flat(s: string): string {
  return s
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "√($1)")
    .replace(/[\s${}]/g, "")
    .replace(/\\(left|right|cdot|,)/g, "")
    .replace(/\((\d+)\)/g, "$1")
    .toLowerCase();
}

const GIVEAWAY = /đáp\s*(án|số)\s*(đúng\s*)?(là|bằng)|chọn\s*(phương án|đáp án|câu)|phương án\s*[a-d]\b\s*(đúng|là)/i;

/** Does a reply give the answer away before she answers? Numbers that already appear in the prompt don't count. */
export function leaksAnswer(reply: string, hidden: { values: number[]; texts: string[] }, promptNumbers: Set<string>, promptFlat = ""): boolean {
  if (GIVEAWAY.test(reply)) return true;
  const f = flat(reply);
  for (const t of hidden.texts) {
    const ft = flat(t);
    if (ft.length >= 2 && f.includes(ft) && !promptFlat.includes(ft)) return true;
  }
  for (const n of numbersIn(reply)) {
    const v = Number(n);
    if (hidden.values.some((h) => Math.abs(h - v) < 1e-9) && !promptNumbers.has(n)) return true;
  }
  return false;
}

const Reply = z.object({ reply: z.string().trim().min(1).max(2000), offTopic: z.boolean() });
export type StudentReply = z.infer<typeof Reply>;

/** Layer 3: everything the server checks before she sees a word. */
export function checkStudentReply(
  raw: string,
  c: { allowed: Set<string>; stage: AiStage; hidden: { values: number[]; texts: string[] }; promptNumbers: Set<string>; promptFlat: string },
): Check<StudentReply> {
  let parsed: StudentReply;
  try {
    const r = Reply.safeParse(JSON.parse(jsonPart(raw)));
    if (!r.success) return { ok: false, reasons: ["json"] };
    parsed = r.data;
  } catch {
    return { ok: false, reasons: ["json"] };
  }
  if (parsed.offTopic) return { ok: true, value: parsed };
  const reasons: string[] = [];
  const t = parsed.reply;
  if (t.split(/\s+/).filter(Boolean).length > STUDENT_AI.replyMaxWords) reasons.push("long");
  if ((t.match(/\?/g) ?? []).length > STUDENT_AI.maxQuestionMarks) reasons.push("questions");
  const unknown = unknownNumbers(t, c.allowed);
  if (unknown.length) reasons.push(`numbers:${unknown.join(",")}`);
  if (c.stage === "before" && leaksAnswer(t, c.hidden, c.promptNumbers, c.promptFlat)) reasons.push("answer");
  const banned = bannedWords(t);
  if (banned.length) reasons.push(`banned:${banned.join(",")}`);
  return reasons.length ? { ok: false, reasons } : { ok: true, value: parsed };
}

/** The guard's inputs for one question. */
export function guardInputs(it: AiItem, pack: unknown, question: string, stage: AiStage) {
  const promptText = [it.prompt, ...(it.type === "steps" ? it.steps.map((s) => `${s.prompt} ${s.item.prompt}`) : [])].join(" ");
  return {
    allowed: allowedNumbers(pack, question),
    stage,
    hidden: hiddenAnswers(it),
    promptNumbers: new Set([...numbersIn(promptText), ...numbersIn(question)]),
    promptFlat: flat(promptText),
  };
}

/** Guard failed twice (or the AI is unsure): the next written hint she hasn't opened, else H6 = the approved solution. */
export function fallbackFor(it: AiItem, shownHints: number): { kind: "hint"; level: number; text: string } | { kind: "solution"; text: string } {
  const hints = it.hints ?? [];
  if (shownHints < hints.length) return { kind: "hint", level: shownHints + 1, text: hints[shownHints] };
  return { kind: "solution", text: it.solution };
}

export type EvalRow = { scores: number[] | null; math_wrong: boolean | null };

export function evalSummary(rows: EvalRow[]): { scored: number; mathWrong: number; mean: number | null; passed: boolean } {
  const scored = rows.filter((r) => r.scores && r.scores.length === 6);
  const mathWrong = scored.filter((r) => r.math_wrong).length;
  const all = scored.flatMap((r) => r.scores!);
  const mean = all.length ? all.reduce((s, x) => s + x, 0) / all.length : null;
  return { scored: scored.length, mathWrong, mean, passed: scored.length >= EVAL_PASS.minScored && mathWrong === 0 && mean !== null && mean >= EVAL_PASS.meanMin };
}

/** Real wrong answers → distinct item × error code, most frequent first. */
export function pickEvalCases<T extends { item_id: string; error_code: string | null }>(rows: T[], max: number = EVAL_PASS.maxCases): (T & { count: number })[] {
  const by = new Map<string, T & { count: number }>();
  for (const r of rows) {
    if (!r.error_code) continue;
    const k = `${r.item_id}|${r.error_code}`;
    const cur = by.get(k);
    if (cur) cur.count++;
    else by.set(k, { ...r, count: 1 });
  }
  return [...by.values()].sort((a, b) => b.count - a.count || a.item_id.localeCompare(b.item_id)).slice(0, max);
}
