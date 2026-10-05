// Parent "Tài khoản": student profiles (list, rename, delete with typed name) + create a linked login.
// Run via e2e/run.sh (parent role).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3103";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/accounts";
fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 900 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));

// ---- list: the seeded student with login + tutor
await page.goto(`${BASE}/parent/accounts`);
const [{ id: nguyen }] = await sql(`select id from public.students where full_name = 'Hạnh Nguyên'`);
const row = (id) => page.getByTestId(`student-${id}`);
ok("list: Nguyên shows login email and tutor", (await row(nguyen).getByText("Đăng nhập: s@e2e").count()) === 1 && (await row(nguyen).getByText("Gia sư: Cô Trang").count()) === 1);
ok("form: email hint says it is not a username", (await page.getByText(/không phải tên người dùng/).count()) === 1);

// ---- add a profile → shown without login → link goes to the create form with it preselected
await page.locator('input[name="fullName"]').last().fill("Thử Xoá");
await page.locator('input[name="grade"]').last().fill("9");
await page.getByRole("button", { name: "Thêm" }).click();
await page.getByText("Đã thêm Thử Xoá.").waitFor();
const [{ id: tmp }] = await sql(`select id from public.students where full_name = 'Thử Xoá'`);
await page.reload();
ok("list: new profile flagged without login", (await row(tmp).getByText(/Chưa có tài khoản đăng nhập/).count()) === 1);
await row(tmp).getByRole("link", { name: /tạo tài khoản cho Thử Xoá/ }).click();
await page.waitForURL(new RegExp(`student=${tmp}`));
ok("create form: role student + profile preselected", (await page.locator('select[name="role"]').inputValue()) === "student" && (await page.locator('#tao-tai-khoan select[name="studentId"]').inputValue()) === tmp);
await page.locator('#tao-tai-khoan input[name="displayName"]').fill("Thử");
await page.locator('#tao-tai-khoan input[name="email"]').fill("thu+xoa@example.com");
await page.locator('#tao-tai-khoan input[name="password"]').fill("matkhau123456");
await page.getByRole("button", { name: "Tạo tài khoản" }).click();
await page.getByText("Đã tạo tài khoản cho Thử.").waitFor();
const linked = await sql(`select u.email from public.students s join auth.users u on u.id = s.profile_id where s.id = '${tmp}'`);
ok("db: login created and linked to the profile", linked[0]?.email === "thu+xoa@example.com", JSON.stringify(linked));

// ---- rename
await page.goto(`${BASE}/parent/accounts`);
await row(tmp).getByText("Sửa").click();
await row(tmp).locator('input[name="fullName"]').fill("Thử Xoá Hai");
await row(tmp).locator('input[name="grade"]').fill("8");
await row(tmp).getByRole("button", { name: "Lưu" }).click();
await row(tmp).locator("b", { hasText: "Thử Xoá Hai" }).waitFor();
ok("rename: name and grade saved", (await sql(`select full_name, grade from public.students where id = '${tmp}'`))[0]?.grade === 8);

// ---- delete: shows what will be lost, refuses a wrong name, then removes profile + data + login
await sql(`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct)
  values ('${tmp}', 'htl-1', 'htl-1-p1', 'practice', '1', true), ('${tmp}', 'htl-1', 'htl-1-p2', 'practice', '0', false)`);
await page.reload();
await row(tmp).getByText("Xoá hồ sơ").click();
ok("delete: impact shown", (await row(tmp).getByText(/Sẽ xoá vĩnh viễn: 2 câu đã làm, tài khoản đăng nhập\./).count()) === 1);
await row(tmp).locator('input[name="confirmName"]').fill("Thu Xoa Hai");
await row(tmp).getByRole("button", { name: "Xoá vĩnh viễn" }).click();
await row(tmp).getByText(/Gõ đúng họ tên/).waitFor();
ok("delete: wrong name refused, nothing removed", (await sql(`select count(*)::int c from public.students where id = '${tmp}'`))[0].c === 1);
await page.screenshot({ path: `${shots}/1-delete-confirm.png`, fullPage: true });
await row(tmp).locator('input[name="confirmName"]').fill("  thử xoá hai ");
await row(tmp).getByRole("button", { name: "Xoá vĩnh viễn" }).click();
await row(tmp).waitFor({ state: "detached" });
const left = (await sql(`select (select count(*)::int from public.students where id = '${tmp}') s,
  (select count(*)::int from public.attempts where student_id = '${tmp}') a,
  (select count(*)::int from auth.users where email = 'thu+xoa@example.com') u,
  (select count(*)::int from public.students where full_name = 'Hạnh Nguyên') keep`))[0];
ok("db: profile, its answers and its login removed; others kept", left.s === 0 && left.a === 0 && left.u === 0 && left.keep === 1, JSON.stringify(left));

await page.screenshot({ path: `${shots}/2-after-delete.png`, fullPage: true });
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
