// S6a acceptance on the fixture content (e2e/fixtures/content): suggestions, unlock, test-out, 2-in-progress cap,
// manual unlock seen by the student, 5-unit review cap. Run via e2e/run.sh (student role, fixture registry).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3105";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const shots = "e2e/out/curriculum"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const newCards = () => page.getByRole("region", { name: "Bài mới" }).locator("li");
const titlesOf = async (loc) => (await loc.allInnerTexts()).join(" | ");
const waitOrExplain = async (loc) => { try { await loc.waitFor({ timeout: 15000 }); } catch (e) { console.log("ALERTS:", await page.locator("[role=alert]").allInnerTexts()); await page.screenshot({ path: `${shots}/fail.png`, fullPage: true }); throw e; } };

// ---- 1. a new student sees 2 suggestions: first of track A (fz-1) + first of track B (fb-1)
await page.goto(`${BASE}/student`);
ok("suggest: 2 cards, track A first + track B first", (await newCards().count()) === 2 && /Bù lỗ hổng thử 1/.test(await titlesOf(newCards())) && /Ghi điểm thử 1/.test(await titlesOf(newCards())), await titlesOf(newCards()));
ok("suggest: locked KUs not offered", !/Đại số thử 1|Ghi điểm thử 2/.test(await titlesOf(newCards())));
await page.screenshot({ path: `${shots}/1-home.png`, fullPage: true });
await page.goto(`${BASE}/student/journey`);
ok("journey: locked 🔒 and coming soon", (await page.getByTestId("node-fa-1").getByText(/Khoá — cần đạt M3/).count()) === 1 && (await page.getByTestId("node-fl-1").getByText("Sắp có").count()) === 1);
ok("journey: only the active module expanded", (await page.getByTestId("module-backfill-fx").getAttribute("open")) !== null && (await page.getByTestId("module-fx-geo").getAttribute("open")) === null);
await page.screenshot({ path: `${shots}/2-journey.png`, fullPage: true });

// ---- 2. test-out fb-1 passed → M3 + review D+1; fb-2 unlocks; no second test-out
await page.goto(`${BASE}/student`);
await newCards().filter({ hasText: "Ghi điểm thử 1" }).getByRole("link", { name: /Làm bài kiểm tra luôn/ }).click();
await page.waitForURL(/fb-1\?testout=1/);
for (let n = 1; n <= 5; n++) await page.locator("section").filter({ hasText: `Câu ${n}` }).getByLabel("Đáp số").fill(String(n));
await page.getByRole("button", { name: "Nộp bài" }).click();
await waitOrExplain(page.getByTestId("testout-result"));
ok("test-out pass: message", (await page.getByTestId("testout-result").getByText(/đã qua kiểm tra vượt/).count()) === 1);
const q1 = await sql(`select stage, due_on::text from public.review_queue where unit_id = 'fb-1'`);
const t1 = await sql(`select testout_at is not null t from public.unit_progress where unit_id = 'fb-1'`);
ok("test-out pass: review D+1 + test-out recorded", q1[0]?.stage === 1 && q1[0]?.due_on === add(vnToday, 1) && t1[0]?.t === true, JSON.stringify([q1, t1]));
await page.goto(`${BASE}/student`);
ok("after pass: fb-2 offered (prerequisite at M3)", /Ghi điểm thử 2/.test(await titlesOf(newCards())), await titlesOf(newCards()));
await page.goto(`${BASE}/student/learn/fb-1?testout=1`);
ok("test-out only once: normal lesson, not the test", (await page.getByText("Kiểm tra vượt:").count()) === 0);

// ---- 3. test-out fz-1 failed → learning as usual, mastery unchanged, counted as in progress
await page.goto(`${BASE}/student`);
await newCards().filter({ hasText: "Bù lỗ hổng thử 1" }).getByRole("link", { name: /Làm bài kiểm tra luôn/ }).click();
await page.waitForURL(/fz-1\?testout=1/);
for (let n = 1; n <= 5; n++) await page.locator("section").filter({ hasText: `Câu ${n}` }).getByLabel("Đáp số").fill("9");
await page.getByRole("button", { name: "Nộp bài" }).click();
await waitOrExplain(page.getByTestId("testout-result"));
ok("test-out fail: message + start learning", (await page.getByTestId("testout-result").getByText(/Chưa qua/).count()) === 1 && (await page.getByRole("link", { name: "Bắt đầu học bài này" }).count()) === 1);
ok("test-out fail: no review scheduled", (await sql(`select count(*)::int c from public.review_queue where unit_id = 'fz-1'`))[0].c === 0);
await page.goto(`${BASE}/student/journey`);
ok("test-out fail: mastery stays M0 (answers not counted)", (await page.getByTestId("node-fz-1").getByText(/^M0 —/).count()) === 1);
await page.goto(`${BASE}/student`);
ok("test-out fail: KU is now 'Đang học'", (await page.getByRole("region", { name: "Đang học" }).getByText("Bù lỗ hổng thử 1").count()) === 1);

