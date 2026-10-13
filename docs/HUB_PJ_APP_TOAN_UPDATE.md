# Bản nháp cập nhật `claude/PJ_APP_TOAN.md` (hub STUDY BB) — chờ phụ huynh duyệt

> Soạn 13/10/2026. Hub chỉ phụ huynh ghi vào file canonical (update → review → commit), nên đây là **bản nháp để dán/commit**, không phải đã ghi.
> Nguồn: `docs/SPEC.md` §0 (LT1–LT18, AI1–AI4), `docs/CURRICULUM.md`, `docs/CONTENT_STANDARD.md`, `docs/AI_TUTOR.md`, `docs/PROGRESS.md`.
> Lý do: `CLAUDE.md` của repo nói hub là nguồn sự thật, nhưng hub dừng ở D24 (05/10). Từ 05/10 đến 13/10 đã chốt thêm LT1–LT18 và AI1–AI4 chỉ có trong repo.

## 1. Sửa phần đầu file

Thay dòng `Trạng thái tài liệu` và `Cập nhật`:

```
Trạng thái tài liệu: ✅ v1.3 — thêm lộ trình 48 KU, chuẩn nội dung, thiết kế AI (LT1–LT18, AI1–AI4) chốt 05–06/10; pilot học chính thức từ 12/10. Bản sao trong repo: `docs/SPEC.md` §0.
Cập nhật: 13/10/2026
```

## 2. Thêm mục "2.8 Quyết định lộ trình, nội dung và AI (05–06/10/2026)" sau bảng D1–D24

Quyết định theo mã LT (lộ trình/nội dung) và AI (trợ lý AI). Chi tiết và lý do: `docs/SPEC.md` §0.

| # | Quyết định | Ghi chú |
|---|---|---|
| LT1 | Lộ trình đọc được bằng máy: `content/curriculum.json` (track, thứ tự, KU tiên quyết, trọng số đề, kiểu chấm), kiểm bằng `npm test` | `docs/CURRICULUM.md` giữ phần giải thích |
| LT2 | KU mở khoá khi mọi KU tiên quyết đạt **M3**; phụ huynh **mở khoá tay** được | SQL 0009 |
| LT3 | "Bài mới" gợi ý **1 KU Track A + 1 KU Track B/C**; tối đa **2 KU đang học** cùng lúc | |
| LT4 | **Kiểm tra vượt** cho Track B và KU nền (F1/F3): làm thẳng bài kiểm tra, **một lần mỗi KU**; ≥ 80% → M3 + ôn D+1 | KU căn thức (c-*), Track A, không có kiểm tra vượt |
| LT5 | Loại câu **nhiều bước** (`steps`): tính là một câu; đúng khi mọi bước đúng; mã lỗi theo bước sai đầu tiên | |
| LT6 | App chỉ giữ câu tự chấm; **chứng minh làm trên giấy với gia sư**; KU có phần gia sư gắn nhãn "cần gia sư xác nhận" | Không chấm bằng ảnh ở P1 |
| LT7 | Hình vẽ: **SVG nhúng trong JSON nội dung**, được lọc và kiểm tra bằng test, màu lấy từ theme | |
| LT8 | Mỗi phiên ôn tối đa **5 KU** (~15 câu), quá hạn lâu nhất trước; phần còn lại dồn sang hôm sau | |
| LT9 | Bản đồ tiến độ nhóm theo **track → module**; chỉ mở module đang học | |
| LT10 | QA nội dung: mỗi KU được **giải độc lập lần hai + tính lại đáp án bằng script** trước khi phụ huynh xem; gia sư soát các đợt khó (C, E, G) | |
| LT11 | Thứ tự build: S6a → giao diện học sinh → S6b → các đợt nội dung, chạy **song song với pilot** từ 12/10 | |
| LT12 | Thời gian: **12/10/2026 → 31/03/2027** học xong; từ tháng 4 chỉ luyện đề | |
| LT13 | Kho kiểm tra **8 câu (2 L1 + 3 L2 + 3 L3)**, mỗi lượt rút **5 (1 + 2 + 2)**, câu chưa gặp trước; ngưỡng M3 giữ nguyên | |
| LT14 | Luyện tập = **3 L1 + 3 L2 + 2 L3**, có ≥ 1 câu nhận dạng (E05); L4 nằm trong ôn trộn | |
| LT15 | Nguồn câu: L1–L2 Claude tự soạn; **L3 lấy/chuyển thể từ sách 68 đề (chỉ Đề 1–56) + đề Hà Nội**, ghi `source` từng câu; **Đề 57–68 để dành thi thử từ ~01/2027** (chốt 06/10); không đưa PDF lên GitHub | |
| LT16 | Câu sai có gốc ở KU nền gắn `review: <KU>` → hiện "Ôn lại: …", do người soạn chọn, không do AI | |
| LT17 | Thu hẹp theo cấu trúc đề thật (Bài 1 1,5 · Bài 2 1,5 · Bài 3 2,5 · Bài 4 4,0 · Bài 5 0,5): **8 KU ít ra thi chuyển sang P2** (f-hamso, f-parabol, e-giaodiem, i-giaitgv, i-ungdung, j-cung, m-vitri, n-ngoainoi); tối ưu gộp **5 → 3 KU**. Còn **48 KU = 40 lõi + 8 P2** (~77 giờ lõi) | |
| LT18 | **Hình học sớm hơn:** Track C bắt đầu **tuần 7 (23/11/2026)**; để đạt 9,5 thì câu 4.2c (o-nangcao) ưu tiên hơn Bài 5; thiết kế S5 (C1–C3) khoảng 11/2026 | |
| AI1 | Bật AI cho học sinh **sau 3–4 tuần pilot (~09/11/2026)**, khi bộ 20–30 test lấy từ lỗi thật của Nguyên đạt rubric của phụ huynh | `docs/AI_TUTOR.md` §8 |
| AI2 | Gợi ý H1–H3 **viết sẵn trong nội dung và duyệt như câu hỏi** (không cần AI); AI chỉ cho câu hỏi tự do sau H3 (H4–H5, ≤ 6 lượt/câu); H6 = lời giải đã duyệt. Đúng sau H2 trở lên không tính là "đúng ngay lần đầu" | |
| AI3 | AI cho phụ huynh/gia sư: **báo cáo tuần**, **tóm tắt trước buổi dạy**, **tóm tắt hội thoại AI hằng tuần**; số liệu lấy từ DB theo mẫu và đối chiếu | |
| AI4 | Ngân sách AI **tối đa 10 USD/tháng** (hạn mức Console + đếm token ở server); chạm trần thì AI tạm dừng, gợi ý viết sẵn vẫn chạy | Khoá API chỉ để trong biến môi trường Vercel |

