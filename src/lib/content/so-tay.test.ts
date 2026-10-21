// S5: Sổ tay suy ngược — schema and the real file.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SoTay, checkSoTay } from "./so-tay.ts";
import { Curriculum } from "./curriculum.ts";

const repo = path.resolve(import.meta.dirname, "../../..");
const ids = new Set(Curriculum.parse(JSON.parse(fs.readFileSync(path.join(repo, "content/curriculum.json"), "utf8"))).units.map((u) => u.id));
const good = () => ({
  status: "draft",
  goals: [{ id: "noi-tiep", title: "Tứ giác nội tiếp", tip: "Tìm góc vuông.", ways: [{ how: "Tổng hai góc đối 180°", sign: "hai góc vuông đối nhau", units: ["k-tugiacnt"] }] }],
  figures: [{ id: "hai-tt", title: "Điểm ngoài + 2 tiếp tuyến", facts: ["AB = AC"] }],
});

test("so-tay: schema and KU ids", () => {
  assert.deepEqual(checkSoTay(SoTay.parse(good()), ids), []);
  assert.ok(!SoTay.safeParse({ ...good(), status: "approved" }).success, "approved needs approvedOn");
  const bad = good();
  bad.goals[0].ways[0].units = ["nope"];
  assert.match(checkSoTay(SoTay.parse(bad), ids).join(), /nope/);
  const dup = good();
  dup.figures[0].id = "noi-tiep";
  assert.match(checkSoTay(SoTay.parse(dup), ids).join(), /trùng/);
});

test("so-tay: the real file is valid", () => {
  const raw = JSON.parse(fs.readFileSync(path.join(repo, "content/so-tay.json"), "utf8"));
  assert.deepEqual(checkSoTay(SoTay.parse(raw), ids), []);
});
