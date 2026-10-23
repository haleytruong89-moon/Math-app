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
// fs-1 (S6b): a 4-step practice item (step 2 has a known mistake → E11 + "Ôn lại" fc-1), hints, an SVG figure,
// a 2-step exit item, and "partial" grading for the tutor badge.
const SVG = '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><title>Tam giác thử</title><path d="M10 50 L90 50 L10 10 Z" fill="none" stroke="currentColor" stroke-width="2"/><text x="4" y="58" fill="var(--muted)">A</text></svg>';
const HINTS = ["Gợi ý một: đề hỏi gì?", "Gợi ý hai: dạng nào?", "Gợi ý ba: dùng công thức nào?"];
const stepsItem = (id, n, level, mistakeAt) => ({
  id, type: "steps", level, prompt: `Câu nhiều bước thử (${n} bước).`,
  steps: Array.from({ length: n }, (_, i) => ({
    prompt: `Bước thử ${i + 1}: nhập số $${i + 1}$.`,
    item: { ...item(`${id}-s${i + 1}`, i + 1), ...(i + 1 === mistakeAt ? { mistakes: [{ answer: "99", code: "E11", feedback: "Bước này chưa rút gọn hết.", review: "fc-1" }] } : {}) },
  })),
  solution: "Lời giải câu nhiều bước.",
});
const fs1 = () => {
  const u = unit("fs-1", "fx-geo", 3, "Nhiều bước thử");
  u.practice = [{ ...stepsItem("fs-1-p1", 4, "L2", 2), hints: HINTS, figure: { svg: SVG, alt: "Tam giác thử" } }, ...u.practice.slice(1).map((it) => ({ ...it, hints: HINTS }))];
  u.exit = [stepsItem("fs-1-x1", 2, "L1", 0), ...u.exit.slice(1)];
  return u;
};
// S5: fg-1 — one analysis, one C3 (figure folded: drawFirst) and one C2 in practice and in the exit test.
const mcqLevel = (id, options, correct, mistakes) => ({ id, type: "mcq", level: "L2", prompt: "Chọn.", options, correct, mistakes, solution: "Vì vậy." });
const analysisItem = (id) => ({
  id, type: "analysis", level: "L2", prompt: "Chứng minh điều thử.", goal: "Điều cần chứng minh thử",
  steps: [
    { ask: "Muốn có điều thử, cần gì?", node: "Mốc giữa thử", item: mcqLevel(`${id}-s1`, ["Hướng đúng thử", "Hướng sai thử", "Hướng lạc thử"], 0, { "1": { code: "E06", feedback: "Hướng này không tới giả thiết." }, "2": { code: "E06", feedback: "Hướng này lạc đề." } }) },
    { ask: "Vì sao có mốc giữa thử?", node: "Giả thiết thử", given: true, item: mcqLevel(`${id}-s2`, ["Vì giả thiết thử", "Vì điều cần chứng minh"], 0, { "1": { code: "E09", feedback: "Đang dùng điều cần chứng minh." } }) },
  ],
  outline: ["Từ giả thiết thử", "suy ra mốc giữa thử", "suy ra điều cần chứng minh thử"], solution: "Lời giải phân tích thử.",
});
const proofItem = (id) => ({
  id, type: "proof", level: "L2", prompt: "Điền lời giải thử.", drawFirst: true, figure: { svg: SVG, alt: "Hình chứng minh thử" },
  lines: ["Ta có góc thử vuông ([[1]])", "⇒ kết luận thử ([[2]])"],
  bank: ["lí do một", "lí do hai", "lí do ba", "lí do bốn"],
  blanks: [{ correct: 0, mistakes: { "2": { code: "E09", feedback: "Lí do ba không khớp bước này." } } }, { correct: 1, mistakes: { "3": { code: "E09", feedback: "Lí do bốn chưa đúng." } } }],
  solution: "Lời giải điền thử.",
});
const orderItem = (id) => ({
  id, type: "order", level: "L3", prompt: "Sắp xếp lời giải thử.",
  lines: [{ text: "Dòng mở đầu thử" }, { text: "Dòng A thử" }, { text: "Dòng B thử", after: [0] }, { text: "Dòng kết luận thử", after: [1, 2] }],
  distractors: [{ text: "Dòng thừa thử", code: "E08", feedback: "Dòng này là bước thừa." }],
  solution: "Lời giải sắp xếp thử.",
});
const fg1 = () => {
  const u = unit("fg-1", "fx-geo", 4, "Chứng minh thử");
  u.worked.analysis = { goal: "Điều cần chứng minh thử", steps: [{ ask: "Cần gì?", node: "Mốc giữa thử" }, { ask: "Vì sao?", node: "Giả thiết thử" }] };
  u.practice = [analysisItem("fg-1-p1"), proofItem("fg-1-p2"), orderItem("fg-1-p3"), ...u.practice.slice(3)];
  u.exit = [analysisItem("fg-1-x1"), proofItem("fg-1-x2"), orderItem("fg-1-x3"), ...u.exit.slice(3)];
  return u;
};
// S10/23-10: fd-1, fd-2 are drafts — the review flows approve fd-1 in the app; fd-2 stays a draft.
const draft = ({ approvedOn, ...u }) => ({ ...u, status: "draft" });
const modules = [
  { id: "fx-alg", title: "Đại số thử", domains: ["C"], units: [["fa-1", "Đại số thử 1"], ["fa-2", "Đại số thử 2"]] },
  { id: "backfill-fx", title: "Bù lỗ hổng thử", domains: ["F1"], units: [["fz-1", "Bù lỗ hổng thử 1"]] },
  { id: "fx-quick", title: "Ghi điểm thử", domains: ["A"], units: [["fb-1", "Ghi điểm thử 1"], ["fb-2", "Ghi điểm thử 2"], ["fb-3", "Ghi điểm thử 3"], ["fd-1", "Bài nháp thử 1"], ["fd-2", "Bài nháp thử 2"]] },
  { id: "fx-geo", title: "Hình học thử", domains: ["J"], units: [["fc-1", "Hình học thử 1"], ["fc-9", "Học thêm thử"], ["fs-1", "Nhiều bước thử"], ["fg-1", "Chứng minh thử"]] },
];
fs.rmSync(root, { recursive: true, force: true });
for (const m of modules) {
  fs.mkdirSync(path.join(root, m.id), { recursive: true });
  fs.writeFileSync(path.join(root, m.id, "module.json"), JSON.stringify({ id: m.id, title: m.title, domains: m.domains, units: m.units.map(([u]) => u) }, null, 2) + "\n");
  m.units.forEach(([u, t], i) => fs.writeFileSync(path.join(root, m.id, `${u}.json`), JSON.stringify(u === "fs-1" ? fs1() : u === "fg-1" ? fg1() : u.startsWith("fd-") ? draft(unit(u, m.id, i + 1, t)) : unit(u, m.id, i + 1, t), null, 2) + "\n"));
}
const C = (id, module, title, track, seq, batch, prereq = [], testOut = false, priority = "P0", grading = "full", phase = 1) => ({ id, module, title, track, seq, prereq, examWeight: 0.5, grading, testOut, batch, priority, phase: priority === "P2" ? null : phase });
const curriculum = {
  start: "2026-10-12",
  learnBy: "2027-03-31",
  phases: [{ n: 1, from: "2026-10-12", to: "2027-03-31" }],
  milestones: [{ id: "8.5", title: "Mốc 8,5", due: "2027-03-31", phases: [1], mustSolid: ["fa-2"] }],
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
    C("fs-1", "fx-geo", "Nhiều bước thử", "C", 20, 1, ["fc-1"], false, "P0", "partial"), // S6b, locked until unlocked by hand
    C("fg-1", "fx-geo", "Chứng minh thử", "C", 30, 1, [], false, "P0", "partial"), // S5 proof KU, open
    C("fl-1", "fx-later", "Bài chưa soạn thử", "A", 40, 9, ["fa-2"]),
    C("fd-1", "fx-quick", "Bài nháp thử 1", "B", 40, 9),
    C("fd-2", "fx-quick", "Bài nháp thử 2", "B", 50, 9),
  ],
};
fs.writeFileSync(path.join(root, "curriculum.json"), JSON.stringify(curriculum, null, 2) + "\n");
// S5: an approved fixture Sổ tay.
fs.writeFileSync(
  path.join(root, "so-tay.json"),
  JSON.stringify({ status: "approved", approvedOn: "2026-10-21", goals: [{ id: "g-thu", title: "Mục tiêu thử", tip: "Mẹo thử.", ways: [{ how: "Cách thử", sign: "Dấu hiệu thử", units: ["fg-1"] }] }], figures: [{ id: "h-thu", title: "Cấu hình thử", facts: ["Điều có sẵn thử"] }] }, null, 2) + "\n",
);
console.log("fixtures written");
