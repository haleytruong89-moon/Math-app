// Parent preview of a unit (D16): gating, feedback, answer formats, exit test. Run via e2e/run.sh.
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3101";
const shots = "e2e/out/preview";
import fs from "node:fs"; fs.mkdirSync(shots, { recursive: true });
const htl2 = JSON.parse(fs.readFileSync("content/he-thuc-luong/htl-2.json", "utf8"));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const results = [];
const ok = (name, cond) => { results.push(`${cond ? "PASS" : "FAIL"} ${name}`); };

for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("console", m => m.type()==="error" && errors.push(m.text()));
  await page.goto(`${BASE}/parent/content`);
  await page.screenshot({ path: `${shots}/${scheme}-1-content-list.png`, fullPage: true });
  if (scheme === "dark") { await ctx.close(); continue; }
  ok("content list shows 2 approved units", (await page.getByText(/^Đã duyệt \d/).count()) === 2);

  await page.locator('a[href$="/htl-2"]').filter({ hasText: "Xem trước" }).click();
  await page.waitForURL(/htl-2/);
  ok("katex rendered", (await page.locator(".katex").count()) > 5);
  ok("faded locked at start", await page.getByRole("button", { name: /Điền bước/ }).isDisabled());
  ok("exit locked at start", await page.getByRole("button", { name: /Kiểm tra/ }).first().isDisabled());
  await page.screenshot({ path: `${shots}/2-learn.png`, fullPage: true });
  // reveal worked steps one by one
  ok("only 1 step at start", (await page.getByText(/^Bước \d$/).count()) === 1);
  while (await page.getByRole("button", { name: /Bước tiếp theo/ }).count()) await page.getByRole("button", { name: /Bước tiếp theo/ }).click();
  await page.getByText("Vì sao làm bước này?").first().click();
  await page.screenshot({ path: `${shots}/3-learn-all-steps.png`, fullPage: true });
  await page.getByRole("button", { name: /sang phần điền bước/ }).click();

  // faded
  const input = () => page.getByLabel("Đáp số").last();
  await input().fill("21");
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByText("Không cộng thẳng hai cạnh").waitFor();
  ok("faded: mistake feedback E04 shown", true);
  await input().fill("15");
  await page.getByRole("button", { name: /Kiểm tra lại/ }).click();
  await page.getByText("Đúng rồi!").first().waitFor();
  await input().fill("hai");
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByText(/Chưa đọc được đáp số/).waitFor();
  ok("faded: unreadable input -> format hint", true);
  await input().fill("5,4");
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: "Sang phần luyện tập" }).waitFor();
  ok("faded: 5,4 accepted for 27/5", true);
  await page.screenshot({ path: `${shots}/4-faded-done.png`, fullPage: true });
  await page.getByRole("button", { name: "Sang phần luyện tập" }).click();

  // practice (driven by the content file; the last item is answered with a rounded value first)
  const last = htl2.practice.length - 1;
  for (const [i, it] of htl2.practice.entries()) {
    if (it.type === "mcq") await page.getByRole("radio").nth(it.correct).check();
    else await input().fill(i === last ? "6,708" : it.answer);
    await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
    await page.getByRole("button", { name: "Câu tiếp" }).waitFor();
    if (i === last) { ok("practice: rounded 3√5 rejected, comes back, no nudge in preview", (await page.getByText("Chưa đúng", { exact: true }).count()) === 1 && (await page.getByText("Câu này sẽ quay lại cuối bài.").count()) === 1 && (await page.getByTestId("mastery-nudge").count()) === 0); await page.screenshot({ path: `${shots}/5-practice-wrong.png`, fullPage: true }); }
    await page.getByRole("button", { name: "Câu tiếp" }).click();
  }
  ok("practice: wrong item comes back", (await page.getByText("làm lại câu sai").count()) === 1);
  await input().fill(htl2.practice[last].answer);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: "Câu tiếp" }).click();
  ok("practice summary 7/8", (await page.getByText("7/8").count()) === 1);
  await page.getByRole("button", { name: "Làm bài kiểm tra" }).click();

  // exit: the preview shows the whole bank (8); all right except x1 (64 = AB², not AB)
  const card = (i) => page.locator("section").filter({ hasText: `Câu ${i + 1}` });
  ok("exit: preview shows the 8-item bank", (await page.getByTestId("exit-bank-note").count()) === 1);
  ok("exit: no feedback before submit", (await page.getByText("Lời giải:").count()) === 0);
  for (const [i, it] of htl2.exit.entries()) {
    if (it.type === "mcq") await card(i).getByRole("radio").nth(it.correct).check();
    else await card(i).getByLabel("Đáp số").fill(i === 0 ? "abc" : it.answer);
  }
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByText(/Câu 1: chưa đọc được/).waitFor();
  ok("exit: unreadable answer blocks submit", true);
  await card(0).getByLabel("Đáp số").fill("64");
  await page.screenshot({ path: `${shots}/6-exit-filled.png`, fullPage: true });
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByText("Kết quả bài kiểm tra").waitFor();
  ok("exit: score 7/8", (await page.getByText("7/8").count()) >= 1);
  ok("exit: E11 feedback for 64", (await page.getByText("là $AB^2$").count()) === 0 && (await page.getByText(/Còn bước lấy căn bậc hai/).count()) >= 1);
  await page.screenshot({ path: `${shots}/7-exit-result.png`, fullPage: true });
  ok("no browser errors", errors.length === 0); if (errors.length) console.log(errors);
  await ctx.close();
}
// htl-1 dark full page learn for visual check
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto(`${BASE}/parent/content/htl-1`);
while (await p.getByRole("button", { name: /Bước tiếp theo/ }).count()) await p.getByRole("button", { name: /Bước tiếp theo/ }).click();
await p.screenshot({ path: `${shots}/dark-htl1-learn.png`, fullPage: true });
await p.getByRole("button", { name: /sang phần điền bước/ }).click();
await p.getByRole("radio").nth(1).check();
await p.getByRole("button", { name: /^Kiểm tra$/ }).click();
await p.getByText("Tam giác $ACH$").count();
await p.waitForTimeout(800);
await p.screenshot({ path: `${shots}/dark-htl1-faded-wrong.png`, fullPage: true });
await p.goto(`${BASE}/parent`);
await p.getByRole("link", { name: "Xem bài làm" }).first().click();
await p.waitForURL(/\/parent\/students\/[0-9a-f-]{36}\/work$/);
ok("parent: work page opens", (await p.getByRole("heading", { name: /Bài làm của/ }).count()) === 1);
await p.screenshot({ path: `${shots}/dark-parent-work.png`, fullPage: true });
await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
