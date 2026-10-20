# Tutor workspace on a laptop — polish (audit 20/10/2026)

> Audit of the login screen and the 5 tutor tabs at 1366×768 and 1920×1080 after S10/S11 (screenshots in the
> session, `e2e/out/audit/`). Parent approved all fixes on 20/10/2026; the tutor's screen size is unknown, so every
> layout must work from 1366 px wide up (and still on a phone). No SQL.

## What the tutor sees
Link → **Đăng nhập** (email + password the parent sent) → one student → straight to **Hôm nay** (S11 redirect).
The session persists; next visits skip the login.

## Fixes

| # | Screen | Problem (1366×768) | Fix |
|---|---|---|---|
| 1 | Duyệt | "Đạt / Cần sửa" below the fold — a scroll per item (~170 for 10 KUs) | **Sticky bar at the bottom of the viewport** (parent's choice): `[✓ Đạt — câu tiếp] [! Cần sửa]` + "đã xem x/y"; "Cần sửa" opens the note field inside the bar (required before sending); the item panel scrolls above it. Same component for tutor and parent |
| 2 | Giao bài | Right column scrolls away; no count of picked items; changing the KU needs a second "Chọn" click | Right column `sticky top`; live "Đã chọn N câu" above the button (button disabled at 0 in items mode); the KU select navigates on change (no button; `<noscript>` keeps a submit) |
| 3 | Làm thử | Banner says "xem trước của phụ huynh" | Banner: "Chế độ xem trước — bấm thử như học sinh, không ghi dữ liệu" (+ draft note); a "← Về màn duyệt" link above the player |
| 4 | Bài làm | One phone-width column listing ~20 units "chưa làm câu nào"; redundant "← Học sinh" | Laptop: grid of 2–3 columns; units with work first; units without any answer folded into "Chưa làm (N)" (`<details>`); no back link inside the tutor tabs (parent page keeps its own) |
| 5 | Header | "App Toán" not aligned with the content (header `max-w-5xl`, tutor body `max-w-6xl`) | `AppHeader` takes `wide`; the tutor layout passes it |
| 6 | Đăng nhập | "tài khoản phụ huynh đã cấp" reads like "use the parent's account"; no way to check a typed password | "Dùng email và mật khẩu phụ huynh đã gửi cho bạn."; 👁 show/hide password button |
| 7 | Duyệt (latent) | `content_hash` = JSON of the parsed item → depends on key order; a schema change would flip every "fix" to "changed" | Canonical JSON (sorted keys) in `review.ts`; existing rows keep working for "ok" (grading hash unchanged). Rows made before this fix: a "fix" item may show "↻" once — acceptable (no "fix" rows exist in production yet beyond the first review day) |

## Out of scope
Keyboard shortcuts, a 3-column review layout, AI (S8).

## Testing
Unit: canonical hash independent of key order. E2E: review-flow clicks the sticky bar (it must be in the viewport
at 1280×720 without scrolling); assign-flow sees "Đã chọn 2 câu"; tutor work page groups "Chưa làm"; screenshots at
1366×768 for all tabs.
