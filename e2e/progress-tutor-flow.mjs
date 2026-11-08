// Kiểm tra tiến bộ (08/11): the tutor schedules KT1 (fixture), opens the print page, grades with one part "chưa học",
// sees the result out of the parts tested, the target board and "Việc tiếp theo: chấm bài". Fixtures DB.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3125";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const TUTOR = "00000000-0000-0000-0000-00000000e2e2";
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const shots = "e2e/out/progress"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
try {
  await sql(`delete from public.mock_exams; delete from public.tutor_priorities;`);
  const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;
  await page.goto(`${BASE}/tutor/${sid}/thi-thu`);
  ok("board shown, nothing measured yet", (await page.getByTestId("target-summary").innerText()).includes("Chưa có bài kiểm tra"));
  const row = page.getByTestId("progress-row-1");
  ok("KT1 listed with planned date and paper mode", (await row.innerText()).includes("KT1") && (await row.innerText()).includes("trên giấy") && (await row.innerText()).includes("22/11/2026"));
  await row.getByLabel("Ngày làm KT1").fill(today);
  await row.getByRole("button", { name: "Hẹn lịch" }).click();
  await row.getByText("Đã hẹn", { exact: true }).waitFor();
  const ex = await sql(`select kind, paper, scheduled_on::text d, created_by from public.mock_exams`);
  ok("KT1 saved as a progress exam", ex.length === 1 && ex[0].kind === "progress" && ex[0].paper === 1 && ex[0].d === today && ex[0].created_by === TUTOR, JSON.stringify(ex));

  // Print page: problems, no answers.
  const print = await page.context().newPage();
  await print.goto(`${BASE}/in/kiem-tra/1`);
  const ptxt = await print.getByTestId("print-problems").innerText();
  ok("print page shows the problems", ptxt.includes("Bài 1") && ptxt.includes("Bài 3") && ptxt.includes("hộp sữa"));
  ok("print page has no answers", !(await print.content()).includes("36\\pi") && !ptxt.includes("60%"));
  await print.screenshot({ path: `${shots}/1-print.png`, fullPage: true });
  await print.close();

  // She sat it.
  await sql(`update public.mock_exams set started_at = now() - interval '44 minutes', finished_at = now() - interval '2 minutes'`);
  await page.goto(`${BASE}/tutor/${sid}`);
  ok("Việc tiếp theo: grade KT1", (await page.getByTestId("next-action").innerText()).includes("Con đã nộp KT1"));
  await page.getByTestId("next-action").getByRole("link", { name: "Chấm bài →" }).click();
  await page.getByTestId("mock-sheet").waitFor();
  ok("sheet has the Chưa học column", (await page.getByLabel("Ý 4.1 con chưa học").count()) === 1);
  await page.getByLabel("Điểm ý 1.1").fill("0.75");
  await page.getByLabel("Điểm ý 1.2").fill("0.5");
  await page.getByLabel("Điểm ý 3.1").fill("0.75");
  await page.getByLabel("Ý 4.1 con chưa học").check();
  await page.getByLabel(/Nhận xét chung/).fill("Bài 3 thiếu điều kiện của ẩn.");
  await page.getByRole("button", { name: "Lưu điểm" }).click();
  await page.getByText("Đã lưu điểm KT1: 2/2,75.").waitFor();
  const sc = await sql(`select part, points::text p, skipped from public.mock_scores order by part`);
  ok("4 parts saved, 4.1 skipped at 0", sc.length === 4 && sc.find((r) => r.part === "4.1").skipped === true && sc.find((r) => r.part === "4.1").p === "0.00", JSON.stringify(sc));
  ok("total 2 over the parts tested", (await sql(`select total::text t from public.mock_exams`))[0].t === "2.00");
  await page.reload();
  ok("result shows 2/2,75 and the skipped part", (await page.getByTestId("mock-total").innerText()).replace(/\s/g, "").startsWith("2/2,75") && (await page.getByTestId("mock-result").innerText()).includes("chưa học: 4.1"));
  await page.screenshot({ path: `${shots}/2-graded.png`, fullPage: true });

  await page.goto(`${BASE}/tutor/${sid}/thi-thu`);
  const b1 = await page.getByTestId("target-1").innerText();
  ok("board Bài 1: 1,25/1,5 from KT1, scaled 1,25, gần đạt", b1.includes("1,25/1,5 · KT1") && b1.includes("gần đạt"), b1);
  ok("board Bài 3 measured (0,75/1,25), Bài 4.1 still chưa đo", (await page.getByTestId("target-3").innerText()).includes("0,75/1,25") && (await page.getByTestId("target-4.1").innerText()).includes("chưa đo"));
  ok("board Bài 5 accepted loss", (await page.getByTestId("target-5").innerText()).includes("chấp nhận bỏ"));
  ok("summary over the measured parts", (await page.getByTestId("target-summary").innerText()).includes("Trên 4 điểm của đề đã đo"), await page.getByTestId("target-summary").innerText());
  await page.screenshot({ path: `${shots}/3-board.png`, fullPage: true });
  await page.goto(`${BASE}/tutor/${sid}`);
  ok("Hôm nay: compact board, next action no longer grading", (await page.getByTestId("target-board").count()) === 1 && !(await page.getByTestId("next-action").innerText()).includes("KT1"));
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/tutor-error.png`, fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
