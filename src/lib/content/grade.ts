// Answer parsing and grading. Pure module: used by server actions and by node tests.
// Accepts equivalent exact forms (12/5 = 2,4 = 2.4; 2√3 = √12) but never rounded decimals
// (3,46 ≠ 2√3) — rounding is only accepted when the item's answer itself is a decimal.

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
type GradableItem = SimpleGradable | { type: "steps"; steps: { item: SimpleGradable }[] };

/** LT5: a multi-step answer is the step answers joined by "|". */
export const STEP_SEPARATOR = "|";

export type GradeResult = {
  /** false when the input could not be read at all (not counted as an attempt). */
  understood: boolean;
  correct: boolean;
  errorCode?: string;
  feedback?: string;
  /** LT16: the KU to revisit for this mistake (author-chosen). */
  review?: string;
  /** Multi-step items: right / wrong per step. */
  steps?: boolean[];
};

/**
 * `blanksWrong` (exit test, review): an empty / unreadable step counts as a wrong step instead of
 * making the whole answer unreadable.
 */
export function gradeItem(item: GradableItem, raw: string, opts: { blanksWrong?: boolean } = {}): GradeResult {
  if (item.type === "steps") {
    const parts = raw.split(STEP_SEPARATOR);
    if (parts.length !== item.steps.length) return { understood: false, correct: false };
    const each = item.steps.map((st, i) => gradeSimple(st.item, parts[i]));
    if (!opts.blanksWrong && each.some((g) => !g.understood)) return { understood: false, correct: false };
    const ok = each.map((g) => g.understood && g.correct);
    const first = each.find((g) => !(g.understood && g.correct));
    if (!first) return { understood: true, correct: true, steps: ok };
    return { understood: true, correct: false, errorCode: first.errorCode, feedback: first.feedback, review: first.review, steps: ok };
  }
  return gradeSimple(item, raw);
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
