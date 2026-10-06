# Chuẩn soạn nội dung KU — App Toán

> Duyệt 05/10/2026 (quyết định LT13–LT16, AI2 trong `docs/SPEC.md` §0). Áp dụng cho **mọi KU mới** (đợt 1–10 trong
> `docs/CURRICULUM.md` H6) và cho việc chuẩn hoá lại htl-1, htl-2. Phiên soạn bài đọc file này + `docs/CURRICULUM.md`
> (dòng của KU) + `src/lib/content/schema.ts` trước khi viết. Bài mẫu đã duyệt: `content/he-thuc-luong/htl-2.json`
> (đúng cấu trúc, nhưng mã lỗi và cấp câu phải sửa theo §4, §3 — xem §9).

## 1. Một KU gồm gì (cố định)

| Phần | Số lượng | Ghi chú |
|---|---|---|
| Lý thuyết (`theory`) | 3–6 đoạn, mỗi đoạn ≤ 80 chữ | Khung §2 |
| Lời giải mẫu (`worked`) | 3–5 bước + 1 câu tự giải thích | Bước cuối bắt đầu bằng **"Kết luận:"** |
| Lời giải khuyết bước (`faded`) | 3–6 bước, **≥ 2 chỗ trống** | Chỗ trống đặt ở **bước quyết định**, không chỉ bước tính |
| Luyện tập (`practice`) | **8 câu: 3 L1 + 3 L2 + 2 L3** | ≥ 1 câu nhận dạng (§3). Là nguồn câu cho phiên ôn → **mỗi câu tự đứng được**, không nhắc "như ví dụ trên" |
| Kiểm tra (`exit`) | **Kho 8 câu: 2 L1 + 3 L2 + 3 L3**; mỗi lần làm rút **5 câu: 1 L1 + 2 L2 + 2 L3**, ưu tiên câu chưa gặp (LT13) | ≥ 1 câu dạng đề thi thật (L3, có `source`). Ngưỡng M3 không đổi (≥ 4/5, không lặp mã lỗi) |
| Thời lượng (`estMinutes`) | ước tính thật: lý thuyết + mẫu 8–12′, khuyết 5′, luyện ~2′/câu, kiểm tra ~2,5′/câu | Tối đa 90 |

## 2. Khung lý thuyết (thứ tự đoạn cố định, bỏ đoạn không cần)

1. **Cần nhớ trước** — 1 câu, nêu KU tiên quyết (ghi tên bài, ví dụ "7 hằng đẳng thức").
2. **Công thức / quy tắc** — kèm **điều kiện dùng** (ví dụ $\sqrt{A^2}=|A|$, mẫu ≠ 0).
3. **Vì sao** — 1–2 câu trực quan, không chứng minh dài.
4. **Bẫy hay gặp** — 1 phản ví dụ, nêu đúng sai lầm GV đã chỉ ra nếu có (ví dụ $(a-b)^2 \ne a^2-b^2$).
5. **Nhận dạng** — từ khoá / dấu hiệu trong đề → dùng cách này; **khi nào KHÔNG dùng**.
6. **Thẻ đặc thù theo mạch** (master plan §25): căn thức → bảng ĐKXĐ + mẫu chung; Viète → bảng biểu thức đối xứng theo S, P;
   bài toán thực tế → bảng đại lượng + checklist (đơn vị, điều kiện, quan hệ, thử lại); xác suất → mẫu liệt kê / sơ đồ cây,
   có/không hoàn lại; tối ưu → phiếu "biến – điều kiện – hàm mục tiêu – dấu bằng – kết luận".

## 3. Cấp câu và câu nhận dạng (LT14)

| Cấp | Mục tiêu | Ví dụ (căn thức) |
|---|---|---|
| L1 | Một kỹ năng đơn, số đẹp | Tính $\sqrt{(3-\sqrt5)^2}$ |
| L2 | Dạng thi chuẩn, 2–3 bước | Rút gọn $\frac{x-4}{\sqrt x-2}$ rồi tính tại $x=9$ |
| L3 | Biến thể: đổi dữ kiện / hỏi ngược / bẫy điều kiện / dạng đề thật | "Tìm $x$ nguyên để $P$ nguyên" dạng câu phụ đề Hà Nội |
| L4 | Trộn, không ghi tên dạng | **Không nằm trong KU** — phiên ôn trộn (D14) đảm nhận |

- **Câu nhận dạng (≥ 1 trong luyện tập, đánh dấu `recognition: true`)**: trắc nghiệm "Bài này nên làm bằng cách nào / bước đầu tiên là gì?",
  phương án nhiễu là các cách của KU lân cận. Sai → mã **E05**.
