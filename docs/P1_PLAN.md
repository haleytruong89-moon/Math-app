# P1 — Module Hệ thức lượng: kế hoạch build

> Nguồn sự thật về sản phẩm: `claude/PJ_APP_TOAN.md` (D1–D19, §2.5–2.7, §3). File này chỉ chia việc.
> Trạng thái từng lát và câu hỏi đang chờ: `docs/PROGRESS.md`.
> Tạo 02/10/2026. Các số ở §2 **phụ huynh đã duyệt 02/10/2026** (dùng cho pilot, chỉnh theo dữ liệu thật sau).

## 1. Cách làm việc (áp dụng cho mọi lát)

| Quy tắc | Chi tiết |
|---|---|
| Nhánh | Mỗi lát một nhánh `p1-slice-N` tách từ `main`. Không bao giờ push thẳng `main`. |
| Xong một lát nghĩa là | `npm run lint` + `npm test` + `npm run build` + `./e2e/run.sh` đều qua (e2e: trình duyệt thật + PGlite, không cần Supabase); tiêu chí nghiệm thu của lát đã tự kiểm; `docs/PROGRESS.md` có báo cáo. |
| Báo cáo | Mỗi lát thêm 1 mục vào `PROGRESS.md`: đã làm gì, cách thử trên preview (checklist), SQL cần chạy, câu hỏi cho phụ huynh. |
| Migration | File mới `supabase/migrations/000N_*.sql`, chỉ **thêm** (không xoá/đổi tên cột có dữ liệu), có GRANT cho `service_role`, RLS bật, có test PGlite. Phụ huynh tự chạy SQL trên Supabase **trước khi merge**. |
| Nội dung toán | Claude soạn ở trạng thái `draft`. Học sinh chỉ thấy KU `approved`. Đổi sang `approved` chỉ khi phụ huynh nói "duyệt KU …" (D16). |
| Điều kiện dừng | Gặp chỗ spec không nói rõ và đoán sai thì tốn công sửa → ghi câu hỏi vào `PROGRESS.md`, làm việc khác không phụ thuộc. Không tự đổi D1–D19. |
| Không làm | Không merge, không chạy SQL lên Supabase thật, không dùng khoá bí mật, không thêm streak/xếp hạng (D17), không bật AI (P2). |

## 2. Quy tắc học & mastery (theo D14, D15, §3.5–3.7)

✅ = đã duyệt 02/10/2026 (đúng §10 PJ_APP_TOAN "chốt khi soạn module 1"). Code: `src/lib/learning/rules.ts` (`RULES`).

**Trình tự trong 1 KU (§3.5):** lời giải mẫu (bắt buộc xem hết từng bước) → lời giải khuyết bước (điền) → luyện tập L1 → L2 → exit test (không AI, không xem đáp án đến khi nộp).

**Mức hệ thống tính (D15: trung bình các lần gần nhất + số lần làm):**

| Mức | Điều kiện ✅ |
|---|---|
| M0 | Chưa xem lời giải mẫu |
| M1 | Đã xem lời giải mẫu, chưa đủ M2 |
| M2 | Tỉ lệ đúng của **5 câu luyện tập gần nhất ≥ 60%** (chỉ tính lần trả lời đầu tiên của mỗi câu trong ngày) |
| M3 | Exit test gần nhất **≥ 80%** và không lặp cùng một mã lỗi ≥ 2 lần trong exit test đó |
| M4 | Đang M3 và **qua lượt ôn D+21** |
| Độ chắc chắn | Hiển thị số lần làm; **< 5 câu đã làm → nhãn "chưa đủ dữ liệu"** |
| KU hình học | Tối đa M3 cho đến khi có bài C5 gia sư xác nhận (C5 thuộc P3) |

