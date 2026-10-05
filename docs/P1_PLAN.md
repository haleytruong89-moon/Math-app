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
| Kiểm tra toán (LT10, 05/10) | Trước khi đưa phụ huynh duyệt, mỗi KU nháp qua: (1) agent thứ hai giải lại mọi câu **không xem đáp án**, so với đáp án trong file; (2) script tính lại đáp số dạng số; (3) mọi lệch → sửa hoặc ghi vào báo cáo. Đợt có C, E, G: gửi thêm gia sư soát. Kết quả kiểm tra ghi trong PROGRESS.md cùng đợt. |
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

Thứ tự **chốt lại 05/10/2026** (review kiến trúc lộ trình, LT1–LT12 trong `docs/SPEC.md` §0): pilot bắt đầu **thứ Hai 12/10/2026**
với htl-1/2 trên app + F1 với gia sư trên giấy; các lát còn lại chạy **song song** với pilot. Học xong 50 KU trước **31/03/2027**
(`docs/CURRICULUM.md` §3). S3 và công cụ gia sư đã merge, S4 đang ở PR #11.

| # | Lát | Nội dung | Trạng thái | Cần xong |
|---|---|---|---|---|
| 1 | **S1** | Nội dung JSON + kiểm tra; KaTeX; xem trước nội dung (D16); luồng học 1 KU; `unit_progress`, `attempts` | ✅ merged | — |
| 2 | **S2** | Mastery hệ thống; lịch ôn D+1/7/21 + duy trì 60 ngày; phiên ôn trộn; "Hôm nay cần làm"; mục tiêu tuần; bản đồ tiến độ | ✅ merged (PR #2) | — |
| 3 | **S3** | Gia sư "Ghi buổi dạy" | ✅ merged (PR #3) | — |
| 3b | **S3b** | Công cụ gia sư: "Bài làm của con" + giao bài về nhà qua link Drive (SQL 0007) | ✅ merged (PR #4, #5, #7) | — |
| 4 | **S4** | Phụ huynh "Tổng quan" (SQL 0008) | 🟡 PR #11, xếp chồng trên PR #9 | trước 12/10 |
| 5 | **S6a** | Bộ lộ trình: `curriculum.json`, mở khoá, gợi ý 2 track, kiểm tra vượt, giới hạn ôn 5 bài, bản đồ nhóm theo track, danh sách KU nhóm theo module cho gia sư, **migration 0009** | ⬜ **tiếp theo** | 16/10 (để đợt 1 lên app tuần 2) |
| 6 | **UX** | Giao diện học sinh — đã làm ở PR #12 (spec `docs/superpowers/specs/2026-10-05-student-ux-design.md`, thay handover); bản đồ nhóm theo track (LT9) làm trong S6a | 🟡 PR #12 | 18/10 |
| 7 | **S6b** | Câu nhiều bước `steps`, hình SVG, nhãn "cần gia sư xác nhận" | ⬜ | 23/10 (để đợt 2 lên app tuần 3) |
| 8 | **S4b** | Bổ sung Tổng quan: tiến độ tới mốc 8.5 / 9.5, KU trễ lịch, nút mở khoá tay | ⬜ sau khi PR #11 merge | 06/11 |
| 9 | **S7** | Pilot: tài khoản Nguyên (sau D18), checklist pilot (PR #8) | ⬜ phụ huynh | **12/10** |
| 10 | **C1…C10** | Soạn nội dung 10 đợt theo `docs/CURRICULUM.md` H6 (nháp + kiểm tra độc lập) | ⬜ | theo bảng H6 |
| 11 | **S5** | Hình học C1 kéo hình, C2 sắp xếp bước, C3 hai cột | ⬜ xét lại trước GĐ3 (01/2027) | — |

### S6a — Bộ lộ trình (curriculum engine)

**Mục tiêu:** app đi theo lộ trình 50 KU thay vì thứ tự file. Chỉ làm phần cần để đợt 1 lên app tuần 2.

| Phần | Thiết kế |
|---|---|
| `content/curriculum.json` (LT1) | `{ start: "2026-10-12", learnBy: "2027-03-31", modules: [{ id, title, domains }], units: [{ id, module, title, track: "A"\|"B"\|"C", seq, prereq: [], examWeight: number\|"indirect", grading: "full"\|"scaffolded"\|"partial"\|"tutor", testOut: bool, batch: 0–10 }] }`. H+Q thuộc track A. Đủ 50 KU kể cả KU chưa có file; `title` dùng cho KU/module chưa có file (bản đồ, danh sách phụ huynh). Giá trị: xem "Quyết định chi tiết" bên dưới. |
| Kiểm tra (`npm test`) | 50 id duy nhất, khớp bảng trong CURRICULUM.md; `seq` duy nhất **trong mỗi track**; tiên quyết tồn tại, không vòng, có `seq` nhỏ hơn; module tồn tại; mọi file KU có trong curriculum; `testOut` chỉ cho track B hoặc module `backfill-*`. |
| Schema | `estMinutes` ≤ 90; `module.json`: `domains: string[]` nhận `A–Q`, `F0–F3` (giữ đọc được `domain` cũ). Theo `docs/CONTENT_STANDARD.md` §8: `level` thêm **L3**; trường tuỳ chọn `source`, `recognition` (câu), `review` (đáp án sai, phải là KU tiên quyết); test kiểm phân bổ 3/3/2 (luyện) và 2/3/3 (kho kiểm tra), ≥ 1 câu nhận dạng — **chỉ áp với KU mới**; htl-1/2 được miễn đến khi chuẩn hoá xong. |
| Kho kiểm tra (LT13) | Kho 8 câu, mỗi lượt rút 5 (1 L1 + 2 L2 + 2 L3), ưu tiên câu chưa gặp (dựa trên `attempts`), thứ tự xáo; trang học render bộ đã rút, máy chủ kiểm lượt nộp đúng 5 câu thuộc kho và đúng phân bổ. KU còn kho 5 câu (htl) → dùng cả 5. Không đổi DB. |
| Registry | Script `npm run content:index` sinh `src/lib/content/registry.generated.ts` (import tĩnh mọi JSON); test báo lỗi nếu file sinh ra cũ. Bỏ sửa tay `index.ts`. |
| Mở khoá (LT2) | `src/lib/learning/sequence.ts` (hàm thuần, unit test): KU mở khi mọi tiên quyết ≥ M3, hoặc có dòng mở tay. KU chưa `approved` hoặc chưa có file → "Sắp có". |
| Gợi ý bài mới (LT3) | `suggestNew(state)`: trong KU đã mở, đã duyệt, chưa bắt đầu — chọn 1 của track A và 1 của ô B/C, xếp theo **`batch` nhỏ nhất → track B trước C → `seq`**. Như vậy f3-dongdang (đợt 5) chỉ được gợi ý sau các bài B đợt ≤ 5, đúng ý GĐ2. Không gợi ý khi đã có **2 KU đang học** (đã xem lời giải mẫu, < M3, chưa vào lịch ôn). Con chọn 1 trong 2. |
| Kiểm tra vượt (LT4) | Nút "Làm bài kiểm tra luôn" trên thẻ gợi ý khi `testOut` và chưa thử. Một lần/KU. Đạt (≥ 80%, không lặp mã lỗi) → M3 + lịch ôn D+1 dù chưa xem lời giải mẫu. Chưa đạt → học bình thường; lượt này **không tính** vào mastery. `rules.ts`: M1+ khi xem lời giải mẫu **hoặc** qua kiểm tra vượt; `lastExitRun` bỏ qua lượt vượt không đạt. |
| Giới hạn ôn (LT8) | `RULES.maxUnitsPerReview = 5`; phiên ôn lấy 5 bài quá hạn lâu nhất; số quá hạn cho phụ huynh vẫn đếm tất cả. |
| Bản đồ tiến độ (LT9) | Nhóm track → module; module đang học mở sẵn, module khác 1 dòng + thanh tiến độ (`<details>`). KU "Sắp có" hiện mờ. Kiểu nút cây 🌱🌿🌳⭐ làm ở lát UX. |
| Gia sư | Danh sách KU trong form "Ghi buổi dạy" **nhóm theo module + ô tìm**; KU "cần gia sư xác nhận" đứng đầu nhóm. |
| Phụ huynh | `/parent/content` nhóm theo đợt (batch) + trạng thái Nháp/Đã duyệt/Chưa soạn; trong trang 1 KU: nút **"Mở khoá cho con"** khi KU đang khoá. |
| Migration **0009** | `unit_unlocks (student_id, unit_id, unlocked_by, unlocked_at)` + `unit_progress.testout_run uuid`, `testout_at timestamptz`. Chỉ thêm; RLS đọc như bảng học khác; ghi qua server action (mở tay: chỉ phụ huynh). GRANT `service_role`. Test PGlite. |

**Quyết định chi tiết S6a** (bổ sung 05/10 sau bridge test — agent mới đọc repo và liệt kê chỗ phải đoán; đây là mặc định, phụ huynh đổi được):

| Chỗ phải đoán | Mặc định |
|---|---|
| Nhánh gốc | Tách từ `main`. Nếu PR #10 (tài liệu này) chưa merge thì **xếp chồng trên `p1-curriculum-design`** như các PR trước. S6a không phụ thuộc PR #11 (S4). |
| `seq` | Thứ tự trong track (duy nhất trong track, lặp giữa các track là bình thường), đánh 10, 20, 30… **Track A:** f1-hdt, f1-pnt, f1-tgon, f1-qd, c-dkxd, c-coban, c-truccan, c-rutgon, c-cauphu, d-ptbh, d-nhamnghiem, d-thamso, e-viete, e-vietets, e-giaodiem, g-chuyendong, g-nangsuat, g-phantram, g-honhop, h-bdt, hq-amgm, hq-doanhthu, hq-hinhhoc, hq-nangcao. **Track B:** a-tanso, b-phepthu, a-bieudo, b-xsuat, p-trunon, b-haib, p-cau, p-ghep, htl-1, htl-2, i-giaitgv, i-ungdung, f-hamso, f-parabol. **Track C:** f3-dongdang, j-coban, j-cung, k-goiintiep, k-tugiacnt, l-tieptuyen, l-kethop, m-vitri, n-ngoainoi, o-chungminh, o-dongdang, o-nangcao. |
| `batch` | Theo bảng H6 trong CURRICULUM.md; htl-1, htl-2 = **0** (đã có). |
| `testOut` | `true` cho mọi KU track B (kể cả htl-1/2) và f1-hdt, f1-pnt, f1-tgon, f1-qd, f3-dongdang; còn lại `false`. |
| `title`, `domains`, thời lượng | KU/module đã có file: file là chuẩn (test bắt `domains` trong curriculum = `module.json`); (test bắt `title` trong curriculum = file). `estMinutes` chỉ lấy từ file; số phút trong CURRICULUM.md là ước tính lập kế hoạch. `order` trong file KU giữ nguyên cho thứ tự trong module; `seq` chỉ dùng để gợi ý bài. |
| Mức dùng để mở khoá | Mức hệ thống ≥ M3 **hoặc** mở tay. Khi S4 (PR #11) merge, S4b đổi sang "mức hiển thị cuối" (phụ huynh chốt nếu mới hơn). |
| 3 trạng thái chưa học | 🔒 **Khoá** (tiên quyết chưa đạt) · ○ **Chưa bắt đầu** (đã mở, M0) · **Sắp có** (chưa có bài đã duyệt, hiện mờ). 🔒 chỉ dùng cho "Khoá". |
| Kiểm tra vượt không đạt | KU chuyển sang "Đang học" ngay (tính vào giới hạn 2 bài), mở ở lời giải mẫu. Câu trả lời của lượt đó **không** tính vào mastery và số "câu đã làm", nhưng lượt nộp vẫn tính **một buổi học** cho mục tiêu tuần. |
| Giới hạn ôn | 1 phiên/ngày, tối đa 5 bài; bài còn lại hiện "Còn N bài, ôn ngày mai". Phiên đang dở mở lại giữ nguyên kế hoạch cũ (không vượt 5). |
| "Mở khoá cho con" | Nút theo từng học sinh mà phụ huynh quản lý (D11); hiện chỉ có Nguyên → 1 nút. |
| Nội dung cho e2e | KU giả trong `e2e/fixtures/content/` (đã duyệt, 7+ KU đủ để test gợi ý, mở khoá, kiểm tra vượt, giới hạn ôn) kèm **`curriculum.json` riêng của fixtures**, thay file thật trong lúc chạy e2e. `e2e/run.sh` sinh registry **kèm fixtures** rồi hoàn nguyên như bản vá hiện có; CI chặn commit registry có fixtures. Không cần phụ huynh duyệt nội dung thật để chạy nghiệm thu. |

**Nghiệm thu S6a:**
- `npm test` bắt được: thiếu KU, tiên quyết sai/vòng, file KU không có trong curriculum, registry cũ.
- e2e (trên KU giả trong fixtures): học sinh mới chỉ thấy 2 gợi ý (bài đầu track A + bài đầu track B); bài đầu track A đạt M3 → bài kế mở; đang học 2 bài → không còn gợi ý mới.
- e2e: kiểm tra vượt bài đầu track B đạt → M3 + lịch ôn; không đạt → vào luồng học, mastery không đổi; không thử lần 2 được.
- e2e: 7 bài đến hạn → phiên ôn chỉ có 5 bài; ngày hôm sau còn 2.
- e2e: phụ huynh mở khoá tay một bài đang khoá → học sinh thấy bài đó trong gợi ý.
- Bản đồ 50 KU trên điện thoại 390px không cuộn quá 2 màn khi chỉ 1 module mở.

### S6b — Loại câu nhiều bước, hình SVG, nhãn gia sư

| Phần | Thiết kế |
|---|---|
| Item `steps` (LT5) | `{ id, type: "steps", level, prompt (đề chung), steps: [{ prompt, item: mcq\|numeric }] (2–5), solution }`. Id bước = `<item id>-s<n>`. |
| Chấm | Luyện tập: làm từng bước, sai bước nào hiện gợi ý / mã lỗi bước đó rồi làm tiếp. Kiểm tra: nộp cả chuỗi, không phản hồi đến khi nộp. Ghi **1 dòng `attempts`**: `correct` = đúng hết, `error_code` = bước sai đầu tiên, `answer` = các đáp án nối bằng `|` (≤ 200 ký tự). Không đổi DB. |
| Ôn tập | Câu `steps` là một câu trong pool; phiên ôn lấy nguyên chuỗi. |
| Link ôn nền (LT16) | Phản hồi sai có `review` → hiện "Ôn lại: <tên KU>" mở KU đó ở chế độ xem lại (lý thuyết + lời giải mẫu), không đổi tiến độ. |
| Hình (LT7) | `figure` ở unit hoặc từng câu: `{ svg, alt }` (giữ enum cũ). Test: chỉ cho phép thẻ `svg g path line polyline polygon circle ellipse rect text tspan defs marker title`, không `script`, `on*`, `href` ngoài, `style` có `url(`; màu chỉ `currentColor` hoặc `var(--…)`; viewBox bắt buộc; ≤ 20 KB. Render server-side. |
| Nhãn gia sư (LT6) | KU `grading` partial/tutor: nhãn "Cần gia sư xác nhận" trên thẻ học, bản đồ, trang phụ huynh. Mức hệ thống không đổi cách tính; mức cuối do gia sư đề xuất (S3) + phụ huynh chốt (S4). |

**Nghiệm thu S6b:** schema + test cho `steps` và SVG (có test SVG độc hại bị từ chối); e2e luyện 1 câu 4 bước sai bước 2 → gợi ý đúng bước, cuối câu tính sai với mã lỗi bước 2; kiểm tra có câu `steps` chấm đúng; hình hiển thị đúng ở theme sáng/tối.

### Lịch song song tuần đầu

| Tuần | Nguyên | Claude | Phụ huynh |
|---|---|---|---|
| 0 (05–11/10) | — | S6a; soạn đợt 1 (f1-hdt, f1-pnt, a-tanso, b-phepthu) theo `docs/CONTENT_STANDARD.md` + chuẩn hoá htl-1/2 + kiểm tra độc lập | Merge PR #9 → #11 (chạy SQL 0008), #8, #6, #10; nói chuyện D18; tạo tài khoản Nguyên; gia sư bắt đầu ghi buổi dạy |
| 1 (12–18/10) | htl-1/2 trên app; F1 với gia sư | UX; S6b; soạn đợt 2 | Chạy SQL 0009, merge S6a; duyệt đợt 1 trước 18/10 |
| 2 (19–25/10) | Đợt 1 trên app (kiểm tra vượt a-tanso, b-phepthu nếu đã biết) | S4b; soạn đợt 3 | Merge UX, S6b; duyệt đợt 2 trước 25/10 |
| 3 (26/10–01/11) | Đợt 2 (f1-tgon, f1-qd có câu nhiều bước) | Soạn đợt 4 (gia sư soát căn thức) | Merge S4b |

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
- Bổ sung 05/10 (làm trong S6a): danh sách 50 KU **nhóm theo module + ô tìm**; KU có nhãn "cần gia sư xác nhận" (LT6) đứng đầu nhóm; đề xuất mức của gia sư cho các KU này là bằng chứng chính cho phần chứng minh trên giấy.

### S4 — Phụ huynh "Tổng quan" (§2.7, mockup phụ huynh)
- 3 con số đầu trang (render lần đầu): KU đạt M3+/tổng KU đã duyệt · lượt ôn quá hạn · cờ lệch chưa chốt.
- Cờ lệch: đề xuất **mới nhất** của gia sư cho một KU lệch ≥ 1 bậc so với mức hệ thống, và chưa có mức phụ huynh chốt mới hơn đề xuất đó → "Cần chú ý" hiện cả hai mức + bằng chứng + nút "Xem & chốt mức". Chốt → bảng `parent_confirmations` (học sinh, KU, mức, lúc chốt); cờ biến mất.
- Mức hiển thị cuối cùng của KU = phụ huynh chốt (nếu mới hơn mọi thay đổi khác) ?? mức hệ thống; ô "chưa đủ dữ liệu" khi < 5 câu (D15).
- Bảng màu theo domain/KU; tóm tắt tuần (số buổi học, bài kiểm tra, lượt ôn).
- Bổ sung 05/10 (làm trong S4b, sau khi PR #11 merge): **tiến độ tới mốc** gate 8.5 (20 KU, hạn ~21/02/2027) và gate 9.5 (50 KU, hạn 31/03/2027) theo `docs/CURRICULUM.md` §4; KU trễ so với lịch §3.3 tô vàng; mở khoá tay cũng có ở đây.
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
