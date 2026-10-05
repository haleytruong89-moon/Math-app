# P1 — Module Hệ thức lượng: kế hoạch build

> Nguồn sự thật về sản phẩm: `claude/PJ_APP_TOAN.md` (D1–D19, §2.5–2.7, §3). File này chỉ chia việc.
> Trạng thái từng lát và câu hỏi đang chờ: `docs/PROGRESS.md`.
> Tạo 02/10/2026. Các số ở §2 **phụ huynh đã duyệt 02/10/2026** (dùng cho pilot, chỉnh theo dữ liệu thật sau).

## 1. Cách làm việc (áp dụng cho mọi lát)

| Quy tắc | Chi tiết |
|---|---|
| Nhánh | Mỗi lát một nhánh `p1-slice-N` tách từ `main`. Không bao giờ push thẳng `main`. |
| Xong một lát nghĩa là | `npm run lint` + `npm test` + `npm run build` + `./e2e/run.sh` đều qua (e2e: trình duyệt thật + PGlite, không cần Supabase); tiêu chí nghiệm thu của lát đã tự kiểm; `docs/PROGRESS.md` có báo cáo. |
| Báo cáo | Mỗi lát thêm 1 mục vào `PROGRESS.md`: đã làm gì, cách thử trên preview (checklist), SQL cần chạy, câu hỏi cho phụ huynh. |
| Migration | File mới `supabase/migrations/000N_*.sql`, chỉ **thêm** (không xoá/đổi tên cột có dữ liệu), có GRANT cho `service_role`, RLS bật, có test PGlite. Phụ huynh tự chạy SQL trên Supabase **trước khi merge**. |
| Nội dung toán | Claude soạn ở trạng thái `draft`. Học sinh chỉ thấy KU `approved`. Đổi sang `approved` chỉ khi phụ huynh nói "duyệt KU …" (D16). |
| Kiểm tra toán (Q10, 05/10) | Trước khi đưa phụ huynh duyệt, mỗi KU nháp qua: (1) agent thứ hai giải lại mọi câu **không xem đáp án**, so với đáp án trong file; (2) script tính lại đáp số dạng số; (3) mọi lệch → sửa hoặc ghi vào báo cáo. Đợt có C, E, G: gửi thêm gia sư soát. Kết quả kiểm tra ghi trong PROGRESS.md cùng đợt. |
| Điều kiện dừng | Gặp chỗ spec không nói rõ và đoán sai thì tốn công sửa → ghi câu hỏi vào `PROGRESS.md`, làm việc khác không phụ thuộc. Không tự đổi D1–D19. |
| Không làm | Không merge, không chạy SQL lên Supabase thật, không dùng khoá bí mật, không thêm streak/xếp hạng (D17), không bật AI (P2). |

## 2. Quy tắc học & mastery (theo D14, D15, §3.5–3.7)

✅ = đã duyệt 02/10/2026 (đúng §10 PJ_APP_TOAN "chốt khi soạn module 1"). Code: `src/lib/learning/rules.ts` (`RULES`).

**Trình tự trong 1 KU (§3.5):** lời giải mẫu (bắt buộc xem hết từng bước) → lời giải khuyết bước (điền) → luyện tập L1 → L2 → exit test (không AI, không xem đáp án đến khi nộp).

**Mức hệ thống tính (D15: trung bình các lần gần nhất + số lần làm):**

| Mức | Điều kiện ✅ |
|---|---|
| M0 | Chưa xem lời giải mẫu |
| M1 | Đã xem lời giải mẫu, chưa đủ M2 |
| M2 | Tỉ lệ đúng của **5 câu luyện tập gần nhất ≥ 60%** (chỉ tính lần trả lời đầu tiên của mỗi câu trong ngày) |
| M3 | Exit test gần nhất **≥ 80%** và không lặp cùng một mã lỗi ≥ 2 lần trong exit test đó |
| M4 | Đang M3 và **qua lượt ôn D+21** |
| Độ chắc chắn | Hiển thị số lần làm; **< 5 câu đã làm → nhãn "chưa đủ dữ liệu"** |
| KU hình học | Tối đa M3 cho đến khi có bài C5 gia sư xác nhận (C5 thuộc P3) |

