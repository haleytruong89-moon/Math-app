// S10 student side (fixture registry): an app-approved KU is visible without its "Cần sửa" item; a priority KU leads
// Bài mới; 23/10: a "Cần sửa" item of a git-approved KU is hidden too. Run via e2e/run.sh.
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
const unit = JSON.parse(fs.readFileSync("e2e/fixtures/content/fx-quick/fd-1.json", "utf8"));
const git = JSON.parse(fs.readFileSync("e2e/fixtures/content/fx-quick/fb-1.json", "utf8"));
const fixId = unit.practice[0].id;

const tutor = `(select id from public.profiles where role = 'tutor' limit 1)`;
const rows = reviewables(unit).map((r) =>
  `('fd-1', '${r.id}', '${r.id === fixId ? "fix" : "ok"}', ${r.id === fixId ? "'Đổi số'" : "null"}, '${r.gradingHash}', '${r.contentHash}', ${tutor})`);
await sql(`delete from public.item_reviews; delete from public.unit_approvals; delete from public.tutor_priorities;
  insert into public.item_reviews (unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id) values ${rows.join(", ")};
  insert into public.unit_approvals (unit_id, action, actor_id) values ('fd-1', 'approve', ${tutor});
  insert into public.tutor_priorities (student_id, unit_id, position, set_by) select id, 'fd-1', 1, ${tutor} from public.students where full_name = 'Hạnh Nguyên';`);

await page.goto(`${BASE}/student`);
// 01/11: a starred KU now surfaces in the "Cần tập trung" block (pick card), not first in "Bài mới".
const focusPick = page.getByTestId("focus-group").getByRole("link", { name: "Học bài này" }).first();
ok("focus: the tutor's priority KU shows in 'Cần tập trung'", (await focusPick.getAttribute("href")) === "/student/learn/fd-1", await focusPick.getAttribute("href"));
const r = await page.goto(`${BASE}/student/learn/fd-1`);
ok("learn: app-approved fd-1 opens (priority opens it at once)", r.status() === 200, String(r.status()));
const html = await page.content();
const has = (id) => new RegExp(`${id}(?![0-9])`).test(html); // fd-1-p1 ≠ fd-1-p10
ok("learn: the 'Cần sửa' item is hidden", !has(fixId) && has(unit.practice[1].id));
const d = await page.goto(`${BASE}/student/learn/fd-2`);
ok("learn: a draft KU is still 404", d.status() === 404);
// Returned by the tutor → hidden again.
await sql(`insert into public.unit_approvals (unit_id, action, note, actor_id) values ('fd-1', 'return', 'Sai đề', ${tutor})`);
const back = await page.goto(`${BASE}/student/learn/fd-1`);
ok("learn: a returned KU is 404 again", back.status() === 404);
// 23/10: "Cần sửa" on a git-approved unit hides that item from the student.
const gr = reviewables(git).find((x) => x.id === "fb-1-p1");
await sql(`insert into public.item_reviews (unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id) values ('fb-1', 'fb-1-p1', 'fix', 'Lý do: x — Sửa: y', '${gr.gradingHash}', '${gr.contentHash}', ${tutor})`);
await page.goto(`${BASE}/student/learn/fb-1`);
const gh = await page.content();
ok("learn: git-approved fb-1 still opens without its 'Cần sửa' item", /fb-1-p2(?![0-9])/.test(gh) && !/fb-1-p1(?![0-9])/.test(gh));
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