## 3. Sửa bảng Milestones (§4)

Thay dòng P1 và P2:

| # | Phase | Nội dung | Trạng thái |
|---|---|---|---|
| P1 | Khung học + nội dung | Luồng học, mastery, lịch ôn, gia sư, phụ huynh, lộ trình 48 KU, câu nhiều bước/SVG/gợi ý (S1–S4, S6a, S6b ✅). Nội dung: htl-1, htl-2 đã duyệt; đợt 1 (4 KU) và đợt 2 (4 KU) đang chờ duyệt; đợt 3–10 theo `docs/CURRICULUM.md` §3 | 🔵 **Mốc học chính thức (pilot) 12/10/2026.** Còn: S4b (~06/11), S5 hình học (~11/2026), nội dung đợt 3–10 đến 21/02/2027 |
| P2 | AI giảng bài | S8: giải thích câu sai (H4–H5), báo cáo tuần, tóm tắt buổi dạy; bộ test từ lỗi thật → phụ huynh duyệt → bật | ⬜ Viết code 26/10–06/11, bật ~09/11 (AI1) |

## 4. Thêm vào §8 Work-product inventory

| Deliverable | Định dạng | Ghi chú |
|---|---|---|
| Lộ trình 48 KU, timeline 12/10/2026 → 31/03/2027 | Markdown + JSON | `docs/CURRICULUM.md`, `content/curriculum.json` |
| Chuẩn soạn nội dung KU | Markdown | `docs/CONTENT_STANDARD.md` |
| Thiết kế AI giảng bài | Markdown | `docs/AI_TUTOR.md` |
| Chỉ mục nguồn 68 đề (914 phần đề phân loại theo KU) | Markdown | `docs/SOURCE_INDEX.md`. File PDF gốc nằm trong Project hub, **không** nằm trên GitHub |
| Bài kiểm tra đầu vào Toán 9 — 11/10/2026 | Claude Doc | Gồm đáp án, phiếu chấm, bảng quyết định theo KU |
| Việc kế tiếp cho từng phiên | Markdown | `docs/HANDOFF.md` |

## 5. Thêm vào §12 Run/decision log

- 05/10/2026: Review kiến trúc lộ trình — chốt LT1–LT12 qua câu hỏi popup; viết `docs/CURRICULUM.md` (50 KU, 2 track song song), `docs/CONTENT_STANDARD.md`, `docs/AI_TUTOR.md` (AI1–AI4).
- 05–06/10/2026: Lập chỉ mục 68 đề; điều chỉnh lộ trình theo cấu trúc đề thật — LT17 (còn 48 KU) và LT18 (hình học từ tuần 7); S6a, S6a+, S6b merged; nội dung đợt 1 merged ở dạng nháp.
- 06/10/2026: Chốt Q15–Q20; **Đề 57–68 để dành thi thử** (phát hiện nội dung đợt 1 dùng 4 câu từ các đề này → thay bằng câu từ Đề 1–56 trước khi merge; thêm test chặn).
- 06/10/2026: Soạn bài kiểm tra đầu vào 11/10 (90 phút, gia sư chấm).
- 12/10/2026: mốc bắt đầu học chính thức (pilot) với tài khoản Nguyên — chưa có báo cáo thực tế.
- 13/10/2026: Nội dung đợt 2 (4 KU nháp, PR #18); thêm `docs/HANDOFF.md`, quy tắc phối hợp claude.ai ↔ Claude Code trong `CLAUDE.md`, test số migration và số câu hỏi mở không trùng.

## 6. Sửa §7 Next actions

1. Phụ huynh duyệt 4 KU đợt 1 trước 18/10 (phiếu duyệt `docs/CONTENT_STANDARD.md` §7, ~20 phút/KU); đợt 2 trước 25/10.
2. Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng quyết định theo KU.
3. Tạo khoá Anthropic Console với **hạn mức chi tiêu 10 USD/tháng**, dán vào biến môi trường Vercel (không dán vào chat) — trước 26/10 (AI4).
4. Claude: viết S8 (26/10–06/11), S4b (~06/11); nội dung đợt 3 (08/11).

## 7. Sửa §10 Còn để ngỏ

| Hạng mục | Chốt khi nào |
|---|---|
| Ngày thi vào 10 chính thức 2027 | Tạm đầu tháng 6/2027; mốc học xong 31/03 không phụ thuộc (Q12) |
| Có đối chiếu trang gốc các câu chuyển thể và có giải độc lập trước khi duyệt đợt 2 không | Q21–Q23, trước 25/10 |
| Rubric chấm AI tutor + bộ 20–30 test case từ lỗi thật | Cuối tháng 10 – đầu tháng 11, trước khi bật AI (AI1) |
| Có lên gói trả phí Supabase không | Sau pilot |
