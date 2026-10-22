// S8: the server's checks on AI text before anyone sees it (AI_TUTOR.md §4 layer 3, §5). Pure.
import { AI_RULES } from "./rules.ts";

const NUM = /\d+(?:[.,]\d+)?/g;

/** Every number written in a text, normalised: "2,50" → "2.5", "007" → "7". */
export function numbersIn(text: string): string[] {
  return (text.match(NUM) ?? []).map((n) => String(Number(n.replace(",", "."))));
}

/** The numbers any of these values contain (non-strings are read as JSON). */
export function allowedNumbers(...sources: unknown[]): Set<string> {
  const out = new Set<string>();
  for (const s of sources) for (const n of numbersIn(typeof s === "string" ? s : (JSON.stringify(s) ?? ""))) out.add(n);
  return out;
}

/** Numbers in `text` that are neither in `allowed` nor a small integer (≤ smallMax). Each once, in order. */
export function unknownNumbers(text: string, allowed: Set<string>, smallMax: number = AI_RULES.smallNumberMax): string[] {
  return [...new Set(numbersIn(text))].filter((n) => !allowed.has(n) && !(Number.isInteger(Number(n)) && Number(n) <= smallMax));
}

export function bannedWords(text: string): string[] {
  const t = text.toLowerCase();
  return AI_RULES.bannedWords.filter((w) => t.includes(w));
}

/** The JSON object inside a reply (models sometimes add code fences or a sentence): first "{" to last "}". */
export function jsonPart(raw: string): string {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  return a >= 0 && b > a ? raw.slice(a, b + 1) : "";
}

export type Check<T> = { ok: true; value: T } | { ok: false; reasons: string[] };
export type Generated<T> = { status: "ok"; value: T; model: string } | { status: "failed"; reasons: string[] } | { status: "off" };

/**
 * Ask, check, ask once more if the check fails (spec §2). `gen` returns null when AI is off, over budget or the
 * call failed: on the first try that is "off"; after a failed check it stays "failed".
 */
export async function generateChecked<T>(
  gen: () => Promise<{ text: string; model: string } | null>,
  check: (text: string) => Check<T>,
  tries = 2,
): Promise<Generated<T>> {
  let reasons: string[] = [];
  for (let i = 0; i < tries; i++) {
    const r = await gen();
    if (!r) return i === 0 ? { status: "off" } : { status: "failed", reasons };
    const c = check(r.text);
    if (c.ok) return { status: "ok", value: c.value, model: r.model };
    reasons = c.reasons;
  }
  return { status: "failed", reasons };
}
