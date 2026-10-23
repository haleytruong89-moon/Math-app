import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Unit } from "./schema.ts";
import { LESSON, canonicalJson, fixNote, fixNotesText, splitFixNote, nextToReview, reviewables, shelfStatus, statusOf, studentView, unitReview, type ApprovalRow, type ReviewRow } from "./review.ts";

// b-haib was approved in git on 23/10; the tests use its content as a draft.
const draft = (() => {
  const raw = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../../content/xac-suat/b-haib.json"), "utf8"));
  delete raw.approvedOn;
  return Unit.parse({ ...raw, status: "draft" });
})();
const T = (n: number) => `2026-10-20T0${n}:00:00Z`;
const row = (item_id: string, verdict: "ok" | "fix", r = reviewables(draft).find((x) => x.id === item_id)!, at = T(1)): ReviewRow => ({
  unit_id: draft.id, item_id, verdict, note: verdict === "fix" ? "Đổi số" : null, grading_hash: r.gradingHash, content_hash: r.contentHash, reviewer_id: "t", created_at: at,
});
const okAll = () => reviewables(draft).map((r) => row(r.id, "ok", r));
const approve: ApprovalRow = { unit_id: draft.id, action: "approve", note: null, actor_id: "t", created_at: T(2) };

test("reviewables: lesson block first, then every practice and exit item", () => {
  const rs = reviewables(draft);
  assert.equal(rs[0].id, LESSON);
  assert.equal(rs.length, 1 + draft.practice.length + draft.exit.length);
  assert.ok(rs.every((r) => /^[0-9a-f]{16}$/.test(r.gradingHash) && /^[0-9a-f]{16}$/.test(r.contentHash)));
});

test("status: unseen → ok / fix; a fixed item whose content changed is 'changed'; wording edits keep 'ok'", () => {
  const p1 = draft.practice[0];
  const r = reviewables(draft).find((x) => x.id === p1.id)!;
  assert.equal(statusOf(r, undefined), "unseen");
  assert.equal(statusOf(r, row(p1.id, "ok", r)), "ok");
  assert.equal(statusOf(r, row(p1.id, "fix", r)), "fix");
  const reworded = { ...draft, practice: [{ ...p1, solution: p1.solution + " (sửa)" }, ...draft.practice.slice(1)] } as Unit;
  const r2 = reviewables(reworded).find((x) => x.id === p1.id)!;
  assert.equal(statusOf(r2, row(p1.id, "ok", r)), "ok"); // wording only
  assert.equal(statusOf(r2, row(p1.id, "fix", r)), "changed"); // "Đã sửa, xem lại"
  if (p1.type === "mcq") {
    const regraded = { ...draft, practice: [{ ...p1, correct: (p1.correct + 1) % p1.options.length }, ...draft.practice.slice(1)] } as Unit;
    assert.equal(statusOf(reviewables(regraded).find((x) => x.id === p1.id)!, row(p1.id, "ok", r)), "changed");
  }
});

test("approve rule: lesson ok, nothing unseen/changed, ≥ 4 practice and ≥ 5 exit ok", () => {
  assert.equal(unitReview(draft, [], []).canApprove.ok, false);
  const noLesson = okAll().filter((x) => x.item_id !== LESSON);
  assert.match((unitReview(draft, noLesson, []).canApprove as { reason: string }).reason, /lý thuyết/);
  const oneFix = [...okAll(), row(draft.practice[0].id, "fix", undefined, T(3))]; // later row wins
  const rv = unitReview(draft, oneFix, []);
  assert.equal(rv.canApprove.ok, true);
  assert.equal(rv.counts.fix, 1);
  const tooFew = [...okAll(), ...draft.exit.slice(0, draft.exit.length - 4).map((it) => row(it.id, "fix", undefined, T(3)))];
  assert.match((unitReview(draft, tooFew, []).canApprove as { reason: string }).reason, /kiểm tra/);
});

test("student view: drafts hidden until approved; 'fix' items hidden; git-approved units unchanged", () => {
  assert.equal(studentView(draft, unitReview(draft, okAll(), [])), null);
  const fixId = draft.practice[0].id;
  const v = studentView(draft, unitReview(draft, [...okAll(), row(fixId, "fix", undefined, T(3))], [approve]))!;
  assert.equal(v.status, "approved");
  assert.equal(v.approvedOn, "2026-10-20");
  assert.equal(v.practice.length, draft.practice.length - 1);
  assert.ok(!v.practice.some((i) => i.id === fixId));
  const ret: ApprovalRow = { ...approve, action: "return", created_at: T(4) };
  assert.equal(studentView(draft, unitReview(draft, okAll(), [approve, ret])), null);
  const git = { ...draft, status: "approved", approvedOn: "2026-10-15" } as Unit;
  assert.equal(studentView(git, null), git);
});

