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
ok("today: greeting header + ring", (await page.getByRole("progressbar", { name: "Mục tiêu tuần" }).count()) === 1 && (await page.getByText(/^Chào buổi (sáng|chiều|tối)$/).count()) === 1);
ok("today: only next new unit listed", (await page.getByRole("link", { name: "Học bài mới" }).count()) === 1);
ok("today: journey teaser 0/2", (await page.getByTestId("journey-teaser").getByText("0/2 bài đạt M3+").count()) === 1);
await page.getByTestId("journey-teaser").click();
await page.waitForURL(/\/student\/journey$/);
ok("journey: htl-1 open 🌰, htl-2 locked 🔒 (needs htl-1 at M3)", (await page.getByTestId("node-htl-1").getByText("M0 — Chưa bắt đầu").count()) === 1 && (await page.getByTestId("node-htl-2").getByText(/Khoá — cần đạt M3/).count()) === 1);
ok("journey: summary 0 · 0 · 2", (await page.getByTestId("journey-summary").innerText()).replace(/\s+/g, " ").includes("0 Đã vững 0 Đang học 2 Chưa bắt đầu"));
await page.screenshot({ path: "e2e/out/student/1b-journey-start.png", fullPage: true });
await page.goto(`${BASE}/student`);

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
for (const [i, it] of units["htl-1"].practice.entries()) {
  await answer(it.id);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  if (i === 0) {
    const fb = page.getByTestId("question-feedback");
    await fb.waitFor();
    ok("practice right: celebration + session tally + nudge", (await fb.getByText("Chính xác!").count()) === 1 && (await fb.getByText("Đúng 1/1 câu lượt này").count()) === 1 && (await fb.getByTestId("mastery-nudge").getByText(/Làm thêm 4 câu luyện/).count()) === 1);
    await page.screenshot({ path: "e2e/out/student/1c-practice-right.png", fullPage: true });
  }
  await page.getByRole("button", { name: "Câu tiếp" }).click();
}
await page.getByRole("button", { name: "Làm bài kiểm tra" }).click();
// the exit shows this run's draw from the 8-item bank (LT13): answer each card by its item id
for (let i = 0; i < 5; i++) {
  const card = page.locator("section").filter({ hasText: `Câu ${i + 1}` });
  const k = key[await card.locator("[data-item]").getAttribute("data-item")];
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
await page.goto(`${BASE}/student/journey`);
ok("journey: htl-1 shows M3 🌳 + next review", (await page.getByTestId("node-htl-1").getByText("M3 — Đạt").count()) === 1 && (await page.getByTestId("node-htl-1").getByText(/Ôn D\+1/).count()) === 1);
const mapHeight = await page.evaluate(() => document.documentElement.scrollHeight);
ok("journey: 48-KU map ≤ 2 screens at 390px with one module open", mapHeight <= 2 * 844, `${mapHeight}px`);
await page.screenshot({ path: "e2e/out/student/1c-journey-50.png", fullPage: true });
await page.goto(`${BASE}/student`);
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
let sawWrong = false;
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
  if (wrong && !sawWrong) {
    sawWrong = true;
    const fb = page.getByTestId("question-feedback");
    await fb.waitFor();
    ok("review wrong: answer vs right answer, no retry button", (await fb.getByText("Con trả lời").count()) === 1 && (await fb.getByText("Đáp án đúng").count()) === 1 && (await page.getByRole("button", { name: /Thử lại/ }).count()) === 0);
    await page.screenshot({ path: "e2e/out/student/4b-review-wrong.png", fullPage: true });
  }
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
// ---- Q5: passing D+21 → maintenance every 60 days, M4 (next day: one review session a day, LT8)
await sql(`update public.review_log set created_at = now() - interval '1 day'`);
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
await page.goto(`${BASE}/student/journey`);
ok("journey: htl-1 shows M4 ⭐", (await page.getByTestId("node-htl-1").getByText("M4 — Đã vững").count()) === 1 && (await page.getByTestId("node-htl-1").getByText("⭐").count()) === 1);
await page.goto(`${BASE}/student`);
await page.screenshot({ path: "e2e/out/student/9-today-m4.png", fullPage: true });

// ---- parent-confirmed level shows on the student's map (S4); htl-2 is M1 here
await sql(`insert into public.parent_confirmations (student_id, parent_id, unit_id, level, system_level)
  select id, '00000000-0000-0000-0000-00000000e2e0', 'htl-2', 3, 1 from public.students where full_name = 'Hạnh Nguyên'`);
await page.goto(`${BASE}/student/journey`);
ok("student map: parent-confirmed level with label", (await page.getByTestId("node-htl-2").getByText(/bố mẹ chốt/).count()) === 1);
await page.screenshot({ path: "e2e/out/student/9b-journey.png", fullPage: true });

// ---- homework from the tutor (part B)
await page.goto(`${BASE}/student`);
const goalBefore = await page.getByRole("progressbar").getAttribute("aria-valuenow");
await sql(`
  insert into public.teaching_sessions (student_id, tutor_id, taught_on)
    select a.student_id, a.tutor_id, current_date from public.tutor_assignments a join public.students s on s.id = a.student_id
    where s.full_name = 'Hạnh Nguyên' and a.ended_at is null limit 1;
  insert into public.homework (session_id, student_id, tutor_id, unit_id, task, links, due_on)
    select id, student_id, tutor_id, 'htl-1', 'Làm bài 3, 5 trang 72 SGK', array['https://drive.google.com/file/d/abc/view'], current_date + 3
    from public.teaching_sessions order by created_at desc limit 1;`);
await page.goto(`${BASE}/student`);
const hwCard = page.getByTestId("homework-card");
ok("homework: card on today's list", (await hwCard.count()) === 1 && (await hwCard.getByText("Làm bài 3, 5 trang 72 SGK").count()) === 1);
ok("homework: Drive link opens in a new tab", (await hwCard.getByRole("link", { name: /Mở đề/ }).getAttribute("target")) === "_blank");
await page.screenshot({ path: "e2e/out/student/10-homework.png", fullPage: true });
await hwCard.getByRole("button", { name: "Con làm xong rồi" }).click();
await hwCard.getByRole("button", { name: "Bỏ đánh dấu xong" }).waitFor();
ok("db: homework done_at set", (await sql(`select done_at is not null d from public.homework`))[0].d === true);
ok("homework: weekly goal unchanged", (await page.getByRole("progressbar").getAttribute("aria-valuenow")) === goalBefore);
await sql(`update public.homework set reviewed_at = now(), review_note = 'Bài 5 sai dấu.'`);
await page.reload();
ok("homework: tutor's note shown, no buttons", (await hwCard.getByText(/Thầy\/cô đã chữa/).count()) === 1 && (await hwCard.getByText(/Bài 5 sai dấu/).count()) === 1 && (await hwCard.getByRole("button").count()) === 0);
await sql(`update public.homework set reviewed_at = now() - interval '8 days'`);
await page.reload();
ok("homework: hidden 7 days after correction", (await page.getByTestId("homework-card").count()) === 0);

const [{ id: sid }] = await sql(`select id from public.students where full_name = 'Hạnh Nguyên'`);
await page.goto(`${BASE}/tutor/${sid}/work`);
ok("student: tutor work page not reachable", !page.url().includes("/tutor/"), page.url());

const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", deviceScaleFactor: 2 });
const dp = await dark.newPage(); await dp.goto(`${BASE}/student`); await dp.screenshot({ path: "e2e/out/student/8-today-dark.png", fullPage: true });
await dp.goto(`${BASE}/student/journey`); await dp.screenshot({ path: "e2e/out/student/8b-journey-dark.png", fullPage: true });
ok("dark: student theme background", (await dp.evaluate(() => getComputedStyle(document.querySelector(".student-theme")).backgroundColor)) === "rgb(26, 22, 19)");
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
