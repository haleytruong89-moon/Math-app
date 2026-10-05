# Nhật ký tiến độ P1

> Claude đọc file này đầu mỗi phiên để biết làm tiếp từ đâu. Mục mới nhất ở trên cùng.
> Kế hoạch: `docs/P1_PLAN.md`.

## Trạng thái nhanh

| Lát | Nhánh | Trạng thái |
|---|---|---|
| S1 — Nội dung + luồng học 1 KU | `p1-slice-1` | ✅ Merged 02/10 (PR #1), SQL 0003 đã chạy |
| S2 — Mastery + lịch ôn + "Hôm nay cần làm" | `p1-slice-2` | ✅ Merged 03/10 (PR #2), SQL 0004 + 0005 đã chạy |
| S3 — Gia sư "Ghi buổi dạy" | `p1-slice-3` | ✅ Merged 03/10 (PR #3), SQL 0006 đã chạy |
| Sửa lỗi trước pilot · S3b công cụ gia sư + bài về nhà | `p1-fixes`, `p1-tutor-tools`, `p1-homework` | ✅ Merged 05/10 (PR #4, #5, #7) — SQL 0007 |
| Tài khoản: danh sách, đổi tên, xoá | `p1-account-tools` | ✅ Merged 05/10 (PR #9) |
| S4 — Phụ huynh "Tổng quan" | `p1-slice-4` | 🟡 PR #11 — **chờ chạy SQL 0008** rồi merge |
| Docs — Content brief + checklist pilot | `p1-content-brief` | ✅ Merged 05/10 (PR #8) |
| Docs — Student UX handover | `p1-student-ux-handover` | ✖ Đóng (PR #6) — nội dung có trong PR #10 và PR #12 |
| Docs — Lộ trình 50 KU + quyết định LT1–LT12 | `p1-curriculum-design` | 🟡 PR #10 |
| S6a — Bộ lộ trình (curriculum engine), SQL 0009 | `p1-slice-6a` | ⬜ **Tiếp theo**, cần xong 16/10 |
| UX — Giao diện học sinh | `p1-student-ux` | 🟡 PR #12 (xếp chồng trên #11; theme, trang chủ, Hành trình, thẻ phản hồi — spec `docs/superpowers/specs/2026-10-05-student-ux-design.md`); bản đồ nhóm theo track (LT9) làm trong S6a |
| S6b — Câu nhiều bước, hình SVG | `p1-slice-6b` | ⬜ 23/10 |
| S4b — Tiến độ tới mốc 8.5/9.5, mở khoá tay | `p1-slice-4b` | ⬜ sau PR #11, ~06/11 |
| Nội dung đợt 1–10 | `p1-content-N` | ⬜ theo `docs/CURRICULUM.md` H6 |
| S7 — Pilot (tài khoản Nguyên) | — | 🟡 Tài khoản con + gia sư, D18, sao lưu xong 05/10; học chính thức từ **12/10/2026** |
| S5 — Hình học C1–C3 | — | ⬜ xét lại trước GĐ3 (01/2027) |

### Câu hỏi đang mở
| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| Q8 | "Buổi dạy chưa ghi > 24h" cần lịch dạy: phụ huynh nhập ngày dạy trong tuần khi gán gia sư (ví dụ T3, T5)? | Có — làm trong S4 |
| Q9 | Buổi dạy không tick bài nào (ví dụ chữa đề ở trường, chủ đề chưa có trong app): cho lưu nếu có ghi chú? | Có — đang làm vậy |
| Q10 | Gia sư được ghi buổi dạy trễ tối đa bao nhiêu ngày? | 7 ngày (theo P1_PLAN) |
| Q11 | Gia sư mới có nên xem buổi dạy của gia sư cũ (để nối tiếp)? | Không — tách biệt theo D3; phụ huynh xem được hết |
| Q12 | Ngày thi chính thức 2027 | Tạm đầu tháng 6/2027; mốc học xong 31/03 không phụ thuộc |

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
