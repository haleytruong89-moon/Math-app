// Tutor "Ghi buổi dạy" flow against PGlite (S3 acceptance criteria). Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3102";
const C = "content/he-thuc-luong";
const title = Object.fromEntries(["htl-1", "htl-2"].map((u) => [u, JSON.parse(fs.readFileSync(`${C}/${u}.json`, "utf8")).title]));
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const vnToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
const add = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

const shots = "e2e/out/tutor";
fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
let taps = 0;
const tap = async (loc) => { taps++; await loc.click(); };
const unitBox = (id) => page.locator(`input[name="unit"][value="${id}"]`);
const level = (id, n) => page.locator(`label:has(input[name="level:${id}"][value="${n}"])`);
const save = () => page.getByRole("button", { name: "Lưu buổi dạy" });
const counts = async () => (await sql(`select (select count(*)::int from public.teaching_sessions) s, (select count(*)::int from public.tutor_proposals) p`))[0];

// Evidence for htl-1: worked example seen, practice 4/5, last exit 3/5 → system M2, 10 answers.
await sql(`
  delete from public.tutor_proposals; delete from public.teaching_sessions; delete from public.attempts; delete from public.unit_progress;
  insert into public.unit_progress (student_id, unit_id, worked_viewed_at, faded_done_at) select id, 'htl-1', now(), now() from public.students where full_name='Hạnh Nguyên';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, exit_run)
    select s.id, 'htl-1', v.item, v.mode::public.attempt_mode, '1', v.ok, case when v.mode = 'exit' then '11111111-1111-4111-8111-111111111111'::uuid end
    from public.students s, (values ('htl-1-p1','practice',true),('htl-1-p2','practice',true),('htl-1-p3','practice',false),('htl-1-p4','practice',true),('htl-1-p5','practice',true),
      ('htl-1-x1','exit',true),('htl-1-x2','exit',true),('htl-1-x3','exit',true),('htl-1-x4','exit',false),('htl-1-x5','exit',false)) v(item, mode, ok)
    where s.full_name='Hạnh Nguyên';`);

// ---- home: only the assigned student
await page.goto(`${BASE}/tutor`);
ok("home: assigned student listed", (await page.getByText("Hạnh Nguyên").count()) === 1);
ok("home: unassigned student hidden (RLS)", (await page.getByText("Đăng An").count()) === 0);
ok("home: 'chưa ghi buổi nào'", (await page.getByText("chưa ghi buổi nào").count()) === 1);
await page.screenshot({ path: `${shots}/1-home.png`, fullPage: true });

// ---- evidence appears on tick, before choosing a level
await tap(page.getByRole("link", { name: "Ghi buổi dạy" }));
await page.waitForURL(/\/tutor\/[0-9a-f-]{36}$/);
const formUrl = page.url();
ok("form: date defaults to today", (await page.locator('input[name="taughtOn"]').inputValue()) === vnToday);
ok("form: no evidence before ticking", (await page.getByTestId("evidence-htl-1").count()) === 0);
await tap(unitBox("htl-1"));
const ev = page.getByTestId("evidence-htl-1");
ok("evidence: system level M2 shown on tick", (await ev.getByText("Hệ thống tính: M2").count()) === 1);
ok("evidence: answer count", (await ev.getByText("10 câu đã làm").count()) === 1);
ok("evidence: last exit 3/5 + practice 80%", (await page.getByText(/Kiểm tra gần nhất 3\/5 · 5 câu luyện gần nhất đúng 80%/).count()) === 1);
await tap(unitBox("htl-2"));
ok("evidence: htl-2 'chưa đủ dữ liệu'", (await page.getByTestId("evidence-htl-2").getByText(/chưa đủ dữ liệu/).count()) === 1);
await tap(level("htl-1", 3));
await page.screenshot({ path: `${shots}/2-form-ticked.png`, fullPage: true });

// ---- missing level blocks the save and names the unit
await tap(save());
await page.locator("form [role=alert]").waitFor();
const alert = await page.locator("form [role=alert]").innerText();
ok("missing level: refused, names htl-2 only", alert.includes(title["htl-2"]) && !alert.includes(title["htl-1"]), alert);
ok("missing level: nothing written", JSON.stringify(await counts()) === JSON.stringify({ s: 0, p: 0 }));
const kept = [await unitBox("htl-2").isChecked(), await page.locator('input[name="level:htl-1"][value="3"]').isChecked(), await page.locator('input[name="taughtOn"]').inputValue()];
ok("missing level: earlier choices kept (ticks, M3, date)", kept[0] && kept[1] && kept[2] === vnToday, JSON.stringify(kept));
await page.screenshot({ path: `${shots}/3-missing-level.png`, fullPage: true });

