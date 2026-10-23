// Luyện đề 4.2 (23/10) tutor side on the fixture registry: Kho bài links the bank, the bank lists approved + draft
// problems, the workbench reviews a draft drill and takes a "Cần sửa". Run via e2e/run.sh (tutor role).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3117";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/drill"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

try {
  const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
  await page.goto(`${BASE}/tutor/${sid}/bai`);
  ok("Kho bài links Luyện đề hình", (await page.getByTestId("drill-link").getAttribute("href")) === `/tutor/${sid}/luyen-de`);
  await page.goto(`${BASE}/tutor/${sid}/luyen-de`);
  const bank = await page.getByTestId("drill-bank").innerText();
  ok("bank: approved, draft and the student's state", bank.includes("Đề 1 thử") && bank.includes("Nháp") && bank.includes("con: chưa mở"), bank.slice(0, 300));
  await page.screenshot({ path: `${shots}/3-tutor-bank.png`, fullPage: true });
  await page.getByTestId("bank-ld-d02").getByRole("link").click();
  await page.waitForURL(/\/bai\/ld-d02/);
  ok("workbench: draft drill note, no in-app approval", (await page.getByTestId("drill-draft-note").count()) === 1 && (await page.getByRole("button", { name: "Duyệt cả bài" }).count()) === 0);
  await page.goto(`${BASE}/tutor/${sid}/bai/ld-d02?item=ld-d02-1`);
  await page.getByRole("button", { name: "! Cần sửa" }).click();
  await page.getByLabel("Lý do cần sửa").fill("Tầng 1 có hai hướng đúng");
  await page.getByLabel("Hướng dẫn Claude sửa").fill("Đổi phương án B thành hướng sai rõ ràng");
  await page.getByRole("button", { name: "Gửi góp ý" }).click();
  await page.waitForFunction(() => document.querySelector("[data-item]")?.getAttribute("data-item") !== "ld-d02-1");
  ok("db: the drill fix note is saved", (await sql(`select note from public.item_reviews where unit_id='ld-d02' and item_id='ld-d02-1'`))[0]?.note === "Lý do: Tầng 1 có hai hướng đúng — Sửa: Đổi phương án B thành hướng sai rõ ràng");
  await page.screenshot({ path: `${shots}/4-tutor-review.png`, fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/tutor-error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
