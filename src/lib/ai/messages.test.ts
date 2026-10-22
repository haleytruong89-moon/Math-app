import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTHROPIC_VERSION, parseResponse, requestBody } from "./messages.ts";

test("request body: one user turn, system separate", () => {
  assert.deepEqual(requestBody({ model: "claude-haiku-5-5", system: "S", user: "U", maxTokens: 400 }), {
    model: "claude-haiku-5-5",
    max_tokens: 400,
    system: "S",
    messages: [{ role: "user", content: "U" }],
  });
  assert.equal(ANTHROPIC_VERSION, "2023-06-01");
});

test("response: text blocks joined, usage read; anything else → null", () => {
  const ok = { id: "m", content: [{ type: "text", text: "Xin " }, { type: "text", text: "chào" }], usage: { input_tokens: 12, output_tokens: 3 } };
  assert.deepEqual(parseResponse(ok), { text: "Xin chào", inputTokens: 12, outputTokens: 3 });
  assert.equal(parseResponse({ type: "error", error: { message: "x" } }), null);
  assert.equal(parseResponse(null), null);
});
