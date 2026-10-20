// H2: an approved item's grading key can't change under the students' recorded answers.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { checkLock, itemHash, updateLock, type Lock } from "./lock.ts";

const root = path.resolve(import.meta.dirname, "../../../content");

function contentUnits() {
  const units = [];
  for (const dir of fs.readdirSync(root).sort()) {
    const mdir = path.join(root, dir);
    if (!fs.statSync(mdir).isDirectory()) continue;
    for (const f of fs.readdirSync(mdir).sort())
      if (f.endsWith(".json") && f !== "module.json") units.push(JSON.parse(fs.readFileSync(path.join(mdir, f), "utf8")));
  }
  return units;
}

test("approved items still grade exactly as when they were locked (content/approved.lock.json)", () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, "approved.lock.json"), "utf8")) as Lock;
  const problems = checkLock(contentUnits(), lock);
  const msg = problems
    .map((p) =>
      p.kind === "unlocked"
        ? `${p.itemId}: bài đã duyệt có câu chưa khoá → chạy \`npm run content:lock\``
        : `${p.itemId}: câu đã duyệt bị ${p.kind === "changed" ? "đổi đáp án / phương án" : "xoá"} — lịch sử làm bài của con sẽ sai. Tạo câu mới (id mới) thay vì sửa; chỉ sửa chữ của phương án thì \`npm run content:lock -- --relock ${p.itemId}\``,
    )
    .join("\n");
  assert.equal(problems.length, 0, msg);
});

const mcq = (id: string, options: string[], correct: number) => ({ id, type: "mcq" as const, options, correct });
const unit = (status: string, practice: ReturnType<typeof mcq>[]) => ({ id: "u", status, faded: { steps: [{ text: "x" }] }, practice, exit: [] });

test("lock: reordering options or moving the right one is caught; wording elsewhere is not hashed", () => {
  const before = unit("approved", [mcq("u-p1", ["A", "B", "C"], 1)]);
  const lock = updateLock([before], { units: {} });
  assert.deepEqual(checkLock([before], lock), []);
  assert.deepEqual(checkLock([unit("approved", [mcq("u-p1", ["B", "A", "C"], 0)])], lock).map((p) => p.kind), ["changed"]);
  assert.deepEqual(checkLock([unit("approved", [mcq("u-p1", ["A", "B", "C"], 2)])], lock).map((p) => p.kind), ["changed"]);
  const reworded = { ...before, practice: [{ ...mcq("u-p1", ["A", "B", "C"], 1), prompt: "new wording", solution: "new" }] };
  assert.deepEqual(checkLock([reworded], lock), []);
});

test("lock: removed and new items; drafts are not locked; relock is explicit", () => {
  const lock = updateLock([unit("approved", [mcq("u-p1", ["A", "B"], 0)])], { units: {} });
  assert.deepEqual(checkLock([unit("approved", [])], lock).map((p) => p.kind), ["removed"]);
  const added = unit("approved", [mcq("u-p1", ["A", "B"], 0), mcq("u-p2", ["C", "D"], 1)]);
  assert.deepEqual(checkLock([added], lock).map((p) => [p.kind, p.itemId]), [["unlocked", "u-p2"]]);
  assert.deepEqual(checkLock([added], updateLock([added], lock)), []);
  assert.deepEqual(updateLock([unit("draft", [mcq("u-p1", ["A", "B"], 0)])], { units: {} }), { units: {} });
  // A changed item stays refused after a plain update; --relock accepts it.
  const fixed = unit("approved", [mcq("u-p1", ["A.", "B"], 0)]);
  assert.equal(checkLock([fixed], updateLock([fixed], lock)).length, 1);
  assert.deepEqual(checkLock([fixed], updateLock([fixed], lock, new Set(["u-p1"]))), []);
  assert.notEqual(itemHash(mcq("x", ["A", "B"], 0)), itemHash(mcq("x", ["A", "B"], 1)));
});
