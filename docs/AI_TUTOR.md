# AI trong App Toán — thiết kế

> Duyệt 05/10/2026 (quyết định AI1–AI4 trong `docs/SPEC.md` §0). Chi tiết hoá D9 và hub §3.9. Chưa code; lát **S8**.
> Nguyên tắc gốc: **AI giúp con tự nghĩ, không giải hộ; không bao giờ là nguồn kiến thức mới.** Mọi kiến thức con học
> đến từ nội dung đã kiểm tra + phụ huynh duyệt (D16). AI chỉ diễn đạt lại và hỏi gợi mở dựa trên nội dung đó.

## 1. Phương pháp dạy (đã chốt, không đổi khi thêm AI)

| Phương pháp | Trong app | Ai làm |
|---|---|---|
| Lời giải mẫu + tự giải thích + giảm dần hỗ trợ | Lời giải mẫu → khuyết bước → tự giải | Nội dung đã duyệt |
| Luyện truy hồi | Luyện tập, kiểm tra không gợi ý | Nội dung đã duyệt |
| Ôn giãn cách + ôn trộn | D+1/7/21/60 ngày, phiên ôn trộn | Quy tắc app |
| Học đến khi vững | M3 mới mở bài sau | Quy tắc app |
| Chữa lỗi theo nguyên nhân | Mã lỗi E01–E15 + lời nhắc + link ôn nền | Nội dung đã duyệt |
| **Gợi ý theo nấc H1→H6 (Socratic)** | H1–H3 viết sẵn; H4–H5 hội thoại AI; H6 = lời giải đã duyệt | **Mới** — mục 3 |

## 2. AI làm gì / không làm gì

| Người dùng | AI làm | AI không làm |
|---|---|---|
| Con | Hỏi gợi mở khi con vẫn chưa hiểu sau gợi ý viết sẵn; "giải thích cách khác" cho lý thuyết / một bước lời giải mẫu | Không bật trong bài kiểm tra, kiểm tra vượt, phiên ôn trước khi trả lời; không đưa đáp số; không trả lời ngoài Toán / ngoài bài đang làm; không chấm điểm, không đổi mức M |
| Gia sư | Tóm tắt trước buổi dạy: lỗi lặp lại từ buổi trước, 2–3 điểm nên chữa | Không đề xuất mức M thay gia sư |
| Phụ huynh | Báo cáo tuần bằng lời; tóm tắt nhật ký hội thoại AI trong tuần (đoạn có vấn đề nêu trước) | Không tự tạo số liệu |

## 3. Luồng của con (một câu luyện tập)

```
Đọc đề ──► (tuỳ chọn) bấm "Gợi ý" ──► H1 Mục tiêu ──► H2 Nhận dạng ──► H3 Công cụ     ← viết sẵn, đã duyệt, không cần AI
   │                                                                     │
   ▼                                                                     ▼ vẫn chưa hiểu
Trả lời ──► sai ──► lời nhắc theo mã lỗi (đã duyệt) ──► "Con chưa hiểu chỗ này" ──► Hỏi AI (H4–H5, tối đa 6 lượt)
                                                                                      │
                                                                                      ▼ vẫn bí
                                                                     H6 = hiện lời giải đã duyệt (không phải AI viết)
```

- Gợi ý viết sẵn H1–H3 có ngay **từ S6b** (trước khi có AI). AI chỉ mở sau H3 hoặc sau một lần trả lời sai.
- Câu trả lời sau khi xem **H2 trở lên** hoặc sau khi hỏi AI: ghi `hint_level`, **không tính là đúng ngay lần đầu** cho M2; câu đó quay lại cuối phiên luyện như câu sai.
- Phiên ôn: không gợi ý trước khi trả lời (ôn là kiểm tra nhớ). Sau khi trả lời sai được mở gợi ý / AI để hiểu, không đổi kết quả ôn.
- Bài kiểm tra, kiểm tra vượt: **không gợi ý, không AI** (hub §3.6).

## 4. Năm lớp chống dạy sai

