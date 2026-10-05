# S4 — Phụ huynh "Tổng quan" (thiết kế)

> Duyệt qua chat ngày 05/10/2026 (phụ huynh: "ok"). Nguồn: `docs/P1_PLAN.md` §3 S4, `docs/SPEC.md` §2.7, D8, D15, D17.
> Một PR, có SQL `0008`.

## Mục tiêu

Phụ huynh mở app là biết tình hình trong 30 giây (user story §2.7): con học đều không, bài nào vững, gia sư và
hệ thống có lệch nhau không, gia sư có ghi buổi đều không — và chốt mức khi lệch (D8).

## Quyết định đã chốt (05/10/2026)

| # | Quyết định |
|---|---|
| P1 (=Q8) | Lịch dạy: khi gán gia sư, phụ huynh **chọn các ngày dạy cố định trong tuần** (T2…CN). Nhắc "buổi dạy chưa ghi" dựa trên lịch đó. |
| P2 | Mức phụ huynh chốt **chỉ để hiển thị** (Tổng quan, trang gia sư, bản đồ của con, kèm nhãn "bố mẹ chốt"). **Không** đổi lịch ôn, "Hôm nay cần làm" hay quy tắc mức. |
| P3 | Lưu mỗi lần chốt thành một dòng (giữ lịch sử ai chốt, khi nào, theo đề xuất nào). |

## Màn hình `/parent` (thay bản P0 đang hiện "—")

### 1. Ba con số đầu trang (render lần đầu, bấm được → kéo xuống phần chi tiết)
- **Bài đạt M3+ / tổng bài đã duyệt** — theo **mức hiển thị** (mục 3).
- **Lượt ôn quá hạn** — số bài có `review_queue.due_on < hôm nay` (giờ VN).
- **Cờ lệch cần chốt** (màu cảnh báo) — số cờ ở mục 2.

### 2. "Cần chú ý"
**Cờ lệch** — với mỗi bài: lấy **đề xuất mới nhất** của gia sư (`tutor_proposals`, mọi gia sư, mới nhất theo `created_at`).
Có cờ khi **cả ba** đúng:
1. `|đề xuất − mức hệ thống hiện tại| ≥ 1`;
2. chưa có lần phụ huynh chốt nào **sau** đề xuất đó;
3. (tự hết) nếu mức hệ thống hiện tại đã bằng mức đề xuất → không còn cờ.
4. (chỉnh 05/10 sau review) đề xuất **trùng với mức bố mẹ chốt còn hiệu lực** → không bật cờ (gia sư đồng ý với phụ huynh).

Thẻ cờ: tên bài · "Gia sư {tên} đề xuất M3 ({ngày})" · "Hệ thống M1" · bằng chứng (số câu, kiểm tra gần nhất x/y,
% đúng 5 câu luyện gần nhất, "chưa đủ dữ liệu" nếu < 5 câu) · ghi chú buổi dạy đó · link "Xem bài làm" (trang S3b).
Nút **"Chốt mức"** → chọn M0–M4 (chọn sẵn mức đề xuất), ghi chú ≤ 300 ký tự (tuỳ chọn) → lưu → cờ biến mất.

**Buổi dạy chưa ghi** — với mỗi phân công đang hoạt động có lịch: mỗi ngày dạy theo lịch trong **7 ngày gần nhất** (= giới hạn ghi trễ của gia sư, để nhắc nào cũng xoá được — chỉnh 05/10 sau review, trước là 14),
từ ngày bắt đầu phân công, đã qua **hơn 24h** (tức ngày đó ≤ hôm qua) mà gia sư đó **không có buổi nào** có
`taught_on` = ngày đó → thẻ "Thứ Ba 07/10: Cô Trang chưa ghi buổi dạy". Phân công không có lịch → không nhắc.

Không có mục nào → "Không có gì cần chú ý."

### 3. Mức hiển thị của một bài
`hiển thị = mức phụ huynh chốt` (lần chốt mới nhất của bài) nếu **mức hệ thống hiện tại bằng mức hệ thống lúc chốt**
(con chưa làm gì làm mức đổi); ngược lại `= mức hệ thống`. Có nhãn "bố mẹ chốt" khi dùng mức chốt.
(Chỉnh 05/10 khi lập kế hoạch: bỏ điều kiện "mới hơn đề xuất mới nhất" — học sinh không đọc được `tutor_proposals` (RLS),
nên quy tắc phải tính được ở mọi màn hình. Đề xuất mới lệch với mức đã chốt vẫn bật lại **cờ lệch** ở mục 2.)
(Chỉnh 05/10 sau review: mức hệ thống **đã đổi ở bất kỳ lúc nào sau khi chốt** thì lần chốt đó hết hiệu lực hẳn — lên M2 rồi tụt về M1 không làm "bố mẹ chốt" hiện lại. App dò lại các câu con làm sau lần chốt.)
Áp dụng ở: Tổng quan, trang gia sư (bằng chứng + "Bài làm của con"), bản đồ tiến độ của con.

