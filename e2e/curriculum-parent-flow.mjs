// S6a parent side on the fixture content: content list by batch with "Chưa soạn", manual unlock.
// Run via e2e/run.sh (parent role, fixture registry).
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3106";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

await page.goto(`${BASE}/parent/content`);
ok("content: grouped by batch", (await page.getByTestId("batch-1").count()) === 1 && (await page.getByTestId("batch-9").getByText("Chưa soạn", { exact: true }).count()) === 1);
await page.goto(`${BASE}/parent/content/fa-2`);
const box = page.getByTestId("unlock-box");
ok("unit page: locked for the child → unlock offered", (await box.count()) === 1);
await box.getByRole("button", { name: "Mở khoá cho con" }).click();
await box.waitFor({ state: "detached" }); // the page re-renders without the box once the KU is open
const row = await sql(`select unit_id from public.unit_unlocks`);
ok("db: unlock saved", row.length === 1 && row[0].unit_id === "fa-2", JSON.stringify(row));
await page.reload();
ok("unit page: no unlock box once open", (await page.getByTestId("unlock-box").count()) === 0);
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
