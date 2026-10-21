// Answer parsing and grading. Pure module: used by server actions and by node tests.
// Accepts equivalent exact forms (12/5 = 2,4 = 2.4; 2√3 = √12) but never rounded decimals
// (3,46 ≠ 2√3) — rounding is only accepted when the item's answer itself is a decimal.
import { displayOrder } from "./shuffle.ts";

/** S5 C2: the lines that must come before line i — `after`, or by default the previous line. */
export function afterOf(lines: { after?: number[] }[], i: number): number[] {
  return lines[i].after ?? (i === 0 ? [] : [i - 1]);
}

/** Normalise what a student types on a phone or laptop keyboard. */
function normalise(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/căn|sqrt|v(?=\(|\d)/g, "√")
    .replace(/[−–]/g, "-")
    .replace(/,/g, ".")
    .replace(/[·×*](?=√)/g, "") // 2·√3 → 2√3
    .replace(/:/g, "/");
}

const NUM = String.raw`\d+(?:\.\d+)?`;
const TERM = new RegExp(String.raw`^(${NUM})?(?:√(?:(${NUM})|\((${NUM})\)))?$`);

function term(s: string): number | null {
  if (!s) return null;
  const m = TERM.exec(s);
  if (!m) return null;
  const [, coef, rad1, rad2] = m;
  const rad = rad1 ?? rad2;
  if (coef === undefined && rad === undefined) return null;
  const c = coef === undefined ? 1 : Number(coef);
  const r = rad === undefined ? 1 : Math.sqrt(Number(rad));
  return c * r;
}

/** Parse "12", "-4,8", "12/5", "2√3", "√(12)/2" → number, or null if not understood. */
export function parseAnswer(raw: string): number | null {
  let s = normalise(raw);
  if (!s || s.length > 40) return null;
  let sign = 1;
  if (s.startsWith("-")) {
    sign = -1;
    s = s.slice(1);
  }
  const parts = s.split("/");
  if (parts.length > 2) return null;
  const num = term(parts[0]);
  if (num === null) return null;
  if (parts.length === 1) return sign * num;
  const den = term(parts[1]);
  if (den === null || den === 0) return null;
  return (sign * num) / den;
}

