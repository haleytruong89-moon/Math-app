// S10 student side: an app-approved KU is visible without its "Cần sửa" item; a priority KU leads Bài mới. Run via e2e/run.sh.
// Each e2e server has its own in-memory DB, so the tutor's verdicts are written here, with hashes from review.ts.
import { chromium } from "playwright";
import fs from "node:fs";
import { reviewables } from "../src/lib/content/review.ts";
const BASE = process.env.BASE ?? "http://localhost:3109";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const unit = JSON.parse(fs.readFileSync("content/xac-suat/b-haib.json", "utf8"));
const fixId = unit.practice[0].id;

const tutor = `(select id from public.profiles where role = 'tutor' limit 1)`;
const rows = reviewables(unit).map((r) =>
  `('b-haib', '${r.id}', '${r.id === fixId ? "fix" : "ok"}', ${r.id === fixId ? "'Đổi số'" : "null"}, '${r.gradingHash}', '${r.contentHash}', ${tutor})`);
await sql(`delete from public.item_reviews; delete from public.unit_approvals; delete from public.tutor_priorities;
  insert into public.item_reviews (unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id) values ${rows.join(", ")};
  insert into public.unit_approvals (unit_id, action, actor_id) values ('b-haib', 'approve', ${tutor});
  insert into public.tutor_priorities (student_id, unit_id, position, set_by) select id, 'b-haib', 1, ${tutor} from public.students where full_name = 'Hạnh Nguyên';`);

await page.goto(`${BASE}/student`);
const first = page.getByRole("link", { name: "Học bài mới" }).first();
ok("Bài mới: the tutor's priority KU first", (await first.getAttribute("href")) === "/student/learn/b-haib", await first.getAttribute("href"));
const r = await page.goto(`${BASE}/student/learn/b-haib`);
ok("learn: app-approved b-haib opens (priority opens it at once)", r.status() === 200, String(r.status()));
const html = await page.content();
const has = (id) => new RegExp(`${id}(?![0-9])`).test(html); // b-haib-p1 ≠ b-haib-p10
ok("learn: the 'Cần sửa' item is hidden", !has(fixId) && has(unit.practice[1].id));
const d = await page.goto(`${BASE}/student/learn/g-giaihpt`);
ok("learn: a draft KU is still 404", d.status() === 404);
// Returned by the tutor → hidden again.
await sql(`insert into public.unit_approvals (unit_id, action, note, actor_id) values ('b-haib', 'return', 'Sai đề', ${tutor})`);
const back = await page.goto(`${BASE}/student/learn/b-haib`);
ok("learn: a returned KU is 404 again", back.status() === 404);
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
