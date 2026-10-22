import { test } from "node:test";
import assert from "node:assert/strict";
import { allowedNumbers, bannedWords, generateChecked, jsonPart, numbersIn, unknownNumbers, type Check } from "./guard.ts";

test("numbers are read and normalised", () => {
  assert.deepEqual(numbersIn("Con làm 2,50 bài, 007 câu, mốc 8,5 hạn 21/02/2027"), ["2.5", "7", "8.5", "21", "2", "2027"]);
  assert.deepEqual(numbersIn("không có số"), []);
});

test("allowed numbers come from strings and JSON", () => {
  const a = allowedNumbers({ solid: 12, perWeek: 2.5, due: "2027-02-21", title: "Mốc 8,5" }, "lỗi E06");
  for (const n of ["12", "2.5", "2027", "2", "21", "8.5", "6"]) assert.ok(a.has(n), n);
});

test("unknown numbers: not in the data and bigger than 10", () => {
  const a = allowedNumbers({ solid: 12 });
  assert.deepEqual(unknownNumbers("12 bài vững, 3 bài cần chú ý", a), []);
  assert.deepEqual(unknownNumbers("đạt 60% và 12 bài, thêm 15 bài", a), ["60", "15"]);
  assert.deepEqual(unknownNumbers("2,5 bài mỗi tuần", a), ["2.5"]); // decimals are never "small"
});

test("banned words (D17)", () => {
  assert.deepEqual(bannedWords("Con giữ chuỗi 5 ngày"), ["chuỗi"]);
  assert.deepEqual(bannedWords("Con đứng Xếp Hạng nhì"), ["xếp hạng"]);
  assert.deepEqual(bannedWords("Tuần này con học đều"), []);
});

test("JSON part of a reply (code fences, text around)", () => {
  assert.equal(jsonPart('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(jsonPart('Đây: {"a":{"b":2}} xong'), '{"a":{"b":2}}');
  assert.equal(jsonPart("không có"), "");
});

const isShort = (t: string): Check<string> => (t.length <= 5 ? { ok: true, value: t } : { ok: false, reasons: ["dài"] });

test("generateChecked: first passes / second passes / both fail / AI off", async () => {
  const seq = (...xs: (string | null)[]) => {
    let i = 0;
    return async () => {
      const x = xs[i++];
      return x === null ? null : { text: x, model: "claude-haiku-5-5" };
    };
  };
  assert.deepEqual(await generateChecked(seq("ok"), isShort), { status: "ok", value: "ok", model: "claude-haiku-5-5" });
  assert.deepEqual(await generateChecked(seq("quá dài", "ok"), isShort), { status: "ok", value: "ok", model: "claude-haiku-5-5" });
  assert.deepEqual(await generateChecked(seq("quá dài", "vẫn dài"), isShort), { status: "failed", reasons: ["dài"] });
  assert.deepEqual(await generateChecked(seq(null), isShort), { status: "off" });
  assert.deepEqual(await generateChecked(seq("quá dài", null), isShort), { status: "failed", reasons: ["dài"] });
});
