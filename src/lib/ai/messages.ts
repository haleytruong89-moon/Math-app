// S8: the Anthropic Messages API request and response, pure (the fetch lives in client.ts).
import { z } from "zod";
import type { AiModel } from "./rules.ts";

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";

export type AiRequest = { model: AiModel; system: string; user: string; maxTokens: number };
export type AiResponse = { text: string; inputTokens: number; outputTokens: number };

export function requestBody(r: AiRequest) {
  return { model: r.model, max_tokens: r.maxTokens, system: r.system, messages: [{ role: "user" as const, content: r.user }] };
}

const Resp = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  usage: z.object({ input_tokens: z.number().int().min(0), output_tokens: z.number().int().min(0) }),
});

export function parseResponse(json: unknown): AiResponse | null {
  const r = Resp.safeParse(json);
  if (!r.success) return null;
  return {
    text: r.data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join(""),
    inputTokens: r.data.usage.input_tokens,
    outputTokens: r.data.usage.output_tokens,
  };
}