**Lịch ôn (D14):** đạt M3 → lượt ôn D+1, rồi D+7, rồi D+21.
- Một lượt ôn của một bài = 3 câu; đạt khi đúng ≥ 2/3.
- Ôn sai (< 2/3 câu đúng) → quay về D+1, mức hệ thống không hạ ngay (chỉ hạ nếu exit/mastery sau đó < 80%). ✅
- Ôn đúng **và** học sinh tự chọn "dễ" → khoảng tiếp theo ×1,5 (D+7 → D+11, D+21 → D+32). ✅
- Phiên ôn trộn câu nhiều KU, không 2 câu liên tiếp cùng KU (khi có ≥ 2 KU đến hạn); chọn câu lâu chưa làm nhất.
- Qua D+21 → M4 và chuyển sang **ôn duy trì 60 ngày/lần** đến kỳ thi (dễ → 90 ngày); ôn duy trì sai → về D+1, mất M4 đến khi qua D+21 lại (Q5, duyệt 03/10/2026).
- Log đủ (đúng/sai, thời gian, dễ/khó) để chuyển FSRS sau.

**Mục tiêu tuần (D17):** **4 buổi học/tuần** ✅, tuần tính từ thứ Hai (giờ Việt Nam); không streak. Một "buổi" = một ngày có nộp bài kiểm tra, hoặc xong lượt ôn, hoặc ≥ 5 câu luyện tập.

**Cờ lệch (D8):** |mức gia sư đề xuất − mức hệ thống| ≥ 1 → cờ ⚠️ cho phụ huynh; mức phụ huynh chốt là nguồn cuối.

## 3. Các lát cắt

Thứ tự đã chốt 03/10/2026: **pilot sớm**. Nguyên bắt đầu dùng ngay khi có S3, các lát còn lại làm trong lúc pilot chạy. Hình học C1–C3 (S5) **lùi lại sau khi pilot bắt đầu** (lệch §3.4/§4 của PJ_APP_TOAN, hub sẽ cập nhật).