**Lịch ôn (D14):** đạt M3 → lượt ôn D+1, rồi D+7, rồi D+21.
- Một lượt ôn của một bài = 3 câu; đạt khi đúng ≥ 2/3.
- Ôn sai (< 2/3 câu đúng) → quay về D+1, mức hệ thống không hạ ngay (chỉ hạ nếu exit/mastery sau đó < 80%). ✅
- Ôn đúng **và** học sinh tự chọn "dễ" → khoảng tiếp theo ×1,5 (D+7 → D+11, D+21 → D+32). ✅
- Phiên ôn trộn câu nhiều KU, không 2 câu liên tiếp cùng KU (khi có ≥ 2 KU đến hạn); chọn câu lâu chưa làm nhất.
- Qua D+21 → M4 và chuyển sang **ôn duy trì 60 ngày/lần** đến kỳ thi (dễ → 90 ngày); ôn duy trì sai → về D+1, mất M4 đến khi qua D+21 lại (Q5, duyệt 03/10/2026).
- Log đủ (đúng/sai, thời gian, dễ/khó) để chuyển FSRS sau.

**Mục tiêu tuần (D17):** **4 buổi học/tuần** ✅, tuần tính từ thứ Hai (giờ Việt Nam); không streak. Một "buổi" = một ngày có nộp bài kiểm tra, hoặc xong lượt ôn, hoặc ≥ 5 câu luyện tập.

**Cờ lệch (D8):** |mức gia sư đề xuất − mức hệ thống| ≥ 1 → cờ ⚠️ cho phụ huynh; mức phụ huynh chốt là nguồn cuối.

## 3. Các lát cắt

Thứ tự **chốt lại 05/10/2026** (review kiến trúc lộ trình, Q1–Q12 trong `docs/SPEC.md` §0): pilot bắt đầu **thứ Hai 12/10/2026**
với htl-1/2 trên app + F1 với gia sư trên giấy; các lát dưới đây chạy **song song** với pilot. Học xong 50 KU trước **31/03/2027**
(`docs/CURRICULUM.md` §3). Thay thế thứ tự 03/10 ("pilot sau S3").

| # | Lát | Nội dung | Trạng thái | Cần xong |
|---|---|---|---|---|
| 1 | **S1** | Nội dung JSON + kiểm tra; KaTeX; xem trước nội dung (D16); luồng học 1 KU; `unit_progress`, `attempts` | ✅ merged | — |
| 2 | **S2** | Mastery hệ thống; lịch ôn D+1/7/21 + duy trì 60 ngày; phiên ôn trộn; "Hôm nay cần làm"; mục tiêu tuần; bản đồ tiến độ | 🟡 PR #2 | trước 12/10 |
| 3 | **S6a** | Bộ lộ trình: `curriculum.json`, mở khoá, gợi ý 2 track, kiểm tra vượt, giới hạn ôn 5 bài, bản đồ nhóm theo track, migration 0006 | ⬜ **tiếp theo** | 16/10 (để đợt 1 lên app tuần 2) |
| 4 | **UX** | Giao diện học sinh theo `docs/HANDOVER_STUDENT_UX.md` (bản đồ dùng cấu trúc nhóm của S6a) | ⬜ | 18/10 |
| 5 | **S6b** | Câu nhiều bước `steps`, hình SVG, nhãn "cần gia sư xác nhận" | ⬜ | 23/10 (để đợt 2 lên app tuần 3) |
| 6 | **S3** | Gia sư "Ghi buổi dạy" (danh sách KU nhóm theo module + ô tìm) | ⬜ | 30/10 |
| 7 | **S4** | Phụ huynh "Tổng quan" + tiến độ tới mốc 8.5 / 9.5 + mở khoá tay | ⬜ | 13/11 |
| 8 | **C1…C10** | Soạn nội dung 10 đợt theo `docs/CURRICULUM.md` H6 (nháp + kiểm tra độc lập) | ⬜ | theo bảng H6 |
| 9 | **S5** | Hình học C1 kéo hình, C2 sắp xếp bước, C3 hai cột | ⬜ sau S4; xét lại trước GĐ3 (01/2027) | — |

### S6a — Bộ lộ trình (curriculum engine)

**Mục tiêu:** app đi theo lộ trình 50 KU thay vì thứ tự file. Chỉ làm phần cần để đợt 1 lên app tuần 2.

