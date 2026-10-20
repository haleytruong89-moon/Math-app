// S11 student: hand-picked homework opens from the card, no worked-example gate, answers count as practice.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3111";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const errors = [];
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
const htl1 = JSON.parse(fs.readFileSync("content/he-thuc-luong/htl-1.json", "utf8"));
const key = Object.fromEntries(htl1.practice.map((it) => [it.id, it.type === "mcq" ? { mcq: it.correct } : { num: it.answer }]));
// Each e2e server has its own in-memory DB: give the homework here (as assign-flow does through the tutor's form).
const items = htl1.practice.filter((i) => i.type !== "steps").slice(0, 2).map((i) => i.id);
await sql(`delete from public.homework; delete from public.unit_progress where unit_id = 'htl-1'; delete from public.attempts where unit_id = 'htl-1';
  insert into public.homework (student_id, tutor_id, unit_id, items, task, due_on)
    select s.id, p.id, 'htl-1', array['${items.join("','")}'], 'Làm 2 câu "htl-1" trên app.', current_date + 3
    from public.students s, public.profiles p where s.full_name = 'Hạnh Nguyên' and p.role = 'tutor';`); // no worked example viewed
const hw = { id: (await sql(`select id from public.homework`))[0].id, items };
await page.goto(`${BASE}/student`);
const link = page.getByTestId("homework-app-link");
ok("card: 'Làm 2 câu trên app'", (await link.innerText()).includes("Làm 2 câu trên app"));
await link.click();
await page.waitForURL(new RegExp(`/student/homework/${hw.id}`));
for (const id of hw.items) {
  const k = key[id];
  if (k.mcq !== undefined) await page.getByRole("radio").nth(k.mcq).check(); else await page.getByLabel("Đáp số").fill(k.num);
  await page.getByRole("button", { name: /^Kiểm tra$/ }).click();
  await page.getByRole("button", { name: "Câu tiếp theo" }).click();
}
await page.getByText("Xong bài về nhà").waitFor();
const rows = await sql(`select item_id, mode, correct from public.attempts where unit_id = 'htl-1' order by id`);
ok("db: both answers recorded as practice, right", rows.length === 2 && rows.every((r) => r.mode === "practice" && r.correct), JSON.stringify(rows));
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