### 4. Bản đồ các bài
Ô màu theo mức hiển thị (thang m0–m4), tên bài, số câu đã làm hoặc "chưa đủ dữ liệu" (D15), nhãn "bố mẹ chốt".
Bấm → "Xem bài làm" của bài đó (`/parent/students/[id]/work?unit=`).

### 5. Tóm tắt tuần này (thứ Hai → hôm nay, giờ VN)
Số buổi học / mục tiêu 4 (cùng quy tắc với học sinh) · bài kiểm tra đã nộp · lượt ôn đã xong · buổi dạy gia sư đã ghi ·
bài về nhà: đã giao / con báo xong / đã chữa. Không streak, không so sánh (D17).

### 6. Nhiều học sinh
Một khối như trên cho mỗi học sinh của phụ huynh (hiện 1; An sau — D11).

## Tài khoản — lịch dạy
- Form "Gán gia sư": thêm ô chọn **T2 … CN** (không bắt buộc).
- "Lịch sử phân công": phân công đang hoạt động hiện lịch ("T3, T5") + nút **"Sửa lịch"**.

## Dữ liệu — migration `0008` (chỉ thêm)

`public.parent_confirmations`
| Cột | Ghi chú |
|---|---|
| `id` uuid pk | |
| `student_id` | FK students, on delete cascade |
| `parent_id` | FK profiles (người chốt) |
| `unit_id` | text `^[a-z0-9-]+$` |
| `level` | 0–4 |
| `system_level` | 0–4 — mức hệ thống lúc chốt (để biết sau này con có làm đổi mức không) |
| `proposal_session_id` | uuid, null — buổi dạy chứa đề xuất được chốt theo |
| `note` | ≤ 300 ký tự |
| `created_at` | |
Index `(student_id, unit_id, created_at desc)`.
RLS SELECT: phụ huynh của học sinh; gia sư **đang được gán**; chính học sinh. Ghi qua server action (`service_role`).

`public.tutor_assignments` thêm cột `weekdays smallint[] not null default '{}'`, check mỗi phần tử 1–7 (1 = thứ Hai), ≤ 7 phần tử, không trùng.

## Logic (thuần, `src/lib/learning/overview.ts`, unit-tested)
- `displayLevel(system, latestProposal, latestConfirmation)` → `{ level, confirmed }`.
- `mismatchFlags(units, proposals, confirmations)` → danh sách cờ.
- `missedSessions(assignments, sessions, today)` → ngày dạy chưa ghi (14 ngày, > 24h).
- `weekSummary(attempts, reviewLog, sessions, homework, today)`.
Server action `confirmLevel` (phụ huynh, sở hữu học sinh, bài tồn tại, mức 0–4, ghi chú ≤ 300) chụp `system_level` hiện tại.
Server action `setAssignmentWeekdays` (phụ huynh sở hữu học sinh của phân công).

## Kiểm tra
- Unit: mức hiển thị (chốt mới hơn đề xuất; con làm đổi mức → về mức hệ thống); cờ (lệch 1 bậc, đã chốt, tự khớp);
  buổi chưa ghi (ngày dạy hôm nay chưa nhắc, ngày hôm qua nhắc, trước ngày bắt đầu phân công không nhắc, có buổi ghi đúng ngày thì không);
  tóm tắt tuần (ranh giới thứ Hai, giờ VN).
- RLS: phụ huynh/gia sư đang gán/học sinh đọc được; gia sư cũ, học sinh khác không; không ai ghi trực tiếp; `weekdays` sai bị từ chối.
- e2e: Tổng quan 3 số đúng; gia sư đề xuất M3 khi hệ thống M1 → cờ → chốt M3 → cờ biến mất, 3 số cập nhật, trang học sinh
  hiện "bố mẹ chốt"; lịch T(hôm qua) không có buổi → nhắc, ghi buổi ngày đó → hết nhắc.

## Ngoài phạm vi
Báo cáo tháng, biểu đồ theo thời gian, nhắc qua email/Zalo (D10), buổi học bù/đổi lịch một lần, chỉnh quy tắc mức từ giao diện.

## Ảnh hưởng tài liệu
`docs/SPEC.md` §0 thêm P1–P3; `docs/DESIGN.md` route `/parent`, bảng mới; `docs/P1_PLAN.md` S4; `docs/PROGRESS.md` báo cáo + SQL 0008.
