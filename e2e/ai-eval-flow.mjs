// S8b test set (parent, fixtures): the switch refuses a model that hasn't passed; build cases from real wrong answers,
// run them (fake Claude), score 20 → the model passes → "Hỏi thêm" turns on. Run via e2e/run.sh (parent role).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3121";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const PARENT = `'00000000-0000-0000-0000-00000000e2e0'`;
fs.mkdirSync("e2e/out/ai", { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const msg = async (text) => page.getByText(text).first().waitFor({ timeout: 15000 });

try {
  await sql(`delete from public.ai_eval_results; delete from public.ai_eval_cases; delete from public.attempts;
    update public.ai_settings set student_enabled = false, student_prompt_version = null where id = 1;
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) select ${ME}, 'fs-1', 'fs-1-p1', 'practice', '1|99|3|4', false, 'E11';
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) select ${ME}, 'fs-1', 'fs-1-p1', 'practice', '1|99|3|4', false, 'E11';
    insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) select ${ME}, 'fs-1', 'fs-1-p2', 'practice', '7', false, 'E01';`);
  // The switch can't go on before the test set passes.
  await page.goto(`${BASE}/parent/ai`);
  await page.getByTestId("student-enabled").check();
  await page.getByTestId("student-ai").getByRole("button", { name: "Lưu cài đặt Hỏi thêm" }).click();
  await msg("chưa đạt bộ test");
  ok("switch refused before the test set passes", (await sql(`select student_enabled from public.ai_settings where id = 1`))[0].student_enabled === false);

  await page.goto(`${BASE}/parent/ai/bo-test`);
  await page.getByRole("button", { name: "Tạo bộ test từ lỗi thật của con" }).click();
  await msg("Đã thêm");
  const built = await sql(`select item_id, stage, error_code from public.ai_eval_cases order by id`);
  ok("cases built from real wrong answers first (most frequent first) + a 'before' case", built[0]?.item_id === "fs-1-p1" && built[0]?.error_code === "E11" && built.some((c) => c.stage === "before"), JSON.stringify(built.slice(0, 4)));
  // Top up to 20 so the pass rule can be reached on the small fixture content.
  const need = Math.max(0, 20 - built.length);
  for (let i = 0; i < need; i++)
    await sql(`insert into public.ai_eval_cases (unit_id, item_id, mode, stage, answer, error_code, question, created_by) values ('fs-1', 'fs-1-p${2 + (i % 4)}', 'practice', 'after', '${50 + i}', 'E01', 'Con chưa hiểu ${i}', ${PARENT})`);
  for (let round = 0; round < 6; round++) {
    await page.getByRole("button", { name: "Chạy các tình huống chưa có kết quả" }).click();
    await page.waitForTimeout(1500);
    const left = (await sql(`select count(*)::int as n from public.ai_eval_cases c where not archived and not exists (select 1 from public.ai_eval_results r where r.case_id = c.id)`))[0].n;
    if (!left) break;
  }
  const results = await sql(`select count(*)::int as n from public.ai_eval_results`);
  ok("every case ran (batches of 6)", results[0].n >= 20, JSON.stringify(results));
  await page.goto(`${BASE}/parent/ai/bo-test`);
  for (let i = 0; i < 20; i++) {
    const before = await page.getByTestId("scored").count();
    await page.getByRole("button", { name: "Lưu điểm" }).first().click();
    await page.waitForFunction((n) => document.querySelectorAll('[data-testid="scored"]').length > n, before, { timeout: 15000 });
  }
  ok("20 scored → Haiku passes", (await page.getByTestId("eval-claude-haiku-5-5").innerText()).includes("Đạt — bật được cho con"));
  await page.screenshot({ path: "e2e/out/ai/3-eval.png", fullPage: true });

  await page.goto(`${BASE}/parent/ai`);
  await page.getByTestId("student-enabled").check();
  await page.getByTestId("student-ai").getByRole("button", { name: "Lưu cài đặt Hỏi thêm" }).click();
  await msg("Đã bật Hỏi thêm cho con.");
  const s = (await sql(`select student_enabled, student_model, student_prompt_version from public.ai_settings where id = 1`))[0];
  ok("switch on for the passed model + current prompt version", s.student_enabled === true && s.student_model === "claude-haiku-5-5" && /^[0-9a-f]{12}$/.test(s.student_prompt_version ?? ""), JSON.stringify(s));
  await page.reload();
  ok("AI page shows 'đang bật'", (await page.getByTestId("student-ai-state").innerText()).includes("đang bật"));
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: "e2e/out/ai/eval-error.png", fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