test("shelf status, next item to review, notes for Claude", () => {
  assert.equal(shelfStatus(null, null), "none");
  assert.equal(shelfStatus(draft, unitReview(draft, [], [])), "waiting");
  assert.equal(shelfStatus(draft, unitReview(draft, okAll(), [approve])), "approved");
  const changedLesson = { ...draft, faded: { ...draft.faded } } as Unit; // same content: still approved
  assert.equal(shelfStatus(changedLesson, unitReview(changedLesson, okAll(), [approve])), "approved");
  const rv = unitReview(draft, [row(LESSON, "ok")], []);
  assert.equal(nextToReview(rv), draft.practice[0].id);
  assert.equal(nextToReview(rv, draft.practice[0].id), draft.practice[1].id);
  assert.equal(nextToReview(unitReview(draft, okAll(), [])), null);
  assert.equal(
    fixNotesText([{ unitId: "b-haib", unitTitle: "Hai biến cố", itemId: "b-haib-p1", note: "Đổi số", at: "2026-10-20T01:00:00Z" }]),
    "- b-haib (Hai biến cố) / b-haib-p1: Đổi số — 20/10",
  );
});

test("content hash ignores key order (a schema change must not flip every 'fix' to 'changed')", () => {
  assert.equal(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }), canonicalJson({ a: [{ c: 3, d: 2 }], b: 1 }));
  assert.equal(canonicalJson({ a: [2, 1] }) === canonicalJson({ a: [1, 2] }), false); // array order still counts
  const p1 = draft.practice[0];
  const reordered = Object.fromEntries(Object.entries(p1).reverse());
  const r1 = reviewables(draft).find((x) => x.id === p1.id)!;
  const r2 = reviewables({ ...draft, practice: [reordered, ...draft.practice.slice(1)] } as Unit).find((x) => x.id === p1.id)!;
  assert.equal(r1.contentHash, r2.contentHash);
});

test("23/10: git-approved units — a 'Cần sửa' item is hidden until its content changes; a fixed lesson or too few items hide the unit", () => {
  const git = { ...draft, status: "approved", approvedOn: "2026-10-23" } as Unit;
  const gitRow = (id: string, verdict: "ok" | "fix", at = T(1)) => ({ ...row(id, verdict, reviewables(git).find((x) => x.id === id)!, at), unit_id: git.id });
  const fixId = git.practice[0].id;
  assert.equal(studentView(git, unitReview(git, [], [])), git); // no verdicts: whole unit
  const v = studentView(git, unitReview(git, [gitRow(fixId, "fix")], []))!;
  assert.ok(!v.practice.some((i) => i.id === fixId));
  assert.equal(v.practice.length, git.practice.length - 1);
  assert.equal(v.status, "approved");
  assert.equal(shelfStatus(git, unitReview(git, [gitRow(fixId, "fix")], [])), "approved");
  // Claude's fix is merged: the content changed, the item is "changed" and visible again.
  const p1 = git.practice[0];
  const fixed = { ...git, practice: [{ ...p1, prompt: p1.prompt + " (đã sửa)" }, ...git.practice.slice(1)] } as Unit;
  assert.ok(studentView(fixed, unitReview(fixed, [gitRow(fixId, "fix")], []))!.practice.some((i) => i.id === fixId));
  assert.equal(studentView(git, unitReview(git, [gitRow(LESSON, "fix")], [])), null);
  const tooFew = git.exit.slice(0, git.exit.length - 4).map((it) => gitRow(it.id, "fix"));
  assert.equal(studentView(git, unitReview(git, tooFew, [])), null);
  assert.equal(shelfStatus(git, unitReview(git, tooFew, [])), "reapprove");
});

test("23/10: a 'Cần sửa' note carries the reason and how Claude should fix it", () => {
  const n = fixNote(" Phương án C cũng đúng ", "Đổi C thành 2√3 ");
  assert.equal(n, "Lý do: Phương án C cũng đúng — Sửa: Đổi C thành 2√3");
  assert.deepEqual(splitFixNote(n), { reason: "Phương án C cũng đúng", how: "Đổi C thành 2√3" });
  assert.deepEqual(splitFixNote("Đổi số"), { reason: "Đổi số", how: "" }); // notes written before 23/10
  assert.deepEqual(splitFixNote(null), { reason: "", how: "" });
});
