// Parent "Tổng quan" (S4): numbers, mismatch flag → confirm, missed session by schedule, weekly schedule edit.
// Run via e2e/run.sh (parent role).
import { chromium } from "playwright";
import fs from "node:fs";
// Number of approved units in the real content (grows as batches are approved — 43 after 08/11).
const APPROVED = (() => { let n = 0; for (const d of fs.readdirSync("content")) { const p = `content/${d}`; if (!fs.statSync(p).isDirectory()) continue; for (const f of fs.readdirSync(p)) if (f.endsWith(".json") && f !== "module.json" && JSON.parse(fs.readFileSync(`${p}/${f}`, "utf8")).status === "approved") n++; } return n; })();
const BASE = process.env.BASE ?? "http://localhost:3104";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const yesterday = add(vnToday, -1);
const isoWd = (d) => ((new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7) + 1;
const shots = "e2e/out/overview"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

// htl-1: worked example seen + 2 practice answers → system M1. Tutor proposed M3 two days ago.
// Assignment started 3 days ago with yesterday's weekday → exactly one missed day (yesterday).
await sql(`
  update public.tutor_assignments set started_at = now() - interval '3 days', weekdays = '{${isoWd(yesterday)}}' where ended_at is null;
  insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select id, 'htl-1', now() from public.students where full_name = 'Hạnh Nguyên';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
    select id, 'htl-1', v.i, 'practice', '1', true from public.students, (values ('htl-1-p1'), ('htl-1-p2')) v(i) where full_name = 'Hạnh Nguyên';
  with s as (insert into public.teaching_sessions (student_id, tutor_id, taught_on, note)
    select a.student_id, a.tutor_id, '${add(vnToday, -2)}', 'Con làm tốt trên lớp' from public.tutor_assignments a where a.ended_at is null returning id, student_id, tutor_id)
  insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select id, student_id, tutor_id, 'htl-1', 3, 1, 2 from s;`);

await page.goto(`${BASE}/parent`);
ok(`numbers: 0/${APPROVED} at M3+, 0 overdue, 1 flag`, (await page.getByTestId("stat-m3").innerText()).includes(`0/${APPROVED}`) && (await page.getByTestId("stat-overdue").innerText()).includes("0") && (await page.getByTestId("stat-flags").innerText()).includes("1"));
// S4b: milestone cards over the whole roadmap (38 / 43 core KUs), the current phase, a pace figure.
ok("milestones: 0/38 to 8.5, 0/43 to 9.5, phase and pace shown",
  (await page.getByTestId("milestone-8.5").getByTestId("milestone-solid").innerText()).startsWith("0/38") &&
  (await page.getByTestId("milestone-9.5").getByTestId("milestone-solid").innerText()).startsWith("0/43") &&
  /giai đoạn \d|Đã hết lịch/.test(await page.getByTestId("phase").innerText()) &&
  /bài\/tuần|bài$/.test(await page.getByTestId("milestone-8.5").getByTestId("milestone-pace").innerText()));
const flag = page.getByTestId("flag-htl-1");
ok("flag: proposal vs system + session note", (await flag.getByText(/đề xuất M3/).count()) === 1 && (await flag.getByText(/Hệ thống M1/).count()) === 1 && (await flag.getByText(/Con làm tốt trên lớp/).count()) === 1);
ok("missed: yesterday's scheduled session", (await page.getByTestId("missed").count()) === 1 && (await page.getByTestId("missed").getByText(/chưa ghi buổi dạy/).count()) === 1);
await page.screenshot({ path: `${shots}/1-overview.png`, fullPage: true });

await flag.locator('input[name="note"]').fill("Đã xem bài trên lớp");
await flag.getByRole("button", { name: "Chốt mức" }).click();
await flag.waitFor({ state: "detached" });
const c = await sql(`select level, system_level, note, proposal_session_id is not null as linked from public.parent_confirmations`);
ok("db: confirmation saved with system snapshot", c.length === 1 && c[0].level === 3 && c[0].system_level === 1 && c[0].linked === true && c[0].note === "Đã xem bài trên lớp", JSON.stringify(c));
await page.reload();
ok(`after confirm: 1/${APPROVED} at M3+, 1/38 to 8.5, no flag, map says 'bố mẹ chốt'`, (await page.getByTestId("stat-m3").innerText()).includes(`1/${APPROVED}`) && (await page.getByTestId("milestone-8.5").getByTestId("milestone-solid").innerText()).startsWith("1/38") && (await page.getByTestId("stat-flags").innerText()).includes("0") && (await page.getByTestId("unit-htl-1").getByText(/bố mẹ chốt/).count()) === 1);
await page.screenshot({ path: `${shots}/2-after-confirm.png`, fullPage: true });

await sql(`insert into public.teaching_sessions (student_id, tutor_id, taught_on) select student_id, tutor_id, '${yesterday}' from public.tutor_assignments where ended_at is null`);
await page.reload();
ok("missed reminder gone once yesterday's session is logged", (await page.getByTestId("missed").count()) === 0);

// weekly schedule editor on Tài khoản
await page.goto(`${BASE}/parent/accounts`);
await page.getByText(/Sửa lịch/).first().click();
const box = (n) => page.locator(`details:has-text("Sửa lịch") input[name="weekday"][value="${n}"]`).first();
for (const n of [1, 2, 3, 4, 5, 6, 7]) if (await box(n).isChecked()) await box(n).uncheck();
await box(2).check(); await box(5).check();
await page.getByRole("button", { name: "Lưu lịch" }).click();
await page.getByText("Đã lưu lịch.").waitFor();
ok("db: weekdays saved", JSON.stringify((await sql(`select weekdays from public.tutor_assignments where ended_at is null`))[0].weekdays) === "[2,5]");
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
