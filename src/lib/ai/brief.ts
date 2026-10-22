// S8a: the tutor's pre-session brief (spec §5.2). Pure. AI may only point at KUs that had wrong answers.
import { z } from "zod";
import { errorLabel } from "../content/errors.ts";
import { addDays, vnDate, type AttemptRow, type Level } from "../learning/rules.ts";
import { commonErrors } from "../learning/work.ts";
import { allowedNumbers, bannedWords, jsonPart, unknownNumbers, type Check } from "./guard.ts";
import { AI_RULES } from "./rules.ts";

export const BRIEF_LOOKBACK_DAYS = 14;

/** From this tutor's last logged session (that day included), or 14 days back. */
export function briefSince(lastSession: string | null, today: string): string {
  return lastSession ?? addDays(today, -BRIEF_LOOKBACK_DAYS);
}

export type BriefUnit = { id: string; title: string; level: Level; answers: number; wrong: number; errors: { code: string; label: string; count: number }[] };
export type BriefFacts = { since: string; today: string; units: BriefUnit[]; homework: { open: number; toReview: number } };
export type BriefPoint = { unit: string; text: string };

export type BriefInput = {
  since: string;
  today: string;
  units: { id: string; title: string; level: Level; attempts: AttemptRow[] }[];
  homework: { done_at: string | null; reviewed_at: string | null }[];
};

export function briefFacts(input: BriefInput): BriefFacts {
  const units = input.units
    .map((u) => {
      const recent = u.attempts.filter((a) => a.mode !== "faded" && vnDate(a.created_at) >= input.since);
      const wrong = recent.filter((a) => !a.correct);
      return {
        id: u.id,
        title: u.title,
        level: u.level,
        answers: recent.length,
        wrong: wrong.length,
        errors: commonErrors(wrong, 1)
          .slice(0, 3)
          .map((e) => ({ code: e.code, label: errorLabel(e.code) ?? e.code, count: e.count })),
      };
    })
    .filter((u) => u.answers > 0)
    .sort((a, b) => b.wrong - a.wrong || b.answers - a.answers)
    .slice(0, 8);
  return {
    since: input.since,
    today: input.today,
    units,
    homework: {
      open: input.homework.filter((h) => !h.done_at && !h.reviewed_at).length,
      toReview: input.homework.filter((h) => !!h.done_at && !h.reviewed_at).length,
    },
  };
}

const BriefJson = z.object({ points: z.array(z.object({ unit: z.string(), text: z.string() })) });

export function checkBrief(raw: string, facts: BriefFacts): Check<BriefPoint[]> {
  let points: BriefPoint[];
  try {
    const p = BriefJson.safeParse(JSON.parse(jsonPart(raw)));
    if (!p.success) return { ok: false, reasons: ["JSON sai dạng"] };
    points = p.data.points.map((x) => ({ unit: x.unit, text: x.text.trim() }));
  } catch {
    return { ok: false, reasons: ["không đọc được JSON"] };
  }
  const wrongUnits = new Set(facts.units.filter((u) => u.wrong > 0).map((u) => u.id));
  const allowed = allowedNumbers(facts);
  const reasons: string[] = [];
  if (points.length < 1 || points.length > AI_RULES.briefPointsMax) reasons.push(`cần 1–${AI_RULES.briefPointsMax} điểm`);
  for (const p of points) {
    if (!wrongUnits.has(p.unit)) reasons.push(`bài không có câu sai: ${p.unit}`);
    if (!p.text || p.text.length > AI_RULES.briefPointMaxChars) reasons.push(`điểm trống hoặc quá dài (${p.unit})`);
    const unknown = unknownNumbers(p.text, allowed);
    if (unknown.length) reasons.push(`số không có trong dữ liệu: ${unknown.join(", ")}`);
    const banned = bannedWords(p.text);
    if (banned.length) reasons.push(`từ không dùng: ${banned.join(", ")}`);
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, value: points };
}

/** Shown when AI is off or its points fail the check: always useful, built from the data alone. */
export function fallbackPoints(facts: BriefFacts): BriefPoint[] {
  return facts.units
    .filter((u) => u.wrong > 0)
    .slice(0, AI_RULES.briefPointsMax)
    .map((u) => ({ unit: u.id, text: `${u.title}: ${u.wrong} câu sai${u.errors[0] ? `, hay gặp ${u.errors[0].label}` : ""}.` }));
}