// ---- 4. manual unlock (written by the parent) → the student sees it in the suggestions
await sql(`insert into public.unit_unlocks (student_id, unit_id, unlocked_by) select ${ME}, 'fa-2', '00000000-0000-0000-0000-00000000e2e0'`);
await page.goto(`${BASE}/student`);
ok("manual unlock: fa-2 offered although fa-1 is not M3", /Đại số thử 2/.test(await titlesOf(newCards())), await titlesOf(newCards()));

// ---- 5. two KUs in progress → no new suggestion
await sql(`insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select ${ME}, 'fc-1', now()`);
await page.goto(`${BASE}/student`);
ok("2 in progress: no 'Bài mới'", (await page.getByRole("region", { name: "Bài mới" }).count()) === 0);

// ---- 6. track A first KU reaches M3 → the next one opens
await sql(`update public.unit_progress set worked_viewed_at = now(), faded_done_at = now() where unit_id = 'fz-1';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, exit_run)
    select ${ME}, 'fz-1', 'fz-1-x' || n, 'exit', n::text, true, '22222222-2222-4222-8222-222222222222' from generate_series(1, 5) n;`);
await page.goto(`${BASE}/student/journey`);
ok("fz-1 at M3 → fa-1 unlocked", (await page.getByTestId("node-fa-1").getByText(/Khoá/).count()) === 0 && (await page.getByTestId("node-fa-1").getByText(/^M0 —/).count()) === 1);

// ---- 7. 7 units due → one session of the 5 most overdue; the other 2 tomorrow
const seven = ["fz-1", "fa-1", "fa-2", "fb-1", "fb-2", "fb-3", "fc-1"];
await sql(`delete from public.review_queue;
  insert into public.review_queue (student_id, unit_id, stage, due_on) values ${seven.map((u, i) => `(${ME}, '${u}', 1, '${add(vnToday, -7 + i)}')`).join(", ")};`);
await page.goto(`${BASE}/student`);
ok("review card: 5 today, 2 later", (await page.getByRole("region", { name: "Ôn lại" }).getByText(/5 bài đến hạn · còn 2 bài, ôn ngày mai/).count()) === 1);
await page.goto(`${BASE}/student/review`);
ok("review session: 5 units", (await page.getByText("Ôn lại · trộn 5 bài").count()) === 1);
await page.screenshot({ path: `${shots}/3-review-5.png`, fullPage: true });
// finish today's session (5 most overdue) the way finishReview does
const first5 = seven.slice(0, 5);
await sql(`update public.review_queue set stage = 2, due_on = '${add(vnToday, 7)}' where unit_id in (${first5.map((u) => `'${u}'`).join(", ")});
  insert into public.review_log (student_id, unit_id, run_id, stage, correct, total, passed, rating, due_on, next_due_on)
    select ${ME}, u, '33333333-3333-4333-8333-333333333333', 1, 3, 3, true, 'normal', '${vnToday}', '${add(vnToday, 7)}' from unnest(array[${first5.map((u) => `'${u}'`).join(", ")}]) u;`);
await page.goto(`${BASE}/student`);
ok("after today's session: 'còn 2 bài, ôn ngày mai'", (await page.getByText(/Hôm nay con đã ôn xong\. Còn 2 bài, ôn ngày mai\./).count()) === 1 && (await page.getByRole("link", { name: "Bắt đầu ôn" }).count()) === 0);
await sql(`update public.review_log set created_at = now() - interval '1 day'`);
await page.goto(`${BASE}/student/review`);
ok("next day: the 2 remaining units", (await page.getByText("Ôn lại · trộn 2 bài").count()) === 1);

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