| Phần | Thiết kế |
|---|---|
| `content/curriculum.json` (Q1) | `{ start, learnBy, units: [{ id, module, track: "A"\|"B"\|"C", seq, prereq: [], examWeight: number\|"indirect", grading: "full"\|"scaffolded"\|"partial"\|"tutor", testOut: bool, batch: 1–10 }] }`. H+Q thuộc track A. Đủ 50 KU kể cả KU chưa có file. |
| Kiểm tra (`npm test`) | 50 id duy nhất, khớp bảng trong CURRICULUM.md; `seq` duy nhất; tiên quyết tồn tại, không vòng, có `seq` nhỏ hơn; module tồn tại; mọi file KU có trong curriculum; `testOut` chỉ cho track B hoặc module `backfill-*`. |
| Schema | `estMinutes` ≤ 90; `module.json`: `domains: string[]` nhận `A–Q`, `F0–F3` (giữ đọc được `domain` cũ). |
| Registry | Script `npm run content:index` sinh `src/lib/content/registry.generated.ts` (import tĩnh mọi JSON); test báo lỗi nếu file sinh ra cũ. Bỏ sửa tay `index.ts`. |
| Mở khoá (Q2) | `src/lib/learning/sequence.ts` (hàm thuần, unit test): KU mở khi mọi tiên quyết ≥ M3, hoặc có dòng mở tay. KU chưa `approved` hoặc chưa có file → "Sắp có". |
| Gợi ý bài mới (Q3) | `suggestNew(state)`: KU đã mở, chưa bắt đầu, `seq` nhỏ nhất của track A + của track B/C (B trước C). Không gợi ý khi đã có **2 KU đang học** (đã xem lời giải mẫu, < M3, chưa vào lịch ôn). Con chọn 1 trong 2. |
| Kiểm tra vượt (Q4) | Nút "Làm bài kiểm tra luôn" trên thẻ gợi ý khi `testOut` và chưa thử. Một lần/KU. Đạt (≥ 80%, không lặp mã lỗi) → M3 + lịch ôn D+1 dù chưa xem lời giải mẫu. Chưa đạt → học bình thường; lượt này **không tính** vào mastery. `rules.ts`: M1+ khi xem lời giải mẫu **hoặc** qua kiểm tra vượt; `lastExitRun` bỏ qua lượt vượt không đạt. |
| Giới hạn ôn (Q8) | `RULES.maxUnitsPerReview = 5`; phiên ôn lấy 5 bài quá hạn lâu nhất; số quá hạn cho phụ huynh vẫn đếm tất cả. |
| Bản đồ tiến độ (Q9) | Nhóm track → module; module đang học mở sẵn, module khác 1 dòng + thanh tiến độ (`<details>`). KU "Sắp có" hiện mờ. Kiểu nút cây 🌱🌿🌳⭐ làm ở lát UX. |
| Phụ huynh | `/parent/content` nhóm theo đợt (batch) + trạng thái Nháp/Đã duyệt/Chưa soạn; trong trang 1 KU: nút **"Mở khoá cho con"** khi KU đang khoá. |
| Migration **0006** | `unit_unlocks (student_id, unit_id, unlocked_by, unlocked_at)` + `unit_progress.testout_run uuid`, `testout_at timestamptz`. Chỉ thêm; RLS đọc như bảng học khác; ghi qua server action (mở tay: chỉ phụ huynh). GRANT `service_role`. Test PGlite. |

**Nghiệm thu S6a:**
- `npm test` bắt được: thiếu KU, tiên quyết sai/vòng, file KU không có trong curriculum, registry cũ.
- e2e: học sinh mới chỉ thấy 2 gợi ý (f1-hdt + a-tanso khi cả hai đã duyệt); xong f1-hdt đến M3 → f1-pnt mở; đang học 2 bài → không còn gợi ý mới.
- e2e: kiểm tra vượt a-tanso đạt → M3 + lịch ôn; không đạt → vào luồng học, mastery không đổi; không thử lần 2 được.
- e2e: 7 bài đến hạn → phiên ôn chỉ có 5 bài; ngày hôm sau còn 2.
- e2e: phụ huynh mở khoá tay f1-pnt → học sinh thấy f1-pnt trong gợi ý.
- Bản đồ 50 KU trên điện thoại 390px không cuộn quá 2 màn khi chỉ 1 module mở.