- **Gợi ý viết sẵn H1–H3 (AI2) — bắt buộc cho mọi câu luyện tập** (trường `hints`, đúng 3 dòng, mỗi dòng ≤ 25 chữ, không chứa đáp số):
  H1 *Mục tiêu* ("Đề hỏi gì? Cần tìm $BH$."), H2 *Nhận dạng* ("Có cạnh huyền và hình chiếu → hệ thức nào?"),
  H3 *Công cụ* ("Dùng $AB^2 = BH \cdot BC$."). H4–H5 do AI hỏi tiếp (`docs/AI_TUTOR.md`); H6 là `solution` đã có.
  Câu kiểm tra **không** có gợi ý.
- **Điểm yếu GV đã chỉ ra phải có câu luyện riêng**: thu gọn chưa đến tận cùng (f1-tgon, f1-qd, c-rutgon: phương án nhiễu = dạng
  *chưa rút gọn hết*, mã E11), hằng đẳng thức (f1-hdt), đồng dạng (f3-dongdang), trình bày thiếu kết luận (bước "Kết luận" là chỗ trống
  trong ≥ 1 bài khuyết của mỗi KU đại số).

## 4. Gắn mã lỗi E01–E15 (bắt buộc dùng đúng bảng này)

Mã lỗi gắn với **nguyên nhân** của đáp án sai, không phải với độ "nặng". Mỗi đáp án nhiễu phải **tính ra từ một lỗi có thật** (làm đúng lỗi đó sẽ ra đúng số đó).

| Mã | Dùng khi | Không dùng khi | Ví dụ |
|---|---|---|---|
| E01 Tính toán | Phương pháp đúng, sai phép tính số | Sai do biến đổi chữ (→ E02) | $7\cdot 8 = 54$ |
| E02 Biến đổi đại số | Sai dấu khi phá ngoặc / chuyển vế, quy đồng sai, rút gọn phân thức sai | Nhớ sai công thức (→ E03) | $-(x-3) = -x-3$ |
| E03 Nhớ công thức | Nhớ sai / thiếu một phần công thức, hằng đẳng thức, hệ thức | — | $(a-b)^2=a^2-b^2$; quên bình phương trong $BH=\frac{AB^2}{BC}$ |
| E04 Khái niệm | Hiểu sai bản chất | — | $\sqrt{a^2}=a$ với mọi $a$; nhầm tần số với tần số tương đối |
| E05 Nhận dạng | Chọn sai phương pháp vì không nhận ra dạng | — | Dùng công thức nghiệm khi nên nhẩm $a+b+c=0$ (câu nhận dạng) |
| E06 Chiến lược | Biết công thức nhưng áp sai chỗ / sai thứ tự bước | — | Tính $CH$ trước khi có $BC$ |
| E07 Mô hình hoá | Đặt ẩn / lập phương trình / chọn không gian mẫu sai | — | Năng suất chung = $t_1+t_2$ |
| E08 Đọc hình | Nhầm cạnh kề–đối, nhầm hình chiếu, đọc sai số liệu trên hình/biểu đồ | — | Nhầm $BH$ với $CH$ |
| E09 Logic chứng minh | (Chỉ dùng cho phần gia sư chấm trên giấy) | Câu tự chấm | — |
| E10 Ẩu | Sơ suất **một chỗ**: chép nhầm số, đọc nhầm đề, quên dấu cuối | Lỗi có hệ thống / lặp lại (→ mã gốc) | Đề cho 12, con dùng 21 |
| E11 Trình bày / chưa hoàn thiện | Kết quả **chưa rút gọn đến tận cùng**, thiếu kết luận, thiếu đơn vị | — | Dừng ở $\frac{2\sqrt x+4}{2}$ thay vì $\sqrt x+2$ |
| E12 Hổng nền | Lỗi gốc ở kiến thức lớp dưới (F0–F3) trong KU lớp 9 → **bắt buộc kèm `review`** (§5) | Lỗi của chính KU | Sai HĐT khi rút gọn căn |
| E13 Thời gian | Không gắn vào câu (hệ thống tự tính) | — | — |
| E14 Điều kiện / đơn vị | Quên ĐKXĐ, quên loại nghiệm không thoả, nhầm đơn vị | — | Giữ nghiệm $x=-2$ cho vận tốc |
| E15 Làm tròn / máy tính | Làm tròn sớm, sai chế độ độ/rad | — | $\sin 30$ ở chế độ rad |

Số đáp án nhiễu: trắc nghiệm 4 phương án → **≥ 2 phương án sai có `mistakes`**; câu đáp số → **1–3 đáp án sai hay gặp**.

## 5. Phản hồi khi sai và link ôn nền (LT16)

- **≤ 2 câu**, xưng "con", gọi đúng tên lỗi + quy tắc đúng; **không** nêu đáp số cuối. Mẫu: *"Con nhớ thiếu: $(a-b)^2 = a^2 - 2ab + b^2$."*
- Đáp án sai mã **E12 hoặc E02/E03 có gốc ở KU nền** thêm `review: "<id KU nền>"` → app hiện "Ôn lại: <tên bài>" (link). KU nền phải là
  tiên quyết (trực tiếp hoặc gián tiếp) của KU đang học. Người soạn chọn link, **không** để AI tự đoán lúc chạy.

