# HANDOFF — việc kế tiếp cho từng phiên

> Phụ huynh chỉ cần nói **"đọc HANDOFF"**. Phiên nào xong việc thì cập nhật mục của mình (ngày, trạng thái, việc kế).
> Cập nhật lần cuối: 01/11/2026 ("Cần tập trung": phụ huynh ★ + mục chọn bài cho con; Luyện đề 4.2 đã duyệt). Quy tắc phối hợp: `CLAUDE.md` mục "Working with two Claude surfaces".

## Quy ước
- Mỗi phiên một nhánh, một thư mục. Không merge, không push `main`, không chạy SQL (kể cả nút "Áp dụng SQL" — chỉ phụ huynh bấm), không đọc/in khoá bí mật.
- Trước khi làm: `git fetch`, xem PR/CI thật trên GitHub; đọc `docs/PROGRESS.md` (mục mới nhất) và `docs/CURRICULUM.md` §3.
- Nội dung chỉ lấy từ Đề 1–56 của sách 68 đề (Đề 57–68 để dành thi thử). Mọi KU mới ở trạng thái `draft`.

## Phiên Nội dung (cloud, gắn Project)
| Việc | Nhánh | Hạn | Trạng thái |
|---|---|---|---|
| Đợt 1: f1-hdt, f1-pnt, a-tanso, b-phepthu + chuẩn hoá htl-1/2 | `p1-content-1` | duyệt trước 18/10 | ✅ đã merge (PR #17); phụ huynh duyệt 15/10 (PR #20) |
| Đợt 2: f1-tgon, f1-qd, a-bieudo, b-xsuat | `p1-content-2` | duyệt trước 25/10 | ✅ đã merge (PR #18); giải độc lập 103/103 + sửa; phụ huynh duyệt 15/10 (PR #20) |
| Đợt 3: p-trunon, p-cau, p-ghep, b-haib, c-dkxd | `p1-content-3` | duyệt trước 08/11 | ✅ phụ huynh duyệt 23/10 (git); gia sư soát sau trên Kho bài |
| Đợt 4 (LT19): g-giaihpt, g-chuso, g-chuyendong, g-nangsuat, g-phantram | `p1-content-4` | duyệt trước 01/11 | ✅ phụ huynh duyệt 23/10 (git); gia sư soát sau trên Kho bài |
| Đợt 5: f3-dongdang, j-coban, c-coban, c-truccan (f3-dongdang theo dạng câu S5) | `p1-content-5` | duyệt trước 15/11 | ✅ phụ huynh duyệt 23/10 (git); gia sư soát sau trên Kho bài |
| Đợt 6: c-rutgon, c-cauphu, k-goiintiep, k-tugiacnt + hình Sổ tay | `p1-content-6` | duyệt trước 29/11 | ✅ phụ huynh duyệt 23/10 (git); gia sư soát sau trên Kho bài |
| Đợt 7: d-ptbh, d-nhamnghiem, d-thamso, l-tieptuyen, f3-tugiac | `p1-content-7` | 13/12 | 🟡 01/11 PR mở (nháp, giải độc lập 80/80); chờ gia sư soát + phụ huynh duyệt. Kế: đợt 8 theo `CURRICULUM.md` §6 |
| Luyện đề 4.2: thiết kế ✅ 23/10 → code + đợt 1 (Đề 3, 5, 6, 8, 28, 31, 35, 46, 52) + đợt 2 (9 + 10 bài ý a, nháp) | `p1-ld42`, `p1-ld42-2` | đợt đầu trước 23/11 | ✅ Merged 23/10 (PR #42 code + đợt 1, #43 đợt 2: Đề 7, 19, 24, 25, 26, 32, 36, 38, 41, 56) — 19 bài, phụ huynh duyệt 23/10, không SQL. Kế: gia sư soát; đợt 3 = bài ý a có tiếp tuyến (Đề 1, 2, 10, 14, 21, 23, 27…) sau l-tieptuyen (đợt 7, 13/12); ý b từ 01/2027 khi có o-dongdang |
| Đợt 7 thêm f3-tugiac; đợt 9: o-thanghang thay l-kethop; P2 thêm q-dagiac (LT21, 21/10) | — | theo `CURRICULUM.md` §6 | ⬜ |

## Phiên Code (VS Code / cloud)
| Việc | Nhánh | Hạn | Điều kiện |
|---|---|---|---|
| Bàn làm việc gia sư (T7–T9): mẫu giao diện 5 tab → lát S10 (kho bài, duyệt, ưu tiên; SQL bảng duyệt) → lát S11 (giao từng câu, buổi dạy gọn, Hôm nay; SQL) | `p1-tutor-ux`, `p1-slice-10`, `p1-slice-11` | code tuần 43–44 | ✅ Mẫu duyệt 20/10; kế hoạch `docs/superpowers/plans/2026-10-20-s10-*.md`, `…-s11-*.md` (4 quyết định chốt 20/10). S10 ✅ #27, S11 ✅ #29 (20/10); chỉnh cho laptop ✅ #30, giao diện bản 2 ✅ #31 (21/10, không SQL) |
| S9 — Gia sư giao bài trong app: bài về nhà gắn KU → nút "Làm trên app" (mở cả khi KU còn khoá), gia sư thấy kết quả của bài đó; ưu tiên theo hạn nộp. Không SQL (dùng `homework.unit_id`) | `p1-slice-9` | ngay sau khi phụ huynh "ok" | ✅ Phụ huynh "ok" 17/10 → PR #23 (không SQL) |
| **1.** S5 — thiết kế | `p1-plan-reorder` (PR #32) | ✅ 21/10 | Spec `docs/superpowers/specs/2026-10-21-s5-geometry-design.md`; mẫu trên design canvas (hàng "S5 · Học hình"); LT21 (52 KU) |
| **2.** S4b gọn — tiến độ mốc 8,5/9,5, KU trễ lịch (bỏ mở khoá tay) | `p1-slice-4b` | ✅ 22/10 — PR mở, không SQL | Quy tắc mốc chốt 22/10 (`SPEC.md` §0); phép tính ở `src/lib/learning/milestones.ts` |
| **3.** S5 — code: Phân tích ngược, C3, C2, Sổ tay, tự vẽ hình | `p1-slice-5` | ✅ 21/10 — PR mở, không SQL | Đợt 5 soạn theo `CONTENT_STANDARD.md` §10 (hạn 15/11); Sổ tay cần hình SVG + duyệt |
| **4a.** S8a — nền AI + báo cáo tuần + tóm tắt gia sư (SQL 0014) | `p1-slice-8` | ✅ Merged 23/10 (PR #37), SQL 0014 ✅ | Kế hoạch `docs/superpowers/plans/2026-10-22-s8a-ai-reports.md`; thiết kế `docs/superpowers/specs/2026-10-22-s8-ai-design.md` (chốt 22/10) |
| **4b.** S8b — AI cho con + bộ test + bật/tắt (không SQL) | `p1-slice-8b` | ✅ Merged 05/11 (PR #48) | Kế hoạch `docs/superpowers/plans/2026-11-01-s8b-student-ai.md`. Phụ huynh: merge → `/parent/ai/bo-test` tạo bộ test, chạy, chấm 20 câu → bật ở `/parent/ai`. Việc sau: "giải thích cách khác", tóm tắt hội thoại trong báo cáo tuần, bài hình chứng minh, gia sư xem hội thoại |

## Phụ huynh
- [x] Merge #20–#23 (đợt 2–4, S9).
- [x] Phụ huynh duyệt 18 bài đợt 3–6 (23/10). Merge PR `p1-approve-23`.
- [x] Merge #39–#43 (23/10).
- [x] Phụ huynh duyệt 19 bài luyện đề (23/10). Merge PR `p1-approve-ld42`.
- [ ] Gia sư soát 19 bài luyện đề trên Kho bài → "📐 Luyện đề hình" ("Cần sửa" = lý do + hướng dẫn). Xem cách sửa lỗi in Đề 32 ("AB, BC").
- [ ] Gia sư soát các bài đã duyệt trên Kho bài ("Cần sửa" = lý do + hướng dẫn sửa) + trả lời Q24.
- [x] Merge PR #33 (S5) và #34 (đợt 5, 22/10).
- [x] Merge PR #35 (S4b, 22/10).
- [x] Merge PR #36 (kế hoạch S8).
- [x] Merge PR #38 (đợt 6 + Sổ tay đã duyệt, 22/10). Gia sư soát 4 KU đợt 6 trước 29/11.
- [x] S8a: "Áp dụng SQL" 0014 (22/10, thành công).
- [x] S8a: `CRON_SECRET` + `ANTHROPIC_API_KEY` có trên Vercel; merge PR #37 (23/10).
- [ ] S8a: bấm "Tạo lại báo cáo tuần trước" để xem nhận xét AI thật lần đầu; đọc 2 lệnh hệ thống ở trang AI; đối chiếu giá model trên trang giá chính thức.
- [ ] Gia sư soát 4 KU đợt 5 (danh sách điểm cần xem: `PROGRESS.md` 22/10).
- [ ] Trong pilot: báo câu nào con sai nhiều / làm quá lâu ở 8 bài mới (thay cho phần làm thử trên bản xem trước).
- [ ] Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng "Quyết định" (tài liệu trong Project).
- [x] Tạo khoá Anthropic API hạn mức 10 USD/tháng, dán vào Vercel (xong 19/10).
- [x] SQL 0011 + PR #25; #24, #26, #28; SQL 0012 + PR #27 (20/10).
- [x] SQL 0013 + PR #29 (20/10).
- [x] Merge PR #30 (21/10).
- [x] Merge PR #31 (giao diện bản 2, 21/10).
- [x] Merge PR #32 (thứ tự, LT21, thiết kế + kế hoạch S5).
- [x] Merge PR #33 (S5 hình học, không SQL).
- [ ] Nhờ gia sư duyệt 10 bài đợt 3–4 trên tab **Kho bài** (thay cho soát qua tin nhắn).
- [ ] Cập nhật `claude/PJ_APP_TOAN.md` trong hub (bản nháp: `docs/HUB_PJ_APP_TOAN_UPDATE.md`).
