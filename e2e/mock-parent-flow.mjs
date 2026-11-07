// S9 Thi thử (07/11): the parent schedules from /parent/thi-thu, sees a "Cần chú ý" when a handed-in paper waits
// more than 3 days, and reads a graded result. Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3124";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const PARENT = "00000000-0000-0000-0000-00000000e2e0";
const TUTOR = "00000000-0000-0000-0000-00000000e2e2";
const shots = "e2e/out/mock"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`delete from public.mock_exams;`);
  const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
  await page.goto(`${BASE}/parent/thi-thu`);
  ok("parent nav has Thi thử", (await page.getByRole("link", { name: "Thi thử" }).count()) >= 1);
  await page.getByTestId("mock-date").fill("2030-01-05");
  await page.getByRole("button", { name: "Hẹn lịch" }).click();
  await page.getByText("Đã hẹn Đề 57").waitFor();
  ok("parent scheduled, created_by = parent", (await sql(`select created_by from public.mock_exams`))[0].created_by === PARENT);
  await page.getByTestId("mock-row-57").getByRole("button", { name: "Huỷ lịch" }).click();
  await page.getByTestId("mock-row-57").getByText("Chưa hẹn").waitFor();
  ok("cancel before start removes it", (await sql(`select count(*)::int c from public.mock_exams`))[0].c === 0);
  await sql(`insert into public.mock_exams (student_id, paper, scheduled_on, started_at, finished_at, created_by) values ('${sid}', 57, current_date - 6, now() - interval '6 days 2 hours', now() - interval '6 days', '${TUTOR}')`);
  await page.goto(`${BASE}/parent`);
  ok("overview: paper waiting for grading", (await page.getByTestId("mock-overdue-notice").innerText()).includes("Đề 57"));
  await sql(`insert into public.mock_scores (exam_id, part, points) select id, p, x from public.mock_exams, (values ('1.1', 1), ('1.2', 0.5), ('2', 1.5), ('3.1', 1), ('3.2', 1.5), ('4.1', 1), ('4.2a', 1), ('4.2b', 0.5), ('4.2c', 1), ('5', 0.5)) v(p, x);
             update public.mock_exams set graded_at = now(), graded_by = '${TUTOR}', total = 9.5;`);
  await page.goto(`${BASE}/parent/thi-thu/${sid}/57`);
  ok("parent reads the result", (await page.getByTestId("mock-total").innerText()).replace(/\s/g, "").startsWith("9,5/10"));
  ok("parent sees the sheet read-only", (await page.getByTestId("mock-sheet").count()) === 1 && (await page.getByLabel("Điểm ý 1.1").count()) === 0);
  await page.goto(`${BASE}/parent/thi-thu`);
  ok("trend line shows the score", (await page.getByTestId("mock-trend").innerText()).includes("9,5"));
  await page.screenshot({ path: `${shots}/6-parent.png`, fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/parent-error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