| # | Lát | Nội dung | Trạng thái | Chạy đêm? |
|---|---|---|---|---|
| 1 | **S1** | Nội dung JSON + kiểm tra; KaTeX; xem trước nội dung (D16); luồng học 1 KU; `unit_progress`, `attempts` | ✅ merged | — |
| 2 | **S2** | Mastery hệ thống; lịch ôn D+1/7/21 + duy trì 60 ngày; phiên ôn trộn; "Hôm nay cần làm"; mục tiêu tuần; bản đồ tiến độ | ✅ merged (PR #2) | — |
| 3 | **S3** | Gia sư "Ghi buổi dạy" | ✅ merged (PR #3) | ✅ |
| 3b | **S3b** | Công cụ gia sư: A "Bài làm của con" (không SQL) → B giao bài về nhà qua link Drive (SQL 0007) — spec `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` | ✅ merged (PR #5, #7; SQL 0007 đã chạy) | ✅ |
| 4 | **S4** | Phụ huynh "Tổng quan" | ⬜ | ✅ |
| 5 | **S7** | Pilot: tài khoản Nguyên (sau D18), checklist pilot | 🟡 bắt đầu 05/10 (tài khoản, D18, sao lưu xong) | ❌ phụ huynh |
| 6 | **S6** | Soạn KU còn lại (Ch.4–6 bài HTML + bổ sung bài tập), dạng nháp — **chờ brainstorm danh sách bài lớp 8–9 + ưu tiên** trên claude.ai (`docs/CONTENT_BRIEF.md`) | ⬜ | ✅ soạn; ❌ duyệt (phụ huynh/gia sư) |
| 7 | **S5** | Hình học C1 kéo hình, C2 sắp xếp bước (chấm theo đồ thị phụ thuộc), C3 hai cột | ⬜ sau khi pilot chạy | ✅ |

### S1 — tiêu chí nghiệm thu
- `npm test` kiểm tra mọi file nội dung: đúng schema, mỗi câu có đáp án + lời giải, ID không trùng, câu trắc nghiệm có đúng 1 đáp án đúng, mã lỗi thuộc E01–E15.
- Phụ huynh mở `/parent/content` → thấy danh sách KU kèm trạng thái Nháp/Đã duyệt; mở 1 KU → **xem như bài thật**, bấm thử được toàn bộ luồng mà không ghi dữ liệu.
- Học sinh chỉ thấy KU đã duyệt; KU mới → phải xem hết lời giải mẫu mới mở phần tự giải (§2.7).
- Đáp số chấp nhận dạng tương đương (`12/5` = `2,4`; `2√3` = `√12`), **không** nhận số làm tròn (`3,46` ≠ `2√3`).
- Exit test: không gợi ý/đáp án đến khi nộp; mọi lần làm ghi vào `attempts` với RLS đúng vai trò.

### S3 — Gia sư "Ghi buổi dạy" (§2.7, mockup gia sư)
Thiết kế mặc định (đổi được khi review):
- `/tutor`: danh sách học sinh **đang được gán** cho gia sư này (RLS). Bấm một học sinh → form ghi buổi dạy.
- Form một màn, tối ưu điện thoại: ngày dạy (mặc định hôm nay, không cho ngày tương lai, tối đa lùi 7 ngày) → tick KU đã dạy (mọi KU trong nội dung, kể cả bài nháp, vì gia sư dạy theo chương trình trường) → mỗi KU đã tick hiện **bằng chứng ngay**: mức hệ thống, số câu đã làm, bài kiểm tra gần nhất x/y, tỉ lệ 5 câu luyện gần nhất → chọn mức đề xuất M0–M4 (**bắt buộc**) → ghi chú (tuỳ chọn, ≤ 500 ký tự) → "Lưu buổi dạy".
- Thiếu mức cho KU đã tick → không lưu, báo rõ KU nào. Lưu xong → "Đã lưu lúc HH:MM", form trống lại; danh sách 5 buổi gần nhất **của chính gia sư này**.
- Bảng mới: `teaching_sessions` (học sinh, gia sư, ngày dạy, ghi chú) và `tutor_proposals` (buổi dạy, KU, mức 0–4). RLS: gia sư đọc **buổi của mình** (lịch sử gia sư cũ tách biệt, D3); phụ huynh đọc mọi buổi của con; học sinh không đọc. Ghi qua server action, yêu cầu gán **đang hoạt động**.
- Nghiệm thu thêm: gia sư bị khoá hoặc hết gán → không ghi được; e2e đo thao tác ghi 1 buổi 2 KU ≤ 10 lần chạm.

### S4 — Phụ huynh "Tổng quan" (§2.7, mockup phụ huynh)
- 3 con số đầu trang (render lần đầu): KU đạt M3+/tổng KU đã duyệt · lượt ôn quá hạn · cờ lệch chưa chốt.
- Cờ lệch: đề xuất **mới nhất** của gia sư cho một KU lệch ≥ 1 bậc so với mức hệ thống, và chưa có mức phụ huynh chốt mới hơn đề xuất đó → "Cần chú ý" hiện cả hai mức + bằng chứng + nút "Xem & chốt mức". Chốt → bảng `parent_confirmations` (học sinh, KU, mức, lúc chốt); cờ biến mất.
- Mức hiển thị cuối cùng của KU = phụ huynh chốt (nếu mới hơn mọi thay đổi khác) ?? mức hệ thống; ô "chưa đủ dữ liệu" khi < 5 câu (D15).
- Bảng màu theo domain/KU; tóm tắt tuần (số buổi học, bài kiểm tra, lượt ôn).
- **Buổi dạy chưa ghi > 24h:** cần biết lịch dạy → mặc định thêm "ngày dạy trong tuần" vào phần gán gia sư (phụ huynh chọn, ví dụ T3, T5); ngày có lịch mà quá 24h chưa có buổi ghi → nhắc. *(Câu hỏi Q8 trong PROGRESS.)*

### S5–S7
Chi tiết hoá khi bắt đầu lát, lấy từ §2.7 và §3.4 của `docs/SPEC.md`.

## 4. Việc phụ huynh cần làm (gom lại)

| Khi nào | Việc |
|---|---|
| Một lần | GitHub → Settings → Actions → General → Workflow permissions → tick **"Allow GitHub Actions to create and approve pull requests"** (để tự mở PR) |
| Một lần | Thêm secret `SUPABASE_DB_URL` (backup hằng tuần) |
| Mỗi lát | Chạy SQL mới (nếu có) → thử preview theo checklist → Merge |
| Khi có nội dung mới | Đọc KU nháp ở `/parent/content` → nói "duyệt KU …" hoặc ghi chỗ sai |
| Trước pilot | Nói chuyện với Nguyên (D18) → tạo tài khoản học sinh |
