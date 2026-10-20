# Tutor laptop polish Implementation Plan

> **For agentic workers:** Implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the tutor's login and the 5-tab workspace comfortable on a laptop from 1366×768 up (review without scrolling for the buttons, sticky assign panel, wide work view, aligned header, clearer login).

**Architecture:** UI-only changes in existing components plus one pure fix (canonical JSON for `content_hash`). No SQL, no new routes.

**Tech Stack:** Next.js 16 App Router, React 19 client components, Tailwind v4, `node --test`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-10-21-tutor-laptop-polish-design.md`

## Global Constraints

- Every layout works from 1366 px wide up and still on a 390 px phone (flex-wrap / grid breakpoints, no fixed widths over 360 px).
- Vietnamese UI text, English code; theme tokens only; no streaks (D17).
- Same review component for tutor and parent (`ReviewWorkbench`).
- Before push: `npm run lint`, `npm test`, `npm run build`, `./e2e/run.sh` (commit first).
- Branch `p1-tutor-polish` from `main` (S11 merged, SQL 0013 applied).

---

### Task 1: Canonical content hash (spec #7)

**Files:** Modify `src/lib/content/review.ts:26`; Test `src/lib/content/review.test.ts`

**Interfaces:** Produces `canonicalJson(v: unknown): string` (exported for the test).

- [ ] **Step 1: Failing test** (append to `review.test.ts`, add `canonicalJson` to the import):

```ts
test("content hash ignores key order (a schema change must not flip every 'fix' to 'changed')", () => {
  assert.equal(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }), canonicalJson({ a: [{ c: 3, d: 2 }], b: 1 }));
  assert.equal(canonicalJson({ a: [2, 1] }) === canonicalJson({ a: [1, 2] }), false); // array order still counts
  const p1 = draft.practice[0];
  const reordered = Object.fromEntries(Object.entries(p1).reverse());
  const r1 = reviewables(draft).find((x) => x.id === p1.id)!;
  const r2 = reviewables({ ...draft, practice: [reordered, ...draft.practice.slice(1)] } as Unit).find((x) => x.id === p1.id)!;
  assert.equal(r1.contentHash, r2.contentHash);
});
```

- [ ] **Step 2: Run** `node --test src/lib/content/review.test.ts` → FAIL (`canonicalJson` is not exported).
- [ ] **Step 3: Implement** in `review.ts`:

```ts
/** JSON with object keys sorted at every level, so hashes don't depend on key order (arrays keep their order). */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

const h16 = (v: unknown) => createHash("sha256").update(canonicalJson(v)).digest("hex").slice(0, 16);
```

(`grading_hash` is unchanged — it comes from `itemHash` in `lock.ts` — so every "ok" stays ok. A "fix" recorded before this change shows "↻ xem lại" once.)

- [ ] **Step 4: Run** → PASS; `npm run test:content` → PASS.
- [ ] **Step 5: Commit** `git commit -am "Review: canonical JSON for content_hash (key order no longer matters)"`

### Task 2: Sticky verdict bar on the review screen (spec #1)

**Files:** Modify `src/components/review/verdict-form.tsx`, `src/components/review/workbench.tsx`

**Interfaces:** `VerdictForm({ unitId, itemId, back, note, progress })` — `progress: string` (e.g. "đã xem 11/17 · 1 cần sửa").

- [ ] **Step 1: Rewrite `verdict-form.tsx`**: a `fixed inset-x-0 bottom-0 z-20` bar (`border-t bg-surface/95 backdrop-blur`), inner `mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-2`: `[✓ Đạt — câu tiếp]` (submit `verdict=ok`), `[! Cần sửa]` (type=button: first click opens the note row; the note row has `textarea name="note"` (required, autoFocus) + submit `verdict=fix` "Gửi góp ý"), progress text on the right, error line. When `note` (existing fix note) is given the note row starts open with it. Keyboard: none.
- [ ] **Step 2: Workbench**: pass `progress`; add `pb-28` to the page's outer wrapper so the last content isn't hidden under the bar; keep `data-testid="review-progress"` in the header.
- [ ] **Step 3: e2e** — `e2e/review-flow.mjs`: viewport 1280×720; before the loop assert the "Đạt" button is in the viewport without scrolling:

```js
const box = await page.getByRole("button", { name: /Đạt — câu tiếp/ }).boundingBox();
ok("review: verdict bar visible without scrolling", !!box && box.y + box.height <= 720);
```

and for the fix item: click "! Cần sửa", fill the note, click "Gửi góp ý".
- [ ] **Step 4: Verify** lint, build, the review flow; **Commit** "Review: sticky verdict bar".

### Task 3: Giao bài — sticky panel, live count, auto-navigating KU picker (spec #2)

**Files:** Modify `src/components/tutor/assign-form.tsx`; Create `src/components/tutor/unit-picker.tsx`; Modify `src/app/tutor/[studentId]/giao/page.tsx`

**Interfaces:** `UnitPicker({ units: { id: string; title: string; star: boolean }[]; value: string | null; mode: string })` (client; `router.push("?unit=…&mode=…")` on change).

- [ ] **Step 1:** `assign-form.tsx`: aside gets `sticky top-4 self-start`; count state from the checkboxes (`onChange` on the list container → count `input[name=item]:checked`); show `Đã chọn {n} câu` above the button; in items mode the button is disabled when `n === 0`; "Chọn nhanh" buttons update the count too.
- [ ] **Step 2:** `unit-picker.tsx` (client) replaces the GET form + "Chọn" button in the page:

```tsx
"use client";
import { useRouter } from "next/navigation";

