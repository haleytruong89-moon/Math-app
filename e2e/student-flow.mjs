// Student flow against PGlite: learn → exit → review scheduling → interleaved review. Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3101";
const C = "content/he-thuc-luong";
const units = Object.fromEntries(["htl-1", "htl-2"].map((u) => [u, JSON.parse(fs.readFileSync(`${C}/${u}.json`, "utf8"))]));
const key = {};
for (const u of Object.values(units)) for (const it of [...u.practice, ...u.exit, ...u.faded.steps.filter((s) => s.item).map((s) => s.item)])
  key[it.id] = it.type === "mcq" ? { mcq: it.correct } : { num: it.answer };
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

fs.mkdirSync("e2e/out/student", { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const answer = async (id, wrong = false, scope = page) => {
  const k = key[id];
  if (k.mcq !== undefined) { const n = await scope.getByRole("radio").count(); await scope.getByRole("radio").nth(wrong ? (k.mcq + 1) % n : k.mcq).check(); }
  else await scope.getByLabel("Đáp số").last().fill(wrong ? "999" : k.num);
};

await sql(`delete from public.review_log; delete from public.review_queue; delete from public.attempts; delete from public.unit_progress;`);
await page.goto(`${BASE}/student`);
await page.screenshot({ path: "e2e/out/student/1-today-start.png", fullPage: true });
ok("today: goal 0/4", (await page.getByText("0/4 buổi").count()) === 1);
ok("today: 2 chips M0 'chưa đủ dữ liệu'", (await page.getByText("chưa đủ dữ liệu").count()) === 2);
ok("today: only next new unit listed", (await page.getByRole("link", { name: "Học bài mới" }).count()) === 1);

// ---- learn htl-1 fully
await page.getByRole("link", { name: "Học bài mới" }).click();
await page.waitForURL(/learn\/htl-1/);
ok("learn: practice locked", await page.getByRole("button", { name: /Luyện tập/ }).isDisabled());
while (await page.getByRole("button", { name: /Bước tiếp theo/ }).count()) await page.getByRole("button", { name: /Bước tiếp theo/ }).click();
await page.getByRole("button", { name: /sang phần điền bước/ }).click();
for (const id of ["htl-1-f1", "htl-1-f2", "htl-1-f3"]) {
  await answer(id, false, page.locator("li.border-accent"));
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.waitForTimeout(600);
}
await page.getByRole("button", { name: "Sang phần luyện tập" }).click();
for (const it of units["htl-1"].practice) {
  await answer(it.id);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: "Câu tiếp" }).click();
}
await page.getByRole("button", { name: "Làm bài kiểm tra" }).click();
for (const [i, it] of units["htl-1"].exit.entries()) {
  const card = page.locator("section").filter({ hasText: `Câu ${i + 1}` });
  const k = key[it.id];
  if (k.mcq !== undefined) await card.getByRole("radio").nth(k.mcq).check(); else await card.getByLabel("Đáp số").fill(k.num);
}
await page.getByRole("button", { name: "Nộp bài" }).click();
await page.getByText("Kết quả bài kiểm tra").waitFor();
ok("exit 5/5", (await page.getByText("5/5").count()) >= 1);
ok("exit: review scheduled message", (await page.getByText(/hẹn ôn lại vào ngày mai/).count()) === 1);
const q1 = await sql(`select stage, due_on::text from public.review_queue where unit_id='htl-1'`);
ok("db: queue htl-1 stage 1 due tomorrow", q1[0]?.stage === 1 && q1[0]?.due_on === add(vnToday, 1), JSON.stringify(q1) + " vnToday=" + vnToday);

await page.goto(`${BASE}/student`);
ok("today: goal 1/4 after exit", (await page.getByText("1/4 buổi").count()) === 1);
ok("today: htl-1 shows M3", (await page.locator("[role=listitem]").filter({ hasText: "Bốn hệ thức" }).getByText("M3").count()) === 1);
ok("today: no review card yet", (await page.getByRole("link", { name: "Bắt đầu ôn" }).count()) === 0);
await page.screenshot({ path: "e2e/out/student/2-today-after-m3.png", fullPage: true });

// ---- time travel: htl-1 due today; htl-2 also in queue at stage 2, due yesterday (overdue)
await sql(`update public.review_queue set due_on='${vnToday}' where unit_id='htl-1';
  insert into public.unit_progress (student_id, unit_id, worked_viewed_at, faded_done_at) select id,'htl-2',now(),now() from public.students where full_name='Hạnh Nguyên';
  insert into public.review_queue (student_id, unit_id, stage, due_on) select id,'htl-2',2,'${add(vnToday, -1)}' from public.students where full_name='Hạnh Nguyên';`);
await page.goto(`${BASE}/student`);
ok("today: review card 'Ôn lại 2 bài' first", (await page.locator("ul li").first().getByText("Ôn lại 2 bài").count()) === 1);
ok("today: 6 questions + overdue note", (await page.getByText(/6 câu, trộn .* 1 bài quá hạn/).count()) === 1);
await page.screenshot({ path: "e2e/out/student/3-today-review-due.png", fullPage: true });

