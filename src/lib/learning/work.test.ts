import { test } from "node:test";
import assert from "node:assert/strict";
import { commonErrors, durationLabel, workEntries, type WorkAttempt } from "./work.ts";
import type { Item } from "../content/schema.ts";

const mcq: Item = {
  id: "q-mcq", type: "mcq", level: "L1", prompt: "Hình chiếu của $AC$?", options: ["$BH$", "$CH$", "$AH$"], correct: 1,
  mistakes: { "0": { code: "E08", feedback: "Nhầm hình chiếu." } }, solution: "Là $CH$.",
};
const num: Item = {
  id: "q-num", type: "numeric", level: "L1", prompt: "Tính $AB$.", answer: "15", unit: "cm",
  mistakes: [{ answer: "225", code: "E10", feedback: "Còn bước lấy căn bậc hai." }], solution: "$AB = 15$.",
};
const items = new Map([mcq, num].map((i) => [i.id, i]));
const lookup = (id: string) => items.get(id) ?? null;

let n = 0;
const at = (h: number) => new Date(`2026-10-05T${String(h).padStart(2, "0")}:00:00+07:00`).toISOString();
const w = (p: Partial<WorkAttempt>): WorkAttempt => ({
  item_id: "q-num", mode: "practice", correct: true, error_code: null, exit_run: null, created_at: at(8 + n++),
  answer: "15", duration_ms: null, ...p,
});

test("common errors: codes seen at least twice, most frequent first, faded ignored", () => {
  const rows = [
    w({ correct: false, error_code: "E10" }), w({ correct: false, error_code: "E10", mode: "exit" }),
    w({ correct: false, error_code: "E03" }), w({ correct: false, error_code: "E03", mode: "faded" }),
    w({ correct: false, error_code: "E08" }), w({ correct: false, error_code: "E08" }), w({ correct: false, error_code: "E08", mode: "review" }),
  ];
  assert.deepEqual(commonErrors(rows), [{ code: "E08", count: 3 }, { code: "E10", count: 2 }]);
});

test("entries: newest first, wrong-only filter, faded never shown", () => {
  const rows = [
    w({ answer: "225", correct: false, error_code: "E10", created_at: at(9) }),
    w({ answer: "15", created_at: at(10) }),
    w({ mode: "faded", answer: "1", correct: false, created_at: at(11) }),
  ];
  const all = workEntries(rows, lookup, { wrongOnly: false });
  assert.deepEqual(all.map((e) => e.answerHtml), ["15", "225"]);
  const wrong = workEntries(rows, lookup, { wrongOnly: true });
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].laterCorrect, true); // the 10:00 try was right
  assert.match(wrong[0].feedbackHtml ?? "", /Còn bước lấy căn bậc hai/);
  assert.match(wrong[0].correctHtml, /15 cm/);
  assert.equal(wrong[0].errorCode, "E10");
});

test("MCQ answers show the option text; unreadable index and blank answers are labelled", () => {
  const [picked] = workEntries([w({ item_id: "q-mcq", answer: "0", correct: false, error_code: "E08" })], lookup, { wrongOnly: true });
  assert.match(picked.answerHtml, /katex/); // option "$BH$" rendered
  assert.match(picked.feedbackHtml ?? "", /Nhầm hình chiếu/);
  assert.equal(picked.laterCorrect, false);
  const [bad] = workEntries([w({ item_id: "q-mcq", answer: "7", correct: false })], lookup, { wrongOnly: true });
  assert.equal(bad.answerHtml, "(không đọc được)");
  const [blank] = workEntries([w({ mode: "exit", answer: "", correct: false })], lookup, { wrongOnly: true });
  assert.equal(blank.answerHtml, "(bỏ trống)");
});

test("student input is escaped, never rendered as TeX or HTML", () => {
  const [e] = workEntries([w({ answer: "$x$<script>", correct: false })], lookup, { wrongOnly: true });
  assert.equal(e.answerHtml, "$x$&lt;script&gt;");
});

test("items no longer in the content are skipped", () => {
  assert.equal(workEntries([w({ item_id: "gone", correct: false })], lookup, { wrongOnly: true }).length, 0);
});

test("duration label", () => {
  assert.equal(durationLabel(null), null);
  assert.equal(durationLabel(45_000), "45 giây");
  assert.equal(durationLabel(150_000), "3 phút");
});
