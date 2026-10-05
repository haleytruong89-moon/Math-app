# Giao diện học sinh mới (thiết kế)

> Duyệt qua chat 05/10/2026 ("đúng rồi"). Nguồn: mockup `https://claude.ai/artifact/LNFSgD23tfTxRb3Yi7vWbJ`
> (StudentHome, ProgressMap, QuestionFeedback) và handover `docs/HANDOVER_STUDENT_UX.md` (nhánh
> `p1-student-ux-handover`, PR #6 — gộp vào PR này rồi đóng). Spec này **thay** handover ở các điểm ghi dưới.
> Nhánh đặt trên S4 (`p1-slice-4`, PR #11). Không có SQL.

## Quyết định đã chốt (05/10/2026)

| # | Quyết định |
|---|---|
| U1 | **Không có "Thử lại"** sau khi chấm luyện tập/ôn: chỉ "Câu tiếp". Phần điền bước vẫn thử lại như cũ. |
| U2 | Đếm trong phiên: **"Đúng x/y câu lượt này"** — tổng, không đếm liên tiếp (D17). Chỉ ở trình duyệt, không lưu. |
| U3 | M0 = **🌰 "Chưa bắt đầu"** (không dùng 🔒 — bài đã mở, chỉ chưa xem lời giải mẫu). |
| U4 | Header teal có lời chào **chỉ ở trang chủ học sinh**, cuộn theo trang; trang học/ôn giữ thanh mỏng. |
| U5 | Tên mã lỗi E01–E15: **phụ huynh cung cấp** từ master plan → `src/lib/content/errors.ts`. Mã chưa có tên → chỉ hiện mã. |
| U6 | Gợi ý lên mức theo **đúng quy tắc** (không "thêm n câu đúng là lên M3"). |
| U7 | So sánh chỉ **"Con trả lời" / "Đáp án đúng"** (app chỉ thu đáp số cuối, không có các bước). |
| U8 | Theo mockup: vòng mục tiêu tuần nằm **trong header**; bản đồ là **trang riêng** "Hành trình của con". |

## 1. Theme (chỉ trang học sinh)
- `src/app/student/layout.tsx` bọc **toàn bộ** (thanh trên + `main`) trong `<div class="student-theme min-h-dvh bg-bg">` để nền kem phủ cả trang (nền `body` vẫn là token cũ).
- `globals.css`: khối `.student-theme` đè token (sáng): `--bg #FFF8F0`, `--surface #fff`, `--ink #1E293B`, `--muted #64748B`, `--border #F1E8DD`, `--accent #0D9488`, `--accent-soft #CCFBF1`, `--on-accent #fff`, `--good #059669`, `--good-soft #D1FAE5`, `--warn #B45309`, `--warn-soft #FEF3C7`, `--m0 #D1D5DB`, `--m1 #C4B5FD`, `--m2 #93C5FD`, `--m3 #5EEAD4`, `--m4 #FCD34D`.
  (`--warn` dùng amber-700 thay amber-600 của handover để chữ trên nền sáng đạt 4,5:1.)
- **Tối** (cùng cách với token gốc: `@media (prefers-color-scheme: dark)` với `:root:not([data-theme="light"]) .student-theme` và `:root[data-theme="dark"] .student-theme`): `--bg #1A1613`, `--surface #241F1B`, `--ink #F3EDE6`, `--muted #B8ADA2`, `--border #3A322B`, `--accent #2DD4BF`, `--accent-soft #12332F`, `--on-accent #0B1A18`, `--good #34D399`, `--good-soft #10291F`, `--warn #FBBF24`, `--warn-soft #33270F`, `--m0 #4B4540`, `--m1 #7C6BC4`, `--m2 #4F7FC0`, `--m3 #2A9D90`, `--m4 #C9A227`.
- Font giữ nguyên (Libre Franklin giao diện, Source Serif 4 tiêu đề/lời chào, IBM Plex Mono số).
- Bảng emoji/màu nút theo mức: `src/components/student/mastery.ts` — `MASTERY = [{emoji:"🌰",label:"Chưa bắt đầu"},{🌱,"Mới bắt đầu"},{🌿,"Đang tiến"},{🌳,"Đạt"},{⭐,"Đã vững"}]` + gradient/viền từ handover §3.3.

## 2. Trang chủ `/student`
- **Header** (gradient `#0D9488 → #0F766E`, chữ trắng): "Chào buổi sáng/chiều/tối" (giờ VN: < 11h sáng, < 18h chiều, còn lại tối) · tên (Source Serif 4) · ngày · khung mờ chứa **vòng mục tiêu tuần** (SVG r=22, nét 5, nền `rgba(255,255,255,.2)`, tiến độ `#FCD34D`, chữ "3/4" giữa) + "Mục tiêu tuần này" + "Thêm n buổi nữa là đạt!" / "Đã đạt mục tiêu tuần!". Vòng giữ `role="progressbar"`, `aria-valuenow`, `aria-label="Mục tiêu tuần"`, và chữ "x/4 buổi" (đọc được).
- **Danh sách** theo nhóm có nhãn: Ôn lại (vàng) → Bài về nhà → Đang học → Bài mới (xanh). Logic chọn bài **giữ nguyên** (`dueReviews`, đang học, bài mới kế tiếp, bài về nhà). Thẻ: ô 40px gradient theo mức + tên + dòng phụ + emoji & "M{n}" bên phải + nút teal rộng hết thẻ (chữ giữ: "Bắt đầu ôn", "Học tiếp", "Học bài mới").
- **Dải hành trình** cuối trang: 🌱 — thanh gradient `#34D399 → #0D9488` (tỉ lệ M3+/tổng) — ⭐ · "x/y bài đạt M3+" · "Xem hành trình →" (`/student/journey`).
- Bản đồ 2 cột cũ bỏ khỏi trang chủ (chuyển sang trang Hành trình).

## 3. Trang `/student/journey` "Hành trình của con"
- Thanh: ← (về `/student`) · "Hành trình của con" · tên module (nhiều module → mỗi module một đoạn có tiêu đề).
- Dải tóm tắt 3 ô: **Đã vững** (mức hiển thị 3–4) · **Đang học** (1–2) · **Chưa bắt đầu** (0).
- Đường dọc: nút 64px (emoji 28px, gradient + viền theo mức, M0: nền xám, viền đứt, mờ) · tên bài · chip "M{n} — {nhãn}" · dòng trạng thái:
  M0 "Chưa bắt đầu" · M1 "Mới bắt đầu" (+ "Chưa đủ dữ liệu (n câu)" khi < 5) · M2 thanh + "x/5 đúng" (5 câu luyện gần nhất) ·
  M3 lượt ôn kế: "Ôn D+1/D+7/D+21 · {hạn}" (quá hạn: "Đến hạn ôn") · M4 "Ôn duy trì · {hạn}" · thêm "bố mẹ chốt" khi mức hiển thị là mức chốt (S4).
  Nối giữa nút: đường 3px gradient giữa màu hai mức; vào nút M0: nét đứt.
- Bấm một bài → `/student/learn/[id]`. Mức hiển thị dùng `displayLevel` của S4.

## 4. Thẻ phản hồi sau khi chấm (`QuestionFeedback`)
Áp cho **luyện tập** (`LessonPlayer`, chặng practice) và **ôn lại** (`ReviewPlayer`). Phần điền bước và bài kiểm tra giữ luồng cũ (chỉ đổi màu theo token).

**Đúng:** thẻ gradient `#D1FAE5 → #A7F3D0`, 🎉 48px, "Chính xác!" (Source Serif 4), một câu khen chung xoay vòng (vd "Giỏi lắm!", "Làm tốt lắm!", "Chuẩn rồi!"), chip "✅ Đúng x/y câu lượt này" · khối "Lời giải" · **gợi ý lên mức** (chỉ luyện tập, U6) · nút "Câu tiếp theo →".

**Sai:** thẻ gradient `#FEF3C7 → #FDE68A`, 💡 40px, "Gần đúng rồi!" nếu đáp án trùng lỗi đã soạn (có lời nhắc), ngược lại "Chưa đúng" · lời nhắc của câu · chip "E04 — {tên}" (U5) · 2 ô: "Con trả lời" (đỏ nhạt) / "Đáp án đúng" (xanh nhạt) · lời giải · luyện tập: "Câu này sẽ quay lại cuối bài" · **chỉ** nút "Câu tiếp →" (U1). Ôn lại hiện y như vậy (không có dòng quay lại).

**Gợi ý lên mức** (thuần, `masteryNudge(mastery)`), sau câu trả lời luyện tập:
- M0/M1, chưa đủ 5 câu luyện đầu: "Làm thêm {5 − n} câu luyện để hệ thống đánh giá lên M2" + thanh n/5.
- M1, đủ 5 câu nhưng < 60%: "Cần đúng thêm {3 − đúng} câu trong 5 câu gần nhất để lên M2" + thanh đúng/5.
- M2: "Làm bài kiểm tra cuối để lên M3". M3: "Qua lượt ôn D+21 để lên M4". M4: "Đã vững — giữ phong độ khi ôn nhé".

**Server** (`checkAnswer`, `checkReview`) trả thêm: `answerHtml` (câu trả lời đã escape / phương án trắc nghiệm), `correctHtml`, `errorCode`, và (luyện tập, học sinh thật) `mastery: { level, practiceRate, practiceCount }` tính lại sau khi lưu. Phần điền bước: `correctHtml` chỉ khi đúng hoặc đã xin xem lời giải (giữ quy tắc cũ). Phụ huynh xem trước: không ghi gì, `mastery` bỏ trống. Không đổi DB.

## 5. Không đổi
Cách chấm, quy tắc mức, lịch ôn, thứ tự "Hôm nay cần làm", bài kiểm tra, màn đồng ý D18, giao diện phụ huynh/gia sư, nội dung JSON. Không streak/xếp hạng (D17).

## 6. Kiểm tra
- Unit: `masteryNudge` (mọi mức + ranh giới 5 câu/60%), lời chào theo giờ VN, `errorLabel` (có tên / chỉ mã), câu khen xoay vòng xác định được.
- e2e (sửa `student-flow.mjs`): vòng mục tiêu vẫn đọc được; nhãn nhóm; dải hành trình → `/student/journey` (tóm tắt 3 ô, emoji theo mức, "bố mẹ chốt"); luyện tập đúng → "Chính xác!", chip "Đúng 1/1 câu lượt này", gợi ý M2; sai → "Con trả lời"/"Đáp án đúng", "Câu này sẽ quay lại cuối bài", **không** có nút "Thử lại"; ôn lại dùng thẻ mới. Chụp sáng + tối (390px).
- Xem trước của phụ huynh (`preview-flow.mjs`) vẫn qua (cùng `LessonPlayer`).

## 7. Tài liệu
`docs/SPEC.md` §0: U1–U8 (thay 2 dòng 05/10 của nhánh handover); `docs/DESIGN.md` §9 student theme (lấy từ handover, sửa theo spec này) + route `/student/journey`; `docs/HANDOVER_STUDENT_UX.md` đưa vào repo kèm dòng đầu "đã thay bằng spec 2026-10-05-student-ux-design"; `docs/PROGRESS.md` báo cáo.
