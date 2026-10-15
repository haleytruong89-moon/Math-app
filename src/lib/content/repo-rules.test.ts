// Repo-wide rules that were broken by hand before (see docs/PROGRESS.md 13/10/2026): fail loudly instead.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "../../..");

test("migration numbers are unique (CLAUDE.md: numbers are global across branches)", () => {
  const files = fs.readdirSync(path.join(repo, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
  const nums = files.map((f) => {
    const m = /^(\d{4})_/.exec(f);
    assert.ok(m, `migration file name must start with a 4-digit number: ${f}`);
    return Number(m[1]);
  });
  assert.equal(new Set(nums).size, nums.length, `duplicate migration number in: ${files.join(", ")}`);
});

test("PROGRESS.md open-question numbers are unique", () => {
  const md = fs.readFileSync(path.join(repo, "docs/PROGRESS.md"), "utf8");
  const open = md.slice(md.indexOf("### Câu hỏi đang mở"), md.indexOf("\n---", md.indexOf("### Câu hỏi đang mở")));
  const ids = [...open.matchAll(/^\| (Q\d+) \|/gm)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `duplicate open question id in PROGRESS.md: ${ids.join(", ")}`);
});
