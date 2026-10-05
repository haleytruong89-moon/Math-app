// The roadmap (LT1): content/curriculum.json must match docs/CURRICULUM.md and the content files.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Curriculum, checkCurriculum } from "./curriculum.ts";
import { Module, Unit } from "./schema.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const curriculum = Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/curriculum.json"), "utf8")));

/** Unit ids listed in the KU tables of CURRICULUM.md §2. */
function idsInDoc(): string[] {
  const md = fs.readFileSync(path.join(repo, "docs/CURRICULUM.md"), "utf8");
  const sec = md.slice(md.indexOf("## 2. Bảng KU đầy đủ"), md.indexOf("## 3."));
  return sec
    .split("\n")
    .filter((l) => /^\| (\d+|—) \| [a-z0-9-]+ \|/.test(l))
    .map((l) => l.split("|")[2].trim());
}

function files() {
  const dir = path.join(repo, "content");
  const mods = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory());
  return mods.map((m) => {
    const mod = Module.parse(JSON.parse(fs.readFileSync(path.join(dir, m, "module.json"), "utf8")));
    return { mod, units: mod.units.map((u) => Unit.parse(JSON.parse(fs.readFileSync(path.join(dir, m, `${u}.json`), "utf8")))) };
  });
}

test("curriculum lists exactly the 50 KUs of CURRICULUM.md", () => {
  const doc = idsInDoc();
  assert.equal(doc.length, 50);
  assert.deepEqual(curriculum.units.map((u) => u.id).sort(), [...doc].sort());
});

test("curriculum is consistent (ids, seq, prerequisites, modules, test-out) and matches the content files", () => {
  assert.deepEqual(checkCurriculum(curriculum, files()), []);
});

test("checkCurriculum catches the mistakes the roadmap can contain", () => {
  const base = structuredClone(curriculum);
  const u = (id: string) => base.units.find((x) => x.id === id)!;
  const bad = structuredClone(base);
  bad.units.find((x) => x.id === "f1-pnt")!.prereq = ["f1-hdt", "nope"];
  bad.units.find((x) => x.id === "f1-hdt")!.prereq = ["f1-pnt"]; // cycle f1-hdt ↔ f1-pnt
  bad.units.find((x) => x.id === "a-bieudo")!.seq = u("a-tanso").seq; // duplicate seq in track B
  bad.units.find((x) => x.id === "c-dkxd")!.testOut = true; // track A, not backfill
  bad.units.find((x) => x.id === "j-coban")!.module = "no-such-module";
  const errs = checkCurriculum(bad, files()).join("\n");
  assert.match(errs, /f1-pnt: tiên quyết "nope" không có/);
  assert.match(errs, /vòng/);
  assert.match(errs, /seq .* trùng trong track B/);
  assert.match(errs, /c-dkxd: testOut chỉ cho track B hoặc module backfill/);
  assert.match(errs, /j-coban: module "no-such-module" không có/);
  // a KU file that is not in the curriculum
  const extra = [...files(), { mod: { id: "x", title: "x", domains: ["A"], units: ["zz-1"] }, units: [{ id: "zz-1", module: "x", title: "Z" } as never] }];
  assert.match(checkCurriculum(base, extra).join("\n"), /zz-1: có file nhưng không có trong curriculum/);
});
