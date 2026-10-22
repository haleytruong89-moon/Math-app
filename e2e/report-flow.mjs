// S8a: weekly report (button + fake AI comment), spend on the AI page, AI switched off, cron auth. Parent role.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3114";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const monday = add(vnToday, -((new Date(vnToday + "T00:00:00Z").getUTCDay() + 6) % 7));
const lastWed = add(monday, -5); // Wednesday of the previous week
const shots = "e2e/out/s8a"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

try {
  // Last week: two wrong htl-1 answers with E01, one review done.
  await sql(`
    insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select id, 'htl-1', '${lastWed}T03:00:00Z' from public.students where full_name = 'Hạnh Nguyên';
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code, created_at)
      select id, 'htl-1', v.i, 'practice', '9', false, 'E01', '${lastWed}T03:00:00Z' from public.students, (values ('htl-1-p1'), ('htl-1-p2')) v(i) where full_name = 'Hạnh Nguyên';
    insert into public.review_log (student_id, unit_id, run_id, stage, correct, total, passed, due_on, next_due_on, created_at)
      select id, 'htl-1', gen_random_uuid(), 1, 3, 3, true, '${lastWed}', '${add(lastWed, 7)}', '${lastWed}T04:00:00Z' from public.students where full_name = 'Hạnh Nguyên';`);

  await page.goto(`${BASE}/parent`);
  ok("overview links to the weekly report", (await page.getByTestId("weekly-link").first().getAttribute("href")) === "/parent/bao-cao");

  await page.goto(`${BASE}/parent/bao-cao`);
  ok("no report before the first run", (await page.getByTestId("no-report").count()) === 1);
  await page.getByRole("button", { name: "Tạo lại báo cáo tuần trước" }).click();
  await page.getByText("Đã tạo báo cáo tuần trước.").waitFor();
  await page.reload();
  const comment = await page.getByTestId("weekly-comment").innerText();
  ok("AI comment shown (fake)", comment.includes("Tuần này con học khá đều"), comment.slice(0, 200));
  ok("numbers from the data: 1 review, E01 × 2", (await page.getByTestId("weekly-reviews").innerText()).includes("1") && (await page.getByTestId("weekly-errors").innerText()).includes("E01 — Tính toán sai · 2 lần"));
  await page.screenshot({ path: `${shots}/1-weekly-report.png`, fullPage: true });

  const u = await sql(`select kind, cost_micros, month from public.ai_usage`);
  ok("db: one call recorded with its cost", u.length === 1 && u[0].kind === "weekly" && u[0].cost_micros === 150 && u[0].month === vnToday.slice(0, 7), JSON.stringify(u));
  const r = await sql(`select comment_status, model, period from public.ai_reports where kind = 'weekly'`);
  ok("db: report stored for last week", r.length === 1 && r[0].comment_status === "ok" && r[0].model === "claude-haiku-5-5" && r[0].period === add(monday, -7), JSON.stringify(r));

  await page.goto(`${BASE}/parent/ai`);
  ok("AI page: spend and the call", (await page.getByTestId("ai-spend").innerText()).includes("1 lượt gọi") && (await page.getByTestId("ai-calls").innerText()).includes("Báo cáo tuần"));
  await page.screenshot({ path: `${shots}/2-ai-page.png`, fullPage: true });
  await page.getByTestId("staff-enabled").uncheck();
  await page.getByRole("button", { name: "Lưu" }).click();
  await page.getByText("Đã lưu.").waitFor();

  await page.goto(`${BASE}/parent/bao-cao`);
  await page.getByRole("button", { name: "Tạo lại báo cáo tuần trước" }).click();
  await page.getByText("Đã tạo báo cáo tuần trước.").waitFor();
  await page.reload();
  ok("AI off → template only, with the reason", (await page.getByTestId("weekly-comment").innerText()).includes("AI đang tắt"));
  ok("db: still one report, no new call", (await sql(`select count(*)::int c from public.ai_reports`))[0].c === 1 && (await sql(`select count(*)::int c from public.ai_usage`))[0].c === 1);

  const cron = await fetch(`${BASE}/api/cron/weekly`);
  ok("cron without the secret is refused", cron.status === 401);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/report-error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
