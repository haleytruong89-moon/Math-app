# HANDOFF — việc kế tiếp cho từng phiên

> Phụ huynh chỉ cần nói **"đọc HANDOFF"**. Phiên nào xong việc thì cập nhật mục của mình (ngày, trạng thái, việc kế).
> Cập nhật lần cuối: 21/10/2026 (S5 code xong, PR mở). Quy tắc phối hợp: `CLAUDE.md` mục "Working with two Claude surfaces".

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
| Đợt 5: f3-dongdang, j-coban, c-coban, c-truccan (f3-dongdang theo dạng câu S5) | `p1-content-5` | 15/11 | ⬜ |
| Đợt 7 thêm f3-tugiac; đợt 9: o-thanghang thay l-kethop; P2 thêm q-dagiac (LT21, 21/10) | — | theo `CURRICULUM.md` §6 | ⬜ |

## Phiên Code (VS Code / cloud)
| Việc | Nhánh | Hạn | Điều kiện |
|---|---|---|---|
| Bàn làm việc gia sư (T7–T9): mẫu giao diện 5 tab → lát S10 (kho bài, duyệt, ưu tiên; SQL bảng duyệt) → lát S11 (giao từng câu, buổi dạy gọn, Hôm nay; SQL) | `p1-tutor-ux`, `p1-slice-10`, `p1-slice-11` | code tuần 43–44 | ✅ Mẫu duyệt 20/10; kế hoạch `docs/superpowers/plans/2026-10-20-s10-*.md`, `…-s11-*.md` (4 quyết định chốt 20/10). S10 ✅ #27, S11 ✅ #29 (20/10); chỉnh cho laptop ✅ #30, giao diện bản 2 ✅ #31 (21/10, không SQL) |
| S9 — Gia sư giao bài trong app: bài về nhà gắn KU → nút "Làm trên app" (mở cả khi KU còn khoá), gia sư thấy kết quả của bài đó; ưu tiên theo hạn nộp. Không SQL (dùng `homework.unit_id`) | `p1-slice-9` | ngay sau khi phụ huynh "ok" | ✅ Phụ huynh "ok" 17/10 → PR #23 (không SQL) |
| **1.** S5 — thiết kế | `p1-plan-reorder` (PR #32) | ✅ 21/10 | Spec `docs/superpowers/specs/2026-10-21-s5-geometry-design.md`; mẫu trên design canvas (hàng "S5 · Học hình"); LT21 (52 KU) |
| **2.** S4b gọn — tiến độ mốc 8,5/9,5, KU trễ lịch (bỏ mở khoá tay) | `p1-slice-4b` | 25–27/10 | Số migration: lấy số trống kế tiếp lúc làm (0011–0013 đã dùng) |
| **3.** S5 — code: Phân tích ngược, C3, C2, Sổ tay, tự vẽ hình | `p1-slice-5` | ✅ 21/10 — PR mở, không SQL | Đợt 5 soạn theo `CONTENT_STANDARD.md` §10 (hạn 15/11); Sổ tay cần hình SVG + duyệt |
| **4.** S8 — AI giảng bài + báo cáo tuần | `p1-slice-8` | code ~12–28/11, bật ~cuối 11 | Chờ phản hồi thật từ pilot 12/10; dùng phép tính mốc của S4b; khoá API đã có trên Vercel (19/10) |

## Phụ huynh
- [x] Merge #20–#23 (đợt 2–4, S9).
- [ ] Gia sư soát c-dkxd và 5 bài G (giờ làm ngay trên tab Kho bài) + trả lời Q24.
- [ ] Trong pilot: báo câu nào con sai nhiều / làm quá lâu ở 8 bài mới (thay cho phần làm thử trên bản xem trước).
- [ ] Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng "Quyết định" (tài liệu trong Project).
- [x] Tạo khoá Anthropic API hạn mức 10 USD/tháng, dán vào Vercel (xong 19/10).
- [x] SQL 0011 + PR #25; #24, #26, #28; SQL 0012 + PR #27 (20/10).
- [x] SQL 0013 + PR #29 (20/10).
- [x] Merge PR #30 (21/10).
- [x] Merge PR #31 (giao diện bản 2, 21/10).
- [x] Merge PR #32 (thứ tự, LT21, thiết kế + kế hoạch S5).
- [ ] Merge PR `p1-slice-5` (S5 hình học, không SQL) khi CI xanh.
- [ ] Nhờ gia sư duyệt 10 bài đợt 3–4 trên tab **Kho bài** (thay cho soát qua tin nhắn).
- [ ] Cập nhật `claude/PJ_APP_TOAN.md` trong hub (bản nháp: `docs/HUB_PJ_APP_TOAN_UPDATE.md`).