await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
await page.waitForURL(/review/);
const seq = [];
const asked = [];
const practiceIds = new Set(Object.values(units).flatMap((u) => u.practice.map((it) => it.id)));
for (let i = 0; i < 6; i++) {
  if (i === 2) {
    // F5 after a wrong htl-2 answer: the run resumes, the wrong answer still counts.
    await page.reload();
    ok("review: reload resumes at question 3/6", (await page.getByText("Câu 3/6").count()) === 1);
  }
  const hdr = page.locator("[data-item]");
  const id = await hdr.getAttribute("data-item"); const unit = await hdr.getAttribute("data-unit");
  seq.push(unit);
  asked.push(id);
  // htl-2: get 2 of 3 wrong (fail); htl-1: all right
  const wrong = unit === "htl-2" && seq.filter((u) => u === "htl-2").length <= 2;
  await answer(id, wrong);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  if (i === 0) await page.screenshot({ path: "e2e/out/student/4-review-q1.png", fullPage: true });
  try { await page.getByRole("button", { name: /Câu tiếp|Xem kết quả/ }).click({ timeout: 8000 }); }
  catch (e) { await page.screenshot({ path: "e2e/out/student/fail.png", fullPage: true }); console.log("FAIL at", i, id, unit, await page.locator("[role=alert]").allTextContents()); throw e; }
}
ok("review: interleaved, never same unit twice in a row", seq.every((u, i) => i === 0 || u !== seq[i - 1]), seq.join(","));
ok("review: 3 per unit", seq.filter((u) => u === "htl-1").length === 3 && seq.filter((u) => u === "htl-2").length === 3);
ok("review: no question asked twice across the reload", new Set(asked).size === 6, asked.join(","));
ok("review: questions only from practice (exit solutions stay unseen)", asked.every((id) => practiceIds.has(id)), asked.join(","));
await page.getByRole("radio", { name: "Dễ, làm nhanh" }).click();
ok("review: failed unit has no rating", (await page.getByRole("radio", { name: "Dễ, làm nhanh" }).count()) === 1);
await page.screenshot({ path: "e2e/out/student/5-review-rate.png", fullPage: true });
await page.getByRole("button", { name: "Lưu kết quả ôn" }).click();
await page.getByText("Xong lượt ôn").waitFor();
await page.screenshot({ path: "e2e/out/student/6-review-summary.png", fullPage: true });
const q = await sql(`select unit_id, stage, due_on::text from public.review_queue order by unit_id`);
ok("db: htl-1 passed easy → stage 2, D+11", q[0].stage === 2 && q[0].due_on === add(vnToday, 11), JSON.stringify(q));
ok("db: htl-2 failed → stage 1, D+1", q[1].stage === 1 && q[1].due_on === add(vnToday, 1), JSON.stringify(q));
const log = await sql(`select unit_id, correct, total, passed, rating from public.review_log order by unit_id`);
ok("db: review_log 2 rows", log.length === 2 && log[0].rating === "easy" && log[1].passed === false && log[1].correct === 1, JSON.stringify(log));

// double submit must not re-score
await page.goBack();
await page.goto(`${BASE}/student`);
ok("today: review card gone", (await page.getByRole("link", { name: "Bắt đầu ôn" }).count()) === 0);
await page.screenshot({ path: "e2e/out/student/7-today-end.png", fullPage: true });
// ---- Q5: passing D+21 → maintenance every 60 days, M4
await sql(`update public.review_queue set stage = 3, due_on = '${vnToday}' where unit_id = 'htl-1'`);
await page.goto(`${BASE}/student/review`);
for (let i = 0; i < 3; i++) {
  const id = await page.locator("[data-item]").getAttribute("data-item");
  await answer(id);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: /Câu tiếp|Xem kết quả/ }).click();
}
await page.getByRole("button", { name: "Lưu kết quả ôn" }).click();
await page.getByText("Xong lượt ôn").waitFor();
ok("review: maintenance message after D+21", (await page.getByText(/Ôn duy trì lần tới/).count()) === 1);
const m = await sql(`select stage, due_on::text, completed_at is not null as done from public.review_queue where unit_id = 'htl-1'`);
ok("db: D+21 passed → stage 4, +60 days, completed", m[0].stage === 4 && m[0].due_on === add(vnToday, 60) && m[0].done === true, JSON.stringify(m));
await page.goto(`${BASE}/student`);
ok("today: htl-1 shows M4", (await page.locator("[role=listitem]").filter({ hasText: "Bốn hệ thức" }).getByText("M4").count()) === 1);
await page.screenshot({ path: "e2e/out/student/9-today-m4.png", fullPage: true });

const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", deviceScaleFactor: 2 });
const dp = await dark.newPage(); await dp.goto(`${BASE}/student`); await dp.screenshot({ path: "e2e/out/student/8-today-dark.png", fullPage: true });
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
