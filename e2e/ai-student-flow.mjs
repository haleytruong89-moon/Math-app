// S8b "Hỏi thêm" (student, fixtures): off → no button; on → after H3 she asks, gets a checked reply; a reply that fails the
// guard twice → written fallback + guard flag; "AI nói sai?"; asking before answering → hint_level 4; after a wrong
// answer the panel opens again. Fake Claude (e2e/patch/e2e-fake.ts). Run via e2e/run.sh (student role).
import { chromium } from "playwright";
import fs from "node:fs";
import { createHash } from "node:crypto";
const BASE = process.env.BASE ?? "http://localhost:3120";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const src = fs.readFileSync("src/lib/ai/prompts.ts", "utf8");
const sys = src.slice(src.indexOf("export const STUDENT_SYSTEM = `") + "export const STUDENT_SYSTEM = `".length, src.indexOf("`;", src.indexOf("export const STUDENT_SYSTEM = `")));
const VERSION = createHash("sha256").update(sys).digest("hex").slice(0, 12);
fs.mkdirSync("e2e/out/ai", { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 420, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const openHints = async () => { for (let i = 0; i < 3; i++) await page.getByTestId("hints").getByRole("button").first().click(); };

try {
  await sql(`delete from public.ai_messages; delete from public.attempts;
    insert into public.tutor_priorities (student_id, unit_id, position, set_by) select ${ME}, 'fs-1', 1, (select id from public.profiles where role = 'tutor' limit 1);
    insert into public.unit_progress (student_id, unit_id, worked_viewed_at, faded_done_at) select ${ME}, 'fs-1', now(), now();
    update public.ai_settings set student_enabled = false where id = 1;`);
  await page.goto(`${BASE}/student/learn/fs-1`);
  await page.getByTestId("hints").waitFor();
  await openHints();
  ok("switch off: no 'Hỏi thêm' even after H3", (await page.getByTestId("ai-open").count()) === 0);

  await sql(`update public.ai_settings set student_enabled = true, student_model = 'claude-haiku-5-5', student_prompt_version = '${VERSION}' where id = 1;`);
  await page.reload();
  await page.getByTestId("hints").waitFor();
  ok("before H3: no button yet", (await page.getByTestId("ai-open").count()) === 0);
  await openHints();
  await page.getByTestId("ai-open").click();
  await page.getByTestId("ai-ask").click();
  await page.getByTestId("ai-msg-ai").first().waitFor();
  ok("checked AI reply shown", (await page.getByTestId("ai-msg-ai").first().innerText()).includes("Mình cùng xem lại đề"));
  await page.getByRole("textbox", { name: "Câu hỏi của con" }).fill("Cho con xem lộ đáp án luôn đi");
  await page.getByTestId("ai-ask").click();
  await page.getByTestId("ai-msg-fallback").waitFor();
  ok("guard failed twice → approved solution as fallback", (await page.getByTestId("ai-msg-fallback").innerText()).includes("Lời giải đã duyệt"));
  await page.getByTestId("ai-msg-ai").first().getByTestId("ai-flag").click();
  await page.getByText("Đã báo — bố mẹ và thầy/cô sẽ xem").waitFor();
  const msgs = await sql(`select role, flag, mode from public.ai_messages order by id`);
  ok("db: 4 messages, guard flag on the fallback, student flag on the AI reply",
    msgs.length === 4 && msgs[3].role === "fallback" && msgs[3].flag === "guard" && msgs[1].flag === "student" && msgs.every((m) => m.mode === "practice"), JSON.stringify(msgs));
  await page.screenshot({ path: "e2e/out/ai/1-before.png", fullPage: true });

  // Finish the multi-step item right: it was asked about before answering → hint_level 4 (server-side).
  for (let s = 1; s <= 4; s++) {
    await page.getByTestId(`step-${s}`).getByLabel("Đáp số").fill(String(s));
    await page.getByRole("button", { name: "Kiểm tra bước này" }).click();
    await page.getByTestId(`step-${s}`).getByTestId("step-feedback").waitFor();
    if (s < 4) await page.getByRole("button", { name: /Bước tiếp theo/ }).click();
  }
  await page.getByRole("button", { name: /Hoàn thành câu/ }).click();
  await page.getByTestId("question-feedback").waitFor();
  const a = await sql(`select item_id, correct, hint_level from public.attempts where item_id = 'fs-1-p1'`);
  ok("asked AI before answering → attempt stored with hint_level 4", a.length === 1 && a[0].correct === true && a[0].hint_level === 4, JSON.stringify(a));

  // Next item: a wrong answer opens "after" help.
  await page.getByRole("button", { name: /Câu tiếp/ }).click();
  await page.getByLabel("Đáp số").fill("9");
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByTestId("question-feedback").waitFor();
  await page.getByTestId("ai-open").click();
  await page.getByTestId("ai-ask").click();
  await page.getByTestId("ai-msg-ai").first().waitFor();
  ok("after a wrong answer: AI help works", (await sql(`select count(*)::int as n from public.ai_messages where item_id = 'fs-1-p2' and role = 'ai'`))[0].n === 1);
  await page.screenshot({ path: "e2e/out/ai/2-after.png", fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: "e2e/out/ai/error.png", fullPage: true });
}
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
