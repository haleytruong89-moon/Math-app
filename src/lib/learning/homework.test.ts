import { test } from "node:test";
import assert from "node:assert/strict";
import { dueLabel, isDriveLink, parseHomework, readHomeworkForm, reviewNote, visibleHomework, type HomeworkRow, type RawHomework } from "./homework.ts";

const ctx = { taughtOn: "2026-10-05", today: "2026-10-05", ticked: new Set(["htl-1"]) };
const raw = (p: Partial<RawHomework>): RawHomework => ({ unit: "htl-1", task: "Làm bài 3 trang 72", links: [], due: "2026-10-08", ...p });

test("form fields hw.<i>.* are read in index order, links repeated", () => {
  const fd = new FormData();
  fd.append("hw.1.task", "B"); fd.append("hw.1.unit", ""); fd.append("hw.1.due", "2026-10-09");
  fd.append("hw.0.task", "A"); fd.append("hw.0.unit", "htl-1"); fd.append("hw.0.due", "2026-10-08");
  fd.append("hw.0.link", "https://drive.google.com/a"); fd.append("hw.0.link", "");
  fd.append("note", "not homework");
  assert.deepEqual(readHomeworkForm(fd), [
    { unit: "htl-1", task: "A", links: ["https://drive.google.com/a", ""], due: "2026-10-08" },
    { unit: "", task: "B", links: [], due: "2026-10-09" },
  ]);
});

test("valid homework: trimmed, blank links dropped, 'Khác' = null unit, CRLF counts once", () => {
  const r = parseHomework([raw({ task: "  dòng 1\r\ndòng 2 ", links: [" https://drive.google.com/a ", ""] }), raw({ unit: "" })], ctx);
  assert.deepEqual(r, {
    ok: true,
    value: [
      { unitId: "htl-1", task: "dòng 1\ndòng 2", links: ["https://drive.google.com/a"], dueOn: "2026-10-08" },
      { unitId: null, task: "Làm bài 3 trang 72", links: [], dueOn: "2026-10-08" },
    ],
  });
});

test("a completely blank row is ignored", () => {
  assert.deepEqual(parseHomework([raw({ task: " ", links: ["", ""] })], ctx), { ok: true, value: [] });
});

test("refusals name the homework row", () => {
  const err = (r: ReturnType<typeof parseHomework>) => (r.ok ? "" : r.error);
  assert.match(err(parseHomework([raw({}), raw({ task: "", links: ["https://drive.google.com/a"] })], ctx)), /Bài về nhà 2: ghi yêu cầu/);
  assert.match(err(parseHomework([raw({ task: "x".repeat(301) })], ctx)), /tối đa 300/);
  assert.match(err(parseHomework([raw({ unit: "htl-2" })], ctx)), /chọn một bài đã tick/);
  assert.match(err(parseHomework([raw({ links: ["http://drive.google.com/a"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["javascript:alert(1)"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["https://a b"] })], ctx)), /https:\/\//);
  assert.match(err(parseHomework([raw({ links: ["https://a", "https://b", "https://c", "https://d"] })], ctx)), /tối đa 3 link/);
  assert.match(err(parseHomework([raw({ due: "2026-10-04" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework([raw({ due: "2026-11-05" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework([raw({ due: "2026-02-30" })], ctx)), /hạn làm/);
  assert.match(err(parseHomework(Array.from({ length: 6 }, () => raw({})), ctx)), /tối đa 5 bài/);
});

test("review note: optional, ≤ 300, CRLF counts once", () => {
  assert.deepEqual(reviewNote(null), { ok: true, value: null });
  assert.deepEqual(reviewNote("  "), { ok: true, value: null });
  assert.deepEqual(reviewNote(`${"x".repeat(149)}\r\n${"x".repeat(150)}`), { ok: true, value: `${"x".repeat(149)}\n${"x".repeat(150)}` });
  assert.equal(reviewNote("x".repeat(301)).ok, false);
});

test("Drive link detection", () => {
  assert.equal(isDriveLink("https://drive.google.com/file/d/abc/view"), true);
  assert.equal(isDriveLink("https://docs.google.com/document/d/abc"), true);
  assert.equal(isDriveLink("https://example.com/de.pdf"), false);
  assert.equal(isDriveLink("https://drive.google.com.evil.io/x"), false);
});

test("due labels in Vietnamese", () => {
  assert.equal(dueLabel("2026-10-05", "2026-10-05"), "hạn hôm nay");
  assert.equal(dueLabel("2026-10-06", "2026-10-05"), "hạn ngày mai");
  assert.equal(dueLabel("2026-10-08", "2026-10-05"), "hạn thứ Năm 08/10");
  assert.equal(dueLabel("2026-10-11", "2026-10-05"), "hạn Chủ nhật 11/10");
  assert.equal(dueLabel("2026-10-03", "2026-10-05"), "quá hạn (03/10)");
});

test("reviewed homework stays visible for 7 days", () => {
  const row = (reviewed_at: string | null): HomeworkRow => ({ id: reviewed_at ?? "open", task: "x", links: [], due_on: "2026-10-08", done_at: null, reviewed_at, review_note: null });
  const now = new Date("2026-10-20T12:00:00Z");
  const rows = [row(null), row("2026-10-14T12:00:00Z"), row("2026-10-12T12:00:00Z")];
  assert.deepEqual(visibleHomework(rows, now).map((r) => r.id), ["open", "2026-10-14T12:00:00Z"]);
});
