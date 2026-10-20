# HANDOFF — việc kế tiếp cho từng phiên

> Phụ huynh chỉ cần nói **"đọc HANDOFF"**. Phiên nào xong việc thì cập nhật mục của mình (ngày, trạng thái, việc kế).
> Cập nhật lần cuối: 20/10/2026 (S11). Quy tắc phối hợp: `CLAUDE.md` mục "Working with two Claude surfaces".

## Quy ước
- Mỗi phiên một nhánh, một thư mục. Không merge, không push `main`, không chạy SQL (kể cả nút "Áp dụng SQL" — chỉ phụ huynh bấm), không đọc/in khoá bí mật.
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
| Bàn làm việc gia sư (T7–T9): mẫu giao diện 5 tab → lát S10 (kho bài, duyệt, ưu tiên; SQL bảng duyệt) → lát S11 (giao từng câu, buổi dạy gọn, Hôm nay; SQL) | `p1-tutor-ux`, `p1-slice-10`, `p1-slice-11` | code tuần 43–44 | ✅ Mẫu duyệt 20/10; kế hoạch `docs/superpowers/plans/2026-10-20-s10-*.md`, `…-s11-*.md` (4 quyết định chốt 20/10). S10 ✅ merged 20/10 (#27); **S11 PR mở 20/10 (SQL 0013)**. Trợ lý AI (S8) lùi ~1 tuần |
| S9 — Gia sư giao bài trong app: bài về nhà gắn KU → nút "Làm trên app" (mở cả khi KU còn khoá), gia sư thấy kết quả của bài đó; ưu tiên theo hạn nộp. Không SQL (dùng `homework.unit_id`) | `p1-slice-9` | ngay sau khi phụ huynh "ok" | ✅ Phụ huynh "ok" 17/10 → PR #23 (không SQL) |
| S8 — AI giảng bài + báo cáo tuần (SQL **0014** — 0011 `review_runs`, 0012 S10, 0013 S11) | `p1-slice-8` | code 26/10–06/11, bật ~09/11 | Chờ phản hồi thật từ pilot 12/10; khoá API đã có trên Vercel (19/10) |
| S4b — mốc 8,5/9,5, mở khoá tay | `p1-slice-4b` | ~06/11 | Kiểm tra số migration trước khi đặt số |
| S5 — Hình học C1–C3 | — | thiết kế ~11/2026 | Track C từ 23/11 (LT18) |

## Phụ huynh
- [x] Merge #20–#23 (đợt 2–4, S9).
- [ ] Gia sư soát c-dkxd và 5 bài G (giờ làm ngay trên tab Kho bài) + trả lời Q24.
- [ ] Trong pilot: báo câu nào con sai nhiều / làm quá lâu ở 8 bài mới (thay cho phần làm thử trên bản xem trước).
- [ ] Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng "Quyết định" (tài liệu trong Project).
- [x] Tạo khoá Anthropic API hạn mức 10 USD/tháng, dán vào Vercel (xong 19/10).
- [x] SQL 0011 + PR #25; #24, #26, #28; SQL 0012 + PR #27 (20/10).
- [ ] Áp dụng SQL `0013_p1_item_homework.sql` (nhánh `p1-slice-11`) **rồi** merge PR S11.
- [ ] Nhờ gia sư duyệt 10 bài đợt 3–4 trên tab **Kho bài** (thay cho soát qua tin nhắn).
- [ ] Cập nhật `claude/PJ_APP_TOAN.md` trong hub (bản nháp: `docs/HUB_PJ_APP_TOAN_UPDATE.md`).
