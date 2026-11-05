// Order 01/11: the parent can mark a chủ đề "cần tập trung" per child from the unit page (focus = tutor_priorities,
// editPriorities allows the parent). Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3119";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const PARENT = "00000000-0000-0000-0000-00000000e2e0";
fs.mkdirSync("e2e/out/focus", { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 900, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`delete from public.tutor_priorities;`);
  await page.goto(`${BASE}/parent/content/fc-1`);
  const box = page.getByTestId("focus-box");
  ok("parent unit page: focus box shown", (await box.count()) === 1);
  const row = box.locator("li").filter({ hasText: "Hạnh Nguyên" });
  ok("focus box: a row per child", (await row.count()) === 1);
  await row.locator("button").filter({ hasText: "Cần tập trung" }).click();
  await page.waitForFunction(async () => true);
  await page.waitForTimeout(800);
  const rows = await sql(`select unit_id, set_by from public.tutor_priorities`);
  ok("parent star saved for this child, set_by = parent", rows.length === 1 && rows[0].unit_id === "fc-1" && rows[0].set_by === PARENT, JSON.stringify(rows));
  await page.reload();
  ok("toggle now shows active state", (await page.getByTestId("focus-box").locator("button").filter({ hasText: "Đang tập trung" }).count()) === 1);
  await page.screenshot({ path: "e2e/out/focus/2-parent-focus.png", fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 200));
  await page.screenshot({ path: "e2e/out/focus/parent-error.png", fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
