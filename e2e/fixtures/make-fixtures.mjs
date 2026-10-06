// Builds the e2e fixture content set (S6a): 7 approved fake KUs + their own curriculum.json.
// Every numeric answer is the item's number (practice p3 → "3", exit x2 → "2"), so flows can
// answer right or wrong without reading files. Run: node e2e/fixtures/make-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "content");
const item = (id, n, level = "L1") => ({ id, type: "numeric", level, prompt: `Câu thử: nhập số $${n}$.`, answer: String(n), solution: `Đáp án là $${n}$.` });
// fc-1 has a standard exit bank of 8 (2 L1 + 3 L2 + 3 L3, LT13); the others keep 5 items, used whole.
const BANK8 = ["L1", "L1", "L2", "L2", "L2", "L3", "L3", "L3"];
const unit = (id, module, order, title) => ({
  id, module, order, title, status: "approved", approvedOn: "2026-10-05", estMinutes: 10,
  theory: [`Lý thuyết thử của ${title}.`],
  worked: { problem: "Bài mẫu thử.", steps: [{ text: "Bước 1." }, { text: "Bước 2." }], selfExplain: "Vì sao?" },
  faded: { problem: "Bài điền bước thử.", steps: [{ text: "Bước đầu." }, { prompt: "Điền số 7.", item: item(`${id}-f1`, 7) }] },
  practice: [1, 2, 3, 4, 5].map((n) => item(`${id}-p${n}`, n, n > 3 ? "L2" : "L1")),
  exit: id === "fc-1" ? BANK8.map((lvl, i) => item(`${id}-x${i + 1}`, i + 1, lvl)) : [1, 2, 3, 4, 5].map((n) => item(`${id}-x${n}`, n)),
});
const modules = [
  { id: "fx-alg", title: "Đại số thử", domains: ["C"], units: [["fa-1", "Đại số thử 1"], ["fa-2", "Đại số thử 2"]] },
  { id: "backfill-fx", title: "Bù lỗ hổng thử", domains: ["F1"], units: [["fz-1", "Bù lỗ hổng thử 1"]] },
  { id: "fx-quick", title: "Ghi điểm thử", domains: ["A"], units: [["fb-1", "Ghi điểm thử 1"], ["fb-2", "Ghi điểm thử 2"], ["fb-3", "Ghi điểm thử 3"]] },
  { id: "fx-geo", title: "Hình học thử", domains: ["J"], units: [["fc-1", "Hình học thử 1"], ["fc-9", "Học thêm thử"]] },
];
fs.rmSync(root, { recursive: true, force: true });
for (const m of modules) {
  fs.mkdirSync(path.join(root, m.id), { recursive: true });
  fs.writeFileSync(path.join(root, m.id, "module.json"), JSON.stringify({ id: m.id, title: m.title, domains: m.domains, units: m.units.map(([u]) => u) }, null, 2) + "\n");
  m.units.forEach(([u, t], i) => fs.writeFileSync(path.join(root, m.id, `${u}.json`), JSON.stringify(unit(u, m.id, i + 1, t), null, 2) + "\n"));
}
const C = (id, module, title, track, seq, batch, prereq = [], testOut = false, priority = "P0") => ({ id, module, title, track, seq, prereq, examWeight: 0.5, grading: "full", testOut, batch, priority });
const curriculum = {
  start: "2026-10-12",
  learnBy: "2027-03-31",
  modules: modules.map(({ id, title, domains }) => ({ id, title, domains })).concat([{ id: "fx-later", title: "Chưa soạn thử", domains: ["Q"] }]),
  units: [
    C("fz-1", "backfill-fx", "Bù lỗ hổng thử 1", "A", 10, 1, [], true),
    C("fa-1", "fx-alg", "Đại số thử 1", "A", 20, 1, ["fz-1"]),
    C("fa-2", "fx-alg", "Đại số thử 2", "A", 30, 1, ["fa-1"]),
    C("fb-1", "fx-quick", "Ghi điểm thử 1", "B", 10, 1, [], true),
    C("fb-2", "fx-quick", "Ghi điểm thử 2", "B", 20, 1, ["fb-1"], true),
    C("fb-3", "fx-quick", "Ghi điểm thử 3", "B", 30, 2, [], true),
    C("fc-1", "fx-geo", "Hình học thử 1", "C", 10, 1),
    C("fc-9", "fx-geo", "Học thêm thử", "C", 5, 1, [], false, "P2"), // LT17: lower seq than fc-1, still waits for it
    C("fl-1", "fx-later", "Bài chưa soạn thử", "A", 40, 9, ["fa-2"]),
  ],
};
fs.writeFileSync(path.join(root, "curriculum.json"), JSON.stringify(curriculum, null, 2) + "\n");
console.log("fixtures written");
