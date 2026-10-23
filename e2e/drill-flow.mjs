// Luyện đề 4.2 (23/10) student side on the fixture registry: locked until fc-1 is ★, draw first, analysis + C3,
// full solution, recorded under the drill id, then "Xong". Run via e2e/run.sh (student role).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3116";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const shots = "e2e/out/drill"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const status = async (id) => page.getByTestId(`drill-${id}`).getAttribute("data-status");

try {
  await page.goto(`${BASE}/student`);
  ok("home: drill teaser shown", (await page.getByTestId("drill-teaser").count()) === 1);
  await page.goto(`${BASE}/student/luyen-de`);
  ok("list: approved problems only (no draft), both locked", (await status("ld-d01")) === "locked" && (await status("ld-d03")) === "locked" && (await page.getByTestId("drill-ld-d02").count()) === 0);
  ok("list: locked says which lesson opens it", (await page.getByTestId("drill-ld-d01").innerText()).includes("Mở khi con vững"));
  await page.goto(`${BASE}/student/luyen-de/ld-d01`);
  ok("locked problem: back to the list", page.url().endsWith("/student/luyen-de"));

  // The tutor stars fc-1 → ld-d01 opens.
  await sql(`insert into public.tutor_priorities (student_id, unit_id, position, set_by) select ${ME}, 'fc-1', 1, (select id from public.profiles where role = 'tutor' limit 1)`);
  await page.goto(`${BASE}/student/luyen-de`);
  ok("★ on the needed lesson opens the problem", (await status("ld-d01")) === "new" && (await status("ld-d03")) === "locked");
  await page.getByTestId("drill-ld-d01").getByRole("link").click();
  await page.getByTestId("draw-first").waitFor();
  ok("draw first: no figure yet", (await page.getByTestId("svg-figure").count()) === 0);
  await page.getByRole("button", { name: "Đã vẽ xong — xem hình" }).click();
  ok("figure shown after drawing", await page.getByTestId("svg-figure").first().isVisible());

  // Item 1: backward analysis, right at both levels.
  await page.getByTestId("level-1").getByRole("button", { name: "Hướng đúng thử" }).click();
  await page.getByRole("button", { name: "Tầng tiếp theo ⇑" }).click();
  await page.getByTestId("level-2").getByRole("button", { name: "Vì giả thiết thử" }).click();
  await page.getByText("Chạm giả thiết ✓").waitFor();
  await page.getByRole("button", { name: /Hoàn thành — lật thành dàn ý/ }).click();
  await page.getByTestId("analysis-outline").waitFor();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  // Item 2: C3, both blanks right.
  await page.getByTestId("proof-input").waitFor();
  await page.getByTestId("blank-1").click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do một" }).click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do hai" }).click();
  await page.getByRole("button", { name: "Kiểm tra", exact: true }).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
  await page.getByText("Xong bài luyện đề").waitFor();
  await page.getByRole("button", { name: "Xem lời giải đầy đủ" }).click();
  ok("full solution after the items", (await page.getByTestId("drill-solution").innerText()).includes("lời giải đề thử"));
  await page.screenshot({ path: `${shots}/1-solution.png`, fullPage: true });

  const a = await sql(`select item_id, correct, mode from public.attempts where unit_id = 'ld-d01' order by created_at`);
  ok("db: two right answers recorded under the drill id", a.length === 2 && a.every((r) => r.correct && r.mode === "practice"), JSON.stringify(a));
  await page.goto(`${BASE}/student/luyen-de`);
  ok("list: the problem is done", (await status("ld-d01")) === "done");
  await page.screenshot({ path: `${shots}/2-list.png`, fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
