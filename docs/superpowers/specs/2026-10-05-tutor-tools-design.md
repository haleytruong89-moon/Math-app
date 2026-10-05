# Công cụ gia sư: xem bài làm của con + giao bài về nhà

> Thiết kế duyệt qua chat ngày 05/10/2026 (phụ huynh: "ok"). Hai phần, **mỗi phần một PR**: A trước, B sau.

## Mục tiêu

Phụ huynh nêu sau khi gia sư dùng thử:
1. Gia sư **không xem được bài con đã làm**, nhất là câu sai → không biết góp ý, dạy chỗ nào.
2. Gia sư **không giao được bài tập bổ sung** (ví dụ ảnh đề trong sách) cho phần con còn yếu.

Thành công khi: trước/trong buổi dạy, gia sư mở điện thoại thấy ngay con sai câu nào, trả lời gì, lỗi gì; sau buổi, gia sư giao được bài và con thấy bài đó ở "Hôm nay cần làm".

## Quyết định đã chốt (05/10/2026)

| # | Quyết định |
|---|---|
| T1 | Bài về nhà: con **làm ra giấy**, buổi sau gia sư chữa trực tiếp. App không chấm, **không tính vào mức M, không tính vào mục tiêu tuần**. Không đổi D4. |
| T2 | Ảnh/đề: gia sư **dán link Google Drive** (tối đa 3 link). App không lưu ảnh, không dùng Supabase Storage. |
| T3 | Hạn làm mặc định **hôm nay + 3 ngày**, gia sư sửa được. |
| T4 | Con **thấy nhận xét** của gia sư sau khi chữa. |
| T5 | Màn "Bài làm của con" chỉ gồm luyện tập, kiểm tra, ôn — **không** gồm phần điền bước. |

---

## Phần A — "Bài làm của con" (không có SQL)

### Màn hình
- `/tutor` — thẻ học sinh có thêm nút phụ **"Xem bài làm"** (cạnh "Ghi buổi dạy").
- Form ghi buổi dạy — dưới bằng chứng mỗi bài đã tick: link **"Xem câu sai →"** tới đúng bài đó.
- **`/tutor/[studentId]/work`** (tiêu đề "Bài làm của {tên}"), điện thoại trước:
  - **Tóm tắt từng bài** (theo thứ tự khoá học): mức hệ thống, số câu đã làm (hoặc "chưa đủ dữ liệu"), kiểm tra gần nhất x/y, **lỗi hay gặp** (mã lỗi xuất hiện ≥ 2 lần, nhiều nhất trước, ví dụ "E04 × 3"), nhãn đề xuất gần nhất của **chính gia sư này** ("Bạn đề xuất M1 · 05/10").
  - **Bấm một bài** → danh sách câu đã làm, mới nhất trước, lọc mặc định **"Chỉ câu sai"** ↔ "Tất cả". Mỗi câu:
    - loại (Luyện tập / Kiểm tra / Ôn lại) · ngày giờ (giờ VN) · thời gian làm;
    - đề (KaTeX, hình nếu bài có hình);
    - **con trả lời** (trắc nghiệm hiện nội dung phương án, không hiện số thứ tự) và **đáp án đúng**;
    - mã lỗi + lời nhắc ứng với lỗi đó trong nội dung (nếu có);
    - **"Lần sau làm đúng"** nếu sau đó con làm đúng chính câu này;
    - lời giải chuẩn (gập sẵn).
  - Chỉ xem; góp ý vẫn ghi ở ghi chú buổi dạy.
- **Phụ huynh** cũng mở được trang này (dùng lại cho S4); học sinh **không**.

### Dữ liệu & quyền
- Đọc `attempts`, `unit_progress`, `review_queue`, `tutor_proposals` qua client của người dùng (RLS sẵn có từ 0003/0004/0006): gia sư chỉ thấy khi **đang được gán** và tài khoản còn hoạt động.
- Gia sư không được gán / bị khoá → **404** (giống form ghi buổi dạy). Học sinh → chuyển về `/student`.
- Bài nháp: hiện như form gia sư (gia sư dạy theo chương trình trường).

### Ghi chú kỹ thuật
- Pure helpers in `src/lib/learning/work.ts` (unit-tested): `commonErrors(attempts)`, `wrongItems(attempts, filter)`, `laterCorrect(attempt, attempts)`.
- `loadStudentState` already returns per-unit attempts but without `answer`/`duration_ms`; load those columns only on this page (one extra query, limited to the 5,000 most recent, newest first).
- Item text comes from content (`findItem` across practice/exit), rendered server-side with `texToHtml`; MCQ answers stored as option index → map to option HTML.

### Kiểm tra
- Unit: lỗi hay gặp, lọc câu sai, "lần sau làm đúng".
- e2e: gia sư thấy câu sai con vừa làm (đúng đáp án con chọn + đáp án đúng); lọc "Tất cả"; link từ form ghi buổi; hết gán → 404; phụ huynh mở được; học sinh không.

