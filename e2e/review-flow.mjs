// S10 tutor flow on the fixture registry: Kho bài → ⭐ → review the draft fd-1 item by item (one "Cần sửa" with reason +
// how to fix) → approve; 23/10: "Cần sửa" also works on a git-approved unit (fb-1). Run via e2e/run.sh.
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3108";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const shots = "e2e/out/review"; fs.mkdirSync(shots, { recursive: true });
const res = []; const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
const unit = JSON.parse(fs.readFileSync("e2e/fixtures/content/fx-quick/fd-1.json", "utf8"));
const total = 1 + unit.practice.length + unit.exit.length;
const fixId = unit.practice[0].id;

await sql(`delete from public.item_reviews; delete from public.unit_approvals; delete from public.tutor_priorities;`);
const sid = (await sql(`select id from public.students where full_name='Hạnh Nguyên'`))[0].id;

await page.goto(`${BASE}/tutor/${sid}/bai`);
ok("shelf: fd-1 waiting for review", (await page.getByTestId("shelf-fd-1").getByText("Chờ duyệt").count()) === 1);
await page.goto(`${BASE}/tutor/${sid}/bai?loc=da`);
ok("shelf: approved fa-1 under 'Đã duyệt'", (await page.getByTestId("shelf-fa-1").count()) === 1);
await page.goto(`${BASE}/tutor/${sid}/bai?loc=cho`);
await page.getByTestId("shelf-fd-1").getByRole("button", { name: "Ưu tiên luyện trước" }).click();
await page.getByTestId("priority-list").getByText(unit.title).waitFor();
ok("priority: ⭐ adds fd-1 to the list", (await sql(`select unit_id, position from public.tutor_priorities`)).length === 1);
await page.screenshot({ path: `${shots}/1-shelf.png`, fullPage: true });

await page.getByTestId("shelf-fd-1").getByRole("link", { name: /Duyệt/ }).click();
await page.waitForURL(/\/bai\/fd-1/);
ok("review: approve blocked before reviewing", (await page.getByTestId("approve-blocked").count()) === 1);
const box = await page.getByRole("button", { name: /Đạt — câu tiếp/ }).boundingBox();
ok("review: verdict bar visible without scrolling (1280×720)", !!box && box.y + box.height <= 720, JSON.stringify(box));
for (let i = 0; i < total; i++) {
  const id = await page.locator("[data-item]").getAttribute("data-item");
  if (id === fixId) {
    await page.getByRole("button", { name: "! Cần sửa" }).click();
    await page.getByLabel("Lý do cần sửa").fill("Số khó nhẩm");
    await page.getByLabel("Hướng dẫn Claude sửa").fill("Đổi số cho dễ nhẩm hơn");
    await page.getByRole("button", { name: "Gửi góp ý" }).click();
  } else await page.getByRole("button", { name: /Đạt — câu tiếp/ }).click();
  // The action redirects to the next item; wait until the panel shows another one (the last verdict stays put).
  if (i < total - 1) await page.waitForFunction((old) => document.querySelector("[data-item]")?.getAttribute("data-item") !== old, id);
}
await page.reload();
await page.getByTestId("review-progress").filter({ hasText: `đã xem ${total}/${total}` }).waitFor();
await page.screenshot({ path: `${shots}/2-reviewed.png`, fullPage: true });
ok("review: every item has a verdict", (await sql(`select count(distinct item_id)::int c from public.item_reviews`))[0].c === total);
ok("review: the fix note is saved", (await sql(`select note from public.item_reviews where item_id='${fixId}'`))[0]?.note === "Lý do: Số khó nhẩm — Sửa: Đổi số cho dễ nhẩm hơn");
await page.getByRole("button", { name: "Duyệt cả bài" }).click();
await page.getByText(/Đã duyệt — con thấy bài này ngay/).waitFor();
ok("approve: one approval row", (await sql(`select action from public.unit_approvals`)).map((r) => r.action).join() === "approve");
await page.goto(`${BASE}/tutor/${sid}/bai?loc=da`);
ok("shelf: fd-1 now 'Đã duyệt'", (await page.getByTestId("shelf-fd-1").getByText("Đã duyệt").count()) === 1);

// 23/10: a git-approved unit still takes a "Cần sửa" (reason + how), and asks for both.
await page.goto(`${BASE}/tutor/${sid}/bai/fb-1?item=fb-1-p1`);
ok("approved unit: review note and verdict bar shown", (await page.getByTestId("approved-review-note").count()) === 1 && (await page.getByRole("button", { name: "! Cần sửa" }).count()) === 1);
await page.getByRole("button", { name: "! Cần sửa" }).click();
await page.getByLabel("Lý do cần sửa").fill("Đề thiếu đơn vị");
await page.getByLabel("Hướng dẫn Claude sửa").fill("Thêm đơn vị cm vào đề");
await page.getByRole("button", { name: "Gửi góp ý" }).click();
await page.waitForFunction(() => document.querySelector("[data-item]")?.getAttribute("data-item") !== "fb-1-p1");
ok("approved unit: the fix note is saved", (await sql(`select note from public.item_reviews where item_id='fb-1-p1'`))[0]?.note === "Lý do: Đề thiếu đơn vị — Sửa: Thêm đơn vị cm vào đề");
await page.screenshot({ path: `${shots}/3-approved-fix.png`, fullPage: true });
ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
