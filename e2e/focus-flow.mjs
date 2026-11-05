// Order 01/11: "Cần tập trung" on the student home — a starred (★) open KU shows as a pick card there,
// grouped by chủ đề, and is removed from "Bài mới". The child picks; nothing is forced. Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3118";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const PARENT = `'00000000-0000-0000-0000-00000000e2e0'`;
fs.mkdirSync("e2e/out/focus", { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 420, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`delete from public.tutor_priorities; insert into public.tutor_priorities (student_id, unit_id, position, set_by) select ${ME}, 'fb-1', 1, ${PARENT};`);
  await page.goto(`${BASE}/student`);
  const focus = page.getByTestId("focus-group");
  ok("home: 'Cần tập trung' block shown", (await focus.count()) === 1);
  ok("focus: contains the starred unit", (await focus.getByText("Ghi điểm thử 1").count()) === 1);
  ok("focus: not forced — it's a pick card with its own button", (await focus.getByRole("link", { name: "Học bài này" }).count()) === 1);
  const newRegion = page.getByRole("region", { name: "Bài mới" });
  ok("dedupe: starred unit is NOT repeated in 'Bài mới'", (await newRegion.getByText("Ghi điểm thử 1").count()) === 0);
  await page.screenshot({ path: "e2e/out/focus/1-home-focus.png", fullPage: true });
  // Picking it opens the lesson (student drives it).
  await focus.getByRole("link", { name: "Học bài này" }).click();
  await page.waitForURL(/\/student\/learn\/fb-1/);
  ok("pick: opens the chosen lesson", page.url().includes("/student/learn/fb-1"));
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 200));
  await page.screenshot({ path: "e2e/out/focus/error.png", fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