### S6b — Loại câu nhiều bước, hình SVG, nhãn gia sư

| Phần | Thiết kế |
|---|---|
| Item `steps` (Q5) | `{ id, type: "steps", level, prompt (đề chung), steps: [{ prompt, item: mcq\|numeric }] (2–5), solution }`. Id bước = `<item id>-s<n>`. |
| Chấm | Luyện tập: làm từng bước, sai bước nào hiện gợi ý / mã lỗi bước đó rồi làm tiếp. Kiểm tra: nộp cả chuỗi, không phản hồi đến khi nộp. Ghi **1 dòng `attempts`**: `correct` = đúng hết, `error_code` = bước sai đầu tiên, `answer` = các đáp án nối bằng `|` (≤ 200 ký tự). Không đổi DB. |
| Ôn tập | Câu `steps` là một câu trong pool; phiên ôn lấy nguyên chuỗi. |
| Hình (Q7) | `figure` ở unit hoặc từng câu: `{ svg, alt }` (giữ enum cũ). Test: chỉ cho phép thẻ `svg g path line polyline polygon circle ellipse rect text tspan defs marker title`, không `script`, `on*`, `href` ngoài, `style` có `url(`; màu chỉ `currentColor` hoặc `var(--…)`; viewBox bắt buộc; ≤ 20 KB. Render server-side. |
| Nhãn gia sư (Q6) | KU `grading` partial/tutor: nhãn "Cần gia sư xác nhận" trên thẻ học, bản đồ, trang phụ huynh. Mức hệ thống không đổi cách tính; mức cuối do S3 + S4. |

**Nghiệm thu S6b:** schema + test cho `steps` và SVG (có test SVG độc hại bị từ chối); e2e luyện 1 câu 4 bước sai bước 2 → gợi ý đúng bước, cuối câu tính sai với mã lỗi bước 2; kiểm tra có câu `steps` chấm đúng; hình hiển thị đúng ở theme sáng/tối.

### Lịch song song tuần đầu

| Tuần | Nguyên | Claude | Phụ huynh |
|---|---|---|---|
| 0 (05–11/10) | — | S6a; soạn đợt 1 (f1-hdt, f1-pnt, a-tanso, b-phepthu) + kiểm tra độc lập | Chạy SQL 0004 + 0005, merge PR #2 + PR docs; nói chuyện D18; tạo tài khoản Nguyên |
| 1 (12–18/10) | htl-1/2 trên app; F1 với gia sư | UX; S6b; soạn đợt 2 | Chạy SQL 0006, merge S6a; duyệt đợt 1 trước 18/10 |
| 2 (19–25/10) | Đợt 1 trên app (kiểm tra vượt a-tanso, b-phepthu nếu đã biết) | S3; soạn đợt 3 | Merge UX, S6b; duyệt đợt 2 trước 25/10 |
| 3 (26/10–01/11) | Đợt 2 (f1-tgon, f1-qd có câu nhiều bước) | S4; soạn đợt 4 | Merge S3; gia sư bắt đầu ghi buổi dạy |

### S1 — tiêu chí nghiệm thu
- `npm test` kiểm tra mọi file nội dung: đúng schema, mỗi câu có đáp án + lời giải, ID không trùng, câu trắc nghiệm có đúng 1 đáp án đúng, mã lỗi thuộc E01–E15.
- Phụ huynh mở `/parent/content` → thấy danh sách KU kèm trạng thái Nháp/Đã duyệt; mở 1 KU → **xem như bài thật**, bấm thử được toàn bộ luồng mà không ghi dữ liệu.
- Học sinh chỉ thấy KU đã duyệt; KU mới → phải xem hết lời giải mẫu mới mở phần tự giải (§2.7).
- Đáp số chấp nhận dạng tương đương (`12/5` = `2,4`; `2√3` = `√12`), **không** nhận số làm tròn (`3,46` ≠ `2√3`).
- Exit test: không gợi ý/đáp án đến khi nộp; mọi lần làm ghi vào `attempts` với RLS đúng vai trò.

