# Nhật ký tiến độ P1

> Claude đọc file này đầu mỗi phiên để biết làm tiếp từ đâu. Mục mới nhất ở trên cùng.
> Kế hoạch: `docs/P1_PLAN.md`.

## Trạng thái nhanh

> Việc kế tiếp cho từng phiên: `docs/HANDOFF.md`.

| Lát | Nhánh | Trạng thái |
|---|---|---|
| S1 — Nội dung + luồng học 1 KU | `p1-slice-1` | ✅ Merged 02/10 (PR #1), SQL 0003 đã chạy |
| S2 — Mastery + lịch ôn + "Hôm nay cần làm" | `p1-slice-2` | ✅ Merged 03/10 (PR #2), SQL 0004 + 0005 đã chạy |
| S3 — Gia sư "Ghi buổi dạy" | `p1-slice-3` | ✅ Merged 03/10 (PR #3), SQL 0006 đã chạy |
| Sửa lỗi trước pilot · S3b công cụ gia sư + bài về nhà | `p1-fixes`, `p1-tutor-tools`, `p1-homework` | ✅ Merged 05/10 (PR #4, #5, #7) — SQL 0007 |
| Tài khoản: danh sách, đổi tên, xoá | `p1-account-tools` | ✅ Merged 05/10 (PR #9) |
| S4 — Phụ huynh "Tổng quan" | `p1-slice-4` | ✅ Merged 05/10 (qua PR #13), SQL 0008 đã chạy |
| Docs — Content brief + checklist pilot | `p1-content-brief` | ✅ Merged 05/10 (PR #8) |
| Docs — Student UX handover | `p1-student-ux-handover` | ✖ Đóng (PR #6) — nội dung có trong PR #10 và PR #12 |
| Docs — Lộ trình 50 KU, chuẩn nội dung, thiết kế AI (LT1–LT16, AI1–AI4) | `p1-curriculum-design` | ✅ Merged 05/10 (PR #10) |
| Docs + data — chỉ mục 68 đề, LT17–LT18 (48 KU), `curriculum.json` cập nhật | `p1-curriculum-design` | ✅ Merged 06/10 (PR #14) |
| S6a — Bộ lộ trình (curriculum engine), SQL 0009 | `p1-slice-6a` | ✅ Merged 05/10 (PR #13, gộp luôn #11, #12), SQL 0009 đã chạy |
| S6a+ — Schema theo chuẩn nội dung: L3, `source`, `recognition`, `review`, `hints`; kho kiểm tra 8 câu rút 5; trường `priority` + chặn KU P2 (LT17) | `p1-slice-6a2` | ✅ Merged 06/10 (PR #15), không SQL |
| UX — Giao diện học sinh | `p1-student-ux` | ✅ Merged 05/10 (qua PR #13; theme, trang chủ, Hành trình, thẻ phản hồi — spec `docs/superpowers/specs/2026-10-05-student-ux-design.md`); bản đồ nhóm theo track (LT9) làm trong S6a |
| S6b — Câu nhiều bước, hình SVG, gợi ý H1–H3 (SQL 0010) | `p1-slice-6b` | ✅ Merged 06/10 (PR #16), SQL 0010 (xác nhận đã chạy trên Supabase: phụ huynh) |
| S9 — Gia sư giao bài trong app (T6) | `p1-slice-9` | ✅ Merged 19/10 (PR #23) — không SQL |
| Sửa lỗi audit H1 + H2: lượt ôn do server lập (SQL 0011), khoá câu đã duyệt | `p1-audit-fix` | ✅ Merged 20/10 (PR #25), SQL 0011 chạy bằng nút 20/10 |
| Nút "Áp dụng SQL" (GitHub Actions) | `p1-sql-button` | ✅ Merged 20/10 (PR #28) |
| S10 — Kho bài, duyệt từng câu, ưu tiên (T7, T8) | `p1-slice-10` | ✅ Merged 20/10 (PR #27), SQL 0012 chạy bằng nút 20/10 |
| S11 — Giao từng câu, Buổi dạy gọn, Hôm nay (T9) | `p1-slice-11` | ✅ Merged 20/10 (PR #29), SQL 0013 chạy bằng nút |
| Bàn làm việc gia sư trên laptop (audit 20/10) | `p1-tutor-polish` | ✅ Merged 21/10 (PR #30) |
| Giao diện gia sư bản 2 (nền trắng, sao vàng, Việc tiếp theo) | `p1-tutor-v2` | ✅ Merged 21/10 (PR #31) — không SQL |
| S8a — Nền AI + báo cáo tuần + tóm tắt gia sư (SQL 0014) | `p1-slice-8` | ✅ Merged 23/10 (PR #37), SQL 0014 chạy bằng nút 22/10 |
| S8b — AI cho con + bộ test | `p1-slice-8b` | ⬜ sau bộ test 02–08/11, bật ~cuối 11 |
| S4b — Tiến độ tới mốc 8.5/9.5 (bỏ mở khoá tay 21/10) | `p1-slice-4b` | ✅ Merged 22/10 (PR #35) — không SQL |
| Nội dung đợt 1 — f1-hdt, f1-pnt, a-tanso, b-phepthu (nháp) + chuẩn hoá htl-1/2 | `p1-content-1` | ✅ Merged 06/10 (PR #17); **phụ huynh duyệt 15/10** (đổi `approved` trong PR #20) |
| Nội dung đợt 2 — f1-tgon, f1-qd, a-bieudo, b-xsuat (nháp) | `p1-content-2`, `p1-content-2-qa` | ✅ Merged 14/10 (PR #18); giải độc lập 103/103 + sửa + **phụ huynh duyệt 15/10** (PR #20, chờ merge) |
| Nội dung đợt 3 — p-trunon, p-cau, p-ghep, b-haib, c-dkxd (nháp) | `p1-content-3` | ✅ **Phụ huynh duyệt 23/10** (git, khoá đáp án); gia sư soát sau — "Cần sửa" trên bài đã duyệt tạm ẩn câu đó |
| LT19–LT20 + Nội dung đợt 4 — g-giaihpt, g-chuso, g-chuyendong, g-nangsuat, g-phantram (nháp) | `p1-content-4` | ✅ **Phụ huynh duyệt 23/10** (git, khoá đáp án); gia sư soát sau — "Cần sửa" trên bài đã duyệt tạm ẩn câu đó |
| Nội dung đợt 5 — f3-dongdang (bài hình S5 đầu tiên), j-coban, c-coban, c-truccan (nháp) | `p1-content-5` | ✅ **Phụ huynh duyệt 23/10** (git, khoá đáp án); gia sư soát sau — "Cần sửa" trên bài đã duyệt tạm ẩn câu đó |
| Nội dung đợt 6 — c-rutgon, c-cauphu, k-goiintiep, k-tugiacnt (nháp) + hình Sổ tay | `p1-content-6` | ✅ **Phụ huynh duyệt 23/10** (git, khoá đáp án); gia sư soát sau — "Cần sửa" trên bài đã duyệt tạm ẩn câu đó |
| Nội dung đợt 7–10 | `p1-content-N` | ⬜ theo `docs/CURRICULUM.md` §6 |
| S7 — Pilot (tài khoản Nguyên) | — | 🟡 Mốc học chính thức **12/10/2026**; chưa có báo cáo thực tế (phụ huynh) |
| S5 — Hình học: Phân tích ngược, C3, C2, Sổ tay (C1 để sau) | `p1-slice-5` | ✅ Merged 22/10 (PR #33) — không SQL |
| Luyện đề hình 4.2 — kho bài 4.2 thật (Đề 1–56), mở khi M3/★, 3 bài mới/tuần; đợt đầu 9 bài ý a (nháp) | `p1-ld42`, `p1-ld42-2` | ✅ Merged 23/10 (PR #42, #43) — không SQL; 19 bài nháp, chờ phụ huynh "duyệt luyện đề" |

### Câu hỏi đang mở
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q8 | "Buổi dạy chưa ghi > 24h" cần lịch dạy: phụ huynh nhập ngày dạy trong tuần khi gán gia sư (ví dụ T3, T5)? | Có — làm trong S4 |
| Q9 | Buổi dạy không tick bài nào (ví dụ chữa đề ở trường, chủ đề chưa có trong app): cho lưu nếu có ghi chú? | Có — đang làm vậy |
| Q10 | Gia sư được ghi buổi dạy trễ tối đa bao nhiêu ngày? | 7 ngày (theo P1_PLAN) |
| Q11 | Gia sư mới có nên xem buổi dạy của gia sư cũ (để nối tiếp)? | Không — tách biệt theo D3; phụ huynh xem được hết |
| Q12 | Ngày thi chính thức 2027 | Tạm đầu tháng 6/2027; mốc học xong 31/03 không phụ thuộc |
| Q14 | KU P2 "chờ mọi KU P0/P1 cùng track đạt M3": tính cả KU lõi chưa có nội dung ("Sắp có")? | Có — tính cả (an toàn: P2 không chen trước bài lõi chưa soạn); phụ huynh mở tay được |

---

## 23/10/2026 — Luyện đề hình 4.2 đợt 2: 10 bài ý a (nhánh `p1-ld42-2`, không SQL, không code)

Phụ huynh "làm luôn" + danh sách theo đề xuất (23/10). Kho có **19 bài ý a** (đợt 1: 9, đợt 2: 10), đều nháp.

| Phần | Kết quả |
|---|---|
| Đề | Đề 7, 19, 24, 25, 26, 32, 36, 38, 41, 56 — không dùng tiếp tuyến (bài tiếp tuyến chờ l-tieptuyen, đợt 7); không cần đề dự phòng |
| Mỗi bài | phân tích ngược (2–3 tầng) + C3 + C2; C2 **đổi cách** từng bài: góc ngoài = góc trong đối diện (Đề 7, 26, 41), trung tuyến ứng với cạnh huyền / tâm cách đều (19, 36, 38), hai đỉnh kề nhìn cạnh dưới góc bằng nhau (24, 25), tổng hai góc đối (32, 56) |
| Bài học đợt 1 áp dụng | không phương án sai nào là dấu hiệu nội tiếp đúng; câu hỏi từng tầng nói rõ đang hỏi gì |
| Kiểm tra | kiểm toạ độ 89 + 67 (thêm 2680 cấu hình ngẫu nhiên) + 101 mệnh đề; chấm thử mọi phương án sai / mọi thứ tự C2; KaTeX 2050 chuỗi; **giải độc lập 30/30** |
| Sửa sau giải độc lập | Đề 26 "cắt **đường thẳng** $BC$ tại $E$", Đề 38 "cắt **đường thẳng** $BE$" (điểm nằm trên phần kéo dài); phản hồi rõ hơn ở d24-1, d25-1 (tổng đúng về số nhưng hai đỉnh kề, góc không phải góc của tứ giác), d56-3 |
| Chuẩn hoá đề gốc | Đề 7, 19, 25, 41: lỗi đánh máy (ngoặc, thiếu chữ, ký hiệu tam giác). **Đề 32 in nhầm** "chân đường vuông góc từ $E$ đến $AB$, $AC$" → sửa "$AB$, $BC$" (ý b xác nhận $K$ thuộc $BC$), ghi chú đầu lời giải |

**Gia sư nên soát:** Đề 32 cùng cấu hình Đề 8 (đợt 1) — C2 đổi hướng; Đề 19 và 24 cùng hình (đường kính $AK$), C3/C2 khác cách; d24-3 cần điểm phụ $N$ (L3); d41-3 góc ngoài (L3, khó hơn lời giải chính); Đề 36, 56 có tiếp tuyến trong phần mở đầu (ý a không dùng) — con vẽ hình có thể bỏ qua tiếp tuyến nếu chưa học; Đề 26: $\widehat{BAC}=45^\circ$ nên C2 tính thẳng được.

**Việc kế:** merge #40 → #41 → #42 → PR này; soát rồi "duyệt luyện đề" (cả 19 bài); đợt 3 (bài ý a có tiếp tuyến) sau khi có l-tieptuyen (đợt 7, 13/12); ý b từ 01/2027.

## 23/10/2026 — Luyện đề hình 4.2: code + đợt đầu 9 bài ý a (nhánh `p1-ld42`, không SQL)

Phụ huynh "làm luôn" (23/10). Thiết kế: `docs/superpowers/specs/2026-10-23-luyen-de-42-design.md` (§4 = bản đã làm).

| Phần | Kết quả |
|---|---|
| Con | mục **"📐 Luyện đề hình"** (`/student/luyen-de`, thẻ ở trang chủ): đọc đề → tự vẽ hình → xem hình mẫu → phân tích ngược → điền lời giải (C3) → sắp xếp bước (C2) → lời giải đầy đủ. Không ảnh hưởng mức M của bài học |
| Quy tắc mở | bài mở khi mọi bài học nó cần đạt M3 hoặc có ★ của gia sư; tối đa 3 bài mới/tuần (T2–CN); làm sai → "Làm lại sau" 7 ngày. Server chặn trả lời bài chưa mở |
| Gia sư / phụ huynh | Kho bài → "📐 Luyện đề hình" (`/tutor/[id]/luyen-de`), Nội dung → "📐 Luyện đề hình 4.2" (`/parent/content/luyen-de`): danh sách bài, trạng thái của con, "Xem đáp án · soát" = bàn duyệt quen thuộc ("Cần sửa" = lý do + hướng dẫn) |
| Duyệt | chỉ trong git (phụ huynh nói "duyệt luyện đề"); app không có nút duyệt bài luyện đề |
| Đợt đầu (nháp) | Đề 3, 5, 6, 8, 28, 31, 35, 46, 52 — mỗi đề 3 câu (phân tích ngược 3 tầng, C3, C2 cách khác) + hình SVG kiểm toạ độ. Đề 16 thay bằng Đề 46 (ý a của Đề 16 cần điểm E chỉ có ở ý b) |
| Kiểm tra | soạn: kiểm toạ độ 59 + 56 + 82 mệnh đề, chấm thử mọi phương án sai; **giải độc lập 27/27**; sau đó sửa 4 phương án sai ở tầng 1 (d31, d35, d46, d52) vốn là dấu hiệu đúng nhưng không đi tới giả thiết → đổi thành "hai góc đối bằng nhau" (sai thật, E04) |
| Kiểm thử | `npm test` 201 ✓, e2e đủ (thêm `drill-flow`, `drill-tutor-flow` trên dữ liệu thử) ✓ |

**Gia sư nên soát:** Đề 28 trùng hình bài mẫu của k-tugiacnt (AEHF với ba đường cao) — vẫn giữ vì là đề thật; Đề 52 cùng cấu hình Đề 29 (câu p4 của k-tugiacnt); Đề 8 câu C2 dùng "trung tuyến ứng với cạnh huyền" (lớp 8); vài phương án sai "tổng hai góc kề = 180°" (đúng về số nhưng sai dấu hiệu, E04) — xem con có hiểu vì sao sai.

**Việc kế:** phụ huynh merge (#40 → #41 → PR này), soát, nói "duyệt luyện đề"; đợt 2 (9–10 bài ý a) trước 07/12; ý b từ 01/2027 (o-dongdang ở đợt 8).

## 23/10/2026 — Phụ huynh duyệt 18 bài nháp; gia sư soát sau trên bài đã duyệt (nhánh `p1-approve-23`, không SQL)

Phụ huynh 23/10: "Phụ huynh đã duyệt, GS review sau" cho 9 bài GĐ1 + 9 bài GĐ2; "Cần sửa kèm lý do và hướng dẫn Claude sửa".

### Đã làm
- 18 KU đợt 3–6 đổi sang `approved` (approvedOn 2026-10-23), khoá đáp án (`approved.lock.json`: 28 bài, 541 câu). Con học được ngay cả 28 bài (bài nào còn khoá theo tiên quyết thì mở dần như thường).
- **"Cần sửa" trên bài đã duyệt**: gia sư / phụ huynh vẫn đánh giá từng câu trên tab Kho bài (trước đây ô đánh giá bị ẩn với bài duyệt trong git). Câu "Cần sửa" **tạm ẩn với con** cho tới khi Claude sửa và PR được merge (nội dung đổi → câu hiện lại); "Cần sửa" ở phần lý thuyết, hoặc ẩn tới mức còn < 4 câu luyện / < 5 câu kiểm tra → cả bài tạm ẩn.
- Ô "Cần sửa" tách 2 phần bắt buộc: **Lý do** và **Hướng dẫn Claude sửa** (lưu thành "Lý do: … — Sửa: …"); danh sách ghi chú ở trang Nội dung gồm cả bài đã duyệt.
- E2E duyệt bài chạy trên 2 bài nháp giả lập (fd-1, fd-2) vì nội dung thật không còn bài nháp.

### Kiểm thử
- Unit 196 (review +2), e2e PASS (review-flow +2 kiểm tra bài đã duyệt, review-student-flow +1).

### Phụ huynh cần làm
- Merge PR (không SQL). Gửi gia sư danh sách điểm cần soát kỹ (mục đợt 5, đợt 6 bên dưới). Ghi chú "Cần sửa" gom ở trang **Nội dung** → nút sao chép → dán cho Claude.

---

## 22/10/2026 — S8a: nền AI, báo cáo tuần, tóm tắt gia sư (nhánh `p1-slice-8`, SQL 0014)

Theo kế hoạch `docs/superpowers/plans/2026-10-22-s8a-ai-reports.md` (11 task), phụ huynh chọn "làm liền một mạch" 22/10.

### Đã làm
- **0014**: mọi bảng AI cho S8a + S8b (`ai_settings`, `ai_usage`, `ai_reports`, `ai_messages`, `ai_eval_cases`, `ai_eval_results`), `hint_level` 0–4; RLS + kiểm thử RLS.
- `src/lib/ai/`: giá model + trần $10 (cảnh báo 90 %, dừng 100 %), **soát số** (mọi số AI viết phải có trong dữ liệu, số nguyên ≤ 10 được phép, từ cấm "chuỗi"/"xếp hạng"), hỏi → soát → hỏi lại 1 lần → không đạt thì chỉ hiện khuôn mẫu; client gọi API bằng `fetch` (khoá chỉ đọc ở máy chủ).
- **Báo cáo tuần** `/parent/bao-cao`: tự tạo thứ Hai 07:00 (cron `0 0 * * 1`), nút "Tạo lại báo cáo tuần trước"; số liệu (buổi học, kiểm tra, ôn, buổi dạy, bài về nhà, bài vững thêm, ôn quá hạn, lỗi lặp, tiến độ mốc, bài trễ) + "Nhận xét" AI. Link từ Tổng quan, menu "Báo cáo tuần".
- **Tóm tắt gia sư** trên Buổi dạy: nút "Tạo tóm tắt trước buổi dạy" → bài con làm từ buổi trước (số câu, sai, mã lỗi, mức) + 2–3 điểm "Nên chữa" (AI hoặc tự động từ dữ liệu); lưu lại, mở lại không tốn.
- **Trang AI** `/parent/ai`: chi phí tháng / $10, bật/tắt AI cho báo cáo + tóm tắt, chọn model (mặc định Haiku 5.5), xem 2 lệnh hệ thống, 20 lượt gọi gần nhất.

### Kiểm thử
- Unit 189 (thêm 21 test `src/lib/ai/`), `test:db` ALL PASSED (thêm ~27 kiểm tra 0014). E2E 251 PASS (thêm `report-flow` 11 + `brief-flow` 5, AI giả lập); ảnh `e2e/out/s8a/`.

### Phụ huynh cần làm
1. ✅ "Áp dụng SQL" `0014_p1_ai.sql` — chạy thành công 22/10.
2. Kiểm tra trên Vercel (Production) có `CRON_SECRET` và `ANTHROPIC_API_KEY` (chỉ xem tên, không dán giá trị vào chat).
3. Đối chiếu giá Haiku 5.5 / Sonnet 5.5 trên trang giá chính thức của Anthropic; khác spec §3 thì báo để sửa bảng giá.
4. Đọc 2 lệnh hệ thống ở trang **AI** → "ok" hoặc ghi chỗ cần sửa.
5. Merge PR. Báo cáo đầu tiên: thứ Hai 26/10 ~07:00 (hoặc bấm "Tạo lại" ngay sau khi merge).

---

## 22/10/2026 — Nội dung đợt 6 + hình Sổ tay (nhánh `p1-content-6`, không SQL)

Phụ huynh chọn "làm đợt 6 trước rồi làm Sổ tay cùng lúc" (22/10).

### Đã làm
- 4 KU nháp: **c-rutgon** (20 câu, phần lớn câu nhiều bước: ĐKXĐ → phân tích → quy đồng → kết quả), **c-cauphu** (19 câu: tính giá trị, P = a, bất phương trình, so sánh với 1, x nguyên / x thực để P nguyên — dạng 2c, min/max), **k-goiintiep** và **k-tugiacnt** (19 câu mỗi bài, bài hình §10: phân tích ngược, điền lời giải C3, sắp xếp bước C2, tự vẽ hình; 11–12 hình SVG mỗi bài). Module mới `noi-tiep`; `can-thuc` thêm 2 bài. Nguồn Đề 1–56.
- **Sổ tay**: vẽ 4 hình mẫu (hai tiếp tuyến + cát tuyến, ba đường cao, nửa đường tròn + tiếp tuyến, đường kính ⊥ dây); "điều có sẵn" ghi theo tên điểm (ví dụ $AB^2 = AM\cdot AN$, $AE\cdot AC = AF\cdot AB$, $AC\cdot BD = R^2$), kiểm bằng toạ độ. **Phụ huynh duyệt 22/10** (`status: approved`, `approvedOn` 2026-10-22) — con thấy Sổ tay sau khi PR này merge.
- Màn Duyệt: đáp án C3 hiện dạng 【n: …】 (trước đó dấu ** hiện thô khi lựa chọn có công thức).

### Kiểm tra chất lượng
- Agent soạn tính lại mọi đáp số và nhiễu bằng sympy / toạ độ: c-rutgon 41 đáp số + 94 nhiễu, c-cauphu 66, k-goiintiep 120 khẳng định hình + 21 số, k-tugiacnt 90 + 27.
- Giải độc lập (chỉ thấy đề như con): **78/78** khớp. Sửa sau khi giải: c-cauphu x6 bước 1 hỏi "đánh giá chặt nhất" (trước có 3 phương án cùng đúng), x4 bước 3 đổi nhiễu `x<4` thành `0<x<2`; k-tugiacnt p4 tầng 2 đổi nhiễu "vì OC ⊥ AB" (cãi được) thành "vì góc ở tâm COB = 90°". Các thứ tự bước khác người giải tìm ra (k-tugiacnt p7, x6; k-goiintiep p7, x6) app đều chấm đúng.

### Gia sư soát kỹ (tab Kho bài)
- c-rutgon: p6 chấp nhận kết quả $1/\sqrt x$ (không trục căn); bài mẫu và bài khuyết lấy từ Đề 28, Đề 14 nhưng không ghi nguồn (phần này không có trường `source`).
- c-cauphu: x8 (Đề 42) khó — x = 5 cho P = 0 nên vẫn tính; p3, p8 giữ ĐKXĐ thừa từ đề gốc; một số mã lỗi (quên bình phương = E01, bỏ trường hợp tử bằng 0 = E04).
- k-goiintiep: f2 phương án "∠BAD = ∠KAC (cùng chắn một cung)" là mệnh đề đúng nhưng sai lí do (đề hỏi cặp góc **và** lí do); x6 không dùng tứ giác nội tiếp; x7 chứng minh AC = AD bằng trung trực; dùng đồng dạng như đề thi dù f3-dongdang không phải tiên quyết.
- k-tugiacnt: f1 phương án "hai góc kề bằng nhau" (E, F là đỉnh đối); x8 thực ra không cần tứ giác nội tiếp; số liệu p8, x8 do soạn thêm; p5 cho sẵn "MA ⊥ OA" (chưa dạy tiếp tuyến).
- Sổ tay: đọc 7 mục tiêu + 4 hình ở tab Sổ tay.

### Phụ huynh cần làm
- Merge PR (không SQL). Gia sư soát 4 bài trước **29/11**; phụ huynh "Duyệt cả bài" trong app. Sổ tay: ✅ đã duyệt 22/10 (trong PR này).

---

## 22/10/2026 — S4b gọn: tiến độ tới mốc 8,5 / 9,5 và bài trễ lịch (nhánh `p1-slice-4b`, không SQL)

Phụ huynh chốt 22/10 (popup): mốc 8,5 = 38 bài lõi GĐ1–3, mốc 9,5 = đủ 43 bài lõi; trễ = hết giai đoạn mà dưới M3. Ghi ở `SPEC.md` §0.

### Đã làm
- `curriculum.json`: thêm `phases` (4 giai đoạn §3.3), `milestones` (8,5 hạn 21/02/2027; 9,5 hạn 31/03/2027; bài ★ theo §4) và `phase` cho từng KU; `checkCurriculum` kiểm tra (P2 không có giai đoạn, bài không đứng trước giai đoạn của tiên quyết, hạn mốc = ngày cuối giai đoạn).
- `src/lib/learning/milestones.ts` (thuần, S8 dùng lại): số bài vững (mức hiển thị ≥ M3), bài ★, "theo lịch lẽ ra đã vững", số bài cần/tuần, bài trễ.
- Tổng quan phụ huynh: mục **Tiến độ tới mốc** (2 thẻ, thanh tiến độ có vạch "theo lịch"), **Cần chú ý** thêm một mục gom các bài trễ (ghi rõ bài con chưa mở được vì chưa soạn / chưa duyệt), ô bài trễ tô vàng.

### Kiểm thử
- Unit 168 (thêm `milestones.test.ts` 4, `curriculum.test.ts` +2). E2E 235 PASS (`overview-flow` +1: 0/38, 0/43, giai đoạn, nhịp; sau chốt 1/38). Đã xem thử trạng thái trễ bằng ngày giả (không commit).

### Còn mở
- Số tuần còn lại tính cả 2 tuần Tết (17–18) — nếu muốn trừ Tết thì sửa một chỗ trong `milestones.ts`.

---

## 22/10/2026 — Nội dung đợt 5: f3-dongdang, j-coban, c-coban, c-truccan (nhánh `p1-content-5`, không SQL)

Dựa trên nhánh `p1-slice-5` (cần dạng câu S5) → **merge PR #33 trước**, rồi PR này.

### Đã làm
- 4 KU nháp, mỗi KU 19 câu (khuyết + 8 luyện + 8 kiểm tra), nguồn Đề 1–56; module mới `backfill-hinh` (F3) và `duong-tron` (J); `can-thuc` thêm c-coban, c-truccan.
- **f3-dongdang**: bài hình đầu tiên theo §10 — phân tích ngược (p4, x3), C3 (p5, x4, x7), C2 (p7, x6), `drawFirst` (p4, p6, p7), sơ đồ suy ngược trong bài mẫu, 11 hình SVG đúng tỉ lệ. **j-coban**: 5 hình.
- Màn Duyệt hiện hình của câu (kèm ghi chú "hình ẩn tới khi con vẽ xong") và hình của bài; sửa lỗi lồng thẻ (div trong p) ở sơ đồ suy ngược.
- `CONTENT_STANDARD.md`: E09 (lập luận vòng) áp dụng cả cho câu chứng minh chấm tự động.

### Kiểm tra chất lượng
- Mọi đáp số và nhiễu tính lại bằng sympy (c-coban 52, c-truccan 84, j-coban 74, f3 28 + các khẳng định hình).
- Giải độc lập (người giải chỉ thấy đề như con thấy): **76/76** khớp đáp án. Sửa sau khi giải:
  - c-coban p6 nói rõ "không còn dấu căn và dấu giá trị tuyệt đối"; f3 "thu gọn đến tận cùng".
  - c-truccan: câu điền số hỏi **hệ số a** (dạng a√b) — vì ô số chấp nhận dạng tương đương nên 6/√3 cũng được tính đúng; 6 đề ghi "rút gọn đến tận cùng" (giữ nhiễu E11 chưa rút gọn).
  - f3 x4 ô 1: "⇒ tỉ lệ thức [[1]]" để chỉ có một đáp án.
- `npm test` 162, build OK, e2e 234 PASS.

### Gia sư soát kỹ (tab Kho bài)
- c-coban x6: giữ điều kiện x≠4 như Đề 31; chọn mã E03 hay E01 ở vài nhiễu.
- j-coban: mã lỗi của nhiễu; x7 cho sẵn OH=3 (tránh tiếp tuyến, chưa học).
- c-truccan p7/x7 hơi nghiêng sang rút gọn biểu thức.
- f3: p7 nhiễu E09 là một dòng đúng nhưng lập luận vòng; x6 dòng "AE/AB=AF/AC" chưa ghi lí do; p4 tầng 4 đánh dấu giả thiết; x3 tầng 1 có phương án đúng nhưng lạc mục tiêu (E06); x5 có thể dễ.

---

## 21/10/2026 — S5 hình học: code xong (nhánh `p1-slice-5`, không SQL)

Theo kế hoạch `docs/superpowers/plans/2026-10-21-s5-geometry.md` (11 phần), phụ huynh chọn "làm liền một mạch" 21/10.

### Đã làm
- **3 dạng câu mới** (`schema.ts`, `grade.ts`): **phân tích ngược** (chấm từng tầng như câu nhiều bước; luyện tập: máy chủ trả `node` sau mỗi tầng, xong câu trả `outline` → "Dàn ý lời giải"; kiểm tra / ôn: chọn xong một tầng mới hiện tầng sau, không đổi lại), **C3 điền chỗ trống** (bấm ô → bấm lựa chọn, tô ô sai đầu tiên), **C2 sắp xếp bước** (bấm thêm, ↑ ↓ ×; nhận mọi thứ tự hợp `after`; "Sai từ dòng N").
- Dòng và lựa chọn được **xáo cố định theo id câu** (`shuffle.ts`), trình duyệt không nhận đáp án; khoá chấm (`lock.ts`) gồm bank / dòng / after.
- `drawFirst` (hình ẩn tới khi con bấm "Đã vẽ xong"), `worked.analysis` (sơ đồ trong lời giải mẫu), bài hình chứng minh dùng **hết chiều rộng laptop**.
- Màn **Duyệt** hiện đáp án 3 dạng (tầng + node + dàn ý; ô điền đúng; thứ tự đúng + "có thể đổi chỗ" + bước thừa); **Bài làm** hiện câu trả lời đọc được.
- **Sổ tay suy ngược**: `content/so-tay.json` (**nháp**: 7 mục tiêu, 4 cấu hình mẫu, chưa có hình SVG), trang con (chỉ khi đã duyệt) / phụ huynh / gia sư; link từ bài hình, Nội dung, Kho bài.
- `CONTENT_STANDARD.md` §10 + `standard.ts` (bài hình cần ≥ 1 phân tích ngược, ≥ 1 C3, ≥ 1 C2 khi luyện; kho kiểm tra ≥ 1 + ≥ 2).

### Kiểm thử
- Unit: 156 (thêm `geometry.test.ts` 13, `so-tay.test.ts` 2). E2E: thêm `geometry-flow` (18) + `geometry-parent-flow` (6) trên bài thử `fg-1`; ảnh `e2e/out/geometry/` ở 1366×768.

### Còn mở
- Sổ tay: soạn hình SVG cho 4 cấu hình + gia sư soát → phụ huynh duyệt (cùng đợt 5/6).
- Bài hình thật (f3-dongdang, đợt 5) soạn theo §10; C1 (kéo hình) để sau.

---

## 21/10/2026 — Thiết kế S5 (hình học) + rà soát danh mục hình (LT21) (nhánh `p1-plan-reorder`, PR #32)

- **S5 thiết kế xong** (`docs/superpowers/specs/2026-10-21-s5-geometry-design.md`, mẫu trên design canvas hàng "S5 · Học hình"): 3 dạng câu tự chấm — **Phân tích ngược** (từ kết luận hỏi "cần gì?" tới giả thiết, rồi lật thành dàn ý), **C3 điền chỗ trống** kiểu "Xét … có … ⇒ … (lí do)", **C2 sắp xếp bước** (bước nhiễu, nhận mọi thứ tự hợp lý, báo "Sai từ dòng N"); **Sổ tay suy ngược** (mục tiêu → cách → dấu hiệu, 4 cấu hình mẫu); **tự vẽ hình trước** (hình ẩn tới khi con bấm). Laptop, bấm + ↑ ↓, không kéo-thả. C1 để sau. Không SQL.
- **M3 bài hình:** như bài khác (kiểm tra ≥ 80 %, kho có ≥ 1 phân tích ngược + ≥ 2 C2/C3); viết tự do gia sư chấm trên giấy, đề xuất mức ở Buổi dạy — thay điều kiện C5 (SPEC §0).
- **LT21 rà soát hình học** (68 đề Bài 4.2 + Toán 9 GDPT 2018): +f3-tugiac (bù lớp 8, đợt 7), tách o-chungminh → o-chungminh + o-thanghang (đợt 9, thay chỗ l-kethop), gộp l-kethop vào l-tieptuyen/o-dongdang, +q-dagiac (P2). `curriculum.json` + test: **52 KU (43 lõi + 9 P2)**.
- Lịch: code S5 28/10–~11/11 (~11 ngày); S8 lùi ~12–28/11.

---

## 21/10/2026 — Thứ tự lát tiếp theo: S5 → S4b → S8 (nhánh `p1-plan-reorder`, chỉ tài liệu)

Phụ huynh chốt 21/10 (ghi ở `docs/SPEC.md` §0):
- **Thứ tự:** thiết kế S5 (22–24/10) → S4b gọn (25–27/10) → code S5 (28/10–08/11) → S8 (~09–25/11, AI cho con bật ~cuối 11 thay vì ~09/11).
- **Lý do:** hình học có hạn cứng (Track C từ 23/11, đợt 5 hạn 15/11) và câu chứng minh cần dạng C2/C3; S8 chờ dữ liệu pilot thật và cần phép tính mốc của S4b cho báo cáo tuần.
- **S5:** làm C2 (sắp xếp bước) + C3 (chứng minh hai cột); **C1 (kéo hình) để sau**, chỉ làm khi C2 + C3 chưa đủ.
- **S4b:** giữ tiến độ mốc 8,5/9,5 + tô vàng KU trễ lịch; **bỏ nút mở khoá tay** (dấu ★ ưu tiên đã mở bài).
- Số migration lấy theo thứ tự làm (số trống kế tiếp), không giữ chỗ 0014 cho S8 nữa.
- Sửa trạng thái: giao diện bản 2 đã merge (#31).

---

## 21/10/2026 — Giao diện gia sư bản 2: nền trắng, sao vàng, "Việc tiếp theo" (nhánh `p1-tutor-v2`)

Máy gia sư để chế độ tối nên app hiện nền đen, dấu sao gần như không thấy. Phụ huynh duyệt mẫu bản 2 (Design canvas, 21/10) và nói "ok". Không SQL.

### Đã làm
- **Luôn nền trắng** cho mọi người (bỏ tự đổi theo chế độ tối của máy).
- **Sao ưu tiên** vàng đặc / viền xám, vùng bấm 40px; dòng ưu tiên viền vàng + nền vàng nhạt.
- **Đầu trang học sinh** (chữ viết tắt tên, lớp) + **tab có số việc** (Hôm nay: bài con đã làm xong chờ chữa + buổi chưa ghi; Kho bài: số bài chờ duyệt).
- **Hôm nay**: ô **"Việc tiếp theo"** với 1 nút chính (chữa bài con đã làm xong → duyệt bài ưu tiên → ghi buổi chưa ghi → duyệt bài khác → giao bài); danh sách chờ duyệt có thanh tiến độ; ô trống có nút gợi ý; cột ưu tiên ghi trạng thái từng bài + link Duyệt/Giao bài; "Tuần này" thành 3 ô số.
- **Kho bài**: lọc dạng nút gộp, thanh tiến độ, nút "Duyệt"/"Duyệt tiếp" đặc màu, "Xem" nhạt.
- **Đăng nhập**: logo, "Dành cho phụ huynh, gia sư và học sinh", khung trắng.
- Chữ giao diện không chân (Libre Franklin); đề bài, lời giải vẫn chữ có chân. Nút dùng chung kiểu (`src/components/ui/styles.ts`).

### Đã tự kiểm
- `npm run lint`, `npm test` (141, thêm thứ tự "Việc tiếp theo"), `npm run build`, `./e2e/run.sh` 210 PASS (2 kiểm tra chế độ tối đổi thành "vẫn nền trắng khi máy để chế độ tối"). Ảnh 1366×768 với máy để chế độ tối: nền trắng.

### Phụ huynh cần làm
- Merge PR (không SQL).

## 21/10/2026 — Bàn làm việc gia sư trên laptop (nhánh `p1-tutor-polish`)

Phụ huynh hỏi màn đăng nhập và bố cục trên máy tính; audit 1366×768 + 1920×1080, phụ huynh duyệt 7 chỗ sửa 20/10 (`docs/superpowers/specs/2026-10-21-tutor-laptop-polish-design.md`). Không SQL.

### Đã làm
- **Duyệt**: nút "Đạt / Cần sửa" nằm trên thanh dính đáy màn hình (không phải cuộn); "Cần sửa" mở ô góp ý ngay trên thanh rồi "Gửi góp ý".
- **Giao bài**: cột phải dính khi cuộn; "Đã chọn N câu" (nút Giao tắt khi chưa chọn); đổi bài là tự tải, bỏ nút "Chọn".
- **Làm thử**: khung báo không còn ghi "của phụ huynh"; có tab và "← Về màn duyệt".
- **Bài làm**: lưới 2–3 cột, bài đã làm lên trước, bài chưa làm gộp "Chưa làm (N)".
- Đầu trang thẳng lề với nội dung; **Đăng nhập**: "Dùng email và mật khẩu phụ huynh đã gửi cho bạn." + nút Hiện/Ẩn mật khẩu.
- Mã nội dung của câu (`content_hash`) tính bằng JSON sắp khoá → không đổi khi đổi thứ tự trường. Góp ý "cần sửa" ghi trước bản này có thể hiện "↻ xem lại" một lần.

### Đã tự kiểm
- `npm run lint`, `npm test` (140), `npm run build`, `./e2e/run.sh` 210 PASS. Mới: thanh duyệt nằm trong màn 1280×720 không cần cuộn; "Đã chọn 2 câu"; đổi bài bằng ô chọn. Ảnh 1366×768 các màn sau khi sửa.

### Phụ huynh cần làm
- Merge PR (không SQL).

## 20/10/2026 — S11: Giao bài từng câu, Buổi dạy gọn, Hôm nay (nhánh `p1-slice-11`)

Kế hoạch: `docs/superpowers/plans/2026-10-20-s11-assign-today-session.md`. Trước đó trong ngày: nút "Áp dụng SQL" (PR #28, SPEC §0 20/10) — phụ huynh đã dùng nó để chạy 0011 và 0012.

### Đã làm
- **SQL 0013**: `homework.items` (câu luyện tập được giao, phải thuộc đúng bài, 1–20 câu); `session_id` không bắt buộc (giao bài không cần ghi buổi).
- **Giao bài (T9)**: chọn bài đã duyệt (★ ưu tiên lên đầu) → "Chọn từng câu" (chỉ câu luyện tập; chọn nhanh theo L1/L2/L3; nhãn "con hay sai", "giống đề thi") / "Cả bài" / "Bài trên giấy" (yêu cầu + ≤ 3 link Drive, cảnh báo link không phải Drive) → hạn nộp, lời dặn.
- **Con làm trên app**: thẻ bài về nhà ghi "Làm N câu trên app" → trang riêng, làm như luyện tập (chấm trên server, **tính vào mức hiểu**), không cần xem bài mẫu trước; cuối có "Xong bài về nhà".
- **Buổi dạy gọn**: 3 bước — ngày; chọn bài bằng nút (ưu tiên + đang học dở, tìm bài khác); mức M0–M4 **chỉ cho bài đã chọn**, vẫn hiện bằng chứng (mức hệ thống, số câu, kiểm tra gần nhất, "Xem câu sai →"). Form cũ ~50 bài và phần bài về nhà trong form đã bỏ.
- **Hôm nay**: bài chờ duyệt, bài về nhà chờ chữa (kết quả trên app chỉ tính các câu được giao), nhắc buổi chưa ghi (theo thứ dạy trong tuần); cột phải: ưu tiên, "Tuần này của con". Gia sư có một học sinh → vào thẳng bàn làm việc.
- 5 tab: Hôm nay · Kho bài · Giao bài · Buổi dạy · Bài làm.

### Đã tự kiểm
- `npm run lint`, `npm test` (139 test + RLS, thêm 5 kiểm tra 0013), `npm run build`, `./e2e/run.sh` 208 PASS. `tutor-flow` viết lại cho các tab mới (giữ mọi kiểm tra cũ: bằng chứng, thiếu mức, ngày tương lai/quá 7 ngày, ghi chú 500 ký tự, bài làm của con, bài trên giấy, "Đã chữa", S9, hết phân công/khoá tài khoản); thêm `assign-flow` (giao 2 câu, không có câu kiểm tra trong danh sách, không cần buổi) và `assign-student-flow` (con làm 2 câu từ thẻ, chưa xem bài mẫu, ghi là luyện tập, đúng).

### Phụ huynh cần làm
1. Actions → **Áp dụng SQL**: file `0013_p1_item_homework.sql`, nhánh `p1-slice-11`, `CHAY` → ✅.
2. Merge PR S11.

## 20/10/2026 — S10: Kho bài, duyệt từng câu, ưu tiên (nhánh `p1-slice-10`)

Mẫu "Bàn làm việc gia sư" phụ huynh duyệt 20/10; 4 quyết định build chốt 20/10 (`docs/superpowers/specs/2026-10-20-tutor-workspace-design.md`). Kế hoạch: `docs/superpowers/plans/2026-10-20-s10-content-review.md`.

### Đã làm
- **SQL 0012**: `item_reviews` (nhận xét từng câu + mã băm nội dung đã xem), `unit_approvals` (duyệt / trả lại), `tutor_priorities` (thứ tự ưu tiên theo học sinh). RLS: con không đọc được nhận xét; gia sư đã ngừng phân công không thấy gì.
- **Duyệt trong app (T7)**: gia sư hoặc phụ huynh bấm "Đạt" / "Cần sửa" từng câu (và phần lý thuyết & bài mẫu); "Duyệt cả bài" khi lý thuyết đạt, không còn câu chưa xem, ≥ 4 câu luyện + ≥ 5 câu kiểm tra đạt → con thấy bài ngay, **câu "cần sửa" bị ẩn**. Sửa đáp án/phương án sau khi duyệt → câu chuyển "↻ xem lại" và ẩn với con. "Trả lại để sửa" ẩn cả bài. 10 bài đã duyệt bằng git giữ nguyên (khoá H2).
- **Ưu tiên (T8)**: ☆/★ ở Kho bài, sắp ↑↓; bài ưu tiên mở ngay cho con và đứng đầu "Bài mới" (vẫn tối đa 2 bài đang học).
- **Màn gia sư**: bố cục rộng + tab (Buổi dạy · Kho bài · Bài làm); Kho bài (lọc, tìm, "đã xem x/y"); Duyệt (danh sách câu ✓ ! ↻ ·, câu đầy đủ đáp án/gợi ý/lời giải/lỗi, ghi chú); "Làm thử như con" (không ghi dữ liệu).
- **Phụ huynh**: danh sách nội dung hiện trạng thái mới; màn Duyệt giống gia sư; khối "Góp ý cần sửa" + nút chép để dán cho phiên Claude soạn nội dung.
- Mọi chỗ chặn bài nháp với con đi qua `studentUnit` / `studentModules`. Số migration: S11 = 0013, S8 = **0014**.

### Đã tự kiểm
- `npm run lint`, `npm test` (134 test + RLS, thêm 15 kiểm tra 0012), `npm run build`, `./e2e/run.sh` 202 PASS. Mới: gia sư ⭐ + duyệt hết b-haib (1 câu cần sửa) + duyệt cả bài; bên con: b-haib mở, đứng đầu Bài mới, câu cần sửa không có trong trang, bài nháp vẫn 404, bài bị trả lại 404.
- Sửa một chỗ chờ trong `student-flow` (quay lại trang trước rồi đi ngay → "network error" lúc có lúc không).

### Phụ huynh cần làm
1. Merge #24, #25 (SQL 0011 trước), #26.
2. **Chạy SQL `0012_p1_content_review.sql` trên Supabase TRƯỚC khi merge PR S10.**
3. Merge PR S10; gửi gia sư link app → tab **Kho bài** → duyệt 10 bài đợt 3–4.

## 20/10/2026 — Sửa 2 lỗi lớn của audit trước khi gia sư sửa bài (nhánh `p1-audit-fix`)

Phụ huynh "ok" 20/10 (sau audit 19/10, tài liệu "Audit App Toán trước khi dùng").

### Đã làm
- **H1 — lượt ôn bị chấm khi con mới làm dở.** Trước: trình duyệt tự đặt mã lượt ôn, "Lưu kết quả ôn" chấm mọi câu đã có (1/6 câu vẫn có thể "đạt"); đổi mã lượt là làm lại được. Nay: câu trả lời đầu tiên lưu **kế hoạch của server** thành lượt ôn (bảng mới `review_runs`, **SQL 0011**), mỗi học sinh chỉ 1 lượt đang mở; chỉ nhận câu trong kế hoạch, mỗi câu 1 lần; **còn câu chưa làm thì không lưu** ("Con còn N câu chưa làm"); lưu xong lượt đóng lại trước khi chấm (bấm 2 lần không chấm 2 lần). Tải lại trang vẫn tiếp đúng câu, câu sai vẫn tính. Lượt làm hết mà chưa bấm lưu: mở lại trang là tới màn đánh giá để lưu.
- **H2 — sửa câu đã duyệt làm sai lịch sử.** Câu trắc nghiệm lưu *số thứ tự* phương án; đổi thứ tự/đáp án sau khi con đã làm thì lịch sử bị hiểu sai. Nay `content/approved.lock.json` khoá "khoá chấm" (phương án, phương án đúng, đáp số) của **192 câu** trong 10 bài đã duyệt; test `lock.test.ts` chặn mọi thay đổi. Lời đề, lời giải, gợi ý, phản hồi vẫn sửa được. Cách làm: `CONTENT_STANDARD.md` §7. Khi lát S10 chuyển việc duyệt vào DB (T7, kèm mã băm) thì khoá này chuyển theo.
- `planReview` (tự đoán lượt dở từ câu trả lời) thay bằng `newReviewPlan` + `reviewRunProgress` (rules.ts) và `reviewSession` (state.ts).
- Số migration: lấy **0011** (không nhánh/PR nào đang dùng); S8 chuyển sang **0012** (sửa trong HANDOFF, P1_PLAN, AI_TUTOR).

### Đã tự kiểm
- `npm run lint`, `npm test` (127 test + RLS, thêm 8 kiểm tra `review_runs`), `npm run build`, `./e2e/run.sh` 187 PASS — thêm: server lưu 1 lượt mở 6 câu; lưu khi còn 1 câu chưa làm bị từ chối, không ghi `review_log`; tải lại hỏi đúng câu thiếu; lưu xong lượt đóng.

### Phụ huynh cần làm
1. **Chạy SQL `supabase/migrations/0011_p1_review_runs.sql` trên Supabase TRƯỚC khi merge** (merge trước thì trang Ôn lại báo lỗi lưu).
2. Merge PR. Lượt ôn đang dở của con (nếu có) sẽ bắt đầu lại từ đầu, không mất lịch ôn.
3. Khi duyệt bài mới (đổi `approved`): chạy `npm run content:lock` trong cùng PR — hoặc nhờ Claude làm.

### Ghi chú
- Khoá API Anthropic (`ANTHROPIC_API_KEY`, workspace riêng, giới hạn chi tiêu) phụ huynh đã đặt trên Vercel 19/10 — S8 không còn chờ việc này.
- Các mục audit mức vừa (lộ đáp án qua luyện tập khi đang đến hạn ôn, tải lại câu nhiều bước, giới hạn LT3, làm lại kiểm tra không giới hạn, khoá/đặt lại tài khoản) để sau S10–S11.

## 17/10/2026 — S9: gia sư giao bài trong app (nhánh `p1-slice-9`)

**Phụ huynh cần làm:** merge PR (không SQL, không đổi nội dung). Phụ huynh duyệt thiết kế trong chat ("ok", 17/10).

**Đã làm (T6 trong `docs/SPEC.md` §0)**
- Gia sư "Giao bài về nhà": ô "Cho phần" có thêm nhóm **"Bài khác trong app"** (mọi bài đã duyệt, không cần tick ở buổi đó); chọn bài trong app thì form nhắc "Con sẽ thấy nút Làm trên app…". Máy chủ kiểm: bài phải đã tick hoặc đã duyệt.
- Học sinh: thẻ bài về nhà có nút **"Làm trên app → <tên bài>"** (ẩn khi đã chữa hoặc bài chưa duyệt); bài được giao **mở luôn** dù bài trước chưa đạt M3 (tính như phụ huynh mở tay — `loadStudentState` đọc `homework.unit_id`).
- Gia sư: dưới mỗi bài đã giao chưa chữa có dòng **"Trên app từ khi giao"**: luyện tập đúng/tổng, điểm lần kiểm tra gần nhất, mã lỗi lặp ≥ 2 lần, mức hiện tại (`homeworkAppResult`, không tính bài khuyết bước).
- Thứ tự ưu tiên của gia sư = hạn nộp (thẻ đã xếp theo hạn).
- Test: `homework.test.ts` (+2: bài trong app được giao; kết quả chỉ tính từ lúc giao, bỏ bài khuyết, lỗi 1 lần không tính). e2e +7: gia sư chọn bài khác trong app, thấy "con chưa làm" rồi "luyện tập 1/1 đúng"; học sinh thấy nút và mở được bài.

**Kiểm tra:** `npm test`, lint, build, `./e2e/run.sh` 182 PASS.

---

## 17/10/2026 — LT19–LT20 + nội dung đợt 4: giải bài toán bằng PT/HPT (nhánh `p1-content-4`)

**Phụ huynh cần làm:** merge PR (không SQL). 5 bài đều **nháp**; mạch G → **gia sư soát trước** (§7 bước 5), rồi phụ huynh nói "duyệt KU …". Sau khi duyệt, g-giaihpt mở ngay (không cần bài trước); 4 bài còn lại mở khi g-giaihpt đạt M3 (hoặc phụ huynh mở tay).

**Quyết định (phụ huynh 17/10, ghi ở `docs/SPEC.md` §0):** LT19 — gia sư đánh giá giải bài toán bằng PT/HPT là chỗ đang hổng, trường đang học Toán 9 chương 1 → mạch G lên **đợt 4**; thêm **g-giaihpt** (giải HPT bậc nhất hai ẩn) và **g-chuso** (chữ số, tìm số) → **50 KU (42 lõi + 8 P2)**; g-chuyendong/g-nangsuat/g-phantram cần g-giaihpt thay cho d-ptbh và chỉ gồm bài lập PT/HPT bậc nhất; bài dẫn tới PT bậc hai gom vào g-honhop (đợt 8, cần d-ptbh); đợt 4–7 cũ thành 5–8, giữ ngày. Thứ tự dạng nào trước do gia sư quyết. LT20 — tài liệu PDF gia sư gửi là nguồn như 68 đề (chuyển thể, ghi `source`, không đưa PDF lên GitHub); Claude viết lời giải từng bước cho bài gia sư giao để con tự kiểm tra (chỉ ghi số câu, không chép đề).

**Đã làm**
- `CURRICULUM.md`, `curriculum.json`, `SPEC.md` §0, `CONTENT_STANDARD.md` §6, `CLAUDE.md`, test đếm 50 KU.
- Module mới `bai-toan-tt`; 5 KU draft đủ khung §1. Bài toán có lời văn là câu nhiều bước: chọn ẩn + điều kiện → chọn hệ → từng ẩn → kết luận (app chấm được phần lập hệ). estMinutes 45–50.
- Nguồn: chuyên đề gia sư ("CĐ lập PT/HPT", §1, §3, §4, §5, §6, §7) và 68 đề (Đề 1, 11, 13, 15, 16, 18, 20, 23, 26, 37, 41, 43, 44, 47, 48, 49 — chỉ Đề 1–56). Soạn mới: L1–L2 phần lớn; L3 soạn mới: g-giaihpt p8, x6, x8; g-nangsuat p8.

**Kiểm tra (§7)**
| Bước | Kết quả |
|---|---|
| 1. `npm test` | 123/123; lint, build qua; `./e2e/run.sh` 175 PASS |
| 2. Giải độc lập | 3 agent mới chỉ nhận đề trắng giải **190/190 ô — 190/190 khớp**. Góp ý đã sửa: 10 câu "chọn ẩn và điều kiện" đổi thành "đúng **và đầy đủ**" (phương án thiếu điều kiện không còn cãi được là đúng); g-phantram-x5 nói rõ "nhiều hơn $1\%$ (A $5\%$ thì B $6\%$)" |
| 3. Tính lại nhiễu | Mỗi KU một script sympy: mọi đáp án, mọi phương án nhiễu (kể cả hệ phương trình trong trắc nghiệm, so từng phương trình với mô hình lỗi) tái tạo đúng lỗi đã ghi — **0 lệch**, chạy lại sau khi sửa: 0 lệch |
| 4. Soát sư phạm | Phản hồi ≤ 2 câu không lộ đáp số; gợi ý chung → cụ thể; câu tự đứng được; 2 hình SVG (g-chuyendong p5, p8) đúng tỉ lệ |
| 5. Gia sư | **Cần** — mạch G. Xem: cách ghi điều kiện của ẩn (Q24), mã lỗi E07/E04/E14 ở bước lập hệ |

**Lỗi tìm thấy trong tài liệu nguồn (báo gia sư)**
- Chuyên đề gia sư: §1 Câu 14 không có đáp số duy nhất (tăng tử 4, giảm mẫu 4 luôn ra nghịch đảo); §1 Ví dụ 9 ra phân số $\frac05$; §1 Câu 6 hỏi "hai số" nhưng đáp án một số; §3 Câu 5 có vô số nghiệm (hai dữ kiện cho cùng một phương trình); §5 Câu 30 đáp án thiếu giá máy sấy (45 nghìn); §5 Câu 8 thiếu tên trường; §5 Câu 22 số liệu khó tin (laptop 100 USD, tai nghe 500 USD).
- 68 đề: Đề 32 Bài 3.2 "49 giờ 48 phút" gần như chắc là "4 giờ 48 phút".

### Câu hỏi mở mới
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q24 | Điều kiện của ẩn: app dùng điều kiện đầy đủ (ví dụ thời gian mỗi vòi > thời gian chảy chung, vận tốc riêng > vận tốc dòng nước); ở vài câu "$x>0$, $y>0$" là phương án sai (thiếu). Gia sư có chấp nhận "$x>0$, $y>0$" không? | Giữ điều kiện đầy đủ; câu hỏi ghi "đúng và đầy đủ" |

---

## 15/10/2026 — Nội dung đợt 3 (nhánh `p1-content-3`)

**Phụ huynh cần làm:** merge PR (không SQL, không đổi app — 5 bài đều **nháp**, con chưa thấy). Duyệt trên preview: menu **Nội dung** → 5 bài *Nháp*; nói "duyệt KU …". **c-dkxd thuộc mạch căn thức (C) → gia sư soát trước** (§7 bước 5, danh sách bên dưới).

**Đã làm**
- 5 KU draft đủ khung §1 (lý thuyết 6 đoạn, mẫu có "Kết luận:", khuyết ≥ 2 chỗ trống, luyện 3/3/2 có câu nhận dạng E05 + H1–H3, kho kiểm tra 2/3/3):
  `p-trunon` (hinh-khoi, 44′), `p-cau` (hinh-khoi, 45′), `p-ghep` (hinh-khoi, 45′), `b-haib` (xac-suat, 45′), `c-dkxd` (can-thuc, 42′). Thời lượng theo công thức §1 (CURRICULUM ghi 25–35′; Q20: 40–45′/KU).
- Module mới `hinh-khoi`, `can-thuc` (`module.json`), `xac-suat` thêm b-haib; registry sinh lại.
- App không đọc được π → câu hình khối hỏi "dạng $k\pi$, ghi $k$" hoặc "lấy $\pi \approx 3{,}14$, làm tròn …" hoặc trắc nghiệm có π.
- 8 hình SVG (p-trunon hình chung trụ/nón, p-cau x7, p-ghep p1/p4/p7/p8/x3, b-haib p8 vòng quay), màu theo theme, có `alt`.
- c-dkxd: thẻ ĐKXĐ là bảng KaTeX `array` đầu tiên trong app — xem trên điện thoại có bị tràn ngang không.

**Nguồn câu (chỉ Đề 1–56)**
| KU | Từ 68 đề | Soạn mới |
|---|---|---|
| p-trunon | 11: Đề 1, 4 (2 câu), 11, 16, 22, 34, 38, 40, 42, 44 | mẫu, p1–p4, x5 |
| p-cau | 7: Đề 5, 8, 17, 18, 30, 37, 50 | mẫu, khuyết, p1–p5, p7 (L3 tỉ lệ thể tích), x1, x2, x5 |
| p-ghep | 8: Đề 4, 18, 27, 39, 45, 49, 50, 53 | mẫu, khuyết, p1–p6, x1, x2 |
| b-haib | 11: Đề 7, 8, 18, 26 (2 câu), 28, 32, 36, 41, 46, 55 | mẫu, khuyết, p1, p3, p6, x2, x5 |
| c-dkxd | 5: Đề 12, 15, 21, 41, 47 (Bài 2, đổi thành "tìm ĐKXĐ") | còn lại |

Hình trong PDF không trích được: p-cau x7 (Đề 17), p-ghep x3 (Đề 39), x4 (Đề 45), b-haib p8 (Đề 28) dùng số liệu ghi bằng chữ / tự chọn, `source` có ghi. Bản text của PDF mất dấu căn → 5 biểu thức c-dkxd được **đối chiếu với ảnh trang PDF**: 4 đúng, **Đề 21 sai và đã sửa** ($A=\frac{x-1}{x-2}$ không có căn; mẫu thứ hai của $B$ là $x-1$).

**Kiểm tra trước khi tới phụ huynh (§7)**
| Bước | Kết quả |
|---|---|
| 1. `npm test` | 117/117 (gồm luật mới: đáp án đúng không dồn một vị trí). Lint, build qua; `./e2e/run.sh` 175 PASS |
| 2. Giải độc lập | 3 agent mới chỉ nhận đề trắng (+ ảnh hình vẽ chụp bằng Chromium) giải **109/109 ô**: **109/109 khớp** (chấm bằng `gradeItem`). Góp ý đã sửa: p-trunon-x6 thêm "không làm tròn ở bước trung gian" (làm tròn $h$ sớm ra 154 thay vì 153); p-trunon-x8 viết lại câu "1 kg lá lợp được 6,13 m²"; p-cau-x6 "tức hai chữ số thập phân"; p-ghep-p7 nhãn "10 cm" nằm cạnh đường sinh → chuyển thành vạch đo chiều cao; b-haib-f3 thêm "phân số tối giản" ($\frac{4}{36}$ cũng bằng giá trị); b-haib-x6 phản hồi cho $\frac{7}{36}$ nêu cả hai nguyên nhân (quên thứ tự hoặc quên $1\cdot1$) |
| 3. Tính lại nhiễu | Mỗi KU một script Python/sympy (liệt kê không gian mẫu, lưới số hữu tỉ cho ĐKXĐ, số hữu tỉ chính xác + làm tròn nửa lên): mọi đáp án và nhiễu tái tạo đúng lỗi đã ghi, **0 lệch**; thử cố tình sai → script bắt được. Chạy lại sau khi sửa: 0 lệch |
| 4. Soát sư phạm | Phản hồi ≤ 2 câu không lộ đáp số; gợi ý chung → cụ thể, H3 không làm hộ; câu tự đứng được; xem lại 8 hình |
| 5. Gia sư | **Cần cho c-dkxd**: bảng ĐKXĐ trong lý thuyết; p7, p8, x6, x7, x8 (từ đề thật, cần phân tích $x-3\sqrt x+2$, $x+2\sqrt x-3$, $x-2\sqrt x$); p6 ($\sqrt{-2x}$), x2 ($\sqrt{(x-2)^2}$); cách tách mã: dùng $>$ thay $\ge$ = E04, quên "mẫu ≠ 0"/quên $x \ge 0$ = E14 |

**Để ý khi duyệt**
- c-dkxd p8, x6, x8 cần phân tích mẫu chứa căn thành nhân tử — đi trước c-coban một chút; nếu con thấy quá khó thì đổi sang biểu thức mẫu đơn giản.
- p-trunon x6, x8 (Đề 11, 34) giữ nguyên số liệu đề gốc; p-cau x7 bán kính 10/9 cm là tự chọn (hình Đề 17 không đọc được).
- Mã "lấy đường kính làm bán kính": E08 khi đọc từ hình, E10 khi đề ghi bằng chữ; "làm tròn lên số ngày/số que trọn vẹn" sai = E14.
- Bẫy quy trình: `./e2e/run.sh` khôi phục `registry.generated.ts` về bản đã commit khi kết thúc → nếu registry mới chưa commit thì bị mất (test "registry is up to date" bắt được). Commit registry **trước** khi chạy e2e.
- `docs/SOURCE_INDEX.md`: Đề 2, 3, 53, 54 xếp ở b-haib thực ra là xác suất một bước (một lần rút, hai điều kiện) → nên chuyển sang b-xsuat khi sửa chỉ mục.

---

## 15/10/2026 — Giải độc lập đợt 2 + phụ huynh duyệt 8 KU (nhánh `p1-content-2-qa`, PR #20)

**Phụ huynh cần làm:** merge PR #20 (không SQL). Sau khi merge, Nguyên thấy ngay 8 bài mới.

**Phụ huynh duyệt 8 KU (15/10, trong chat: "duyệt luôn", chọn "cả 8 bài").** f1-hdt, f1-pnt, a-tanso, b-phepthu (đợt 1) và f1-tgon, f1-qd, a-bieudo, b-xsuat (đợt 2) đổi `status: approved`, `approvedOn: 2026-10-15`. Phụ huynh duyệt dựa trên kết quả giải độc lập (đợt 1: 113/113, đợt 2: 103/103), **chưa làm thử trên bản xem trước** → các mục 2–5 của phiếu duyệt (đọc có hiểu không, độ khó so với con, lời nhắc có giúp không, giống đề thật không) chuyển sang **theo dõi trong pilot**: câu nào con sai nhiều hoặc làm quá lâu thì gia sư/phụ huynh báo để sửa.

**Thay đổi con nhìn thấy sau khi merge:** trang Hôm nay gợi ý **2 bài mới** (LT3: 1 Track A + 1 Track B/C) thay vì chỉ htl-1; Hành trình đếm **0/10 bài đạt M3+**; Tổng quan của phụ huynh đếm trên 10 bài. e2e cập nhật theo (5 kỳ vọng: số bài 2 → 10, 2 gợi ý bài mới, bấm đúng link htl-1).

**Bước 2 §7 — giải độc lập (trả lời Q23: làm trước khi phụ huynh duyệt).** Script bỏ đáp án, nhiễu, lời giải, gợi ý khỏi 4 file → 4 đề trắng; hình a-bieudo chụp bằng Chromium với màu theme thật để agent đọc biểu đồ như con nhìn trên màn hình. Hai agent mới, chỉ được đọc đề trắng, giải **103/103 ô** (f1-tgon 31, f1-qd 32, a-bieudo 20, b-xsuat 20). Chấm bằng chính `gradeItem` của app: **103/103 khớp**, không đổi đáp án nào.

**Agent góp ý → đã sửa**
| Chỗ | Vấn đề | Sửa |
|---|---|---|
| Cả đợt 2 | **47/50 câu trắc nghiệm có đáp án đúng ở phương án đầu tiên** (f1-qd 27/27). App hiện phương án theo đúng thứ tự trong file → con có thể đoán "luôn chọn câu đầu" | Đảo vị trí 60 câu trắc nghiệm của 4 bài (đáp án và mã lỗi đi theo phương án; script kiểm 60/60 giữ nguyên nội dung). Thêm luật vào `standard.ts`: KU có ≥ 8 câu trắc nghiệm thì một vị trí không được chiếm > 60% đáp án đúng. Đợt 1 và htl-1/2 đã đạt |
| f1-qd-p4, f1-qd-x3 | Đề "Tính …" nhưng phương án chưa thu gọn (E11) cũng bằng đúng giá trị | Đề thành "Tính và thu gọn …" |
| b-xsuat-x3 | $\frac{6}{16}$ (E11) cũng đúng giá trị khi đề không nói tối giản | Thêm "(phân số tối giản)" như các câu xác suất khác |
| a-bieudo-x8 | Cột Huy thứ 5 bằng 20, nằm giữa vạch 15 và 30 → khó đọc; "làm tròn đến hàng phần trăm" dễ hiểu nhầm với % | Ghi số 20 trên cột; đề thêm "tức hai chữ số thập phân" |

**Góp ý giữ nguyên:** b-xsuat-p7 (đếm cả số 0 — đã có nhiễu 4/39 với phản hồi riêng); f1-tgon-x3, p5 (đề đã nói "thu gọn"/"rút gọn"); a-bieudo-p7 (con gõ "36,7%" thì app báo không đọc được và cho nhập lại, không chấm sai — ô đã có đơn vị % bên cạnh).

**Kiểm tra:** `npm test` 110/110 (thêm 1 test cho luật vị trí đáp án), lint, build, `./e2e/run.sh` 175 PASS.

---

## 13/10/2026 — Dọn tài liệu + quy tắc phối hợp hai phiên (nhánh `p1-hygiene`)

Không đổi chức năng app, không SQL.
- Sửa bảng "Trạng thái nhanh" (đang ghi #14–#17 là chờ merge trong khi đã merge 06/10); bỏ Q13 (đã xử lý: #14 merged).
- `docs/HANDOFF.md` (việc kế tiếp cho từng phiên); `CLAUDE.md` thêm mục "Working with two Claude surfaces".
- Test mới `src/lib/content/repo-rules.test.ts`: số migration không trùng; số câu hỏi mở `Q#` trong PROGRESS không trùng.
- `docs/HUB_PJ_APP_TOAN_UPDATE.md`: bản nháp cập nhật `PJ_APP_TOAN.md` ở hub (LT1–LT18, AI1–AI4) — **phụ huynh commit vào hub**.

---

## 13/10/2026 — Nội dung đợt 2 (nhánh `p1-content-2`)

**Phụ huynh cần làm:** merge PR này (không SQL, không đổi app; nội dung đợt 1 đã ở main qua PR #17). Duyệt trên preview: menu **Nội dung** → 4 bài *Nháp* mới; phiếu duyệt `CONTENT_STANDARD.md` §7 (~20′/KU). Nói "duyệt KU …" thì phiên sau đổi `status`. Hạn duyệt theo H6: 25/10/2026. **Trước khi duyệt còn một việc:** bước 2 của §7 (agent thứ hai giải độc lập, không xem đáp án) **chưa làm** — phiên soạn chỉ có một agent; cần một phiên khác giải 4 bài (tổng 103 ô trả lời, gồm bước con) rồi so với file.

**Đã làm**
- 4 KU mới ở trạng thái **draft**, mỗi bài đủ khung §1: lý thuyết 6 đoạn (≤ 80 chữ), mẫu có "Kết luận:", bài khuyết 3–4 chỗ trống (KU đại số có chỗ trống "Kết luận" và chỗ trống ở bước quyết định), luyện 8 câu 3 L1 + 3 L2 + 2 L3 có câu nhận dạng (E05) và H1–H3, kho kiểm tra 8 câu 2/3/3.
- `f1-tgon` (module `backfill-dai-so`, order 3, 50′) và `f1-qd` (order 4, 45′): mỗi bài 2 câu nhiều bước trong luyện tập (p6 L2, p7 L3) và 2 câu trong kho kiểm tra (x5 L2, x7 L3); bước rút gọn luôn có phương án "chưa rút gọn hết" (E11); bước điều kiện xác định có phương án thiếu một giá trị (E14). f1-qd có câu bẫy "giá trị bị loại sau khi rút gọn" (p7 s3, x6).
- `a-bieudo` (module `thong-ke`, order 2, 40′): 13 hình SVG vẽ lại (cột, cột kép, cột liền nhau ghép nhóm, hình quạt) dùng token màu của theme, mỗi hình có `alt`; xem đủ ở preview sáng/tối.
- `b-xsuat` (module `xac-suat`, order 2, 40′): xác suất cổ điển một bước, biến cố đối, hỏi ngược số phần tử, xác suất thực nghiệm.
- `module.json` của 3 module thêm KU mới; chạy `npm run content:index` (registry sinh lại). Không đổi `curriculum.json` (đợt 2 đã ghi sẵn `batch: 2`), không đổi danh sách 48 KU, seq, track, priority.

**Nguồn câu (LT15, chỉ Đề 1–56; không dùng Đề 57–68, `standard.ts` cũng chặn)**

| KU | Câu có `source` | Từ 68 đề (Đề 1–56) | Soạn mới |
|---|---|---|---|
| f1-tgon | 5 (L3) | 0 | 5 — SOURCE_INDEX: 0 câu trong 68 đề; dạng "rút gọn có nhân tử đối nhau", "tử cần nhóm hạng tử", "hỏi ngược từ kết quả rút gọn" |
| f1-qd | 5 (L3) | 0 | 5 — dạng "ĐKXĐ + rút gọn + thay số, bẫy giá trị bị loại", "đếm giá trị thỏa ĐKXĐ", "hỏi ngược sau quy đồng" |
| a-bieudo | 7 | 7: Đề 21, 22, 23, 29, 38, 49, 56 | 0 (số liệu và hình soạn lại) |
| b-xsuat | 11 | 11: Đề 10, 11, 14, 21, 25, 26, 29, 34, 42, 50, 53 | 0 |

Đề gốc đọc từ bản PDF trong Project (chữ đọc được, **hình biểu đồ không đọc được**): với a-bieudo, hình và số liệu là soạn lại theo dạng đề, `source` ghi "chuyển thể: … vẽ lại, số liệu soạn lại". Câu b-xsuat, a-bieudo (Đề 49) chuyển thể từ đề đọc được chữ, đổi số liệu; vẫn **chưa đối chiếu lại trang gốc** từng câu.

**Kiểm tra trước khi tới phụ huynh (§7)**

| Bước | Kết quả |
|---|---|
| 1. `npm test` | 107/107 qua (có thêm kiểm tra cho 4 bài: schema, 3/3/2, 2/3/3, nhận dạng E05, gợi ý ≤ 25 chữ không lộ đáp số, ≥ 1 câu kiểm tra có nguồn, `review` hợp lệ, SVG hợp lệ). `npm run lint`, `npm run build` qua; `./e2e/run.sh` 175 PASS, 0 FAIL (không phải sửa kỳ vọng e2e) |
| 2. Giải độc lập | Xong 15/10 — 103/103 khớp, xem mục 15/10 |
| 3. Tính lại nhiễu | Script Python/sympy ngoài repo: mỗi đáp án đúng và mỗi phương án nhiễu dạng biểu thức đọc thẳng từ TeX trong file rồi so với giá trị tính độc lập (mỗi nhiễu = đúng một lỗi đã ghi; nhiễu E11 phải bằng đáp án đúng, nhiễu mã khác phải khác); đáp số và nhiễu dạng số tính lại từ đề (đếm bằng liệt kê, `isprime`), ĐKXĐ bằng `solve`, câu hỏi ngược bằng giải phương trình, đồng nhất thức của lời giải mẫu. Thử cố tình sai 3 chỗ → script bắt đủ. **0 lệch** |
| 4. Soát sư phạm | Script: lý thuyết ≤ 80 chữ/đoạn, mẫu 3–5 bước kết thúc "Kết luận:", khuyết 3–6 bước ≥ 2 chỗ trống, phản hồi ≤ 2 câu, trắc nghiệm ≥ 2 nhiễu có mã, tự đứng được → 0 vấn đề. Chụp hình a-bieudo bằng Chromium với CSS thật: cột, cột kép, hình quạt, cột liền nhau đều đúng số liệu và dễ đọc. Câu khái niệm không có phép tính (nhận dạng, chọn tập ĐKXĐ, mẫu chung, phát biểu hình quạt) soát tay |
| 5. Gia sư | Không cần — đợt 2 không có KU mạch C, E, G |

**Để ý khi duyệt**
- Thời lượng `estMinutes`: f1-tgon 50′, f1-qd 45′ (đúng CURRICULUM), nhưng a-bieudo và b-xsuat để 40′ theo ước tính thật (CURRICULUM ghi 30′; Q20 đã chốt 40–45′/KU).
- f1-tgon, f1-qd chỉ dùng đa thức/phân thức một biến, **không** có căn (khác f1-hdt/f1-pnt); L3 là dạng soạn mới nên có thể khó hơn đề thật — nếu Nguyên làm quá chậm thì bớt câu L3 hỏi ngược (f1-tgon x6, f1-qd x8).
- a-bieudo: bài mẫu và bài khuyết chỉ mô tả số liệu bằng chữ (không hình): `figure` ở cấp bài lặp lại ở mọi câu luyện nên không dùng; hình đặt ở từng câu luyện/kiểm tra (xem Q21).
- b-xsuat x2 (giá trị không thể là xác suất): cả ba đáp án nhiễu là xác suất hợp lệ, phản hồi nói rõ vì sao.

### Câu hỏi mở mới
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q21 | Bài mẫu và bài khuyết của a-bieudo không hiện được biểu đồ (chỉ câu luyện/kiểm tra có `figure`). Có làm thêm cho bài mẫu / khuyết có hình riêng (thay đổi app, lát nhỏ)? | Không — mô tả số liệu bằng chữ, hình ở câu luyện |
| Q22 | Hình biểu đồ trong 68 đề không trích được từ PDF: a-bieudo dùng hình/số liệu soạn lại theo dạng đề (ghi "vẽ lại, số liệu soạn lại"). Phụ huynh có muốn đối chiếu trang gốc Đề 21, 22, 23, 29, 38, 56 trước khi duyệt? | Không đối chiếu; giữ ghi chú nguồn như hiện tại |
| Q23 | Bước 2 §7 (giải độc lập) chạy ở phiên nào, trước hay sau khi phụ huynh duyệt? | Trước khi phụ huynh duyệt — một phiên mới chỉ nhận đề, giải 103 ô và so với file |

---

## 06/10/2026 — Phụ huynh chốt Q15–Q20; Đề 57–68 để dành thi thử; bài kiểm tra đầu vào

**Phụ huynh chốt (06/10):** cả 6 câu theo mặc định —
Q15 tin `hint_level` trình duyệt báo (chưa chặn ở máy chủ) · Q16 link "Ôn lại" mở được bài đang khoá, chỉ đọc ·
Q17 không dùng ô điền bước cho câu nhiều bước · Q18 giữ câu L3 htl-1/2 soạn mới (thay khi có đề Hà Nội) ·
Q19 "quên lấy căn" = E11 · Q20 giữ thời lượng 40–45′/KU, xem lại tổng giờ sau đợt 2 (25/10); nếu vượt lịch 31/03 thì bớt câu L1.

**Đề 57–68 để dành cho thi thử** (~01/2027, mỗi tháng một đề): nội dung chỉ lấy từ Đề 1–56 — đã ghi `CONTENT_STANDARD.md` §6 và đầu `SOURCE_INDEX.md`.
✅ Đã thay 4 câu từng lấy từ đề để dành bằng câu cùng dạng, cùng mức L, có gợi ý H1–H3 và mã lỗi: `b-phepthu-p7` Đề 59 → **Đề 41 · 1.3**, `b-phepthu-p8` Đề 65 → **Đề 39 · 1.1**,
`b-phepthu-x7` Đề 65 → **Đề 31 · 1.2**, `a-tanso-x6` Đề 62 → **Đề 10 · 1.1** (đáp số + đáp án nhiễu tính lại bằng tay). `standard.ts` giờ báo lỗi nếu `source` có "Đề 57"–"Đề 68".

**Bài kiểm tra đầu vào 11/10** (giấy, 90′, gia sư chấm) — tài liệu Claude Docs "Bài kiểm tra đầu vào Toán 9 — 11/10/2026" trong hub.
Kết quả → bảng chốt theo KU (kiểm tra vượt / học từ đầu / học nhanh + mở khoá tay). Ghi nhận khi soạn: hệ phương trình **không có KU riêng**
(dùng lại ở g-*); KU c-* là Track A nên không có kiểm tra vượt (LT4) — con đã học căn thức ở trường thì phụ huynh mở khoá tay (LT2).

---

## 06/10/2026 — Nội dung đợt 1 (nhánh `p1-content-1`)

**Phụ huynh cần làm:** merge **#14 → #15 → PR này** (PR này xếp chồng trên `p1-slice-6a2` vì main chưa có L3/hints/source). Không SQL.
Duyệt trên preview: menu **Nội dung** → 4 bài *Nháp* + htl-1, htl-2; phiếu duyệt `CONTENT_STANDARD.md` §7 (~20′/KU). Nói "duyệt KU …" thì phiên sau đổi `status`.

**Đã làm**
- 4 KU mới ở trạng thái **draft**: `f1-hdt` (7 hằng đẳng thức), `f1-pnt` (phân tích thành nhân tử), `a-tanso` (tần số & tần số tương đối), `b-phepthu` (phép thử & không gian mẫu). Mỗi bài: lý thuyết theo khung §2, mẫu có bước "Kết luận:", bài khuyết 3 chỗ trống (KU đại số có chỗ trống "Kết luận"), luyện 8 câu 3/3/2 có câu nhận dạng và H1–H3, kho kiểm tra 8 câu 2/3/3. Module mới: `backfill-dai-so`, `thong-ke`, `xac-suat`.
- **Chuẩn hoá htl-1, htl-2 (§9)**, `status` giữ `approved`: thêm H1–H3 cho mọi câu luyện; mỗi bài thêm 2 câu L3 luyện + 3 câu L3 kiểm tra (id mới, không dùng lại id cũ); htl-1-p7/p8 và htl-2-p7/p8 (L2) bỏ, htl-1-p4 và htl-2-p4 lên L2; thêm câu nhận dạng (htl-1-p5 đánh dấu nhận dạng, htl-2-p2 thay bằng htl-2-p11 "nên dùng hệ thức nào?"); thêm bước "Kết luận:".
  Mã lỗi: quên bình phương / tính ngược sai E10, E06 → **E03** (+ `review: htl-1` ở htl-2); nhầm hình chiếu, nhầm cạnh E03 → **E08**; quên lấy căn E10 → **E11** (Q19); bỏ E09 (chỉ dùng cho bài chấm tay) → E08/E06; câu trắc nghiệm 4 phương án nay đủ ≥ 2 phương án sai có lời nhắc.
- Bỏ miễn chuẩn của htl-1/2 trong `standard.ts` — giờ cả 6 bài qua đủ kiểm tra của `npm test`.
- App: phương án đúng của câu trắc nghiệm mới được đặt ở vị trí khác nhau (app hiển thị theo thứ tự trong file). Ô "Câu n" của bài kiểm tra có `data-item` để e2e trả lời đúng bộ được rút; `preview-flow`, `student-flow` cập nhật theo nội dung mới (kho 8 câu, rút 5).

**Nguồn câu L3 (LT15)**
- Bản PDF trong Project đọc được dạng chữ nhưng **mất dấu căn, phân số** ở Bài 2. Câu L3 của f1-hdt, f1-pnt chuyển thể theo **mẫu số** của câu rút gọn (c-rutgon), suy ra từ ĐKXĐ in trong đề: $x \ne 4$ (Đề 1, 2, 3, 8, 13, 15, 17), $x \ne 9$ (Đề 5, 6, 7, 10, 16, 20), $x \ne 1$ (Đề 11, 12, 18, 19). Biểu thức là soạn lại theo mẫu đó, **chưa đối chiếu trang gốc** — `source` ghi "chuyển thể".
- a-tanso, b-phepthu: chuyển thể từ đề đọc được đủ chữ, đổi số liệu — Đề 14, 44, 48, 62 (a-tanso); Đề 39, 44, 59, 65 (b-phepthu).
- htl-1/2: Q18.

**Kiểm tra trước khi tới phụ huynh (§7)**

| Bước | Kết quả |
|---|---|
| 1. `npm test` | 94/94 qua (schema, 3/3/2, 2/3/3, nhận dạng E05, gợi ý ≤ 25 chữ không lộ đáp số, ≥ 1 câu kiểm tra có nguồn, `review` hợp lệ). Lint, build, `./e2e/run.sh` (156 PASS) qua |
| 2. Giải độc lập | 2 agent chỉ nhận đề (không đáp án, không lời giải, không gợi ý) giải **113/113** câu (điền bước + luyện + kho kiểm tra của 6 bài): **113/113 khớp**. Agent góp ý, đã sửa: f1-pnt-p1, x1 thêm "đến tận cùng" (dạng đặt thiếu nhân tử chung cũng là phân tích đúng); a-tanso-p8 ghi rõ "dạng số thập phân"; a-tanso-x7 nêu cỡ mẫu 200. Không đổi đáp án nào |
| 3. Tính lại nhiễu | Script Python/sympy đọc thẳng TeX trong file JSON: **81 câu** tính lại đáp án + từng đáp án nhiễu theo đúng lỗi đã ghi (vd f1-hdt-p5: 49 = $(x+y)^2$ quên $-2xy$ (E03), 69 = sai dấu (E02), 39 = thiếu hệ số 2 (E03)); dạng "chưa rút gọn hết" (E11) phải bằng đúng đáp án; số liệu thống kê đếm lại từ danh sách. **0 lệch**. Thử cố tình sửa sai 1 đáp án và 1 nhiễu → script bắt được cả hai. 32 câu khái niệm (chọn cách làm, chọn kết luận, chọn tập hợp chữ) không có phép tính → soát tay ở bước 4 |
| 4. Soát sư phạm | Script soát: lý thuyết ≤ 80 chữ/đoạn, mẫu 3–5 bước kết thúc "Kết luận:", khuyết ≥ 2 chỗ trống, phản hồi ≤ 2 câu không lộ đáp số, trắc nghiệm 4 phương án có ≥ 2 nhiễu có mã → 0 vấn đề. Xem preview 390px: sửa 1 đoạn in đậm chứa TeX bị lỗi hiển thị (a-tanso) và tập $\Omega$ tràn ngang (b-phepthu) |
| 5. Gia sư | Không cần — đợt 1 không có KU mạch C, E, G |

**Để ý khi duyệt:** thời lượng 40–45′/KU (Q20); f1-hdt/f1-pnt dùng $\sqrt{x}$ ở câu L3 (lấy từ dạng rút gọn lớp 9) — nếu con chưa học căn bậc hai ở trường thì báo để đổi; câu L3 a-tanso-x8 cố ý cho số người giảm mà tỉ lệ tăng (bẫy so tần số với tần số tương đối).

---

## 06/10/2026 — S6b Câu nhiều bước, hình SVG, gợi ý, ôn nền, nhãn gia sư (nhánh `p1-slice-6b`)

**Phụ huynh cần làm:** chạy **SQL 0010** (`supabase/migrations/0010_p1_hints.sql`: thêm cột `attempts.hint_level`, mặc định 0 — chỉ thêm) **trước khi merge** PR S6b; thứ tự merge **#14 → #15 → S6b** (S6b xếp chồng trên #15 vì dùng `hints`, `review` của S6a+).

**Đã làm (P1_PLAN S6b, AI_TUTOR §3, CONTENT_STANDARD §8):**
- Câu `steps` (LT5): luyện tập làm **từng bước** — sai bước nào hiện phản hồi + mã lỗi + giá trị đúng của bước đó để làm tiếp; cuối câu ghi **1 dòng** (đúng khi đúng hết, mã lỗi = bước sai đầu). Kiểm tra và ôn: nhập cả chuỗi một lần.
- Gợi ý H1→H3 (AI2): nút "💡 Gợi ý" mở từng dòng; trả lời sau H2+ ghi `hint_level`, không tính "đúng ngay lần đầu" cho M2, câu quay lại cuối phiên. Kiểm tra: không gợi ý. Ôn: gợi ý chỉ sau khi trả lời.
- Link "📖 Ôn lại: …" (LT16) ở phản hồi sai → trang xem lại bài nền (lý thuyết + lời giải mẫu) trong tab mới, không ghi gì.
- Hình SVG (LT7) ở bài hoặc từng câu, kiểm chặt (test có SVG độc hại bị từ chối), theo màu theme sáng/tối.
- Nhãn "Cần gia sư xác nhận" (LT6) trên thẻ học, bản đồ, bản đồ bài của phụ huynh.

**Quyết định khi làm:** ghi ở SPEC §0 ("S6b build rulings"); câu hỏi mở Q15–Q17.

**Review (đã sửa):** kiểm tra từng bước không hiện giá trị đúng khi bài đang đến hạn ôn (câu luyện cũng là câu ôn); thẻ nhắc mức + thanh "x/5 đúng" trên bản đồ không tính câu trả lời sau H2+; gõ nhầm định dạng ở một bước khi ôn → nhắc định dạng thay vì tính sai; kết quả kiểm tra hiện đáp án từng bước (không phải chuỗi `a|b`); giữ đáp án các bước sau khi hoàn thành câu; trang "Bài làm" của gia sư có phản hồi cho câu nhiều bước. **Để sau (nhỏ):** id trong SVG có thể trùng khi bài và câu cùng có hình; kiểm SVG không so tên thẻ đóng; gợi ý câu nhiều bước chỉ kiểm đáp số bước cuối; hình ở từng bước con chưa hiển thị; luyện tập vẫn có thể dò từng bước rồi nộp đúng (cần devtools, chỉ ảnh hưởng dữ liệu của con).

**Kiểm tra:** lint, `npm test`, build, `./e2e/run.sh` — xem mô tả PR.

---

## 06/10/2026 — LT17 trong S6a+ (nhánh `p1-slice-6a2`, PR #15)

**Phụ huynh cần làm:** merge **PR #14 trước, rồi PR #15** (#15 xếp chồng trên #14, xem Q13). Không SQL.

**Đã làm:** trường `priority` (P0/P1/P2) trong `content/curriculum.json` + schema, test khớp cột priority của CURRICULUM.md; bài lõi không được phụ thuộc bài P2; KU P2 chỉ được gợi ý khi mọi KU P0/P1 cùng track đạt M3 (kể cả bài lõi chưa soạn — Q14) hoặc phụ huynh mở tay; nhóm **"Học thêm khi dư thời gian"** cuối bản đồ Hành trình và cuối trang Nội dung.

---

## 05/10/2026 — S6a+ Schema theo chuẩn nội dung (nhánh `p1-slice-6a2`)

**Phụ huynh cần làm:** merge PR (không có SQL). Sau đó Claude soạn đợt 1 theo chuẩn.

**Đã làm (CONTENT_STANDARD §8):**
- Câu hỏi có cấp **L3** và các trường `source`, `recognition`, `hints` (3 dòng), `review` (ở đáp án sai). Chưa hiện cho con — nút Gợi ý và link "Ôn lại" làm ở S6b.
- `npm test` kiểm chuẩn: luyện 3/3/2 có câu nhận dạng (sai = E05), mỗi câu luyện 3 gợi ý ≤ 25 chữ không lộ đáp số, kho kiểm tra 2/3/3 có câu ghi nguồn, `review` phải là bài tiên quyết. htl-1/2 tạm miễn tới khi chuẩn hoá (§9).
- **Kho kiểm tra 8 câu, mỗi lượt rút 5** (1 Cơ bản, 2 Vận dụng, 2 Nâng cao), ưu tiên câu chưa gặp rồi câu gặp lâu nhất; máy chủ rút lại khi nộp và từ chối bộ khác (ví dụ tab cũ). Phụ huynh xem trước thấy đủ 8 câu.

**Review (đã sửa):** (1) quan trọng nhất — khi con có > 1000 câu trả lời, API Supabase chỉ trả 1000 dòng nên trang thấy lịch sử cũ, rút sai bộ và con không nộp được nữa; mức M cũng bị tính thiếu. Giờ đọc theo trang + trang và máy chủ dùng chung một truy vấn; e2e giả lập giới hạn 1000 dòng và có 1100 câu trả lời. (2) Màn kết quả sau khi nộp thiếu câu (trang rút bộ mới) — giờ giữ bộ đã làm. (3) Mã E12 bắt buộc có `review`.

**Quyết định:** hai lần nộp đúng cùng một lúc (hai tab, bấm đúng cùng giây) vẫn có thể lưu 2 lượt — không giúp gian lận M3 (mỗi lượt phải đúng bộ đã rút, chỉ lượt cuối tính), chỉ làm lượt sau rút bộ khác; chặn hẳn cần ràng buộc DB, để sau nếu thấy xảy ra.

**Để sau (nhỏ):** câu nhận dạng không có `mistakes` vẫn qua kiểm E05, chưa kiểm "≥ 2 phương án sai có mistakes"; kiểm gợi ý lộ đáp số không nhận dạng TeX (`2sqrt{3}`, `rac{}{}`) và không kiểm câu trắc nghiệm; đếm chữ tính cả ký hiệu TeX; danh sách Nội dung ghi "8 câu kiểm tra" thay vì "kho 8, mỗi lượt 5"; sau 2 lượt con đã xem lời giải cả 8 câu (giống bộ 5 cố định trước đây).

**Kiểm tra:** lint, `npm test`, build, `./e2e/run.sh` — xem mô tả PR.

---

## 06/10/2026 — Điều chỉnh lộ trình theo đề thật (LT17–LT18)

**Phụ huynh chốt (popup):** hạ 8 KU ít ra thi xuống P2 + gộp tối ưu 5 → 3 (LT17); hình học từ tuần 7 (LT18).
Khung đề Hà Nội 2025/2026 xác nhận Bài 4 = 4đ, Bài 5 = 0,5đ (nguồn tham khảo, ghi trong `CURRICULUM.md` §4).
**Đã làm:** `CURRICULUM.md` — 48 KU (40 lõi + 8 P2), ~77 giờ lõi, lịch 4 giai đoạn mới, mốc 8.5/9.5 tính lại, đợt nội dung đổi ngày;
`P1_PLAN.md` — `seq` mới, trường `priority`, quy tắc gợi ý KU P2, S5 dời lên (thiết kế ~11/2026).
**S6a đã merge trước khi có LT17** (50 KU) → nhánh này cập nhật luôn `content/curriculum.json` (48 KU, `seq` + đợt mới, hq-amgm gộp h-bdt)
và test (48) để `main` không đỏ. lint, `npm test` 73, build, e2e **148/148** qua. Không có SQL mới.
**Còn lại cho Claude Code (gộp vào S6a+):** thêm trường `priority` vào `curriculum.json` + chặn gợi ý KU P2 đến khi P0/P1 cùng track đạt M3;
nhóm "Học thêm khi dư thời gian" trên bản đồ và trang Nội dung (hiện 8 KU P2 tạm nằm ở đợt 10 và chưa có nội dung nên không được gợi ý).

---

## 05/10/2026 (đêm) — Chỉ mục nguồn 68 đề

**Đã làm:** `docs/SOURCE_INDEX.md` — 68 đề → 914 câu, phân loại theo KU (tự động + soát mẫu), số trang, tóm tắt ngắn; bảng tần suất KU.
**Phát hiện cần phụ huynh quyết (chưa sửa `CURRICULUM.md`):** (1) khung đề sách này: Bài 1 = 1,5đ, Bài 5 = **0,5đ**, Bài 4 = 4đ — khác §4.3;
(2) parabol/giao điểm, tỉ số lượng giác, vị trí tương đối, ngoại/nội tiếp gần như không xuất hiện → cân nhắc hạ ưu tiên.
**Phụ huynh cần làm:** tải file PDF 68 đề vào Project "STUDY BB" (Files) để phiên soạn bài đọc được đề gốc.

---

## 05/10/2026 — S6a Bộ lộ trình (nhánh `p1-slice-6a`)

**Phụ huynh cần làm:** merge theo thứ tự **#11 (sau SQL 0008) → #12 → #10 → PR S6a**; trước khi merge S6a chạy **SQL 0009** (`supabase/migrations/0009_p1_curriculum.sql`: bảng `unit_unlocks` + 2 cột kiểm tra vượt trong `unit_progress`). Chỉ thêm, không sửa dữ liệu cũ.

**Đã làm:**
- `content/curriculum.json` 50 KU / 17 module (LT1); test bắt: thiếu KU, tiên quyết sai/vòng, file không có trong lộ trình, title/domains lệch, registry cũ.
- Registry sinh tự động (`npm run content:index`) thay danh sách import tay.
- Mở khoá khi tiên quyết đạt M3 hoặc phụ huynh mở tay (LT2); gợi ý 1 bài track A + 1 bài B/C, tối đa 2 bài đang học (LT3); kiểm tra vượt 1 lần cho track B + bù nền (LT4); ôn tối đa 5 bài, 1 phiên/ngày (LT8); bản đồ nhóm track → module, 🔒 / 🌰 / "Sắp có" (LT9).
- Gia sư: 50 KU nhóm theo module + ô tìm, "cần gia sư xác nhận" đứng đầu. Phụ huynh: nội dung theo đợt + "Chưa soạn", nút "Mở khoá cho con".
- e2e trên KU giả (`e2e/fixtures/content`); các luồng cũ vẫn chạy trên nội dung thật.

**Thay đổi phụ huynh nên biết:** htl-2 giờ **khoá** cho đến khi htl-1 đạt M3 (tiên quyết theo CURRICULUM.md). Muốn con làm htl-2 trước: vào Nội dung → htl-2 → "Mở khoá cho con".

**Quyết định khi làm (mặc định, đổi được):** R1 bài đã bắt đầu không bao giờ khoá lại; R2 xếp chồng trên #12; R3 e2e S6a dùng registry riêng của fixtures. Ghi trong `docs/SPEC.md` §0.

**Kiểm tra:** lint, `npm test` (73 + 88 RLS), build, `./e2e/run.sh` 148 PASS.

**Review cuối (đã sửa 2 điểm quan trọng):** mức phụ huynh chốt không còn bị mất sau khi qua kiểm tra vượt; hai lần nộp kiểm tra vượt cùng lúc chỉ giữ một. **Để sau (nhỏ):** phiên ôn bắt đầu 23:55 xong 00:05 tính cho ngày hôm sau; giới hạn 5 bài/1 phiên chỉ chặn ở trang (không ở action); `e2e/run.sh` khôi phục registry bằng git checkout (mất bản chưa commit); trang Nội dung tải toàn bộ trạng thái từng con; đề xuất của gia sư cho KU chưa có bài hiện mã thay vì tên và không lên cờ cho phụ huynh; xoá hồ sơ phụ huynh xoá luôn các bài đã mở tay chưa học; phiên ôn mở lại chỉ giữ các bài đã có câu trả lời.

---

## 05/10/2026 (tối) — Thiết kế AI trong app (AI1–AI4)

**Phụ huynh chốt (popup):** bật AI cho con sau 3–4 tuần pilot (~09/11) (AI1); gợi ý H1–H3 viết sẵn trong nội dung, AI chỉ cho câu hỏi tự do (AI2);
AI hỗ trợ phụ huynh/gia sư: báo cáo tuần, tóm tắt trước buổi, tóm tắt hội thoại AI (AI3); trần $10/tháng (AI4).

**Đã làm:** `docs/AI_TUTOR.md` — phương pháp dạy, AI làm/không làm, luồng gợi ý H1→H6, 5 lớp chống dạy sai (viết sẵn trước, bám nội dung đã duyệt,
máy chủ soát số/đáp án, bộ test từ lỗi thật + chấm lại khi đổi, nút "AI nói sai?"), hỗ trợ phụ huynh/gia sư, chi phí, quyền riêng tư, lịch.
`CONTENT_STANDARD.md`: mọi câu luyện có `hints` H1–H3 từ đợt 1. `P1_PLAN.md`: gợi ý trong S6b (migration 0010), lát **S8** AI (0011).

**Phụ huynh cần làm trước S8 (~26/10):** tạo tài khoản Anthropic Console, đặt giới hạn chi $10, tự dán khoá API vào Vercel (không gửi qua chat).

---

## 05/10/2026 (tối) — Chuẩn soạn nội dung KU (LT13–LT16)

**Phụ huynh chốt (popup):** kho kiểm tra 8 câu, mỗi lượt rút 5 (LT13); luyện tập 3 L1 + 3 L2 + 2 L3, có câu nhận dạng (LT14);
L1–L2 tự soạn, L3 lấy/chuyển thể từ 68 đề + đề Hà Nội, ghi nguồn từng câu (LT15); đáp án sai do hổng nền có link "Ôn lại" (LT16).

**Đã làm:** `docs/CONTENT_STANDARD.md` — khung KU, khung lý thuyết, cấp câu, bảng gắn mã lỗi E01–E15 (khi nào dùng / không dùng, ví dụ),
cách viết phản hồi, quy ước số và nguồn, quy trình kiểm tra 5 bước + phiếu duyệt 20 phút cho phụ huynh, thay đổi app cần (đưa vào S6a/S6b),
chuẩn hoá htl-1/2. CLAUDE.md trỏ tới file này.

**Lưu ý:** file PDF 68 đề không đưa vào GitHub (sách có bản quyền). Việc tiếp theo đề xuất: lập `docs/SOURCE_INDEX.md` (đề số, bài, dạng → KU).

---

## 05/10/2026 — Review kiến trúc lộ trình + chốt LT1–LT12 (nhánh `p1-curriculum-design`)

**Kết luận review:** curriculum đã rõ *học gì*, nhưng app chưa đủ để code 50 KU (chỉ chạy 1 module theo thứ tự file, 2 loại câu, 1 hình cố định). Trang review: `https://claude.ai/artifact/HuDrqkHFP1jRPZGC7rLrss`.

**Phụ huynh chốt (05/10, qua câu hỏi popup):** cả 11 phương án đề xuất + mốc thời gian. Chi tiết ở `docs/SPEC.md` §0 (mã LT1–LT12; trang review gọi là Q1–Q12):
| # | Chốt |
|---|---|
| LT1 | `content/curriculum.json` + test là nguồn app đọc |
| LT2 | Mở khoá khi tiên quyết đạt M3; phụ huynh mở tay được (migration 0009) |
| LT3 | Gợi ý 1 bài Track A + 1 bài Track B/C, con chọn; tối đa 2 bài đang học |
| LT4 | Kiểm tra vượt cho Track B + bù nền F1/F3, 1 lần/KU (**đổi quy tắc học**) |
| LT5 | Câu nhiều bước = 1 câu, đúng khi đúng hết, mã lỗi ở bước sai đầu |
| LT6 | App giữ phần tự chấm; chứng minh trên giấy với gia sư; nhãn "cần gia sư xác nhận" |
| LT7 | Hình = SVG trong file nội dung |
| LT8 | Tối đa 5 bài/phiên ôn |
| LT9 | Bản đồ nhóm track → module |
| LT10 | Kiểm tra độc lập + phụ huynh duyệt; gia sư soát C, E, G |
| LT11 | Lộ trình trước; chạy song song với pilot (S3 đã merge, S4 ở PR #11) |
| LT12 | Bắt đầu **12/10/2026**; học xong 50 KU trước **31/03/2027**; tháng 4–5 chỉ luyện đề |

**Đã làm (nhánh `p1-curriculum-design`):**
- `docs/CURRICULUM.md`: sửa 13 dòng thiếu cột trọng số đề; số đếm loại chấm khớp bảng (26 / 4 / 15 / 5 → 60% tự chấm toàn bộ); lịch nén 4 giai đoạn đến 31/03 (Tết tuần 17–18 chỉ ôn; gate 8.5 xong ~21/02); 10 đợt nội dung có hạn duyệt; §9 khớp schema thật.
- `docs/P1_PLAN.md`: thiết kế + nghiệm thu S6a, S6b, S4b; thứ tự lát mới; lịch song song 4 tuần đầu; quy trình kiểm tra toán.
- Nhánh đã merge `main` mới nhất (sau PR #7) để khớp số migration: lộ trình dùng **0009** (0006 S3, 0007 bài về nhà, 0008 S4).
- `docs/SPEC.md` §0: 13 dòng quyết định mới.

**Phụ huynh cần làm tuần này (05–11/10):**
1. Merge theo thứ tự: PR #9 (tài khoản) → PR #11 (S4, **chạy SQL 0008** trước) → PR #8 (content brief + checklist pilot) → PR #6 (handover UX) → PR #10 (lộ trình). Các PR tài liệu có thể đụng nhau ở `PROGRESS.md`; Claude sửa xung đột nếu GitHub báo.
2. Nói chuyện D18 với Nguyên → tạo tài khoản học sinh trước 12/10; gia sư bắt đầu ghi buổi dạy.
3. Cập nhật hub `claude/PJ_APP_TOAN.md` (thêm LT1–LT12, mốc 12/10 → 31/03) qua chu trình update → review → commit.
4. Chọn cách chạy build S6a: bật lại lịch đêm (đang tắt) hay làm trong phiên chat.

**Lưu ý:** HANDOVER_STUDENT_UX §3.3 (đường dọc 1 cột) được thay bằng bản đồ nhóm track → module (LT9); kiểu nút cây giữ nguyên.

---

## 05/10/2026 — Student UX mockup duyệt + handover

**Phụ huynh duyệt (05/10):** Mockup Student UX (3 màn hình: StudentHome, ProgressMap, QuestionFeedback).

**Đã làm:**
- Design artifact (3 artboards) trên Claude.ai: `https://claude.ai/artifact/LNFSgD23tfTxRb3Yi7vWbJ`.
- `docs/HANDOVER_STUDENT_UX.md`: mô tả chi tiết component changes, token mapping, data sources cho Claude Code.
- `docs/DESIGN.md` §9: student theme spec (warm teal, plant emoji badges, SVG ring, question feedback).
- `docs/SPEC.md` §0: thêm 2 build decisions (student UX theme + session correct count D17).

**Scope:** Chỉ thay đổi UI student routes — không sửa server logic, DB schema, hay parent/tutor routes.

**Claude Code cần làm:** Đọc `docs/HANDOVER_STUDENT_UX.md` → implement theo thứ tự đề xuất (§8 trong handover).

---

## 05/10/2026 — Giao diện học sinh mới (nhánh `p1-student-ux`)

Spec `docs/superpowers/specs/2026-10-05-student-ux-design.md` (U1–U8, phụ huynh duyệt 05/10; thay handover PR #6). **Không có SQL.** Xếp chồng trên `p1-slice-4`.

### Đã làm
- **Theme ấm** (kem + teal, có bản tối) chỉ cho trang học sinh; phụ huynh/gia sư giữ giao diện cũ.
- **Trang chủ**: header teal "Chào buổi sáng/chiều/tối" + tên + ngày + **vòng mục tiêu tuần**; "Hôm nay cần làm" chia nhóm Ôn lại → Bài về nhà → Đang học → Bài mới (emoji mức trên mỗi thẻ, nút teal); dải "x/y bài đạt M3+ · Xem hành trình →".
- **Trang mới "Hành trình của con"** (`/student/journey`): 3 ô Đã vững / Đang học / Chưa bắt đầu, đường dọc 🌰 → 🌱 → 🌿 → 🌳 → ⭐, lịch ôn kế tiếp, "bố mẹ chốt".
- **Thẻ sau mỗi câu luyện tập / ôn**: đúng → 🎉 "Chính xác!", "Đúng x/y câu lượt này" (tổng, không phải chuỗi), lời giải, gợi ý lên mức theo đúng quy tắc ("Làm thêm 4 câu luyện để hệ thống đánh giá lên M2", "Làm bài kiểm tra cuối để lên M3"…); sai → 💡 "Gần đúng rồi!"/"Chưa đúng", lời nhắc, nhãn lỗi tiếng Việt ("E10 — Sơ ý"), "Con trả lời / Đáp án đúng", lời giải, "Câu này sẽ quay lại cuối bài", **chỉ "Câu tiếp"** (không "Thử lại").
- **Tên lỗi E01–E15** (master plan §26): tiếng Anh là chuẩn, con thấy tiếng Việt (`src/lib/content/errors.ts`).

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **62** test quy tắc/nội dung (thêm 5: tên lỗi, lời chào theo giờ VN, gợi ý lên mức mọi mức + ranh giới 5 câu/60%, câu khen, đếm phiên) + **78** RLS.
- `./e2e/run.sh`: **121/121** (header + vòng; dải hành trình → trang Hành trình 0·0·2 với 🌰; câu luyện đúng → "Chính xác!", "Đúng 1/1 câu lượt này", gợi ý M2; ôn sai → "Con trả lời"/"Đáp án đúng", không có "Thử lại"; M3 🌳 + "Ôn D+1"; M4 ⭐; "bố mẹ chốt"; xem trước phụ huynh: "Chưa đúng" + "quay lại cuối bài", không gợi ý; nền tối đúng màu). Đã xem ảnh chụp sáng/tối.

### Phụ huynh cần làm
1. Merge theo thứ tự **#9 → #11** (sau khi chạy SQL 0008) → PR này. Không có SQL mới.
2. Thử preview bằng tài khoản con: trang chủ, "Xem hành trình", làm vài câu luyện tập (đúng và sai).
3. Đóng **PR #6** (handover đã gộp vào đây: `docs/HANDOVER_STUDENT_UX.md`).

### Ghi chú
- Remediation Router (master plan §27) mới có hướng xử lý cho 7/15 mã lỗi — **E03, E07, E11, E13, E14, E15** cần bổ sung trước khi làm tính năng đó.

---

## 05/10/2026 — S4: Phụ huynh "Tổng quan" (nhánh `p1-slice-4`)

Spec `docs/superpowers/specs/2026-10-05-parent-overview-design.md` (P1–P3, phụ huynh duyệt 05/10). **Có SQL mới: `0008`.** Nhánh xếp chồng trên `p1-account-tools` (PR #9) vì cùng sửa trang Tài khoản → merge #9 trước.

**Chỉnh so với spec lúc lập kế hoạch:** mức bố mẹ chốt hiện **cho tới khi mức hệ thống đổi** (bỏ điều kiện "mới hơn đề xuất" — học sinh không đọc được đề xuất của gia sư). Gia sư đề xuất lại mà vẫn lệch → cờ lệch hiện lại.

**Sửa sau review độc lập (3 điểm):** nhắc buổi chưa ghi chỉ trong **7 ngày** (bằng giới hạn ghi trễ — trước là 14, có nhắc không xoá được); gia sư đề xuất **trùng** mức bố mẹ đã chốt thì không bật cờ; mức hệ thống **đã đổi sau khi chốt** (kể cả đổi rồi quay lại) thì mức chốt hết hiệu lực hẳn.

### Đã làm
- **Tổng quan** (mỗi học sinh): 3 con số (bài đạt M3+ / tổng, bài ôn quá hạn, cờ lệch cần chốt) → **"Cần chú ý"**: cờ lệch (gia sư đề xuất M3 · hệ thống M1 + bằng chứng + ghi chú buổi dạy + "Xem bài làm" + **"Chốt mức"** M0–M4 có ghi chú) và **buổi dạy chưa ghi** (ngày dạy theo lịch đã qua > 24h, 14 ngày gần nhất) → **các bài** (mức hiển thị, "bố mẹ chốt", "ôn quá hạn") → **tuần này** (buổi học /4, bài kiểm tra, lượt ôn, buổi dạy đã ghi, bài về nhà giao/xong/chữa).
- **Tài khoản**: chọn ngày dạy T2…CN khi gán gia sư; "Lịch: T3, T5 · Sửa lịch" cho phân công đang hoạt động. Chưa đặt lịch → Tổng quan nhắc đặt lịch.
- Mức bố mẹ chốt hiện ở: bản đồ tiến độ của con ("bố mẹ chốt"), bằng chứng trong form gia sư ("Bố mẹ chốt M3 (05/10)"), "Bài làm của con". Lịch ôn, "Hôm nay cần làm" và quy tắc mức **không đổi** (P2).
- SQL 0008: bảng `parent_confirmations` (giữ mọi lần chốt, chụp mức hệ thống lúc chốt), cột `tutor_assignments.weekdays` (DB chặn ngày sai/trùng).

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **54** test quy tắc/nội dung (thêm 6: ngày trong tuần, mức hiển thị, cờ lệch — kể cả đề xuất lại sau khi chốt, buổi chưa ghi — hôm nay chưa nhắc/trước ngày gán không nhắc/gia sư khác không tính, tóm tắt tuần) + **78** test RLS (thêm 13).
- `./e2e/run.sh`: **115/115** (thêm 9): Tổng quan 0/2 · 0 · 1 cờ → chốt M3 có ghi chú → DB lưu kèm mức hệ thống, 1/2, hết cờ, "bố mẹ chốt"; nhắc ngày dạy hôm qua → ghi buổi → hết nhắc; sửa lịch → DB [2,5]; con thấy "bố mẹ chốt" trên bản đồ.

### Phụ huynh cần làm (khoảng 15 phút)
1. Merge **PR #9** trước (nếu chưa).
2. **Chạy SQL** `supabase/migrations/0008_p1_parent_overview.sql` → "Success. No rows returned".
3. Tài khoản → Lịch sử phân công → **Sửa lịch** → tick ngày gia sư dạy → Lưu lịch.
4. Thử preview: Tổng quan → xem 3 con số, "Cần chú ý", "Các bài", "Tuần này". (Có cờ lệch thật thì có thể chốt luôn — đó là dữ liệu thật.)
5. Merge PR.

### Ghi chú kỹ thuật
- Quy tắc thuần ở `src/lib/learning/overview.ts`; `StudentOverview` (`src/components/parent/student-overview.tsx`) đọc qua RLS của phụ huynh.
- `parentOwnsStudent` chuyển sang `src/lib/parent.ts` (server-only), dùng chung cho `/parent` và Tài khoản.

---

## 05/10/2026 — Công cụ tài khoản (nhánh `p1-account-tools`)

Sau sự cố tài khoản học sinh hôm 05/10 (hồ sơ thừa "nguyen1607", không có tài khoản đăng nhập nào gắn với hồ sơ — phải xoá bằng SQL). **Không có SQL mới.**

### Đã làm
- **Tài khoản → mục "Học sinh"**: mỗi hồ sơ một dòng — lớp, gia sư đang dạy, **email đăng nhập đang gắn** hoặc cảnh báo "Chưa có tài khoản đăng nhập — tạo tài khoản cho …" (bấm vào: form tạo tài khoản chọn sẵn vai trò Học sinh + hồ sơ đó).
- **Sửa** họ tên / lớp. **Xoá hồ sơ**: hiện trước những gì sẽ mất ("Sẽ xoá vĩnh viễn: 37 câu đã làm, 2 buổi dạy, tài khoản đăng nhập"), phải **gõ lại họ tên** (không phân biệt hoa/thường, khoảng trắng; phân biệt dấu); xoá cả bài làm, lịch ôn, buổi dạy, bài về nhà và tài khoản đăng nhập của hồ sơ đó.
- Form tạo tài khoản: ghi chú email "dùng để đăng nhập, không phải tên người dùng; app không gửi thư — có thể dùng tenban+nguyen@gmail.com"; "Thêm học sinh" ghi rõ đây là bước 1.
- Gia sư vẫn chỉ **khoá** (không xoá) để giữ lịch sử dạy (D3); tài khoản phụ huynh không xoá được.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **48** test quy tắc/nội dung (thêm 2: so khớp họ tên khi xoá, kể cả tiếng Việt dạng tách dấu; dòng "sẽ xoá…") + **65** test RLS: qua.
- `./e2e/run.sh`: **106/106** (thêm 10, luồng phụ huynh mới `e2e/accounts-flow.mjs`): danh sách hiện email + gia sư; hồ sơ mới bị đánh dấu chưa có tài khoản → link chọn sẵn hồ sơ → tạo tài khoản → DB gắn đúng; sửa tên + lớp; xoá: hiện "2 câu đã làm, tài khoản đăng nhập", gõ sai tên bị chặn, gõ đúng (khác hoa/thường) → hồ sơ, bài làm, tài khoản đăng nhập biến mất, hồ sơ khác còn nguyên. DB giả e2e có thêm `auth.admin` (tạo/xoá/liệt kê) và đếm `count: "exact", head: true`.

### Phụ huynh cần làm
1. Không có SQL. Thử preview: Tài khoản → mục Học sinh → thấy "Hanh Nguyen" kèm email đăng nhập và gia sư. (Đừng thử nút Xoá trên hồ sơ thật — preview dùng database thật.)
2. Merge.

---

## 05/10/2026 — S3b phần B: Giao bài về nhà (nhánh `p1-homework`)

Theo spec `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` (T1–T4). **Có SQL mới: `0007`.** Nhánh xếp chồng trên `p1-tutor-tools` (PR #5) → merge #4 → #5 → PR này.

### Đã làm
- **Gia sư, form "Ghi buổi dạy"**: mục **"+ Giao bài về nhà"** (tối đa 5 bài/buổi) — cho phần (bài đã tick hoặc "Khác"), yêu cầu ≤ 300 ký tự, 0–3 link (chỉ `https://`; link không phải Google Drive thì nhắc nhưng vẫn lưu), hạn mặc định **hôm nay + 3** (từ ngày dạy đến tối đa 30 ngày). Lưu cùng buổi dạy trong một lần bấm; lỗi thì không lưu gì.
- **Đầu form: "Bài đã giao chưa chữa"** — yêu cầu, hạn, con đã báo xong chưa; nút **"Đã chữa"** + nhận xét (≤ 300 ký tự), không cần lưu buổi mới.
- **Học sinh, "Hôm nay cần làm"**: thẻ **"Bài về nhà của thầy/cô"** ngay sau thẻ ôn — yêu cầu, link "Mở đề ↗" (tab mới), hạn ("hạn thứ Năm 08/10" / "quá hạn" màu nhẹ), nút **"Con làm xong rồi"** (bấm lại để bỏ). Sau khi gia sư chữa: "Thầy/cô đã chữa" + nhận xét, ẩn sau 7 ngày. **Không chấm, không tính mức M, không tính mục tiêu tuần.**
- **Bảng mới `homework`** (migration 0007): gắn với buổi dạy (đúng học sinh + gia sư của buổi). RLS: phụ huynh đọc hết; gia sư chỉ đọc bài **mình giao**, khi còn được gán; học sinh đọc bài của mình. Mọi thao tác ghi qua máy chủ.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **45** test quy tắc/nội dung (thêm 8: đọc form, bỏ qua dòng trống, báo lỗi nêu đúng "Bài về nhà N", link `http://`/`javascript:`/có dấu cách bị chặn, hạn ngoài khoảng, nhận xét xuống dòng, nhãn hạn tiếng Việt, ẩn sau 7 ngày) + **63** test RLS (thêm 14 cho bảng `homework`): qua.
- `./e2e/run.sh`: **96/96** (thêm 13): gia sư giao bài (hạn mặc định +3, có link mà thiếu yêu cầu → bị chặn, link lạ → nhắc), DB lưu đúng; thấy "Con chưa báo xong" → "Con đã báo xong" → "Đã chữa" + nhận xét → biến khỏi danh sách; học sinh thấy thẻ, link mở tab mới, bấm xong → DB ghi, **mục tiêu tuần không đổi**, sau khi chữa thấy nhận xét và hết nút, quá 7 ngày thì ẩn.

### Phụ huynh cần làm (khoảng 15 phút)
1. Merge **PR #4**, rồi **PR #5** (nếu chưa).
2. **Chạy SQL** `supabase/migrations/0007_p1_homework.sql` trên Supabase → "Success. No rows returned".
3. Thử preview: gia sư → Ghi buổi dạy → tick bài, chọn mức → **+ Giao bài về nhà** (dán link Drive để chế độ "Bất kỳ ai có đường liên kết") → Lưu. Học sinh → thấy thẻ, mở link, **Con làm xong rồi**. Gia sư mở lại form → "Con đã báo xong" → ghi nhận xét → **Đã chữa**. Học sinh thấy nhận xét.
4. Merge PR.

### Quyết định cho giao diện học sinh (handover `p1-student-ux-handover`, phụ huynh chốt 05/10)
- **Bỏ nút "Thử lại"** khi làm sai: chỉ "Câu tiếp" (luyện tập chấm 1 lần, câu sai quay lại cuối bài; lượt ôn không làm lại được). Phần điền bước vẫn thử lại như cũ.
- Đếm câu trong phiên: **"Đúng x/y câu lượt này"** — không đếm "liên tiếp" (tránh cơ chế chuỗi, D17).
- Thứ tự: phần B (bài về nhà) trước, giao diện học sinh sau. Các điểm khác của handover cần chỉnh khi lên kế hoạch: gợi ý lên mức theo đúng quy tắc M2/M3/M4; so sánh chỉ "con trả lời / đáp án đúng" (app không có các bước làm); cần bảng tên lỗi E01–E15; server trả thêm dữ liệu sau khi chấm (không đổi DB); M0 "Chưa bắt đầu" thay vì 🔒 "Chưa mở"; header không ghim cố định; thêm bộ màu tối.

### Ghi chú kỹ thuật (cho phiên sau)
- Form gửi bài về nhà dạng `hw.<i>.unit|task|link|due` (`readHomeworkForm`); quy tắc thuần ở `src/lib/learning/homework.ts`.
- Buổi dạy vẫn cần ít nhất 1 bài đã tick hoặc ghi chú — chỉ giao bài về nhà thôi thì chưa lưu được.
- `activeAssignment()` trong `src/app/tutor/actions.ts` dùng chung cho lưu buổi và "Đã chữa".

---

## 05/10/2026 — S3b phần A: "Bài làm của con" (nhánh `p1-tutor-tools`)

Theo góp ý sau khi gia sư dùng thử: gia sư không xem được con làm sai câu nào. Thiết kế + quyết định T1–T5: `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` (phụ huynh duyệt 05/10). **Không có SQL.**

**Nhánh xếp chồng:** `p1-tutor-tools` tách từ `p1-fixes` (PR #4 chưa merge). Merge PR #4 trước; PR này sau đó chỉ còn phần mới.

### Đã làm
- **Gia sư**: trang chủ có nút **"Xem bài làm"**; form ghi buổi dạy có link **"Xem câu sai →"** dưới bằng chứng mỗi bài đã tick (mở tab mới, không mất lựa chọn đang nhập).
- **Trang "Bài làm của {con}"**: mỗi bài một thẻ — mức hệ thống, số câu, kiểm tra gần nhất, **lỗi hay gặp** (mã lỗi ≥ 2 lần, ví dụ "E10 × 2"), mức gia sư đề xuất gần nhất. Bấm một bài → các câu đã làm, mới nhất trước, mặc định **chỉ câu sai** ↔ "Tất cả": loại (luyện tập/kiểm tra/ôn), giờ, thời gian làm, đề + hình, **con trả lời gì**, **đáp án đúng**, mã lỗi + lời nhắc trong nội dung, nhãn **"Lần sau làm đúng"**, lời giải (gập sẵn). Chỉ xem.
- **Phụ huynh**: "Tổng quan" → **"Xem bài làm"** cạnh tên con — cùng trang (dùng lại cho S4).
- Quyền: gia sư chỉ thấy khi **đang được gán**; hết gán → 404; học sinh không vào được.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **37** test quy tắc/nội dung (thêm 6 cho trang bài làm: lỗi hay gặp, lọc, "lần sau làm đúng", trắc nghiệm hiện nội dung phương án, câu bỏ trống, chữ con gõ không bị hiểu thành công thức/HTML) + **49** test RLS: qua.
- `./e2e/run.sh`: **83/83** (thêm 11): gia sư thấy đúng 3 câu sai, con trả lời 225 / đáp án 15 / lời nhắc "Còn bước lấy căn bậc hai", "E10 × 2", "Bạn đề xuất M3", "Lần sau làm đúng", "Tất cả (11)", mã bài lạ → quay về danh sách, link từ form mở tab mới, hết gán → 404; phụ huynh mở được; học sinh bị chặn. Sau đó chỉ sửa cỡ hình (CSS) — lint + build qua, e2e chưa chạy lại.

### Phụ huynh cần làm (khoảng 10 phút)
1. Merge **PR #4** trước (nếu chưa). Không có SQL.
2. Thử preview: đăng nhập gia sư → **Xem bài làm** → chọn bài → thấy câu sai của con; vào **Ghi buổi dạy**, tick một bài → "Xem câu sai →".
3. Đăng nhập phụ huynh → Tổng quan → **Xem bài làm**.
4. Merge PR. Phần B (giao bài về nhà, SQL 0007) làm tiếp sau.

### Ghi chú kỹ thuật (cho phiên sau)
- `StudentWork` (`src/components/work/student-work.tsx`) là server component nhận client RLS của người gọi; lọc qua search params, không có state phía trình duyệt. Logic thuần ở `src/lib/learning/work.ts`.
- Câu trả lời con gõ luôn được escape (không qua `texToHtml`); trắc nghiệm lưu số thứ tự → hiện nội dung phương án.
- `RightTriangleAltitude` có sẵn `max-w-xs`: muốn nhỏ hơn thì bọc bằng div có độ rộng (class truyền vào không thắng).

---

## 05/10/2026 — Sửa 3 lỗi trước pilot (nhánh `p1-fixes`)

Từ đợt review PR #2/#3 (phụ huynh đồng ý sửa điểm 1, 2, 4 trước pilot). **Không có SQL mới.**

### Đã làm
1. **Tải lại trang (F5) giữa lượt ôn không còn "xoá" câu sai.** Trước: mỗi lần mở trang là một lượt ôn mới với câu khác, câu sai cũ không bao giờ được tính → lịch ôn có thể không về D+1. Giờ: trang ôn **tiếp tục lượt đang dở** (lượt có câu trả lời nhưng chưa "Lưu kết quả ôn"): câu đã trả lời vẫn tính, không hỏi lại, các câu còn lại giữ nguyên ("Câu 3/6"). Bài mới đến hạn trong lúc đó được nhập vào cùng lượt.
2. **Câu ôn chỉ lấy từ phần luyện tập** (mỗi bài 8 câu), không lấy câu bài kiểm tra nữa — vì lượt ôn hiện lời giải sau mỗi câu, con có thể xem trước đáp án rồi làm lại bài kiểm tra. Máy chủ cũng từ chối chấm câu kiểm tra trong lượt ôn.
3. **Ghi chú có xuống dòng**: ô ghi chú hiện 500/500 nhưng máy chủ báo quá dài (trình duyệt gửi mỗi lần xuống dòng thành 2 ký tự). Giờ máy chủ đếm như ô nhập; ghi chú lưu với xuống dòng chuẩn.
- Phụ: test RLS (`npm run test:db`) chạy được cả trên Windows.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua. `npm test`: **31** test quy tắc/nội dung (thêm 2 cho tiếp tục lượt ôn, 1 cho ghi chú xuống dòng) + **49** test RLS: qua.
- `./e2e/run.sh` (chạy trong container Playwright Linux): **72/72** — thêm: F5 sau câu sai → tiếp ở "Câu 3/6", không câu nào hỏi lại, câu sai vẫn tính (htl-2 vẫn về D+1, đúng 1/3); mọi câu ôn thuộc phần luyện tập; gia sư gõ ghi chú 9 dòng hiện 500/500 → lưu được, DB lưu đúng 500 ký tự, không có `
`.

### Phụ huynh cần làm (khoảng 10 phút)
1. Không có SQL.
2. Thử preview (tài khoản học sinh có bài đến hạn ôn): làm 1 câu sai → bấm F5 → vẫn ở câu tiếp theo, không được làm lại câu sai. Làm hết → kết quả tính cả câu sai đó.
3. Tài khoản gia sư: gõ ghi chú nhiều dòng tới 500/500 → Lưu được.
4. Merge PR.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q12 | Bài kiểm tra làm lại dùng **đúng 5 câu cũ**, và sau khi nộp con đã thấy lời giải → lần làm lại dễ đạt M3 do nhớ đáp án. Có cần thêm bộ câu kiểm tra thứ 2 (đổi số) cho mỗi bài? | Chưa làm — đưa vào S6 (soạn nội dung) |

### Ghi chú kỹ thuật (cho phiên sau)
- `planReview` (rules.ts): lượt "dở" = có câu `mode = review` cho bài đang đến hạn mà chưa có dòng `review_log (run_id, unit_id)`; chọn lượt mới nhất. Bỏ câu của chính lượt đó khi chọn câu còn lại → ra đúng bộ câu ban đầu.
- e2e trên Windows: `./e2e/run.sh` cần Linux; chạy trong `mcr.microsoft.com/playwright:v1.63.0-noble`, **bỏ `.env.local`** (có env thì proxy chuyển hướng vòng lặp), symlink Chromium vào `/opt/pw-browsers/chromium`.
- Còn lại từ review (chưa sửa, ít gặp): điểm 3 (mastery chỉ đọc 5.000 câu trả lời cũ nhất — 2 tuần pilot chưa chạm), điểm 5 (buổi dạy + đề xuất ghi bằng 2 lệnh riêng), bấm Lưu 2 lần tạo 2 buổi trùng.

---

## 03/10/2026 (đêm) — S3 xong: Gia sư "Ghi buổi dạy" (nhánh `p1-slice-3`)

**Nhánh xếp chồng:** PR #2 (`p1-slice-2`) chưa merge nên `p1-slice-3` tách từ `p1-slice-2`; PR mới có base = `p1-slice-2`. Merge PR #2 trước, PR S3 sẽ tự chuyển base về `main` (nếu GitHub không tự chuyển: mở PR → *Edit* → base `main`).

**Quyết định dùng (mặc định, chưa hỏi được):**
- Thiết kế S3 theo P1_PLAN §3 (đã viết sẵn "mặc định, đổi được khi review").
- Q8: chưa đụng — thuộc S4.
- Mới (Q9–Q11 bên dưới): buổi không tick bài nào vẫn lưu được nếu có ghi chú; lùi tối đa 7 ngày; gia sư chỉ thấy buổi của chính mình.
- Nhãn M0–M4 trên form lấy đúng thang trong `PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` §2.

### Đã làm
- **`/tutor`**: danh sách học sinh **đang được gán** (RLS) + ngày buổi ghi gần nhất; nút "Ghi buổi dạy" đã mở.
- **`/tutor/[học sinh]` — form một màn, cho điện thoại**: ngày dạy (mặc định hôm nay, không cho ngày tương lai, lùi tối đa 7 ngày) → tick bài đã dạy (mọi bài, kể cả bài nháp — ghi chú "chưa mở cho học sinh") → **bằng chứng hiện ngay khi tick**: mức hệ thống, số câu đã làm (hoặc "chưa đủ dữ liệu"), bài kiểm tra gần nhất x/y, % đúng 5 câu luyện gần nhất, ngày làm bài cuối → chọn mức đề xuất M0–M4 (**bắt buộc**) → ghi chú ≤ 500 ký tự → "Lưu buổi dạy".
- Thiếu mức → không lưu, báo đúng tên bài thiếu; các lựa chọn đã chọn **được giữ nguyên**. Lưu xong → "✓ Đã lưu lúc HH:MM", form trống lại, danh sách 5 buổi gần nhất cập nhật (đề xuất vs hệ thống).
- **Bảng mới** (migration `0006`): `teaching_sessions` (học sinh, gia sư, ngày dạy, ghi chú), `tutor_proposals` (buổi, bài, mức đề xuất + **ảnh chụp mức hệ thống và số câu lúc đề xuất** — để S4 hiện bằng chứng cho cờ lệch, D8). RLS: phụ huynh đọc mọi buổi của con; gia sư chỉ đọc **buổi của mình** khi còn được gán (D3); học sinh không đọc. Ghi qua server action, kiểm tra lại tài khoản gia sư còn hoạt động + gán còn hiệu lực.

### Đã tự kiểm
- `npm run lint`, `npm run build`: qua.
- `npm test`: **29** test quy tắc/nội dung (thêm 7 test form buổi dạy) + **49** test RLS (thêm 15 cho 2 bảng mới): qua.
- `./e2e/run.sh`: **67/67** — 16 xem trước phụ huynh + 23 luồng học sinh + **28 luồng gia sư mới**: chỉ thấy học sinh được gán; bằng chứng hiện khi tick (M2, 10 câu, kiểm tra 3/5, luyện 80%); thiếu mức bị chặn + giữ lựa chọn; lưu 1 buổi 2 bài = **7 lần chạm** (≤ 10, kể cả 1 lần lưu bị chặn); DB đúng 1 buổi + 2 đề xuất kèm ảnh chụp mức hệ thống; chặn ngày tương lai / quá 7 ngày / buổi trống (kiểm ở máy chủ); buổi chỉ có ghi chú lưu được; hết gán → không lưu được, học sinh biến mất, link form 404; gia sư bị khoá → không lưu được.
- Ảnh chụp điện thoại 390px sáng + tối: `e2e/out/tutor/` (không commit).
- Không có nội dung toán mới → không cần soát toán.

### Phụ huynh cần làm (khoảng 15 phút)
1. Nếu chưa: chạy SQL `0004` → `0005` → merge **PR #2** trước.
2. **Chạy SQL** `supabase/migrations/0006_p1_teaching_sessions.sql` → "Success. No rows returned".
3. Thử preview (cần một tài khoản gia sư được gán cho Nguyên — tạo ở **Tài khoản** nếu chưa có):
   - Đăng nhập gia sư → thấy đúng Nguyên → bấm **Ghi buổi dạy**.
   - Tick 1 bài → thấy bằng chứng ngay; tick bài thứ 2, chỉ chọn mức cho bài 1 → bấm Lưu → bị chặn, nêu tên bài 2.
   - Chọn mức bài 2, gõ ghi chú → Lưu → "Đã lưu lúc …", form trống, buổi hiện ở danh sách dưới.
   - Đổi ngày dạy về hôm qua rồi lưu thử một buổi chỉ có ghi chú.
   - (Tuỳ chọn) Khoá tài khoản gia sư thử → đăng nhập lại không được.
4. **Merge** PR S3 (sau PR #2). Lưu ý: preview dùng database thật — buổi thử sẽ nằm lại trong dữ liệu (chưa có nút xoá; nhờ Claude xoá nếu cần).
5. Sau merge: có thể bắt đầu **pilot** (S7) — tạo tài khoản Nguyên sau khi nói chuyện D18.

### Câu hỏi cho phụ huynh
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q9 | Buổi không tick bài nào (chữa đề ở trường, chủ đề chưa có trong app): cho lưu nếu có ghi chú? | Có |
| Q10 | Ghi trễ tối đa bao nhiêu ngày? | 7 ngày |
| Q11 | Gia sư mới có xem buổi của gia sư cũ? | Không (D3); phụ huynh xem hết |

### Ghi chú kỹ thuật (cho phiên sau)
- Form có thể bị từ chối **không** dùng `<form action>` (React tự reset form sau action → mất lựa chọn). `SessionForm` dùng `onSubmit` + `startTransition(formAction)`, reset bằng `key` khi lưu thành công.
- `loadStudentState(..., { includeDrafts: true })` cho gia sư; học sinh/phụ huynh giữ mặc định (chỉ bài đã duyệt).
- S4 cờ lệch: lấy `tutor_proposals` mới nhất theo `(student_id, unit_id, created_at)` (đã có index); `system_level` là ảnh chụp lúc đề xuất, còn cờ lệch so với mức hệ thống **hiện tại** (§2.7).
- e2e có vai trò `tutor` (`E2E_ROLE=tutor`, `TUTOR_UID`), fake client có `.delete()`; DB giả có thêm học sinh "Đăng An" không gán gia sư.
- Sửa/xoá buổi đã ghi: chưa làm (spec không yêu cầu) — nếu gia sư cần, thêm ở S4/S7.

---

## 03/10/2026 — Quyết định + bổ sung vào PR #2

**Phụ huynh duyệt (03/10, "ok cả 3"):**
- Q5: sau D+21 → **ôn duy trì 60 ngày/lần** đến kỳ thi.
- Q6: tạo tài khoản Nguyên **sau S3**.
- Q7: **bật lịch tự chạy mỗi đêm 23:00**.
- Theo `vibe-code`: đưa spec vào repo (`docs/SPEC.md`, `docs/DESIGN.md`); **pilot sớm**, lùi hình học C1–C3 (S5) sau khi pilot chạy.

**Đã làm (cùng nhánh `p1-slice-2`):**
- `docs/SPEC.md`: bản sao PJ_APP_TOAN (D1–D19, §2.5–2.7, §3, §4, §10) + bảng quyết định trong lúc build. `docs/DESIGN.md`: kiến trúc thực tế, route, bảng dữ liệu, nội dung, chấm điểm, vận hành, kiểm thử, lưu ý. `CLAUDE.md` trỏ tới hai file này.
- Ôn duy trì: migration **0005** (stage 4 = duy trì), quy tắc + test; màn kết quả ôn hiện "Ôn duy trì lần tới".
- `P1_PLAN.md`: thứ tự lát mới (S3 → S4 → pilot → S6 → S5) + tiêu chí nghiệm thu chi tiết cho S3, S4.
- Tự kiểm: lint, build, 22 test quy tắc/nội dung, 36 test RLS, e2e **39/39**.

**Phụ huynh cần làm:** chạy SQL `0004` (nếu chưa) rồi `0005` → merge PR #2.

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
