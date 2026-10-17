# HANDOFF — việc kế tiếp cho từng phiên

> Phụ huynh chỉ cần nói **"đọc HANDOFF"**. Phiên nào xong việc thì cập nhật mục của mình (ngày, trạng thái, việc kế).
> Cập nhật lần cuối: 17/10/2026. Quy tắc phối hợp: `CLAUDE.md` mục "Working with two Claude surfaces".

## Quy ước
- Mỗi phiên một nhánh, một thư mục. Không merge, không push `main`, không chạy SQL, không đọc/in khoá bí mật.
- Trước khi làm: `git fetch`, xem PR/CI thật trên GitHub; đọc `docs/PROGRESS.md` (mục mới nhất) và `docs/CURRICULUM.md` §3.
- Nội dung chỉ lấy từ Đề 1–56 của sách 68 đề (Đề 57–68 để dành thi thử). Mọi KU mới ở trạng thái `draft`.

## Phiên Nội dung (cloud, gắn Project)
| Việc | Nhánh | Hạn | Trạng thái |
|---|---|---|---|
| Đợt 1: f1-hdt, f1-pnt, a-tanso, b-phepthu + chuẩn hoá htl-1/2 | `p1-content-1` | duyệt trước 18/10 | ✅ đã merge (PR #17); phụ huynh duyệt 15/10 (PR #20) |
| Đợt 2: f1-tgon, f1-qd, a-bieudo, b-xsuat | `p1-content-2` | duyệt trước 25/10 | ✅ đã merge (PR #18); giải độc lập 103/103 + sửa; phụ huynh duyệt 15/10 (PR #20) |
| Đợt 3: p-trunon, p-cau, p-ghep, b-haib, c-dkxd | `p1-content-3` | duyệt trước 08/11 | 🟡 PR mở 15/10, nháp; giải độc lập 109/109; c-dkxd chờ gia sư soát |
| Đợt 4 (LT19): g-giaihpt, g-chuso, g-chuyendong, g-nangsuat, g-phantram | `p1-content-4` | duyệt trước 01/11 | 🟡 PR mở 17/10, nháp; giải độc lập 190/190; chờ gia sư soát G |
| Đợt 5: f3-dongdang, j-coban, c-coban, c-truccan | `p1-content-5` | 15/11 | ⬜ |

## Phiên Code (VS Code / cloud)
| Việc | Nhánh | Hạn | Điều kiện |
|---|---|---|---|
| S9 — Gia sư giao bài trong app: bài về nhà gắn KU → nút "Làm trên app" (mở cả khi KU còn khoá), gia sư thấy kết quả của bài đó; ưu tiên theo hạn nộp. Không SQL (dùng `homework.unit_id`) | `p1-slice-9` | ngay sau khi phụ huynh "ok" | Thiết kế đề xuất 17/10 trong chat, chờ duyệt |
| S8 — AI giảng bài + báo cáo tuần (SQL 0011) | `p1-slice-8` | code 26/10–06/11, bật ~09/11 | Chờ phản hồi thật từ pilot 12/10; cần khoá API 10 USD/tháng (phụ huynh dán vào Vercel) |
| S4b — mốc 8,5/9,5, mở khoá tay | `p1-slice-4b` | ~06/11 | Kiểm tra số migration trước khi đặt số |
| S5 — Hình học C1–C3 | — | thiết kế ~11/2026 | Track C từ 23/11 (LT18) |

## Phụ huynh
- [ ] Merge PR #20 (giải độc lập đợt 2 + duyệt 8 KU đợt 1–2, đã chốt 15/10).
- [ ] Merge PR đợt 3 (`p1-content-3`), duyệt 5 bài trên preview; nhờ gia sư soát c-dkxd (danh sách trong PROGRESS 15/10).
- [ ] Merge PR đợt 4 (`p1-content-4`); nhờ gia sư soát 5 bài G + trả lời Q24; gửi gia sư danh sách lỗi trong chuyên đề (PROGRESS 17/10).
- [ ] Trả lời "ok" cho S9 (gia sư giao bài trong app) nếu đồng ý thiết kế.
- [ ] Trong pilot: báo câu nào con sai nhiều / làm quá lâu ở 8 bài mới (thay cho phần làm thử trên bản xem trước).
- [ ] Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng "Quyết định" (tài liệu trong Project).
- [ ] Tạo khoá Anthropic API hạn mức 10 USD/tháng, dán vào Vercel (không dán vào chat) — trước 26/10.
- [ ] Cập nhật `claude/PJ_APP_TOAN.md` trong hub (bản nháp: `docs/HUB_PJ_APP_TOAN_UPDATE.md`).
