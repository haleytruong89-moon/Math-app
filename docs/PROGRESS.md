# Nhật ký tiến độ P1

> Claude đọc file này đầu mỗi phiên để biết làm tiếp từ đâu. Mục mới nhất ở trên cùng.
> Kế hoạch: `docs/P1_PLAN.md`.

## Trạng thái nhanh

| Lát | Nhánh | Trạng thái |
|---|---|---|
| S1 — Nội dung + luồng học 1 KU | `p1-slice-1` | ✅ Merged 02/10 (PR #1), SQL 0003 đã chạy |
| S2 — Mastery + lịch ôn + "Hôm nay cần làm" | `p1-slice-2` | 🟡 Chờ phụ huynh chạy SQL 0004, review & merge |
| S3 — Gia sư "Ghi buổi dạy" | — | ⬜ Tiếp theo |
| S4–S7 | — | ⬜ |

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
