// S5: the answer key of the three proof item types in Duyệt (parent), Làm thử, and the parent's Sổ tay preview.
// Run via e2e/run.sh (parent role, fixture registry).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3113";
const shots = "e2e/out/geometry";
fs.mkdirSync(shots, { recursive: true });
const res = [];
const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const panel = () => page.locator("[aria-label='Câu đang xem']");

try {
  await page.goto(`${BASE}/parent/content/fg-1/duyet?item=fg-1-p1`);
  const a = await panel().innerText();
  ok("analysis key: nodes and outline", a.includes("Mốc giữa thử") && a.includes("suy ra mốc giữa thử") && a.includes("phân tích ngược"), a.slice(0, 200));
  await page.goto(`${BASE}/parent/content/fg-1/duyet?item=fg-1-p2`);
  ok("C3 key: right fills shown", (await panel().innerText()).includes("【1: lí do một】"));
  await page.goto(`${BASE}/parent/content/fg-1/duyet?item=fg-1-p3`);
  const t = await panel().innerText();
  ok("C2 key: swap note + distractor", t.includes("có thể đổi chỗ với dòng") && t.includes("bước thừa"), t.slice(0, 300));
  await page.screenshot({ path: `${shots}/5-review-key.png`, fullPage: true });

  // Làm thử: the parent plays the lesson as the student (nothing recorded); the Sổ tay link goes to the preview.
  await page.goto(`${BASE}/parent/content/fg-1`);
  ok("preview: Sổ tay link points to the parent preview", (await page.getByTestId("so-tay-link").getAttribute("href")) === "/parent/content/so-tay");

  await page.goto(`${BASE}/parent/content/so-tay`);
  ok("so-tay: parent preview renders goals and figures", (await page.getByTestId("so-tay-goal").count()) === 1 && (await page.getByTestId("so-tay-figure").count()) === 1);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/parent-error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