## 6. Con số, ký hiệu, nguồn (LT15)

- **L1–L2**: Claude tự soạn, đáp số "đẹp" (số nguyên, phân số tối giản, căn có số dưới căn ≤ 50).
- **L3 và câu dạng đề thi**: lấy hoặc chuyển thể từ **68 đề luyện thi** + đề Hà Nội các năm; ghi `source` cho từng câu (ví dụ
  `"68 đề – Đề 12, Bài 2c (chuyển thể)"`). Câu nhiều ý → tách thành câu đáp số / trắc nghiệm / câu nhiều bước (`steps`).
  File PDF 68 đề **không** đưa vào GitHub (sách có bản quyền); dùng chỉ mục nguồn `docs/SOURCE_INDEX.md` và file gốc trong Project hub.
- Số vô tỉ để dạng căn (`2√3`); chỉ hỏi số làm tròn khi đề ghi "làm tròn đến …" (đáp án là số thập phân).
- Dấu thập phân **phẩy** trong đề; TeX trong `$…$`; đơn vị ghi ở trường `unit`.
- Câu `steps` (sau S6b): 2–5 bước, mỗi bước **một quyết định** (ĐKXĐ → phân tích mẫu → kết quả rút gọn → giá trị); bước rút gọn luôn có
  phương án nhiễu "chưa rút gọn hết" (E11).
- Hình: SVG trong nội dung theo quy tắc S6b (màu `currentColor` / `var(--…)`, có `alt`). Hình vẽ phải đúng tỉ lệ số liệu nếu có thể.

## 7. Kiểm tra trước khi tới phụ huynh (LT10)

| Bước | Ai | Đạt khi |
|---|---|---|
| 1. `npm test` | máy | Schema, ID, đáp án đọc được, nhiễu ≠ đáp án, TeX, SVG, `review` hợp lệ, mỗi câu luyện có 3 `hints` không chứa đáp số, đủ 3/3/2 và 2/3/3, ≥ 1 câu nhận dạng, ≥ 1 câu có `source` trong kho kiểm tra |
| 2. Giải độc lập | agent thứ hai, **không xem đáp án** | Giải hết câu luyện + kiểm tra + chỗ trống; mọi đáp số trùng file. Lệch → sửa, ghi lý do |
| 3. Tính lại nhiễu | script (Python/sympy) trong phiên soạn | Mỗi đáp án nhiễu tái tạo được bằng đúng lỗi đã ghi |
| 4. Soát sư phạm | người soạn | Phản hồi ≤ 2 câu, không lộ đáp số; gợi ý đi từ chung → cụ thể, H3 chưa làm hộ phép tính; bước cuối "Kết luận:"; câu luyện tự đứng được |
| 5. Gia sư | gia sư | Chỉ đợt có C, E, G |

Kết quả bước 2–3 ghi vào `docs/PROGRESS.md` cùng đợt.

**Phiếu duyệt của phụ huynh (~20 phút/KU, trên preview):** (1) làm thử hết bài như con; (2) có câu nào đọc không hiểu?;
(3) có câu nào quá dễ / quá khó so với con?; (4) lời nhắc khi sai có giúp được không?; (5) đề thi thật có giống không?;
(6) nói "duyệt KU …" hoặc ghi câu cần sửa.

## 8. Thay đổi app cần cho chuẩn này

| Thay đổi | Lát |
|---|---|
| `level` thêm **L3**; trường tuỳ chọn `source` (câu), `recognition` (câu), `review` (đáp án sai), `hints` (3 dòng, câu luyện); test kiểm phân bổ cấp | ✅ S6a+ (PR `p1-slice-6a2`) |
| Nút "Gợi ý" H1→H3 khi luyện tập, ghi `hint_level` (migration 0010) | ✅ S6b (PR `p1-slice-6b`) |
| Kho kiểm tra 8 câu, mỗi lượt rút 5 theo cấp, ưu tiên câu chưa gặp; máy chủ kiểm lượt nộp đúng bộ đã rút | ✅ S6a+ (PR `p1-slice-6a2`) |
| Hiện link "Ôn lại: …" trong phản hồi sai | ✅ S6b (PR `p1-slice-6b`) |

## 9. Chuẩn hoá htl-1, htl-2 (đợt 1)

Đã duyệt nhưng chưa theo chuẩn: thêm `hints` H1–H3 cho 8 câu luyện, thêm 2 câu L3 vào luyện tập (đổi 2 câu L2 hiện có), thêm 3 câu vào kho kiểm tra, sửa mã lỗi
(ví dụ htl-2 "quên bình phương" đang là E10 → **E03**; "tính ngược công thức" đang là E06 → **E03**), thêm bước "Kết luận:". Sau khi sửa,
phụ huynh duyệt lại (trạng thái giữ `approved` để con không bị gián đoạn; thay đổi đi qua PR như mọi nội dung).