// ---- complete and save: 2 units, 1 session
await tap(level("htl-2", 0));
await page.locator('textarea[name="note"]').fill("Còn nhầm hình chiếu BH với CH.");
await tap(save());
await page.locator("form [role=status]").filter({ hasText: "Đã lưu lúc" }).waitFor();
ok("save: 'Đã lưu lúc HH:MM' shown", /Đã lưu lúc \d{2}:\d{2}/.test(await page.locator("form [role=status]").innerText()));
ok(`save: tap count for 2 units ≤ 10 (${taps} incl. one refused save)`, taps <= 10, `taps=${taps}`);
const rows = await sql(`select ts.taught_on::text d, ts.note, tp.unit_id, tp.level, tp.system_level, tp.answers, ts.tutor_id::text t
  from public.teaching_sessions ts join public.tutor_proposals tp on tp.session_id = ts.id order by tp.unit_id`);
ok("db: one session, two proposals with system snapshot",
  rows.length === 2 && rows[0].d === vnToday && rows[0].unit_id === "htl-1" && rows[0].level === 3 && rows[0].system_level === 2 && rows[0].answers === 10
  && rows[1].level === 0 && rows[1].system_level === 0 && rows[0].note === "Còn nhầm hình chiếu BH với CH." && rows[0].t.endsWith("e2e2"), JSON.stringify(rows));
ok("save: form emptied", !(await unitBox("htl-1").isChecked()) && (await page.locator('textarea[name="note"]').inputValue()) === "");
const recent = page.getByRole("list", { name: "Buổi đã ghi" });
ok("recent: session listed with proposal vs system", (await recent.getByText("đề xuất M3 · hệ thống M2").count()) === 1);
await page.screenshot({ path: `${shots}/4-saved.png`, fullPage: true });

// ---- server-side guards (bypassing the browser's own checks)
await page.locator('input[name="taughtOn"]').evaluate((el) => el.removeAttribute("max"));
await page.locator('input[name="taughtOn"]').fill(add(vnToday, 1));
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("guard: future date refused", (await page.locator("form [role=alert]").innerText()).includes("tương lai"));
await page.goto(formUrl);
await page.locator('input[name="taughtOn"]').evaluate((el) => el.removeAttribute("min"));
await page.locator('input[name="taughtOn"]').fill(add(vnToday, -8));
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("guard: more than 7 days back refused", (await page.locator("form [role=alert]").innerText()).includes("7 ngày"));
await page.goto(formUrl);
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("guard: empty session (no unit, no note) refused", (await page.locator("form [role=alert]").innerText()).includes("ít nhất một bài"));
await page.locator('textarea[name="note"]').fill("Chữa đề kiểm tra giữa kỳ ở trường.");
await save().click();
await page.locator("form [role=status]").filter({ hasText: "Đã lưu lúc" }).waitFor();
ok("note-only session saved", (await counts()).s === 2);
ok("home: last logged date shown", await page.goto(`${BASE}/tutor`).then(() => page.getByText(`buổi ghi gần nhất ${vnToday.slice(8)}/${vnToday.slice(5, 7)}`).count()) === 1);
// A note with line breaks that the counter shows as 500/500 must save (the form sends CRLF).
await page.goto(formUrl);
await page.locator('textarea[name="note"]').fill(`${"x".repeat(49)}\n`.repeat(9) + "x".repeat(50));
ok("note: multi-line 500/500 shown", (await page.getByText("500/500").count()) === 1);
await save().click();
await page.locator("form [role=status]").filter({ hasText: "Đã lưu lúc" }).waitFor({ timeout: 8000 }).catch(() => {});
const long = await sql(`select char_length(note) as n, position(chr(13) in note) as cr from public.teaching_sessions where char_length(note) > 400`);
ok("note: multi-line 500 chars saved, stored without CR", long.length === 1 && long[0].n === 500 && long[0].cr === 0, JSON.stringify(long));
await sql(`delete from public.teaching_sessions where char_length(note) > 400`);