### S3 — Gia sư "Ghi buổi dạy" (§2.7, mockup gia sư)
Thiết kế mặc định (đổi được khi review):
- `/tutor`: danh sách học sinh **đang được gán** cho gia sư này (RLS). Bấm một học sinh → form ghi buổi dạy.
- Form một màn, tối ưu điện thoại: ngày dạy (mặc định hôm nay, không cho ngày tương lai, tối đa lùi 7 ngày) → tick KU đã dạy (mọi KU trong nội dung, kể cả bài nháp, vì gia sư dạy theo chương trình trường) → mỗi KU đã tick hiện **bằng chứng ngay**: mức hệ thống, số câu đã làm, bài kiểm tra gần nhất x/y, tỉ lệ 5 câu luyện gần nhất → chọn mức đề xuất M0–M4 (**bắt buộc**) → ghi chú (tuỳ chọn, ≤ 500 ký tự) → "Lưu buổi dạy".
- Thiếu mức cho KU đã tick → không lưu, báo rõ KU nào. Lưu xong → "Đã lưu lúc HH:MM", form trống lại; danh sách 5 buổi gần nhất **của chính gia sư này**.
- Bảng mới: `teaching_sessions` (học sinh, gia sư, ngày dạy, ghi chú) và `tutor_proposals` (buổi dạy, KU, mức 0–4). RLS: gia sư đọc **buổi của mình** (lịch sử gia sư cũ tách biệt, D3); phụ huynh đọc mọi buổi của con; học sinh không đọc. Ghi qua server action, yêu cầu gán **đang hoạt động**.
- Nghiệm thu thêm: gia sư bị khoá hoặc hết gán → không ghi được; e2e đo thao tác ghi 1 buổi 2 KU ≤ 10 lần chạm.
- Bổ sung 05/10: danh sách 50 KU **nhóm theo module + ô tìm**; KU có nhãn "cần gia sư xác nhận" (Q6) đứng đầu nhóm; đề xuất mức của gia sư cho các KU này là bằng chứng chính cho phần chứng minh trên giấy.

### S4 — Phụ huynh "Tổng quan" (§2.7, mockup phụ huynh)
- 3 con số đầu trang (render lần đầu): KU đạt M3+/tổng KU đã duyệt · lượt ôn quá hạn · cờ lệch chưa chốt.
- Cờ lệch: đề xuất **mới nhất** của gia sư cho một KU lệch ≥ 1 bậc so với mức hệ thống, và chưa có mức phụ huynh chốt mới hơn đề xuất đó → "Cần chú ý" hiện cả hai mức + bằng chứng + nút "Xem & chốt mức". Chốt → bảng `parent_confirmations` (học sinh, KU, mức, lúc chốt); cờ biến mất.
- Mức hiển thị cuối cùng của KU = phụ huynh chốt (nếu mới hơn mọi thay đổi khác) ?? mức hệ thống; ô "chưa đủ dữ liệu" khi < 5 câu (D15).
- Bảng màu theo domain/KU; tóm tắt tuần (số buổi học, bài kiểm tra, lượt ôn).
- Bổ sung 05/10: **tiến độ tới mốc** gate 8.5 (20 KU, hạn ~21/02/2027) và gate 9.5 (50 KU, hạn 31/03/2027) theo `docs/CURRICULUM.md` §4; KU trễ so với lịch §3.3 tô vàng; mở khoá tay cũng có ở đây.
- **Buổi dạy chưa ghi > 24h:** cần biết lịch dạy → mặc định thêm "ngày dạy trong tuần" vào phần gán gia sư (phụ huynh chọn, ví dụ T3, T5); ngày có lịch mà quá 24h chưa có buổi ghi → nhắc. *(Câu hỏi Q8 trong PROGRESS.)*

### S5
Chi tiết hoá khi bắt đầu lát, lấy từ §2.7 và §3.4 của `docs/SPEC.md`.

## 4. Việc phụ huynh cần làm (gom lại)

| Khi nào | Việc |
|---|---|
| Một lần | GitHub → Settings → Actions → General → Workflow permissions → tick **"Allow GitHub Actions to create and approve pull requests"** (để tự mở PR) |
| Một lần | Thêm secret `SUPABASE_DB_URL` (backup hằng tuần) |
| Mỗi lát | Chạy SQL mới (nếu có) → thử preview theo checklist → Merge |
| Khi có nội dung mới | Đọc KU nháp ở `/parent/content` → nói "duyệt KU …" hoặc ghi chỗ sai |
| Trước pilot | Nói chuyện với Nguyên (D18) → tạo tài khoản học sinh |