---

## Phần B — Giao bài về nhà (SQL `0007`)

### Gia sư giao bài (trong form "Ghi buổi dạy")
- Mục **"Giao bài về nhà (không bắt buộc)"** trên nút Lưu, có nút "+ Thêm bài" (nhiều bài/buổi):
  - **Cho phần:** một bài đã tick ở trên, hoặc "Khác";
  - **Yêu cầu** (bắt buộc nếu thêm bài, ≤ 300 ký tự);
  - **Link** (0–3, chỉ `https://`; không phải drive.google.com / docs.google.com → nhắc, vẫn cho lưu);
  - **Hạn** (mặc định hôm nay + 3, không trước ngày dạy, tối đa + 30 ngày).
- Lưu cùng buổi dạy (một lần bấm "Lưu buổi dạy"). Gợi ý dưới ô link: "Nhớ để chế độ *Bất kỳ ai có đường liên kết*".

### Con nhận bài
- "Hôm nay cần làm": thẻ **"Bài về nhà của thầy/cô"** cho mỗi bài chưa chữa — yêu cầu, hạn ("hạn thứ Năm 08/10" / "quá hạn" màu nhẹ), nút mở từng link (tab mới), nút **"Con làm xong rồi"** (bấm lại được để huỷ).
- Sau khi gia sư chữa: thẻ chuyển thành "Thầy/cô đã chữa" + nhận xét, ẩn sau 7 ngày.
- Không streak, không điểm, không tính mục tiêu tuần (D17, T1).

### Buổi sau gia sư chữa
- Đầu form ghi buổi dạy: **"Bài đã giao chưa chữa"** — yêu cầu, hạn, con đã báo xong chưa; nút **"Đã chữa"** + ô nhận xét (≤ 300 ký tự, tuỳ chọn). Chữa được độc lập với việc lưu buổi dạy.

### Bảng `homework` (migration 0007, chỉ thêm)
| Cột | Ghi chú |
|---|---|
| `id` uuid pk | |
| `student_id`, `tutor_id` | FK; tutor = người giao |
| `session_id` | khoá ngoại ghép `(session_id, student_id, tutor_id)` → `teaching_sessions` (giống `tutor_proposals`), nên bài luôn khớp học sinh + gia sư của buổi |
| `unit_id` | text, null = "Khác" |
| `task` | text 1–300 ký tự |
| `links` | text[] 0–3 phần tử, mỗi phần tử bắt đầu `https://`, ≤ 500 ký tự |
| `due_on` | date |
| `done_at` | timestamptz null — con báo xong |
| `reviewed_at`, `review_note` | null — gia sư chữa; note ≤ 300 |
| `created_at` | |

- RLS bật. **SELECT:** phụ huynh của học sinh; gia sư khi `tutor_id = mình` **và** đang được gán; chính học sinh. Không ai INSERT/UPDATE trực tiếp từ trình duyệt — mọi ghi qua server action (`service_role`), kiểm tra lại vai trò/gán như "Lưu buổi dạy".
- Server actions: `saveTeachingSession` (thêm homework), `setHomeworkDone(id, done)` — học sinh, chỉ bài của mình, chỉ khi chưa chữa; `reviewHomework(id, note)` — gia sư đã giao, đang được gán.
- GRANT cho `service_role`; test PGlite trong `supabase/tests/rls.test.mjs`.

### Kiểm tra
- RLS: con đọc được bài của mình, không đọc của học sinh khác; gia sư cũ (hết gán) không đọc; gia sư mới không thấy bài gia sư cũ giao; `links` sai định dạng / > 3 bị từ chối.
- Unit: kiểm tra đầu vào (yêu cầu rỗng, link không `https`, hạn ngoài khoảng).
- e2e cả vòng: gia sư giao 1 bài có link → con thấy thẻ, mở link, bấm xong → gia sư thấy "con đã báo xong", chữa + nhận xét → con thấy nhận xét; không ảnh hưởng mục tiêu tuần.

---

## Ngoài phạm vi
- Lưu ảnh trong app, con chụp bài nộp (T1, T2).
- Gia sư chọn câu có sẵn trong app làm bài về nhà (để sau khi có nhiều nội dung, S6).
- Thông báo/nhắc hạn ngoài app (D10).
- Gia sư sửa/xoá bài đã giao (thêm nếu pilot cần).

## Ảnh hưởng tài liệu
- `docs/SPEC.md` §0: thêm T1–T5; `docs/DESIGN.md`: route `/tutor/[studentId]/work`, bảng `homework`; `docs/P1_PLAN.md`: lát mới "S3b — Công cụ gia sư" trước S4; `docs/PROGRESS.md`: báo cáo mỗi PR.