| # | Lớp | Cách làm |
|---|---|---|
| 1 | **Viết sẵn trước, AI sau** | H1–H3 + lời nhắc mã lỗi + lời giải H6 đều qua quy trình kiểm tra nội dung (`CONTENT_STANDARD.md` §7). Phần lớn lúc con cần giúp không chạm tới AI. |
| 2 | **Bám nội dung đã duyệt** | Gói ngữ cảnh gửi AI chỉ gồm: đề, lời giải đã duyệt, lý thuyết KU, các gợi ý H1–H3, lời nhắc các đáp án sai, câu trả lời + mã lỗi của con, câu hỏi của con. Không tên, không trường, không dữ liệu khác. Lệnh hệ thống: giảng theo lời giải đã duyệt, không tự giải lại, mỗi lượt 1 câu hỏi gợi mở, ≤ 80 chữ. |
| 3 | **Máy chủ soát câu trả lời của AI** | Trước khi hiện cho con: (a) mọi con số / biểu thức TeX trong câu trả lời phải có trong gói ngữ cảnh hoặc câu của con (cho phép số nhỏ ≤ 10); (b) không chứa đáp số cuối; (c) đúng chủ đề. Trượt → tạo lại 1 lần → vẫn trượt thì hiện gợi ý viết sẵn kế tiếp + ghi cờ cho phụ huynh. |
| 4 | **Thi trước khi bật, thi lại khi đổi** | Bộ test 20–30 tình huống lấy từ **lỗi thật của con trong 3–4 tuần pilot** (đã ẩn danh), phủ các mã lỗi chính. Phụ huynh chấm trên trang `/parent/ai-eval` theo 6 tiêu chí (0–2 điểm): đúng toán · không lộ đáp án sớm · đúng nấc gợi ý · ngắn, dễ hiểu · khiến con tự nghĩ · tiếng Việt tự nhiên. **Đạt:** không tình huống nào "sai toán" và trung bình ≥ 1,6. Chạy lại toàn bộ khi đổi lệnh hệ thống hoặc model. Thử 2 model, chọn model rẻ nhất đạt. |
| 5 | **Con báo sai, người lớn xem** | Nút "AI nói sai?" trên mỗi câu AI; mọi hội thoại lưu lại, phụ huynh + gia sư đọc được; cờ hiện ở Tổng quan. Bài con cần tới H4+ hoặc AI → vào danh sách "làm lại" (master plan §29). |

## 5. Hỗ trợ phụ huynh và gia sư

| Tính năng | Khi nào | Dữ liệu vào | Chống sai |
|---|---|---|---|
| Báo cáo tuần | Sáng thứ Hai, tự tạo | Số liệu tuần từ DB (buổi học, KU lên M3, ôn quá hạn, lỗi lặp, tiến độ mốc 8.5/9.5 theo `CURRICULUM.md` §3.3) | Số liệu chèn bằng khuôn mẫu, AI chỉ viết phần nhận xét quanh số; máy chủ đối chiếu mọi con số AI viết với dữ liệu |
| Tóm tắt cho gia sư | Khi mở form "Ghi buổi dạy" | Lỗi và KU từ buổi trước đến nay, bài về nhà | Như trên; chỉ nêu lỗi có trong dữ liệu |
| Tóm tắt hội thoại AI | Trong báo cáo tuần | Nhật ký hội thoại + cờ "AI nói sai?" + cờ soát số | Trích nguyên văn đoạn có cờ, không diễn giải lại |

## 6. Chi phí và giới hạn (AI4)

- Tài khoản Anthropic Console **riêng** (D9), khoá API chỉ nằm ở biến môi trường Vercel (không dán vào chat, không vào repo).
- **Trần $10/tháng:** đặt giới hạn chi tiêu trong Console + máy chủ tự đếm token (bảng `ai_usage`). Chạm 90% → báo phụ huynh; chạm trần → AI tạm tắt, gợi ý viết sẵn vẫn chạy.
- Giới hạn cho con: 6 lượt AI / câu, 20 lượt AI / ngày. Ước tính chi phí theo bảng giá hiện hành làm lại khi chọn model ở S8.

## 7. Dữ liệu và quyền riêng tư

- Không gửi tên, trường, lớp, ảnh; học sinh chỉ là mã ẩn danh. D18 đã bao gồm hội thoại AI (con đồng ý trước).
- Bảng mới (S8): `ai_messages` (học sinh, câu, vai trò, nội dung, cờ, token), `ai_usage`. RLS: học sinh đọc của mình; phụ huynh đọc hết; gia sư đọc khi đang được gán; ghi qua máy chủ.
- Kiểm tra lại điều khoản dữ liệu của API trước khi bật.

## 8. Lịch triển khai

| Lát | Nội dung | Khi nào |
|---|---|---|
| **S6b** | Gợi ý viết sẵn H1–H3 trong luyện tập; ghi `hint_level` (migration **0010**); câu dùng gợi ý H2+ không tính đúng lần đầu | 23/10 |
| Nội dung | Mọi câu luyện tập từ đợt 1 có `hints` H1–H3 (`CONTENT_STANDARD.md` §3) | từ đợt 1 |
| **S8** | Hội thoại AI cho con + soát câu trả lời + nhật ký + nút "AI nói sai?" + trang chấm bộ test + giới hạn chi phí (migration **0011**); báo cáo tuần, tóm tắt gia sư, tóm tắt hội thoại | code 26/10 – 06/11 |
| Bộ test | Gom 20–30 lỗi thật từ pilot tuần 1–3 → phụ huynh chấm | 02–08/11 |
| **Bật AI cho con** | Sau khi đạt bộ test + phụ huynh duyệt lệnh hệ thống | **~09/11/2026** (tuần pilot thứ 5) |

**Phụ huynh cần làm trước S8:** tạo tài khoản Anthropic Console, đặt giới hạn chi tiêu $10, tự dán khoá API vào Vercel; duyệt lệnh hệ thống (Claude soạn ở S8, file riêng); chấm bộ test.
