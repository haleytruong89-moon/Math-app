# HANDOFF — việc kế tiếp cho từng phiên

> Phụ huynh chỉ cần nói **"đọc HANDOFF"**. Phiên nào xong việc thì cập nhật mục của mình (ngày, trạng thái, việc kế).
> Cập nhật lần cuối: 13/10/2026 (claude.ai). Quy tắc phối hợp: `CLAUDE.md` mục "Working with two Claude surfaces".

## Quy ước
- Mỗi phiên một nhánh, một thư mục. Không merge, không push `main`, không chạy SQL, không đọc/in khoá bí mật.
- Trước khi làm: `git fetch`, xem PR/CI thật trên GitHub; đọc `docs/PROGRESS.md` (mục mới nhất) và `docs/CURRICULUM.md` §3.
- Nội dung chỉ lấy từ Đề 1–56 của sách 68 đề (Đề 57–68 để dành thi thử). Mọi KU mới ở trạng thái `draft`.

## Phiên Nội dung (cloud, gắn Project)
| Việc | Nhánh | Hạn | Trạng thái |
|---|---|---|---|
| Đợt 1: f1-hdt, f1-pnt, a-tanso, b-phepthu + chuẩn hoá htl-1/2 | `p1-content-1` | duyệt trước 18/10 | ✅ đã merge (PR #17); chờ phụ huynh duyệt |
| Đợt 2: f1-tgon, f1-qd, a-bieudo, b-xsuat | `p1-content-2` | 25/10 | 🟡 PR #18, bản nháp; còn giải độc lập (CONTENT_STANDARD §7 bước 2), Q21–Q23 |
| Đợt 3: p-trunon, p-cau, p-ghep, b-haib, c-dkxd | `p1-content-3` | 08/11 | ⬜ chưa bắt đầu — làm sau khi phụ huynh phản hồi đợt 1 |

## Phiên Code (VS Code / cloud)
| Việc | Nhánh | Hạn | Điều kiện |
|---|---|---|---|
| S8 — AI giảng bài + báo cáo tuần (SQL 0011) | `p1-slice-8` | code 26/10–06/11, bật ~09/11 | Chờ phản hồi thật từ pilot 12/10; cần khoá API 10 USD/tháng (phụ huynh dán vào Vercel) |
| S4b — mốc 8,5/9,5, mở khoá tay | `p1-slice-4b` | ~06/11 | Kiểm tra số migration trước khi đặt số |
| S5 — Hình học C1–C3 | — | thiết kế ~11/2026 | Track C từ 23/11 (LT18) |

## Phụ huynh
- [ ] Duyệt 4 KU đợt 1 (trước 18/10) rồi nói "duyệt KU …".
- [ ] Điền kết quả bài kiểm tra đầu vào 11/10 vào bảng "Quyết định" (tài liệu trong Project).
- [ ] Tạo khoá Anthropic API hạn mức 10 USD/tháng, dán vào Vercel (không dán vào chat) — trước 26/10.
- [ ] Cập nhật `claude/PJ_APP_TOAN.md` trong hub (bản nháp: `docs/HUB_PJ_APP_TOAN_UPDATE.md`).
