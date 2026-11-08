// Kiểm tra tiến bộ (08/11): the student sees the KT1 card, starts a 45-minute timer, reads the problems on screen,
// hands in; after grading she sees points over the parts tested — no answers, no target board. Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3126";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const TUTOR = "00000000-0000-0000-0000-00000000e2e2";
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const shots = "e2e/out/progress"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`update public.students set consent_at = now() where full_name='Hạnh Nguyên'; delete from public.mock_exams;`);
  const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
  await sql(`insert into public.mock_exams (student_id, kind, paper, scheduled_on, created_by) values ('${sid}', 'progress', 1, '${today}', '${TUTOR}')`);
  await page.goto(`${BASE}/student`);
  const card = page.getByTestId("mock-card");
  ok("home card: Kiểm tra tiến bộ KT1 · 45 phút", (await card.innerText()).includes("Kiểm tra tiến bộ KT1") && (await card.innerText()).includes("45 phút"));
  await card.click();
  ok("problems hidden before start", (await page.getByTestId("progress-problems").count()) === 0);
  await page.getByTestId("mock-start").click();
  await page.getByTestId("mock-clock").waitFor();
  await page.waitForTimeout(1500);
  const clock = await page.getByTestId("mock-clock").innerText();
  ok("countdown from 45 minutes", /^4[45]:[0-5]\d$/.test(clock), clock);
  ok("problems shown once started", (await page.getByTestId("progress-problems").innerText()).includes("Bài 3"));
  ok("no answers on her page", !(await page.content()).includes("x=12"));
  await page.screenshot({ path: `${shots}/4-student-running.png`, fullPage: true });
  await page.getByTestId("mock-finish").click();
  await page.getByTestId("mock-finished").waitFor();
  ok("hand-in recorded", (await sql(`select count(*)::int c from public.mock_exams where finished_at is not null`))[0].c === 1);
  await sql(`insert into public.mock_scores (exam_id, part, points, skipped) select id, p, x, s from public.mock_exams, (values ('1.1', 0.75, false), ('1.2', 0.5, false), ('3.1', 1.25, false), ('4.1', 0, true)) v(p, x, s);
             update public.mock_exams set graded_at = now(), graded_by = '${TUTOR}', total = 2.5, comment = 'Tốt, giữ nhịp.';`);
  await page.reload();
  ok("graded: 2,5 over 2,75 tested", (await page.getByTestId("mock-total").innerText()).replace(/\s/g, "").startsWith("2,5/2,75"));
  const body = await page.locator("body").innerText();
  ok("skipped part not listed, no answers", !body.includes("4.1") && !body.includes("60%") && body.includes("Tốt, giữ nhịp."), body.slice(0, 400));
  await page.goto(`${BASE}/student`);
  ok("home shows the recent KT1 result", (await page.getByTestId("mock-result-card").innerText()).includes("Kết quả kiểm tra KT1: 2,5 điểm"));
  ok("no target board for the student", (await page.getByTestId("target-board").count()) === 0);
  const r = await page.goto(`${BASE}/in/kiem-tra/1`);
  ok("print page not for the student", r.status() === 404);
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/student-error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
