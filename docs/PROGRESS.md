# Nhật ký tiến độ P1

> Claude đọc file này đầu mỗi phiên để biết làm tiếp từ đâu. Mục mới nhất ở trên cùng.
> Kế hoạch: `docs/P1_PLAN.md`.

## Trạng thái nhanh

| Lát | Nhánh | Trạng thái |
|---|---|---|
| S1 — Nội dung + luồng học 1 KU | `p1-slice-1` | ✅ Merged 02/10 (PR #1), SQL 0003 đã chạy |
| S2 — Mastery + lịch ôn + "Hôm nay cần làm" (+ ôn duy trì, docs) | `p1-slice-2` | ✅ Merged 03/10 (PR #2), SQL 0004 + 0005 đã chạy |
| S3 — Gia sư "Ghi buổi dạy" | `p1-slice-3` | ✅ Merged 03/10 (PR #3), SQL 0006 đã chạy |
| Sửa lỗi trước pilot (review PR #2/#3) | `p1-fixes` | 🟡 PR mới — **không có SQL**, thử preview rồi merge |
| S3b — Công cụ gia sư (spec 05/10) | `p1-tutor-tools` | 🟡 A "Bài làm của con": PR mới, **không SQL** (xếp chồng trên `p1-fixes` — merge PR #4 trước) · B giao bài về nhà: ⬜ |
| S4 — Phụ huynh "Tổng quan" | — | ⬜ Tiếp theo |
| S7 — Pilot (tài khoản Nguyên) | — | ⬜ phụ huynh — có thể bắt đầu sau khi merge S3 |
| S6 — Soạn KU còn lại · S5 — Hình học C1–C3 | — | ⬜ S5 sau khi pilot chạy |

### Câu hỏi đang mở
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q8 | "Buổi dạy chưa ghi > 24h" cần lịch dạy: phụ huynh nhập ngày dạy trong tuần khi gán gia sư (ví dụ T3, T5)? | Có — làm trong S4 |
| Q9 | Buổi dạy không tick bài nào (ví dụ chữa đề ở trường, chủ đề chưa có trong app): cho lưu nếu có ghi chú? | Có — đang làm vậy |
| Q10 | Gia sư được ghi buổi dạy trễ tối đa bao nhiêu ngày? | 7 ngày (theo P1_PLAN) |
| Q11 | Gia sư mới có nên xem buổi dạy của gia sư cũ (để nối tiếp)? | Không — tách biệt theo D3; phụ huynh xem được hết |

---

## 05/10/2026 — S3b phần A: "Bài làm của con" (nhánh `p1-tutor-tools`)

Theo góp ý sau khi gia sư dùng thử: gia sư không xem được con làm sai câu nào. Thiết kế + quyết định T1–T5: `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` (phụ huynh duyệt 05/10). **Không có SQL.**

**Nhánh xếp chồng:** `p1-tutor-tools` tách từ `p1-fixes` (PR #4 chưa merge). Merge PR #4 trước; PR này sau đó chỉ còn phần mới.

### Đã làm
- **Gia sư**: trang chủ có nút **"Xem bài làm"**; form ghi buổi dạy có link **"Xem câu sai →"** dưới bằng chứng mỗi bài đã tick (mở tab mới, không mất lựa chọn đang nhập).
- **Trang "Bài làm của {con}"**: mỗi bài một thẻ — mức hệ thống, số câu, kiểm tra gần nhất, **lỗi hay gặp** (mã lỗi ≥ 2 lần, ví dụ "E10 × 2"), mức gia sư đề xuất gần nhất. Bấm một bài → các câu đã làm, mới nhất trước, mặc định **chỉ câu sai** ↔ "Tất cả": loại (luyện tập/kiểm tra/ôn), giờ, thời gian làm, đề + hình, **con trả lời gì**, **đáp án đúng**, mã lỗi + lời nhắc trong nội dung, nhãn **"Lần sau làm đúng"**, lời giải (gập sẵn). Chỉ xem.
- **Phụ huynh**: "Tổng quan" → **"Xem bài làm"** cạnh tên con — cùng trang (dùng lại cho S4).
- Quyền: gia sư chỉ thấy khi **đang được gán**; hết gán → 404; học sinh không vào được.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **37** test quy tắc/nội dung (thêm 6 cho trang bài làm: lỗi hay gặp, lọc, "lần sau làm đúng", trắc nghiệm hiện nội dung phương án, câu bỏ trống, chữ con gõ không bị hiểu thành công thức/HTML) + **49** test RLS: qua.
- `./e2e/run.sh`: **83/83** (thêm 11): gia sư thấy đúng 3 câu sai, con trả lời 225 / đáp án 15 / lời nhắc "Còn bước lấy căn bậc hai", "E10 × 2", "Bạn đề xuất M3", "Lần sau làm đúng", "Tất cả (11)", mã bài lạ → quay về danh sách, link từ form mở tab mới, hết gán → 404; phụ huynh mở được; học sinh bị chặn. Sau đó chỉ sửa cỡ hình (CSS) — lint + build qua, e2e chưa chạy lại.

### Phụ huynh cần làm (khoảng 10 phút)
1. Merge **PR #4** trước (nếu chưa). Không có SQL.
2. Thử preview: đăng nhập gia sư → **Xem bài làm** → chọn bài → thấy câu sai của con; vào **Ghi buổi dạy**, tick một bài → "Xem câu sai →".
3. Đăng nhập phụ huynh → Tổng quan → **Xem bài làm**.
4. Merge PR. Phần B (giao bài về nhà, SQL 0007) làm tiếp sau.

### Ghi chú kỹ thuật (cho phiên sau)
- `StudentWork` (`src/components/work/student-work.tsx`) là server component nhận client RLS của người gọi; lọc qua search params, không có state phía trình duyệt. Logic thuần ở `src/lib/learning/work.ts`.
- Câu trả lời con gõ luôn được escape (không qua `texToHtml`); trắc nghiệm lưu số thứ tự → hiện nội dung phương án.
- `RightTriangleAltitude` có sẵn `max-w-xs`: muốn nhỏ hơn thì bọc bằng div có độ rộng (class truyền vào không thắng).

---

## 05/10/2026 — Sửa 3 lỗi trước pilot (nhánh `p1-fixes`)

Từ đợt review PR #2/#3 (phụ huynh đồng ý sửa điểm 1, 2, 4 trước pilot). **Không có SQL mới.**

### Đã làm
1. **Tải lại trang (F5) giữa lượt ôn không còn "xoá" câu sai.** Trước: mỗi lần mở trang là một lượt ôn mới với câu khác, câu sai cũ không bao giờ được tính → lịch ôn có thể không về D+1. Giờ: trang ôn **tiếp tục lượt đang dở** (lượt có câu trả lời nhưng chưa "Lưu kết quả ôn"): câu đã trả lời vẫn tính, không hỏi lại, các câu còn lại giữ nguyên ("Câu 3/6"). Bài mới đến hạn trong lúc đó được nhập vào cùng lượt.
2. **Câu ôn chỉ lấy từ phần luyện tập** (mỗi bài 8 câu), không lấy câu bài kiểm tra nữa — vì lượt ôn hiện lời giải sau mỗi câu, con có thể xem trước đáp án rồi làm lại bài kiểm tra. Máy chủ cũng từ chối chấm câu kiểm tra trong lượt ôn.
3. **Ghi chú có xuống dòng**: ô ghi chú hiện 500/500 nhưng máy chủ báo quá dài (trình duyệt gửi mỗi lần xuống dòng thành 2 ký tự). Giờ máy chủ đếm như ô nhập; ghi chú lưu với xuống dòng chuẩn.
- Phụ: test RLS (`npm run test:db`) chạy được cả trên Windows.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **31** test quy tắc/nội dung (thêm 2 cho tiếp tục lượt ôn, 1 cho ghi chú xuống dòng) + **49** test RLS: qua.
- `./e2e/run.sh` (chạy trong container Playwright Linux): **72/72** — thêm: F5 sau câu sai → tiếp ở "Câu 3/6", không câu nào hỏi lại, câu sai vẫn tính (htl-2 vẫn về D+1, đúng 1/3); mọi câu ôn thuộc phần luyện tập; gia sư gõ ghi chú 9 dòng hiện 500/500 → lưu được, DB lưu đúng 500 ký tự, không có ``.

### Phụ huynh cần làm (khoảng 10 phút)
1. Không có SQL.
2. Thử preview (tài khoản học sinh có bài đến hạn ôn): làm 1 câu sai → bấm F5 → vẫn ở câu tiếp theo, không được làm lại câu sai. Làm hết → kết quả tính cả câu sai đó.
3. Tài khoản gia sư: gõ ghi chú nhiều dòng tới 500/500 → Lưu được.
4. Merge PR.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q12 | Bài kiểm tra làm lại dùng **đúng 5 câu cũ**, và sau khi nộp con đã thấy lời giải → lần làm lại dễ đạt M3 do nhớ đáp án. Có cần thêm bộ câu kiểm tra thứ 2 (đổi số) cho mỗi bài? | Chưa làm — đưa vào S6 (soạn nội dung) |

### Ghi chú kỹ thuật (cho phiên sau)
- `planReview` (rules.ts): lượt "dở" = có câu `mode = review` cho bài đang đến hạn mà chưa có dòng `review_log (run_id, unit_id)`; chọn lượt mới nhất. Bỏ câu của chính lượt đó khi chọn câu còn lại → ra đúng bộ câu ban đầu.
- e2e trên Windows: `./e2e/run.sh` cần Linux; chạy trong `mcr.microsoft.com/playwright:v1.63.0-noble`, **bỏ `.env.local`** (có env thì proxy chuyển hướng vòng lặp), symlink Chromium vào `/opt/pw-browsers/chromium`.
- Còn lại từ review (chưa sửa, ít gặp): điểm 3 (mastery chỉ đọc 5.000 câu trả lời cũ nhất — 2 tuần pilot chưa chạm), điểm 5 (buổi dạy + đề xuất ghi bằng 2 lệnh riêng), bấm Lưu 2 lần tạo 2 buổi trùng.

---

## 03/10/2026 (đêm) — S3 xong: Gia sư "Ghi buổi dạy" (nhánh `p1-slice-3`)

**Nhánh xếp chồng:** PR #2 (`p1-slice-2`) chưa merge nên `p1-slice-3` tách từ `p1-slice-2`; PR mới có base = `p1-slice-2`. Merge PR #2 trước, PR S3 sẽ tự chuyển base về `main` (nếu GitHub không tự chuyển: mở PR → *Edit* → base `main`).

**Quyết định dùng (mặc định, chưa hỏi được):**
- Thiết kế S3 theo P1_PLAN §3 (đã viết sẵn "mặc định, đổi được khi review").
- Q8: chưa đụng — thuộc S4.
- Mới (Q9–Q11 bên dưới): buổi không tick bài nào vẫn lưu được nếu có ghi chú; lùi tối đa 7 ngày; gia sư chỉ thấy buổi của chính mình.
- Nhãn M0–M4 trên form lấy đúng thang trong `PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` §2.

### Đã làm
- **`/tutor`**: danh sách học sinh **đang được gán** (RLS) + ngày buổi ghi gần nhất; nút "Ghi buổi dạy" đã mở.
- **`/tutor/[học sinh]` — form một màn, cho điện thoại**: ngày dạy (mặc định hôm nay, không cho ngày tương lai, lùi tối đa 7 ngày) → tick bài đã dạy (mọi bài, kể cả bài nháp — ghi chú "chưa mở cho học sinh") → **bằng chứng hiện ngay khi tick**: mức hệ thống, số câu đã làm (hoặc "chưa đủ dữ liệu"), bài kiểm tra gần nhất x/y, % đúng 5 câu luyện gần nhất, ngày làm bài cuối → chọn mức đề xuất M0–M4 (**bắt buộc**) → ghi chú ≤ 500 ký tự → "Lưu buổi dạy".
- Thiếu mức → không lưu, báo đúng tên bài thiếu; các lựa chọn đã chọn **được giữ nguyên**. Lưu xong → "✓ Đã lưu lúc HH:MM", form trống lại, danh sách 5 buổi gần nhất cập nhật (đề xuất vs hệ thống).
- **Bảng mới** (migration `0006`): `teaching_sessions` (học sinh, gia sư, ngày dạy, ghi chú), `tutor_proposals` (buổi, bài, mức đề xuất + **ảnh chụp mức hệ thống và số câu lúc đề xuất** — để S4 hiện bằng chứng cho cờ lệch, D8). RLS: phụ huynh đọc mọi buổi của con; gia sư chỉ đọc **buổi của mình** khi còn được gán (D3); học sinh không đọc. Ghi qua server action, kiểm tra lại tài khoản gia sư còn hoạt động + gán còn hiệu lực.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua.
- `npm test`: **29** test quy tắc/nội dung (thêm 7 test form buổi dạy) + **49** test RLS (thêm 15 cho 2 bảng mới): qua.
- `./e2e/run.sh`: **67/67** — 16 xem trước phụ huynh + 23 luồng học sinh + **28 luồng gia sư mới**: chỉ thấy học sinh được gán; bằng chứng hiện khi tick (M2, 10 câu, kiểm tra 3/5, luyện 80%); thiếu mức bị chặn + giữ lựa chọn; lưu 1 buổi 2 bài = **7 lần chạm** (≤ 10, kể cả 1 lần lưu bị chặn); DB đúng 1 buổi + 2 đề xuất kèm ảnh chụp mức hệ thống; chặn ngày tương lai / quá 7 ngày / buổi trống (kiểm ở máy chủ); buổi chỉ có ghi chú lưu được; hết gán → không lưu được, học sinh biến mất, link form 404; gia sư bị khoá → không lưu được.
- Ảnh chụp điện thoại 390px sáng + tối: `e2e/out/tutor/` (không commit).
- Không có nội dung toán mới → không cần soát toán.

### Phụ huynh cần làm (khoảng 15 phút)
1. Nếu chưa: chạy SQL `0004` → `0005` → merge **PR #2** trước.
2. **Chạy SQL** `supabase/migrations/0006_p1_teaching_sessions.sql` → "Success. No rows returned".
3. Thử preview (cần một tài khoản gia sư được gán cho Nguyên — tạo ở **Tài khoản** nếu chưa có):
   - Đăng nhập gia sư → thấy đúng Nguyên → bấm **Ghi buổi dạy**.
   - Tick 1 bài → thấy bằng chứng ngay; tick bài thứ 2, chỉ chọn mức cho bài 1 → bấm Lưu → bị chặn, nêu tên bài 2.
   - Chọn mức bài 2, gõ ghi chú → Lưu → "Đã lưu lúc …", form trống, buổi hiện ở danh sách dưới.
   - Đổi ngày dạy về hôm qua rồi lưu thử một buổi chỉ có ghi chú.
   - (Tuỳ chọn) Khoá tài khoản gia sư thử → đăng nhập lại không được.
4. **Merge** PR S3 (sau PR #2). Lưu ý: preview dùng database thật — buổi thử sẽ nằm lại trong dữ liệu (chưa có nút xoá; nhờ Claude xoá nếu cần).
5. Sau merge: có thể bắt đầu **pilot** (S7) — tạo tài khoản Nguyên sau khi nói chuyện D18.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q9 | Buổi không tick bài nào (chữa đề ở trường, chủ đề chưa có trong app): cho lưu nếu có ghi chú? | Có |
| Q10 | Ghi trễ tối đa bao nhiêu ngày? | 7 ngày |
| Q11 | Gia sư mới có xem buổi của gia sư cũ? | Không (D3); phụ huynh xem hết |

### Ghi chú kỹ thuật (cho phiên sau)
- Form có thể bị từ chối **không** dùng `<form action>` (React tự reset form sau action → mất lựa chọn). `SessionForm` dùng `onSubmit` + `startTransition(formAction)`, reset bằng `key` khi lưu thành công.
- `loadStudentState(..., { includeDrafts: true })` cho gia sư; học sinh/phụ huynh giữ mặc định (chỉ bài đã duyệt).
- S4 cờ lệch: lấy `tutor_proposals` mới nhất theo `(student_id, unit_id, created_at)` (đã có index); `system_level` là ảnh chụp lúc đề xuất, còn cờ lệch so với mức hệ thống **hiện tại** (§2.7).
- e2e có vai trò `tutor` (`E2E_ROLE=tutor`, `TUTOR_UID`), fake client có `.delete()`; DB giả có thêm học sinh "Đăng An" không gán gia sư.
- Sửa/xoá buổi đã ghi: chưa làm (spec không yêu cầu) — nếu gia sư cần, thêm ở S4/S7.

---

## 03/10/2026 — Quyết định + bổ sung vào PR #2

**Phụ huynh duyệt (03/10, "ok cả 3"):**
- Q5: sau D+21 → **ôn duy trì 60 ngày/lần** đến kỳ thi.
- Q6: tạo tài khoản Nguyên **sau S3**.
- Q7: **bật lịch tự chạy mỗi đêm 23:00**.
- Theo `vibe-code`: đưa spec vào repo (`docs/SPEC.md`, `docs/DESIGN.md`); **pilot sớm**, lùi hình học C1–C3 (S5) sau khi pilot chạy.

**Đã làm (cùng nhánh `p1-slice-2`):**
- `docs/SPEC.md`: bản sao PJ_APP_TOAN (D1–D19, §2.5–2.7, §3, §4, §10) + bảng quyết định trong lúc build. `docs/DESIGN.md`: kiến trúc thực tế, route, bảng dữ liệu, nội dung, chấm điểm, vận hành, kiểm thử, lưu ý. `CLAUDE.md` trỏ tới hai file này.
- Ôn duy trì: migration **0005** (stage 4 = duy trì), quy tắc + test; màn kết quả ôn hiện "Ôn duy trì lần tới".
- `P1_PLAN.md`: thứ tự lát mới (S3 → S4 → pilot → S6 → S5) + tiêu chí nghiệm thu chi tiết cho S3, S4.
- Tự kiểm: lint, build, 22 test quy tắc/nội dung, 36 test RLS, e2e **39/39**.

**Phụ huynh cần làm:** chạy SQL `0004` (nếu chưa) rồi `0005` → merge PR #2.

---

## 02/10/2026 — S2 xong (nhánh `p1-slice-2`)

**Quyết định của phụ huynh (02/10):** Q1 duyệt các số ở P1_PLAN §2; Q2 duyệt 2 bài `htl-1`, `htl-2` (đã đổi sang *Đã duyệt*). Q3, Q4 coi như theo đề xuất (8 + 5 câu; tự dán SQL).

### Đã làm
- **Mức hiểu hệ thống (D15)** tính từ dữ liệu làm bài, theo đúng các số đã duyệt; luôn kèm số câu đã làm, < 5 câu → "chưa đủ dữ liệu". Code: `src/lib/learning/rules.ts` (dùng lại cho màn gia sư/phụ huynh ở S3–S4).
- **Lịch ôn (D14)**: nộp bài kiểm tra đạt M3 → tự hẹn ôn D+1 → D+7 → D+21; ôn sai → về D+1; ôn đúng + "Dễ" → ×1,5. Lưu đủ lịch sử trong `review_log` để sau này chuyển FSRS.
- **Phiên ôn trộn** `/student/review`: mọi bài đến hạn trong một phiên, 3 câu/bài, **xen kẽ giữa các bài**, ưu tiên câu lâu chưa làm. Cuối phiên học sinh chọn "Dễ / Bình thường" cho bài làm đúng.
- **"Hôm nay cần làm"** theo mockup: thanh **mục tiêu tuần** (4 buổi), **bản đồ tiến độ** M0–M4, danh sách *Ôn lại* (trước) → *Đang học* → *Bài mới* (chỉ 1 bài kế tiếp). Không streak/xếp hạng (D17).
- **Bảng mới** (migration `0004`): `review_queue`, `review_log` — RLS như các bảng khác.
- **Bộ thử tự động bằng trình duyệt** `e2e/run.sh`: chạy app với database giả lập (PGlite + migration thật), không cần Supabase. Dùng cho các phiên tự chạy sau này.

### Đã tự kiểm
- lint, build, 21 test quy tắc/nội dung + 31 test RLS: qua.
- `./e2e/run.sh`: **36/36** qua — 16 bước xem trước của phụ huynh + 20 bước luồng học sinh: học bài 1 → kiểm tra 5/5 → hẹn ôn ngày mai → (giả lập đến hạn) phiên ôn 2 bài xen kẽ → bài đúng + "Dễ" hẹn D+11, bài sai về D+1 → thẻ ôn biến mất.

### Phụ huynh cần làm (khoảng 15–20 phút)
1. **Chạy SQL** `supabase/migrations/0004_p1_review_queue.sql` (nội dung trong tin nhắn chat) → "Success. No rows returned".
2. PR `p1-slice-2` lần này **tự mở** (đã bật quyền). Kiểm tra CI ✓.
3. **Thử preview**: hiện chưa có tài khoản học sinh nên màn học sinh chưa xem được bằng tài khoản thật. Phụ huynh xem lại **Nội dung** → 2 bài hiện *Đã duyệt*. Ảnh chụp màn học sinh (từ bộ thử tự động) Claude gửi trong chat.
4. **Merge**.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Claude đề xuất |
|---|---|---|
| Q5 | Bài đã qua D+21 (M4): dừng ôn hẳn, hay ôn duy trì thưa (ví dụ 60 ngày/lần) đến kỳ thi? | Ôn duy trì 60 ngày — thi vào 10 còn ~8 tháng, dễ quên |
| Q6 | Khi nào tạo tài khoản cho Nguyên (sau khi nói chuyện D18)? Pilot 2 tuần cần có tài khoản. | Sau khi xong S3 (gia sư ghi buổi dạy) |
| Q7 | Bật **lịch tự chạy mỗi đêm** (23:00) cho các lát S3–S6? Mỗi sáng có PR + báo cáo như hôm nay. | Bật |

### Ghi chú kỹ thuật (cho phiên sau)
- `finishReview` cố ý **không** `revalidatePath`: làm vậy sẽ render lại `/student/review` (đã hết bài đến hạn) và xoá màn kết quả.
- Mục "Đang học" không hiện bài đã vào lịch ôn mà sau đó làm lại kiểm tra < 80% (hiếm) — xử lý khi có dữ liệu thật.
- `e2e/run.sh` vá tạm `dal.ts`, `supabase/server.ts`, `supabase/admin.ts`, `next.config.ts` rồi tự hoàn nguyên; CI chặn nếu lỡ commit bản vá.

---

## 02/10/2026 — S1 xong (nhánh `p1-slice-1`)

### Đã làm
- **Định dạng nội dung JSON** (`content/`, schema `src/lib/content/schema.ts`). `npm test` tự kiểm tra: đúng cấu trúc, mỗi câu có đáp án + lời giải, ID không trùng, mã lỗi thuộc E01–E15, công thức TeX không lỗi.
- **2 bài nháp** của module Hệ thức lượng (soạn từ bài HTML Chương 1–3):
  - `htl-1` Bốn hệ thức lượng: hiểu và nhớ — lời giải mẫu chứng minh $AB^2 = BH·BC$, điền bước chứng minh $AC^2 = CH·BC$, 8 câu luyện, 5 câu kiểm tra.
  - `htl-2` Tính độ dài bằng hệ thức lượng — lời giải mẫu tính $AH$, điền bước tính $BH$, 8 câu luyện, 5 câu kiểm tra.
  - Mỗi đáp án sai hay gặp có mã lỗi + lời nhắc riêng (ví dụ quên lấy căn → E10, nhầm hình chiếu → E03).
- **Trang phụ huynh "Nội dung"** (menu mới): danh sách bài + trạng thái Nháp/Đã duyệt; "Xem trước" chạy đúng như học sinh nhưng **không ghi dữ liệu** (D16).
- **Luồng học 1 bài** (§3.5): Lời giải mẫu (hiện từng bước, có "Vì sao làm bước này?") → Điền bước (sai thì có lời nhắc, sai 2 lần thì hiện lời giải) → Luyện tập (sai thì câu đó quay lại cuối) → Kiểm tra (không gợi ý, nộp mới xem đáp án).
  - Phần sau **bị khoá** cho đến khi xong phần trước; máy chủ cũng chặn (không lách được bằng cách gõ link).
  - Chấm ở máy chủ; trình duyệt **không nhận đáp án**.
  - Đáp số chấp nhận dạng tương đương (`12/5` = `2,4`; `2√3` = `√12`), **không** nhận số làm tròn (`1,732` ≠ `√3`). Có nút √ và / cho điện thoại.
- **Trang học sinh**: "Hôm nay cần làm" liệt kê bài **đã duyệt** kèm trạng thái (Bài mới / Đang học / Kiểm tra x/y). Lịch ôn và mục tiêu tuần là việc của S2.
- **Bảng dữ liệu mới** (migration `0003`): `unit_progress`, `attempts` — RLS: học sinh thấy của mình, phụ huynh thấy con mình, gia sư thấy học sinh được gán.
- **GitHub**: tự mở pull request khi Claude push nhánh `p1-*` (`auto-pr.yml`) + kiểm tra tự động lint/test/build cho mọi PR (`ci.yml`).

### Đã tự kiểm
- `npm run lint`, `npm test` (10 test chấm điểm & nội dung + 25 test RLS), `npm run build`: qua.
- Chạy thử bằng trình duyệt (điện thoại 390px, sáng + tối) toàn bộ luồng xem trước `htl-2`: khoá phần, lời nhắc lỗi, nhận `5,4` cho `27/5`, từ chối `1,732`, câu sai quay lại, chặn nộp khi đáp số không đọc được, chấm 4/5 đúng. 15/15 kiểm tra qua, không lỗi trình duyệt.
- **Chưa thử được**: luồng *học sinh thật* (ghi vào DB) — cần tài khoản học sinh + SQL 0003. Phần ghi DB đã có test RLS.

### Phụ huynh cần làm (khoảng 30–40 phút)
1. **Một lần**: GitHub → repo `Math-app` → Settings → Actions → General → *Workflow permissions* → tick **"Allow GitHub Actions to create and approve pull requests"** → Save. (Nếu chưa bật, PR cho nhánh này chưa tự mở: vào tab *Pull requests* → *New pull request* → chọn `p1-slice-1` → *Create*.)
2. **Chạy SQL**: Supabase → SQL Editor → dán **nội dung** file `supabase/migrations/0003_p1_learning_attempts.sql` → Run → kết quả mong đợi "Success. No rows returned".
3. **Thử bản preview** (link Vercel trong PR, đăng nhập bằng tài khoản phụ huynh) — trên điện thoại càng tốt:
   - Menu **Nội dung** → thấy 2 bài *Nháp*.
   - Mở từng bài → đi hết 4 phần như học sinh. Thử cố tình gõ sai, gõ `5,4` thay vì `27/5`, gõ chữ linh tinh.
   - **Soát toán**: đề, đáp án, lời giải, lời nhắc khi sai. Ghi lại câu nào sai/khó hiểu.
4. **Merge** PR nếu ổn (preview dùng chung database thật — không sao, phụ huynh xem trước không ghi gì).
5. **Trả lời câu hỏi** bên dưới.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Claude đề xuất |
|---|---|---|
| Q1 | Duyệt các số 🟡 trong `P1_PLAN.md` §2 (ngưỡng M2/M3, ôn sai/ôn dễ, 4 phiên/tuần)? | Như trong plan — đã chỉnh lại cho khớp D14/D15 |
| Q2 | 2 bài nháp: duyệt luôn hay cần gia sư xem? | Phụ huynh xem trước; gia sư xem khi có tài khoản |
| Q3 | Một bài nên có bao nhiêu câu luyện/kiểm tra? Hiện 8 + 5 (~20–25 phút) | Giữ 8 + 5 cho pilot |
| Q4 | Việc tự áp migration lên Supabase khi merge bị hệ thống an toàn chặn (thao tác thẳng lên database thật). Giữ cách **phụ huynh tự dán SQL** (2 phút/lần), hay muốn bật tự động? | Giữ tự dán SQL: phụ huynh là người cuối cùng chạm vào DB thật |

### Ghi chú kỹ thuật (cho phiên sau)
- Nội dung chấm ở server: `src/app/learn/actions.ts`. Thêm bài mới: tạo JSON trong `content/<module>/`, thêm vào `module.json` và vào registry `src/lib/content/index.ts`.
- Luyện tập: mỗi câu chấm 1 lần (câu sai quay lại cuối được ghi thêm 1 lần nữa). S2 tính mastery nên dùng **lần trả lời đầu tiên của mỗi câu trong mỗi phiên**.
- Để thử bằng trình duyệt cục bộ đã dùng một bản vá tạm (giả đăng nhập phụ huynh) — **không commit**.
