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
- Qua D+21 → M4, **dừng lịch ôn** của bài đó (spec chưa nói ôn duy trì sau D+21 — xem câu hỏi trong PROGRESS).
- Log đủ (đúng/sai, thời gian, dễ/khó) để chuyển FSRS sau.

**Mục tiêu tuần (D17):** **4 buổi học/tuần** ✅, tuần tính từ thứ Hai (giờ Việt Nam); không streak. Một "buổi" = một ngày có nộp bài kiểm tra, hoặc xong lượt ôn, hoặc ≥ 5 câu luyện tập.

**Cờ lệch (D8):** |mức gia sư đề xuất − mức hệ thống| ≥ 1 → cờ ⚠️ cho phụ huynh; mức phụ huynh chốt là nguồn cuối.

## 3. Các lát cắt

| Lát | Nội dung | Phụ thuộc | Có thể chạy đêm? |
|---|---|---|---|
| **S1** | Định dạng nội dung JSON + kiểm tra tự động; KaTeX; 2 KU nháp đầu tiên; trang **xem trước nội dung** cho phụ huynh (D16); luồng học 1 KU cho học sinh (lời giải mẫu → khuyết bước → luyện tập → exit test); bảng `unit_progress`, `attempts` | — | ✅ |
| **S2** | Mastery hệ thống + lượt ôn (`mastery`, `review_queue`, `review_log`); "Hôm nay cần làm" đầy đủ (ôn trước, mới sau, trộn KU); mục tiêu tuần; bản đồ tiến độ | S1 + phụ huynh duyệt §2 | ✅ |
| **S3** | Gia sư "Ghi buổi dạy" (tick KU, xem bằng chứng, đề xuất M0–M4, ghi chú; ≤ 2 phút trên điện thoại) | S2 | ✅ |
| **S4** | Phụ huynh "Tổng quan": 3 con số, cờ lệch + "Xem & chốt mức", buổi dạy chưa ghi > 24h, bảng màu theo domain | S2, S3 | ✅ |
| **S5** | Dạng bài hình học C1 (kéo hình, dự đoán), C2 (sắp xếp bước, có bước nhiễu, chấm theo đồ thị phụ thuộc), C3 (2 cột chọn lý do) | S1 | ✅ (cần duyệt nội dung) |
| **S6** | Soạn đủ các KU còn lại của Hệ thức lượng (từ bài HTML 6 chương + bổ sung bài tập thiếu) | S1, S5 | ⚠️ Soạn được, **duyệt nội dung là việc của phụ huynh/gia sư** |
| **S7** | Chuẩn bị pilot 2 tuần: tạo tài khoản Nguyên (sau D18), checklist pilot, sửa lỗi | Tất cả | ❌ Cần phụ huynh |

### S1 — tiêu chí nghiệm thu
- `npm test` kiểm tra mọi file nội dung: đúng schema, mỗi câu có đáp án + lời giải, ID không trùng, câu trắc nghiệm có đúng 1 đáp án đúng, mã lỗi thuộc E01–E15.
- Phụ huynh mở `/parent/content` → thấy danh sách KU kèm trạng thái Nháp/Đã duyệt; mở 1 KU → **xem như bài thật** (công thức hiển thị đúng, không phải JSON thô), bấm thử được toàn bộ luồng mà không ghi dữ liệu.
- Học sinh chỉ thấy KU đã duyệt; KU mới → phải xem hết lời giải mẫu mới mở phần tự giải (§2.7).
- Câu nhập đáp số chấp nhận dạng tương đương (`12/5` = `2,4` = `2.4`; `2√3` = `√12`) nhưng **không** chấp nhận số làm tròn (`3,46` ≠ `2√3`).
- Exit test: không có gợi ý/đáp án cho đến khi nộp; mọi lần làm được ghi vào `attempts` (RLS: học sinh thấy của mình, phụ huynh thấy con mình, gia sư thấy học sinh được gán).

### S2–S5 — tiêu chí nghiệm thu
Lấy nguyên văn từ §2.7 của `PJ_APP_TOAN.md` theo màn hình tương ứng; chi tiết hoá khi bắt đầu lát.

## 4. Việc phụ huynh cần làm (gom lại)

| Khi nào | Việc |
|---|---|
| Một lần | GitHub → Settings → Actions → General → Workflow permissions → tick **"Allow GitHub Actions to create and approve pull requests"** (để tự mở PR) |
| Một lần | Thêm secret `SUPABASE_DB_URL` (backup hằng tuần) |
| Mỗi lát | Chạy SQL mới (nếu có) → thử preview theo checklist → Merge |
| Khi có nội dung mới | Đọc KU nháp ở `/parent/content` → nói "duyệt KU …" hoặc ghi chỗ sai |
| Trước pilot | Nói chuyện với Nguyên (D18) → tạo tài khoản học sinh |
