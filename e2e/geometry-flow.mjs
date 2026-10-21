// S5 acceptance on fixture KU fg-1: worked ladder, analysis (wrong level → feedback + node, outline), C3 with
// draw-first, C2 with a distractor and a swapped-but-valid order, exit test with all three, Sổ tay.
// Run via e2e/run.sh (student role, fixture registry).
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3112";
const sql = async (q) => (await fetch(`${BASE}/api/e2e/sql`, { method: "POST", body: JSON.stringify({ sql: q }) })).json();
const ME = `(select id from public.students where full_name = 'Hạnh Nguyên')`;
const shots = "e2e/out/geometry";
fs.mkdirSync(shots, { recursive: true });
const res = [];
const ok = (n, c, extra = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${c ? "" : " " + extra}`);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const rows = async (item) => {
  const r = await sql(`select answer, correct, error_code from public.attempts where item_id = '${item}' order by created_at`);
  return r.rows ?? r ?? [];
};
const next = () => page.getByRole("button", { name: "Câu tiếp theo" }).click();
const check = () => page.getByRole("button", { name: "Kiểm tra", exact: true }).click();

try {
  // ---- worked example: the analysis ladder; proof KU links the Sổ tay
  await page.goto(`${BASE}/student/learn/fg-1`);
  await page.getByTestId("worked-analysis").waitFor();
  ok("worked example shows the analysis ladder", (await page.getByTestId("worked-analysis").innerText()).includes("Mốc giữa thử"));
  ok("proof KU links the Sổ tay", (await page.getByTestId("so-tay-link").getAttribute("href")) === "/student/so-tay");
  await page.screenshot({ path: `${shots}/0-worked.png`, fullPage: true });
  await sql(`insert into public.unit_progress (student_id, unit_id, worked_viewed_at, faded_done_at) select ${ME}, 'fg-1', now(), now();`);
  await page.goto(`${BASE}/student/learn/fg-1`);

  // ---- p1 analysis: wrong at level 1
  await page.getByTestId("analysis-practice").waitFor();
  await page.getByTestId("level-1").getByRole("button", { name: "Hướng sai thử" }).click();
  await page.getByTestId("level-feedback").waitFor();
  ok("analysis: wrong level shows its feedback", (await page.getByTestId("level-feedback").innerText()).includes("không tới giả thiết"));
  ok("analysis: the right node appears so she climbs on", (await page.getByTestId("analysis-node").first().innerText()).includes("Mốc giữa thử"));
  await page.getByRole("button", { name: "Tầng tiếp theo ⇑" }).click();
  await page.getByTestId("level-2").getByRole("button", { name: "Vì giả thiết thử" }).click();
  await page.getByText("Chạm giả thiết ✓").waitFor();
  ok("analysis: last level touches the given", true);
  await page.getByRole("button", { name: /Hoàn thành — lật thành dàn ý/ }).click();
  await page.getByTestId("analysis-outline").waitFor();
  ok("analysis: outline after the item", (await page.getByTestId("analysis-outline").innerText()).includes("suy ra mốc giữa thử"));
  const p1 = await rows("fg-1-p1");
  ok("analysis: one attempt, wrong, E06, option indices", p1.length === 1 && p1[0].correct === false && p1[0].error_code === "E06" && p1[0].answer === "1|0", JSON.stringify(p1));
  await page.screenshot({ path: `${shots}/1-analysis.png`, fullPage: true });
  await next();

  // ---- p2 C3 with draw-first
  await page.getByTestId("proof-input").waitFor();
  ok("draw-first: figure folded", (await page.getByTestId("draw-first").isVisible()) && (await page.getByTestId("svg-figure").count()) === 0);
  await page.getByTestId("draw-first").click();
  ok("draw-first: figure shown after the click", await page.getByTestId("svg-figure").isVisible());
  await page.getByTestId("blank-1").click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do ba" }).click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do hai" }).click(); // auto-advanced to blank 2
  await check();
  await page.getByText("Lí do ba không khớp bước này.").waitFor();
  ok(
    "C3: first wrong blank marked, second right",
    (await page.getByTestId("blank-1").getAttribute("data-right")) === "false" && (await page.getByTestId("blank-2").getAttribute("data-right")) === "true",
  );
  const p2 = await rows("fg-1-p2");
  ok("C3: recorded wrong with E09", p2.length === 1 && p2[0].correct === false && p2[0].error_code === "E09", JSON.stringify(p2));
  await page.screenshot({ path: `${shots}/2-proof.png`, fullPage: true });
  await next();

  // ---- p3 C2 with a distractor
  await page.getByTestId("order-input").waitFor();
  const pool = (t) => page.getByTestId("order-pool").filter({ hasText: t });
  ok("C2: says how many steps are extra", (await page.getByTestId("order-input").innerText()).includes("có 1 bước thừa"));
  for (const t of ["Dòng mở đầu thử", "Dòng thừa thử", "Dòng A thử", "Dòng B thử", "Dòng kết luận thử"]) await pool(t).click();
  await page.screenshot({ path: `${shots}/3a-order-before.png`, fullPage: true });
  await check();
  await page.getByText("Dòng này là bước thừa.").waitFor();
  ok("C2: the distractor line is marked as the first wrong one", (await page.locator("[data-wrong=true]").innerText()).includes("Dòng thừa thử"));
  await page.screenshot({ path: `${shots}/3-order.png`, fullPage: true });
  await next();

  // ---- p4, p5 numeric
  for (const n of ["4", "5"]) {
    await page.getByLabel("Đáp số").fill(n);
    await check();
    await next();
  }

  // ---- retries: analysis right, C3 right, C2 right in the swapped order (B before A)
  await page.getByTestId("level-1").getByRole("button", { name: "Hướng đúng thử" }).click();
  await page.getByRole("button", { name: "Tầng tiếp theo ⇑" }).click();
  await page.getByTestId("level-2").getByRole("button", { name: "Vì giả thiết thử" }).click();
  await page.getByRole("button", { name: /Hoàn thành — lật thành dàn ý/ }).click();
  await page.getByTestId("analysis-outline").waitFor();
  await next();
  await page.getByTestId("draw-first").click();
  await page.getByTestId("blank-1").click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do một" }).click();
  await page.getByTestId("bank-choice").filter({ hasText: "lí do hai" }).click();
  await check();
  await next();
  for (const t of ["Dòng mở đầu thử", "Dòng B thử", "Dòng A thử", "Dòng kết luận thử"]) await pool(t).click();
  await check();
  await next();
  const retry = [(await rows("fg-1-p1")).at(-1), (await rows("fg-1-p2")).at(-1), (await rows("fg-1-p3")).at(-1)];
  ok("retries right: analysis, C3, C2 in a swapped valid order", retry.every((r) => r?.correct === true), JSON.stringify(retry));

  // ---- exit: the three types answered right
  await page.getByRole("button", { name: "Làm bài kiểm tra" }).click();
  const ana = page.getByTestId("analysis-input");
  await ana.getByRole("button", { name: "Hướng đúng thử" }).click();
  await ana.getByRole("button", { name: "Vì giả thiết thử" }).click();
  ok("exit analysis: a pick is final", await ana.getByRole("button", { name: "Hướng sai thử" }).isDisabled());
  const exitProof = page.getByTestId("proof-input");
  await exitProof.getByTestId("blank-1").click();
  await exitProof.getByTestId("bank-choice").filter({ hasText: "lí do một" }).click();
  await exitProof.getByTestId("bank-choice").filter({ hasText: "lí do hai" }).click();
  for (const t of ["Dòng mở đầu thử", "Dòng A thử", "Dòng B thử", "Dòng kết luận thử"])
    await page.getByTestId("order-input").getByTestId("order-pool").filter({ hasText: t }).click();
  const boxes = page.getByLabel("Đáp số");
  await boxes.nth(0).fill("4");
  await boxes.nth(1).fill("5");
  await page.screenshot({ path: `${shots}/4a-exit-filled.png`, fullPage: true });
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await page.getByText("Kết quả bài kiểm tra").waitFor();
  const exitRows = await sql(`select item_id, correct from public.attempts where unit_id = 'fg-1' and mode = 'exit'`);
  const er = exitRows.rows ?? exitRows ?? [];
  ok("exit: 5/5 with analysis, C3, C2", er.length === 5 && er.every((r) => r.correct === true), JSON.stringify(er));
  await page.screenshot({ path: `${shots}/4-exit.png`, fullPage: true });

  // ---- Sổ tay (approved fixture)
  await page.goto(`${BASE}/student/so-tay`);
  ok("so-tay: approved handbook visible to the student", (await page.getByTestId("so-tay-goal").innerText()).includes("Cách thử"));
  await page.screenshot({ path: `${shots}/6-so-tay.png`, fullPage: true });
} catch (e) {
  ok("flow ran to the end", false, String(e).slice(0, 300));
  await page.screenshot({ path: `${shots}/error.png`, fullPage: true });
}

ok("no browser errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(res.join("\n"));
process.exit(res.some((r) => r.startsWith("FAIL")) ? 1 : 0);
