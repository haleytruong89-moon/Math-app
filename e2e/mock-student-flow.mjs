// S9 Thi thử (07/11): the student sees the card, starts the 120-minute timer, hands in; sees no points before
// grading, then her points per part and KUs to review — never the answers. Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3123";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const TUTOR = "00000000-0000-0000-0000-00000000e2e2";
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const shots = "e2e/out/mock"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 820, height: 1180 } })).newPage(); // iPad
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`update public.students set consent_at = now() where full_name='Hạnh Nguyên'; delete from public.mock_exams;`);
  const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
  await sql(`insert into public.mock_exams (student_id, paper, scheduled_on, created_by) values ('${sid}', 57, '2030-01-05', '${TUTOR}')`);
  await page.goto(`${BASE}/student`);
  ok("no card for a paper far ahead", (await page.getByTestId("mock-card").count()) === 0);
  await page.goto(`${BASE}/student/thi-thu/57`);
  ok("too early: no start button", (await page.getByTestId("mock-start").count()) === 0 && (await page.getByText("Chưa tới ngày thi thử.").count()) === 1);
  await sql(`update public.mock_exams set scheduled_on = '${today}'`);
  await page.goto(`${BASE}/student`);
  const card = page.getByTestId("mock-card");
  ok("home card on the day", (await card.innerText()).includes("Thi thử Đề 57"));
  await page.screenshot({ path: `${shots}/3-student-card.png`, fullPage: true });
  await card.click();
  await page.getByTestId("mock-start").click();
  await page.getByTestId("mock-clock").waitFor();
  await page.waitForTimeout(1500);
  const clock = await page.getByTestId("mock-clock").innerText();
  ok("countdown from 120 minutes", /^11[89]:[0-5]\d$|^120:00$/.test(clock), clock);
  ok("start time recorded", (await sql(`select count(*)::int c from public.mock_exams where started_at is not null`))[0].c === 1);
  await page.screenshot({ path: `${shots}/4-student-timer.png`, fullPage: true });
  await page.getByTestId("mock-finish").click();
  await page.getByTestId("mock-finished").waitFor();
  ok("hand-in recorded", (await sql(`select count(*)::int c from public.mock_exams where finished_at is not null`))[0].c === 1);
  // Points written but not yet graded: hidden from her (RLS).
  const exam = (await sql(`select id from public.mock_exams`))[0].id;
  const parts = [["1.1", 1], ["1.2", 0.5], ["2", 1.5], ["3.1", 1], ["3.2", 0.5], ["4.1", 1], ["4.2a", 1], ["4.2b", 1], ["4.2c", 0], ["5", 0.5]];
  await sql(`insert into public.mock_scores (exam_id, part, points) values ${parts.map(([p, x]) => `(${exam}, '${p}', ${x})`).join(", ")}`);
  await page.reload();
  ok("no points before grading", (await page.getByTestId("mock-finished").count()) === 1 && (await page.getByTestId("mock-total").count()) === 0);
  await sql(`update public.mock_exams set graded_at = now(), graded_by = '${TUTOR}', total = 8, comment = 'Cố gắng ý 4.2c.'`);
  await page.reload();
  ok("graded: total shown", (await page.getByTestId("mock-total").innerText()).replace(/\s/g, "").startsWith("8/10"));
  const body = await page.locator("main").innerText();
  ok("no answers shown to the student", !body.includes("A=3") && !body.includes("Mỗi giờ đội I") && !body.includes("thẳng hàng"), body.slice(0, 300));
  ok("KUs to review linked", (await page.getByTestId("mock-review-links").locator("a").count()) === 3);
  await page.screenshot({ path: `${shots}/5-student-result.png`, fullPage: true });
  await page.goto(`${BASE}/student`);
  ok("home shows the recent result", (await page.getByTestId("mock-result-card").innerText()).includes("8/10"));
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/student-error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
