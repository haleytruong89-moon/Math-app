import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteImpact, nameMatches } from "./rules.ts";

test("delete confirmation: the typed name must match the student's name", () => {
  assert.equal(nameMatches("Hạnh Nguyên", "Hạnh Nguyên"), true);
  assert.equal(nameMatches("  hạnh   nguyên ", "Hạnh Nguyên"), true); // spaces and case don't matter
  assert.equal(nameMatches("Hạnh Nguyên", "Hạnh Nguyên"), true); // decomposed Vietnamese (NFD) still matches
  assert.equal(nameMatches("Hanh Nguyen", "Hạnh Nguyên"), false); // diacritics do matter
  assert.equal(nameMatches("", "Hạnh Nguyên"), false);
  assert.equal(nameMatches(null, "Hạnh Nguyên"), false);
});

test("delete impact line lists only what exists", () => {
  assert.equal(deleteImpact({ attempts: 37, sessions: 2, homework: 0, hasLogin: true }), "Sẽ xoá vĩnh viễn: 37 câu đã làm, 2 buổi dạy, tài khoản đăng nhập.");
  assert.equal(deleteImpact({ attempts: 0, sessions: 0, homework: 1, hasLogin: false }), "Sẽ xoá vĩnh viễn: 1 bài về nhà.");
  assert.equal(deleteImpact({ attempts: 0, sessions: 0, homework: 0, hasLogin: false }), "Hồ sơ này chưa có dữ liệu học.");
});
