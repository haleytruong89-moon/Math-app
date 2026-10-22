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

test("curriculum lists exactly the 52 KUs of CURRICULUM.md (LT17, LT19, LT21)", () => {
  const doc = idsInDoc();
  assert.equal(doc.length, 52);
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

test("generated registry is up to date (run `npm run content:index`)", async () => {
  const { render, OUT } = await import("../../../scripts/content-index.mjs");
  const onDisk = fs.readFileSync(OUT, "utf8").replace(/\r\n/g, "\n");
  assert.equal(onDisk, render("content"), "src/lib/content/registry.generated.ts is stale or was generated from fixtures");
});

test("LT17: each KU's priority matches CURRICULUM.md; no core (P0/P1) KU depends on a P2 KU", () => {
  const md = fs.readFileSync(path.join(repo, "docs/CURRICULUM.md"), "utf8");
  const sec = md.slice(md.indexOf("## 2. Bảng KU đầy đủ"), md.indexOf("## 3."));
  const doc = new Map(sec.split("\n").filter((l) => /^\| (\d+|—) \| [a-z0-9-]+ \|/.test(l)).map((l) => [l.split("|")[2].trim(), l.split("|")[7].trim()]));
  for (const u of curriculum.units) assert.equal(u.priority, doc.get(u.id), `${u.id} priority`);
  const c = structuredClone(curriculum);
  c.units.find((u) => u.priority === "P0")!.prereq.push(c.units.find((u) => u.priority === "P2")!.id);
  assert.match(checkCurriculum(c, files()).join(), /phụ thuộc bài P2/);
});

test("S4b: phases and milestones are checked (P2 has no phase, prerequisites not later, due = last phase end)", () => {
  const bad = structuredClone(curriculum);
  bad.units.find((x) => x.id === "j-cung")!.phase = 2; // P2
  bad.units.find((x) => x.id === "c-dkxd")!.phase = null; // core
  bad.units.find((x) => x.id === "f1-hdt")!.phase = 3; // f1-pnt (phase 1) needs it
  bad.milestones[0].due = "2027-03-01";
  bad.milestones[0].mustSolid.push("o-nangcao"); // phase 4, not in 8.5
  const errs = checkCurriculum(bad, files()).join("\n");
  assert.match(errs, /j-cung: bài P2 không có giai đoạn/);
  assert.match(errs, /c-dkxd: bài lõi phải có giai đoạn/);
  assert.match(errs, /f1-pnt: giai đoạn 1 trước tiên quyết f1-hdt/);
  assert.match(errs, /mốc 8.5: hạn 2027-03-01 phải là ngày cuối giai đoạn 3/);
  assert.match(errs, /mốc 8.5: bài "o-nangcao" không thuộc/);
});

test("S4b: phases match CURRICULUM.md §3.3 (43 core KUs: 19 / 13 / 6 / 5)", () => {
  const n = (k: number) => curriculum.units.filter((u) => u.phase === k).length;
  assert.deepEqual([n(1), n(2), n(3), n(4)], [19, 13, 6, 5]);
  assert.deepEqual(curriculum.phases.map((p) => p.to), ["2026-11-22", "2027-01-10", "2027-02-21", "2027-03-31"]);
});
