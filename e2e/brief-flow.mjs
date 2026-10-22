// S8a: the tutor makes a brief on Buổi dạy (fake AI points), and reopening shows the stored one. Tutor role.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3115";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/s8a"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

try {
  const [{ id }] = await sql(`select id from public.students where full_name = 'Hạnh Nguyên'`);
  await sql(`
    insert into public.unit_progress (student_id, unit_id, worked_viewed_at) values ('${id}', 'htl-1', now()), ('${id}', 'htl-2', now());
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) values
      ('${id}', 'htl-1', 'htl-1-p1', 'practice', '9', false, 'E03'), ('${id}', 'htl-1', 'htl-1-p2', 'practice', '9', false, 'E03'),
      ('${id}', 'htl-2', 'htl-2-p1', 'practice', '9', false, 'E01'), ('${id}', 'htl-2', 'htl-2-p2', 'practice', '1', true, null);`);

  await page.goto(`${BASE}/tutor/${id}/buoi`);
  await page.getByRole("button", { name: "Tạo tóm tắt trước buổi dạy" }).click();
  await page.getByText("Đã tạo tóm tắt.").waitFor();
  await page.reload();
  const b = await page.getByTestId("brief").innerText();
  ok("brief: KUs since, most wrong first", b.indexOf("Bốn hệ thức lượng") < b.indexOf("Tính độ dài") && b.includes("E03×2"), b.slice(0, 300));
  ok("brief: 2 AI points (fake)", (await page.getByTestId("brief-point").count()) === 2 && b.includes("Chữa lại"));
  await page.screenshot({ path: `${shots}/3-brief.png`, fullPage: true });
  const r = await sql(`select comment_status, tutor_id is not null as has_tutor from public.ai_reports where kind = 'brief'`);
  ok("db: brief stored with its tutor", r.length === 1 && r[0].comment_status === "ok" && r[0].has_tutor === true, JSON.stringify(r));
  await page.reload();
  ok("reopening costs nothing: still one call", (await sql(`select count(*)::int c from public.ai_usage`))[0].c === 1);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/brief-error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
