import "server-only";
import { ANTHROPIC_URL, ANTHROPIC_VERSION, parseResponse, requestBody, type AiRequest, type AiResponse } from "./messages";
import { AI_RULES } from "./rules";

// S8: the only place that reads ANTHROPIC_API_KEY (set on Vercel by the parent). Never log the key or the prompt.

export function hasAiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** One Messages API call. Never throws: null on a missing key, an HTTP error, a timeout or an odd response. */
export async function callClaude(req: AiRequest): Promise<AiResponse | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify(requestBody(req)),
      signal: AbortSignal.timeout(AI_RULES.timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("callClaude: HTTP", res.status);
      return null;
    }
    return parseResponse(await res.json());
  } catch (e) {
    console.error("callClaude:", e instanceof Error ? e.name : "error");
    return null;
  }
}