export function UnitPicker({ units, value, mode }: { units: { id: string; title: string; star: boolean }[]; value: string | null; mode: string }) {
  const router = useRouter();
  return (
    <label className="flex flex-wrap items-center gap-2">
      <span className="font-display text-xs font-semibold uppercase tracking-wide text-muted">Bài</span>
      <select name="unit" defaultValue={value ?? undefined} onChange={(e) => router.push(`?${new URLSearchParams({ unit: e.target.value, mode })}`)}
        className="rounded-lg border border-border bg-surface px-3 py-2 font-display font-semibold">
        {units.map((u) => <option key={u.id} value={u.id}>{u.star ? "★ " : ""}{u.title}</option>)}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: e2e** — `assign-flow.mjs`: after checking 2 items assert `page.getByText("Đã chọn 2 câu")`; `tutor-flow.mjs` S9 step: `page.locator('select[name="unit"]').selectOption("htl-2")` then `waitForURL(/unit=htl-2/)` instead of opening the URL directly.
- [ ] **Step 4: Verify + Commit** "Giao bài: sticky panel, picked count, KU picker navigates on change".

### Task 4: Làm thử banner + back link (spec #3)

**Files:** Modify `src/components/lesson/lesson-player.tsx:76`, `src/app/tutor/[studentId]/bai/[unitId]/thu/page.tsx`

- [ ] **Step 1:** banner text → `Chế độ xem trước — bấm thử như học sinh, <b>không ghi dữ liệu</b>.` (keeps the draft/approved sentence).
- [ ] **Step 2:** try page: `<Link href={back}>← Về màn duyệt</Link>` above the player and `<TutorTabs … active="bai" />` at the top (look up the student name like the review page).
- [ ] **Step 3:** check `e2e/preview-flow.mjs` for the old wording (`grep -n "xem trước của phụ huynh" e2e/*.mjs` → none today). **Commit** "Làm thử: neutral preview banner, back to review".

### Task 5: Bài làm on a laptop (spec #4)

**Files:** Modify `src/components/work/student-work.tsx`, `src/app/tutor/[studentId]/work/page.tsx`

**Interfaces:** `StudentWork` prop `back` becomes optional (`back?: { href: string; label: string }`).

- [ ] **Step 1:** list = units with any graded answer or a proposal (`done`) in `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`, then `<details>` "Chưa làm ({n})" with the rest in the same grid; empty `done` → a short line "Con chưa làm câu nào trên app."; the unit detail keeps `max-w-3xl`.
- [ ] **Step 2:** back link only when `back` is set or a unit is open ("← Tất cả bài"); the tutor page drops `back` and its `max-w-md` wrapper.
- [ ] **Step 3:** e2e unchanged (htl-1 has answers → in the first group). **Commit** "Bài làm: grid on laptops, untouched units folded".

### Task 6: Header alignment + login wording (spec #5, #6)

**Files:** Modify `src/components/app-header.tsx`, `src/app/tutor/layout.tsx`, `src/app/login/page.tsx`, `src/app/login/login-form.tsx`

- [ ] **Step 1:** `AppHeader({ user, nav, wide })` → container `max-w-6xl` when `wide`, else `max-w-5xl`; tutor layout passes `wide`.
- [ ] **Step 2:** login sub-title: `Dùng email và mật khẩu phụ huynh đã gửi cho bạn.`; password field wrapped with a `type="button"` toggle (`aria-label` "Hiện mật khẩu" / "Ẩn mật khẩu", text 👁) switching `type` between password/text.
- [ ] **Step 3: Commit** "Header aligned with the tutor workspace; clearer login".

### Task 7: Verify, screenshots, docs, push

- [ ] **Step 1:** `npm run lint && npm test && npm run build && ./e2e/run.sh` → all PASS.
- [ ] **Step 2:** screenshots at 1366×768 of Duyệt, Giao bài, Bài làm, login → compare with the spec table.
- [ ] **Step 3:** docs — `DESIGN.md` routes (verdict bar, picker, work grid), `PROGRESS.md` dated section, `HANDOFF.md` line.
- [ ] **Step 4:** commit, push `p1-tutor-polish`, run CI by dispatch, PR body (no SQL).
