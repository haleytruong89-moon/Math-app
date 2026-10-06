// S6b acceptance on the fixture KU fs-1: a 4-step practice item wrong at step 2 (feedback for that step,
// whole item wrong with step 2's code, one attempts row), hints H1→H3 + hint_level, "Ôn lại" link → read-only
// recap, a 2-step exit item graded right, SVG figure in light and dark, "Cần gia sư xác nhận" badge.
// Run via e2e/run.sh (student role, fixture registry).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3107";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const shots = "e2e/out/items"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

// fs-1 is locked behind fc-1: the parent unlocks it; the worked example and faded steps are done.
await sql(`insert into public.unit_unlocks (student_id, unit_id, unlocked_by) select ${ME}, 'fs-1', '00000000-0000-0000-0000-00000000e2e0';
  insert into public.unit_progress (student_id, unit_id, worked_viewed_at, faded_done_at) select ${ME}, 'fs-1', now(), now();`);

// ---- LT6 badge on the map
await page.goto(`${BASE}/student/journey`);
ok("LT6: 'Cần gia sư xác nhận' on the map node", (await page.getByTestId("node-fs-1").getByTestId("tutor-badge").count()) === 1);

// ---- practice item 1: figure, hints, 4 steps
await page.goto(`${BASE}/student/learn/fs-1`);
await page.getByTestId("steps-practice").waitFor();
const fig = page.getByTestId("svg-figure").first();
ok("LT7: SVG figure shown with its alt text", (await fig.getAttribute("aria-label")) === "Tam giác thử");
const strokeIn = async (scheme) => {
  await page.emulateMedia({ colorScheme: scheme });
  return page.evaluate(() => getComputedStyle(document.querySelector("[data-testid=svg-figure] path")).stroke);
};
const light = await strokeIn("light"), dark = await strokeIn("dark");
ok("LT7: figure follows the theme (stroke differs light / dark)", light && dark && light !== dark, `${light} / ${dark}`);
await page.emulateMedia({ colorScheme: "light" });
await page.screenshot({ path: `${shots}/1-practice.png`, fullPage: true });

await page.getByRole("button", { name: "💡 Gợi ý" }).click();
await page.getByRole("button", { name: "Gợi ý tiếp" }).click();
ok("AI2: hints open one at a time (H1, H2 shown, H3 not yet)", (await page.getByTestId("hint-1").count()) === 1 && (await page.getByTestId("hint-2").count()) === 1 && (await page.getByTestId("hint-3").count()) === 0);

const step = (n) => page.getByTestId(`step-${n}`);
const answerStep = async (n, v) => {
  await step(n).getByLabel("Đáp số").fill(v);
  await page.getByRole("button", { name: "Kiểm tra bước này" }).click();
  await step(n).getByTestId("step-feedback").waitFor();
};
await answerStep(1, "1");
ok("steps: step 1 right", (await step(1).getByTestId("step-feedback").getAttribute("data-correct")) === "true");
await page.getByRole("button", { name: "Bước tiếp theo →" }).click();
await answerStep(2, "99");
const fb2 = step(2).getByTestId("step-feedback");
ok("steps: step 2 wrong → its own feedback + the right value to carry on", (await fb2.getAttribute("data-correct")) === "false" && /chưa rút gọn hết/.test(await fb2.innerText()) && /Giá trị đúng của bước này/.test(await fb2.innerText()));
ok("LT16: 'Ôn lại' link to the prerequisite", (await step(2).getByTestId("review-link").getAttribute("href")) === "/student/recap/fc-1");
await page.getByRole("button", { name: "Bước tiếp theo →" }).click();
await answerStep(3, "3");
await page.getByRole("button", { name: "Bước tiếp theo →" }).click();
await answerStep(4, "4");
ok("steps: nothing recorded before the item is complete", (await sql(`select count(*)::int c from public.attempts where item_id = 'fs-1-p1'`))[0].c === 0);
await page.getByRole("button", { name: "Hoàn thành câu" }).click();
const qf = page.getByTestId("question-feedback");
await qf.waitFor();
ok("steps: whole item wrong, labelled with step 2's error", (await qf.getAttribute("data-correct")) === "false" && /Trình bày|chưa hoàn thiện/i.test(await qf.innerText()), await qf.innerText());
const row = await sql(`select correct, error_code, answer, hint_level from public.attempts where item_id = 'fs-1-p1'`);
ok("steps: one attempts row — wrong, E11, answers joined by |, hint_level 2", row.length === 1 && row[0].correct === false && row[0].error_code === "E11" && row[0].answer === "1|99|3|4" && row[0].hint_level === 2, JSON.stringify(row));
ok("hinted / wrong item comes back at the end", (await page.getByText("Câu này sẽ quay lại cuối bài.").count()) === 1);
await page.screenshot({ path: `${shots}/2-steps-feedback.png`, fullPage: true });

// ---- the recap opens read-only and changes nothing
const before = (await sql(`select count(*)::int c from public.unit_progress where unit_id = 'fc-1'`))[0].c;
const recap = await ctx.newPage();
await recap.goto(`${BASE}/student/recap/fc-1`);
ok("LT16: recap shows the earlier KU's theory + worked example", (await recap.getByText("Ôn lại bài nền").count()) === 1 && (await recap.getByRole("heading", { name: "Hình học thử 1" }).count()) === 1 && (await recap.getByRole("heading", { name: "Lời giải mẫu" }).count()) === 1);
ok("LT16: recap records nothing", (await sql(`select count(*)::int c from public.unit_progress where unit_id = 'fc-1'`))[0].c === before);
await recap.close();

// ---- exit test with a 2-step item (bank of 5 → used whole)
await page.goto(`${BASE}/student/learn/fs-1`);
await page.getByRole("navigation", { name: "Các phần của bài" }).getByRole("button", { name: /Kiểm tra/ }).click();
const q1 = page.locator("section").filter({ hasText: "Câu 1" });
await q1.getByTestId("steps-input").waitFor();
ok("exit: no hints in the test", (await page.getByRole("button", { name: "💡 Gợi ý" }).count()) === 0);
await q1.getByLabel("Đáp số").nth(0).fill("1");
await q1.getByLabel("Đáp số").nth(1).fill("2");
for (let n = 2; n <= 5; n++) await page.locator("section").filter({ hasText: `Câu ${n}` }).getByLabel("Đáp số").fill(String(n));
await page.getByRole("button", { name: "Nộp bài" }).click();
await page.getByText("Kết quả bài kiểm tra").waitFor();
const x1 = await sql(`select correct, answer from public.attempts where item_id = 'fs-1-x1'`);
ok("exit: the 2-step item graded right as one answer", x1.length === 1 && x1[0].correct === true && x1[0].answer === "1|2", JSON.stringify(x1));
ok("exit: 5/5", (await page.getByText("5/5").count()) >= 1);

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
