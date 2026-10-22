import { test } from "node:test";
import assert from "node:assert/strict";
import { BRIEF_SYSTEM, WEEKLY_SYSTEM, briefUser, promptVersion } from "./prompts.ts";

test("prompt versions: 12 hex, change with the text", () => {
  assert.match(promptVersion(WEEKLY_SYSTEM), /^[0-9a-f]{12}$/);
  assert.notEqual(promptVersion(WEEKLY_SYSTEM), promptVersion(BRIEF_SYSTEM));
});

test("prompts keep the markers the e2e fake relies on, and send no name", () => {
  assert.ok(WEEKLY_SYSTEM.includes("«Nhận xét»"));
  assert.ok(BRIEF_SYSTEM.includes("chuẩn bị buổi dạy"));
  const u = briefUser({ since: "2026-10-15", today: "2026-10-22", units: [], homework: { open: 0, toReview: 0 } });
  assert.ok(u.includes('{"since":"2026-10-15"'));
  assert.ok(!/Nguyên|Hạnh/.test(u));
});
