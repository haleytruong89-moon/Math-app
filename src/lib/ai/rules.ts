// S8 (AI4): models, prices, the monthly cap and spend maths. Pure, so `node --test` covers it.
// Prices are references of 22/10/2026 (spec §3) — check the official pricing page before switching on.

export const AI_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"] as const;
export type AiModel = (typeof AI_MODELS)[number];
export const isAiModel = (s: unknown): s is AiModel => (AI_MODELS as readonly unknown[]).includes(s);

/** USD per million tokens (prompts ≤ 100k tokens). */
export const PRICES: Record<AiModel, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

export const MODEL_LABEL: Record<AiModel, string> = {
  "claude-haiku-5-5": "Claude Haiku 5.5 (rẻ, nhanh)",
  "claude-sonnet-5-5": "Claude Sonnet 5.5 (tốt hơn, đắt hơn ~20 lần)",
};

export const AI_RULES = {
  monthlyCapUsd: 10, // AI4
  warnRatio: 0.9,
  smallNumberMax: 10, // AI_TUTOR §4 layer 3: small integers may appear in AI text
  weeklyCommentMaxChars: 900,
  briefPointMaxChars: 220,
  briefPointsMax: 3,
  timeoutMs: 25_000,
  bannedWords: ["chuỗi", "xếp hạng", "hạng nhất", "bảng vàng"], // D17: no streaks, no leaderboards
} as const;

/** One call's cost in micro-dollars (µ$), rounded up so the cap is never under-counted. */
export function costMicros(model: AiModel, inputTokens: number, outputTokens: number): number {
  const p = PRICES[model];
  return Math.ceil(inputTokens * p.input + outputTokens * p.output);
}

/** Spend is counted per Vietnam-time month: "YYYY-MM" of a YYYY-MM-DD date. */
export function monthKey(today: string): string {
  return today.slice(0, 7);
}

export type Budget = { spentMicros: number; capMicros: number; ratio: number; warn: boolean; paused: boolean };

export function budget(spentMicros: number, capUsd: number = AI_RULES.monthlyCapUsd): Budget {
  const capMicros = Math.round(capUsd * 1_000_000);
  const ratio = capMicros > 0 ? spentMicros / capMicros : 1;
  return { spentMicros, capMicros, ratio, warn: ratio >= AI_RULES.warnRatio, paused: ratio >= 1 };
}

export function spendByKind(rows: { kind: string; cost_micros: number }[]): { total: number; calls: number; byKind: Record<string, number> } {
  const byKind: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + r.cost_micros;
    total += r.cost_micros;
  }
  return { total, calls: rows.length, byKind };
}

/** "$1,23" (Vietnamese decimal comma); below one cent but not zero → "< $0,01". */
export function usdLabel(micros: number): string {
  if (micros > 0 && micros < 10_000) return "< $0,01";
  return `$${(micros / 1_000_000).toFixed(2).replace(".", ",")}`;
}