export function sameValue(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

type Mistake = { code: string; feedback: string; review?: string };
type SimpleGradable =
  | { type: "mcq"; correct: number; options: string[]; mistakes?: Record<string, Mistake> }
  | { type: "numeric"; answer: string; mistakes?: (Mistake & { answer: string })[] };
type ProofGradable = { type: "proof"; id: string; bank: string[]; blanks: { correct: number; mistakes?: Record<string, Mistake> }[] };
type OrderGradable = { type: "order"; id: string; lines: { text: string; after?: number[] }[]; distractors: { text: string; code: string; feedback: string }[] };
type StepsGradable = { type: "steps"; steps: { item: SimpleGradable }[] } | { type: "analysis"; steps: { item: SimpleGradable }[] };
type GradableItem = SimpleGradable | StepsGradable | ProofGradable | OrderGradable;

/** LT5: a multi-step answer is the step answers joined by "|" (also S5 analysis levels and C3 blanks). */
export const STEP_SEPARATOR = "|";
/** S5 C2: an order answer = shown positions joined by ",". */
export const ORDER_SEPARATOR = ",";

export type GradeResult = {
  /** false when the input could not be read at all (not counted as an attempt). */
  understood: boolean;
  correct: boolean;
  errorCode?: string;
  feedback?: string;
  /** LT16: the KU to revisit for this mistake (author-chosen). */
  review?: string;
  /** Multi-step items and S5 analysis levels: right / wrong per step. */
  steps?: boolean[];
  /** S5 C3: right / wrong per blank. */
  parts?: boolean[];
  /** S5 C2: the first wrong line (0-based); equals the answer's length when a line is missing. */
  at?: number;
};

const NOT: GradeResult = { understood: false, correct: false };

/**
 * `blanksWrong` (exit test, review): an empty / unreadable step counts as a wrong step instead of
 * making the whole answer unreadable.
 */
export function gradeItem(item: GradableItem, raw: string, opts: { blanksWrong?: boolean } = {}): GradeResult {
  if (item.type === "steps" || item.type === "analysis") {
    const parts = raw.split(STEP_SEPARATOR);
    if (parts.length !== item.steps.length) return { ...NOT };
    const each = item.steps.map((st, i) => gradeSimple(st.item, parts[i]));
    if (!opts.blanksWrong && each.some((g) => !g.understood)) return { ...NOT };
    const ok = each.map((g) => g.understood && g.correct);
    const first = each.find((g) => !(g.understood && g.correct));
    if (!first) return { understood: true, correct: true, steps: ok };
    return { understood: true, correct: false, errorCode: first.errorCode, feedback: first.feedback, review: first.review, steps: ok };
  }
  if (item.type === "proof") return gradeProof(item, raw, opts);
  if (item.type === "order") return gradeOrder(item, raw);
  return gradeSimple(item, raw);
}

/** S5 C3: each part is a shown bank position; mapped back through the same shuffle as the public view. */
function gradeProof(item: ProofGradable, raw: string, opts: { blanksWrong?: boolean }): GradeResult {
  const order = displayOrder(item.id, item.bank.length);
  const parts = raw.split(STEP_SEPARATOR);
  if (parts.length !== item.blanks.length) return { ...NOT };
  const picked = parts.map((p) => (/^\d$/.test(p.trim()) && Number(p) < order.length ? order[Number(p)] : null));
  if (picked.every((x) => x === null) || (!opts.blanksWrong && picked.some((x) => x === null))) return { ...NOT };
  const ok = picked.map((x, i) => x === item.blanks[i].correct);
  const first = ok.indexOf(false);
  if (first < 0) return { understood: true, correct: true, parts: ok };
  const k = picked[first];
  const m = k === null ? undefined : item.blanks[first].mistakes?.[String(k)];
  return { understood: true, correct: false, parts: ok, errorCode: m?.code, feedback: m?.feedback, review: m?.review };
}

/** S5 C2: right iff every line is placed once, no distractor, and each line comes after its `after` lines. */
function gradeOrder(item: OrderGradable, raw: string): GradeResult {
  const n = item.lines.length;
  const total = n + item.distractors.length;
  const s = raw.trim();
  if (!s) return { ...NOT };
  const pos = s.split(ORDER_SEPARATOR).map((p) => (/^\d{1,2}$/.test(p.trim()) ? Number(p) : -1));
  if (pos.some((p) => p < 0 || p >= total) || new Set(pos).size !== pos.length) return { ...NOT };
  const order = displayOrder(item.id, total);
  const src = pos.map((p) => order[p]); // < n: a line; ≥ n: distractor (src − n)
  const placedAt = new Map(src.map((v, i) => [v, i]));
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    if (v >= n) {
      const d = item.distractors[v - n];
      return { understood: true, correct: false, at: i, errorCode: d.code, feedback: d.feedback };
    }
    const missing = afterOf(item.lines, v).find((a) => !(placedAt.has(a) && placedAt.get(a)! < i));
    if (missing !== undefined)
      return { understood: true, correct: false, at: i, errorCode: "E09", feedback: `Dòng này cần «${item.lines[missing].text}» đứng trước.` };
  }
  if (src.length < n) return { understood: true, correct: false, at: src.length, errorCode: "E09", feedback: "Lời giải còn thiếu bước — chưa đi tới kết luận." };
  return { understood: true, correct: true };
}

function gradeSimple(item: SimpleGradable, raw: string): GradeResult {
  if (item.type === "mcq") {
    if (!/^\d$/.test(raw.trim())) return { understood: false, correct: false };
    const i = Number(raw.trim());
    if (i >= item.options.length) return { understood: false, correct: false };
    if (i === item.correct) return { understood: true, correct: true };
    const m = item.mistakes?.[String(i)];
    return { understood: true, correct: false, errorCode: m?.code, feedback: m?.feedback, review: m?.review };
  }
  const v = parseAnswer(raw);
  if (v === null) return { understood: false, correct: false };
  const want = parseAnswer(item.answer);
  if (want !== null && sameValue(v, want)) return { understood: true, correct: true };
  const m = item.mistakes?.find((x) => {
    const w = parseAnswer(x.answer);
    return w !== null && sameValue(v, w);
  });
  return { understood: true, correct: false, errorCode: m?.code, feedback: m?.feedback, review: m?.review };
}
