// S10 student side: an app-approved KU is visible without its "Cần sửa" item; a priority KU leads Bài mới. Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3109";
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const unit = JSON.parse(fs.readFileSync("content/xac-suat/b-haib.json", "utf8"));
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
// LT3: no suggestion at all with 2 KUs in progress — leave only the htl-1/2 history of the earlier flows.
await sql(`delete from public.unit_progress where unit_id not in ('htl-1','htl-2')`);

await page.goto(`${BASE}/student`);
const first = page.getByRole("link", { name: "Học bài mới" }).first();
ok("Bài mới: the tutor's priority KU first", (await first.getAttribute("href")) === "/student/learn/b-haib", await first.getAttribute("href"));
const r = await page.goto(`${BASE}/student/learn/b-haib`);
ok("learn: app-approved b-haib opens", r.status() === 200);
const html = await page.content();
const has = (id) => new RegExp(`${id}(?![0-9])`).test(html); // b-haib-p1 ≠ b-haib-p10
ok("learn: the 'Cần sửa' item is hidden", !has(unit.practice[0].id) && has(unit.practice[1].id));
const d = await page.goto(`${BASE}/student/learn/g-giaihpt`);
ok("learn: a draft KU is still 404", d.status() === 404);
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