// ---- "Bài làm của con": wrong answers with what the student typed
await sql(`
  update public.attempts set answer = '0', error_code = 'E08' where item_id = 'htl-1-p3';
  update public.attempts set answer = '225', error_code = 'E10' where item_id = 'htl-1-x4';
  update public.attempts set answer = '144', error_code = 'E10' where item_id = 'htl-1-x5';
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
    select id, 'htl-1', 'htl-1-p3', 'practice', '1', true from public.students where full_name = 'Hạnh Nguyên';`);
await page.goto(`${BASE}/tutor`);
await page.getByRole("link", { name: "Xem bài làm" }).click();
await page.waitForURL(/\/work$/);
const workUrl = page.url();
ok("work: unit list with common error E10 × 2", (await page.getByTestId("work-summary-htl-1").getByText("E10 × 2").count()) === 1);
ok("work: tutor's own proposal shown", (await page.getByTestId("work-summary-htl-1").getByText(/Bạn đề xuất M3/).count()) === 1);
await page.getByTestId("work-summary-htl-1").click();
await page.waitForURL(/unit=htl-1/);
ok("work: wrong-only by default (3)", (await page.getByTestId("work-entry").count()) === 3 && (await page.getByRole("link", { name: "Chỉ câu sai (3)" }).count()) === 1);
const x4 = page.locator('[data-testid=work-entry][data-item="htl-1-x4"]');
ok("work: student answer + right answer + feedback", (await x4.getByText("225").count()) >= 1 && (await x4.getByText("15").count()) >= 1 && (await x4.getByText(/Còn bước lấy căn bậc hai/).count()) === 1);
ok("work: 'Lần sau làm đúng' on p3", (await page.locator('[data-testid=work-entry][data-item="htl-1-p3"]').getByText("Lần sau làm đúng").count()) === 1);
await page.screenshot({ path: `${shots}/6-work-wrong.png`, fullPage: true });
await page.getByRole("link", { name: /^Tất cả \(/ }).click();
await page.waitForURL(/all=1/);
ok("work: 'Tất cả' shows 11", (await page.getByTestId("work-entry").count()) === 11);
await page.goto(`${workUrl}?unit=../../etc`);
ok("work: unknown unit falls back to the list", (await page.getByTestId("work-summary-htl-1").count()) === 1);
await page.goto(formUrl);
await unitBox("htl-1").check();
const evLink = page.getByRole("link", { name: "Xem câu sai →" });
ok("form: evidence links to wrong answers in a new tab", (await evLink.getAttribute("href"))?.endsWith("/work?unit=htl-1") && (await evLink.getAttribute("target")) === "_blank");

// ---- homework (part B): give it with the session, see the student's "done", mark corrected
await page.goto(formUrl);
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await page.getByRole("button", { name: "+ Giao bài về nhà" }).click();
ok("homework: due defaults to today + 3", (await page.locator('input[name="hw.0.due"]').inputValue()) === add(vnToday, 3));
await page.locator('input[name="hw.0.link"]').fill("https://drive.google.com/file/d/abc/view");
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("homework: link without a task refused", (await page.locator("form [role=alert]").innerText()).includes("ghi yêu cầu"));
await page.locator('select[name="hw.0.unit"]').selectOption("htl-1");
await page.locator('textarea[name="hw.0.task"]').fill("Làm bài 3, 5 trang 72 SGK");
await page.getByRole("button", { name: "+ thêm link" }).click();
await page.locator('input[name="hw.0.link"]').nth(1).fill("https://example.com/de.pdf");
ok("homework: non-Drive link warned", (await page.getByText(/không phải link Google Drive/).count()) === 1);
await page.locator('input[name="hw.0.link"]').nth(1).fill("");
await page.screenshot({ path: `${shots}/7-homework-form.png`, fullPage: true });
await save().click();
await page.locator("form [role=status]").filter({ hasText: "giao 1 bài về nhà" }).waitFor();
const hwRows = await sql(`select h.unit_id, h.links, h.due_on::text due from public.homework h`);
ok("db: homework saved with the session", hwRows.length === 1 && hwRows[0].unit_id === "htl-1" && hwRows[0].links.length === 1 && hwRows[0].due === add(vnToday, 3), JSON.stringify(hwRows));
await page.reload();
const openHw = page.getByTestId("open-homework");
ok("homework: listed as not done yet", (await openHw.count()) === 1 && (await openHw.getByText("Con chưa báo xong").count()) === 1);
await sql(`update public.homework set done_at = now()`);
await page.reload();
ok("homework: shows the student's 'done'", (await openHw.getByText(/Con đã báo xong/).count()) === 1);
await openHw.locator('textarea[name="reviewNote"]').fill("Bài 5 sai dấu, đã chữa.");
await openHw.getByRole("button", { name: "Đã chữa" }).click();
await openHw.waitFor({ state: "detached" });
const rv = await sql(`select reviewed_at is not null r, review_note from public.homework`);
ok("db: homework corrected with note", rv[0].r === true && rv[0].review_note === "Bài 5 sai dấu, đã chữa.", JSON.stringify(rv));
// keep the later session counts (2) unchanged: the cascade removes the proposal and homework too
await sql(`delete from public.teaching_sessions where id in (select session_id from public.homework)`);

// ---- S9: homework on another unit of the app (not taught today) + what the student did there
await page.goto(formUrl);
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await page.getByRole("button", { name: "+ Giao bài về nhà" }).click();
const opts = await page.locator('select[name="hw.0.unit"] optgroup[label="Bài khác trong app"] option').allTextContents();
ok("S9: picker offers other units of the app", opts.includes(title["htl-2"]), JSON.stringify(opts));
await page.locator('select[name="hw.0.unit"]').selectOption("htl-2");
ok("S9: tells the tutor the unit opens for the student", (await page.getByText(/Làm trên app/).count()) === 1);
await page.locator('textarea[name="hw.0.task"]').fill("Làm phần luyện tập htl-2 trên app");
await save().click();
await page.locator("form [role=status]").filter({ hasText: "giao 1 bài về nhà" }).waitFor();
ok("db: S9 homework saved on htl-2", (await sql(`select unit_id from public.homework`))[0]?.unit_id === "htl-2");
await page.reload();
const appRes = page.getByTestId("homework-app-result");
ok("S9: tutor sees 'not done in the app yet'", (await appRes.count()) === 1 && (await appRes.innerText()).includes("con chưa làm"), await appRes.innerText().catch(() => ""));
await sql(`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
  select id, 'htl-2', 'htl-2-p1', 'practice', '1', true from public.students where full_name='Hạnh Nguyên'`);
await page.reload();
ok("S9: tutor sees the app result since the homework", (await appRes.innerText()).includes("luyện tập 1/1 đúng"), await appRes.innerText());
await sql(`delete from public.attempts where unit_id = 'htl-2'; delete from public.teaching_sessions where id in (select session_id from public.homework)`);

// ---- dark mode, evidence open
const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", deviceScaleFactor: 2 });
const dp = await dark.newPage();
await dp.goto(formUrl);
await dp.locator('input[name="unit"][value="htl-1"]').check();
await dp.locator('label:has(input[name="level:htl-1"][value="2"])').click();
await dp.screenshot({ path: `${shots}/5-form-dark.png`, fullPage: true });

// ---- assignment ended → cannot log, student disappears
await page.goto(formUrl);
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await sql(`update public.tutor_assignments set ended_at = now()`);
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("ended assignment: save refused", (await page.locator("form [role=alert]").innerText()).includes("không còn được phân công"));
ok("ended assignment: still 2 sessions", (await counts()).s === 2);
await page.goto(`${BASE}/tutor`);
ok("ended assignment: student gone from home", (await page.getByText("Hạnh Nguyên").count()) === 0);
ok("ended assignment: form URL is 404", (await page.goto(formUrl)).status() === 404);
ok("ended assignment: work URL is 404", (await page.goto(workUrl)).status() === 404);
await sql(`update public.tutor_assignments set ended_at = null`);
await page.goto(formUrl);
await unitBox("htl-1").check(); await level("htl-1", 2).click();
await sql(`update public.profiles set is_active = false where role = 'tutor'`);
await save().click();
await page.locator("form [role=alert]").waitFor();
ok("locked tutor: save refused", (await page.locator("form [role=alert]").innerText()).includes("không còn được phân công"));
await sql(`update public.profiles set is_active = true where role = 'tutor'`);

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
