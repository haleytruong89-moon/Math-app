import { test } from "node:test";
import assert from "node:assert/strict";
import type { AttemptRow } from "../learning/rules.ts";
import { briefFacts, briefSince, checkBrief, fallbackPoints } from "./brief.ts";

const at = (day: string) => `${day}T03:00:00Z`;
const w = (day: string, code: string | null, correct = false): AttemptRow => ({ item_id: "x", mode: "practice", correct, error_code: code, exit_run: null, created_at: at(day) });

const facts = briefFacts({
  since: "2026-10-15",
  today: "2026-10-22",
  units: [
    { id: "c-coban", title: "Căn thức cơ bản", level: 2, attempts: [w("2026-10-10", "E02"), w("2026-10-16", "E02"), w("2026-10-17", "E02"), w("2026-10-17", "E01"), w("2026-10-18", null, true)] },
    { id: "htl-1", title: "Bốn hệ thức lượng: hiểu và nhớ", level: 3, attempts: [w("2026-10-20", "E03"), w("2026-10-20", null, true)] },
    { id: "a-tanso", title: "Tần số", level: 1, attempts: [w("2026-10-01", "E01")] }, // nothing since → left out
  ],
  homework: [{ done_at: null, reviewed_at: null }, { done_at: at("2026-10-21"), reviewed_at: null }, { done_at: at("2026-10-12"), reviewed_at: at("2026-10-13") }],
});

test("since: the tutor's last session, else 14 days back", () => {
  assert.equal(briefSince("2026-10-15", "2026-10-22"), "2026-10-15");
  assert.equal(briefSince(null, "2026-10-22"), "2026-10-08");
});

test("brief facts: KUs answered since, most wrong first, error codes, homework", () => {
  assert.deepEqual(
    facts.units.map((u) => [u.id, u.answers, u.wrong, u.errors.map((e) => `${e.code}×${e.count}`).join(",")]),
    [["c-coban", 4, 3, "E02×2,E01×1"], ["htl-1", 2, 1, "E03×1"]],
  );
  assert.deepEqual(facts.homework, { open: 1, toReview: 1 });
});

test("AI points: JSON, KUs with wrong answers only, numbers from the data, 1–3 points", () => {
  const good = '```json\n{"points":[{"unit":"c-coban","text":"Con sai 3 câu biến đổi (E02): cho làm lại 2 câu đưa thừa số ra ngoài dấu căn."},{"unit":"htl-1","text":"Nhắc lại hệ thức h² = b′c′."}]}\n```';
  const ok = checkBrief(good, facts);
  assert.equal(ok.ok, true);
  assert.equal(ok.ok && ok.value.length, 2);
  const reasons = (raw: string) => {
    const c = checkBrief(raw, facts);
    return c.ok ? "" : c.reasons.join(" | ");
  };
  assert.match(reasons("không phải JSON"), /JSON/);
  assert.match(reasons('{"points":[{"unit":"a-tanso","text":"x"}]}'), /a-tanso/);
  assert.match(reasons('{"points":[{"unit":"c-coban","text":"Con sai 17 câu"}]}'), /17/);
  assert.match(reasons('{"points":[]}'), /1–3/);
  assert.match(reasons(`{"points":[{"unit":"c-coban","text":"${"x".repeat(221)}"}]}`), /dài/);
});

test("fallback points: most wrong first, with the most frequent error", () => {
  assert.deepEqual(fallbackPoints(facts), [
    { unit: "c-coban", text: "Căn thức cơ bản: 3 câu sai, hay gặp E02 — Biến đổi đại số sai." },
    { unit: "htl-1", text: "Bốn hệ thức lượng: hiểu và nhớ: 1 câu sai, hay gặp E03 — Nhớ sai công thức." },
  ]);
});
