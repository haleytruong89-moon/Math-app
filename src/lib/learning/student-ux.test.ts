import { test } from "node:test";
import assert from "node:assert/strict";
import { PRAISE, greeting, masteryNudge, practiceNudge, praise, sessionTally } from "./student-ux.ts";

const vn = (h: number) => new Date(`2026-10-05T${String(h).padStart(2, "0")}:30:00+07:00`);

test("greeting by Vietnam hour", () => {
  assert.equal(greeting(vn(7)), "Chào buổi sáng");
  assert.equal(greeting(vn(11)), "Chào buổi chiều");
  assert.equal(greeting(vn(18)), "Chào buổi tối");
  assert.equal(greeting(vn(2)), "Chào buổi tối");
});

test("nudge follows the real mastery rules", () => {
  assert.deepEqual(masteryNudge({ level: 1, practiceCount: 2, practiceRight: 2 }), { text: "Làm thêm 3 câu luyện để hệ thống đánh giá lên M2", progress: { done: 2, total: 5 } });
  assert.deepEqual(masteryNudge({ level: 0, practiceCount: 0, practiceRight: 0 }), { text: "Làm thêm 5 câu luyện để hệ thống đánh giá lên M2", progress: { done: 0, total: 5 } });
  assert.deepEqual(masteryNudge({ level: 1, practiceCount: 5, practiceRight: 2 }), { text: "Cần đúng thêm 1 câu trong 5 câu gần nhất để lên M2", progress: { done: 2, total: 5 } });
  assert.equal(masteryNudge({ level: 2, practiceCount: 5, practiceRight: 3 }).text, "Làm bài kiểm tra cuối để lên M3");
  assert.equal(masteryNudge({ level: 3, practiceCount: 5, practiceRight: 5 }).text, "Qua lượt ôn D+21 để lên M4");
  assert.equal(masteryNudge({ level: 4, practiceCount: 5, practiceRight: 5 }).text, "Đã vững — giữ phong độ khi ôn nhé");
});

test("praise cycles; session tally counts every graded answer", () => {
  assert.equal(praise(0), praise(PRAISE.length));
  assert.notEqual(praise(0), praise(1));
  assert.deepEqual(sessionTally([true, false, true]), { right: 2, total: 3 });
  assert.deepEqual(sessionTally([]), { right: 0, total: 0 });
});

test("fix: no level nudge while a parent-confirmed level is in effect (display only, P2)", () => {
  assert.equal(practiceNudge({ level: 1, practiceCount: 2, practiceRight: 2 }, true), null);
  assert.equal(practiceNudge({ level: 1, practiceCount: 2, practiceRight: 2 }, false)?.text, "Làm thêm 3 câu luyện để hệ thống đánh giá lên M2");
});
