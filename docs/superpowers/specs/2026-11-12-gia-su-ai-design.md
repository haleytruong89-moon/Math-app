# Gia sư AI — phỏng vấn chẩn đoán, sửa lỗi, huấn luyện giải toán (thiết kế)

> **Trạng thái: bản thiết kế 12/11/2026, chưa định ngày code** (quyết định của phụ huynh 12/11, `docs/SPEC.md` §0).
> Mở rộng `docs/AI_TUTOR.md` (AI1–AI4); giữ nguyên nguyên tắc gốc: **AI giúp con tự nghĩ, không giải hộ, không tự nghĩ ra đề
> hay đáp án.** Phương án đã chọn: **A — phỏng vấn theo bản đồ lỗi**, lấy dữ liệu lỗi sẵn có trong app làm đầu vào.

## 0. Quyết định 12/11

| # | Câu hỏi | Phụ huynh chọn |
|---|---|---|
| 1 | Con thi chuyên gì | **Chuyên Tiếng Anh**; Toán là môn điều kiện (đề chung) → gia sư AI chỉ phục vụ đề Toán chung |
| 2 | Mục tiêu điểm Toán | **Giữ 8,5 lúc này** (nâng sau khi có điểm KT1, KT2). Gia sư nói an toàn cho chuyên là 8,5–9,25 |
| 3 | Khi nào code | **Chỉ thiết kế, chưa định ngày.** Lộ trình app (A2, B, C) tạm dừng tới tháng 12 |
| 4 | Ảnh bài làm viết tay | **Cho phép**, chỉ trang giấy làm bài — không tên, không mặt |

## 1. Vì sao cần

- Gia sư dạy **2 buổi/tuần**; giữa các buổi con tự học. App hiện biết con **sai câu nào, mã lỗi gì**, nhưng không biết **vì sao**.
- AI hiện có (S8b) chỉ gợi ý **một câu đang làm**: ≤ 6 lượt, ≤ 80 chữ, không dạy kiến thức mới. Không đủ để tìm ra gốc yếu.

**Đầu vào: nhận xét của gia sư (11/2026)**

| Nhóm | Gia sư thấy | Mảng app liên quan |
|---|---|---|
| Kiến thức | Chưa thuộc **hằng đẳng thức**; hổng **tam giác đồng dạng** (xương sống lớp 8) | `f1-hdt`, `f3-dongdang` |
| Kỹ năng | **Thu gọn chưa đến tận cùng** (≈ 1 điểm trong đề); chưa làm được **dạng nâng cao của thu gọn**; nhầm cơ bản: **rút gọn khi không được rút gọn** (giao hoán / rút gọn qua dấu cộng) | `f1-tgon`, `c-rutgon`, `c-cauphu` |
| Tư duy | Bài hình khó cần **suy luận ngược** chưa làm được; bài nâng cao đại số chưa làm được | `k-*`, `o-*`, phân tích ngược (S5) |
| Trình bày | Gạch xoá nhiều, **thiếu câu kết luận** (thi vào 10 trừ 0,25 mỗi chỗ) | mã lỗi E11 |
| Thái độ | Chăm, chịu làm bài; tư duy không nhanh; **nản và bỏ qua bài dài, phức tạp** | — |

Ý chặn mốc trong đề Hà Nội (gia sư): **chặn 8,5 = 2c (thu gọn nâng cao), 3c (Vi-ét), 4b ý 2 (hình)**; **chặn 9,5 = Bài 5, 4c**.

**Kỳ vọng của phụ huynh, theo thứ tự:** (1) chắc cơ bản, không mất điểm lỗi cơ bản → (2) hiểu bản chất, không học vẹt, để vận dụng
được bài nâng cao → (3) tự giải được bài nhiều bước / suy luận ngược: **thử → không được → thử tiếp → đến khi ra.**

## 2. Gia sư AI làm gì, không làm gì

| Làm | Không làm |
|---|---|
| Phỏng vấn qua lại theo một mảng để tìm gốc yếu (mục 4) | Không thay gia sư: gia sư xác nhận mọi kết luận |
| Chỉ cách sửa và cho luyện đúng chỗ yếu (mục 5) | **Không giải bài về nhà gia sư giao**, không có mặt trong bài kiểm tra, kiểm tra tiến bộ, thi thử |
| Huấn luyện giải bài nhiều bước bằng câu hỏi (mục 6) | Không tự ra đề hay đáp án; không làm bài ngoài kho đã kiểm (v1) |
| Đọc ảnh bài làm để soát trình bày (mục 7) | Không nhận ảnh có tên, mặt; không lưu ảnh ngoài app |
| Viết hồ sơ điểm yếu cho gia sư, phụ huynh (mục 8) | Không đổi mức M, không chấm điểm |

## 3. Năm nhóm điểm yếu

Mọi kết luận của AI xếp vào một nhóm — gia sư đọc là biết phải dạy gì.

| Nhóm | Nghĩa | Ví dụ của con | Cách sửa thường dùng |
|---|---|---|---|
| **Kiến thức** | Không biết / nhớ sai một sự thật, công thức, định lí | $(a-b)^2 = a^2 - b^2$ | Thẻ ghi nhớ + ôn giãn cách; cặp đúng/sai |
| **Kỹ năng** | Biết nhưng làm sai hoặc dừng giữa chừng | Thu gọn chưa đến cùng; rút gọn $\frac{x+3}{x}$ thành $3$ | Luyện riêng dạng đó, có "danh sách soát" trước khi nộp |
| **Tư duy** | Không tìm ra hướng; không biết bắt đầu từ đâu | Bài hình phải đi ngược từ kết luận | Huấn luyện giải toán (mục 6) |
| **Trình bày** | Làm đúng nhưng viết thiếu, sai thể thức | Thiếu điều kiện, thiếu kết luận, gạch xoá | Khung trình bày 5 bài (gia sư gửi mẫu) + soát ảnh |
| **Thói quen** | Bỏ cuộc sớm, vội, không kiểm lại | Bỏ qua bài dài | Chia mốc nhỏ, đếm lần thử, khen quá trình |

Một nhận định phải có **bằng chứng** (câu con trả lời hoặc nói) và **mức chắc chắn**: *nghi ngờ* (1 lần) → *khá chắc* (lặp lại ở
câu khác) → *đã xác nhận* (gia sư bấm "đúng").

## 4. Chế độ 1 — Phỏng vấn chẩn đoán (một mảng, 15–20 phút)

```
Chọn mảng (gia sư giao / app gợi ý từ mã lỗi hay gặp)
  │
  ▼
Câu khởi động (dễ) ── con trả lời + "con làm thế nào?" (gõ ngắn hoặc chụp ảnh)
  │
  ├─ đúng, giải thích chắc ───────► câu khó hơn (lên mức)
  ├─ đúng nhưng giải thích vẹt ───► "vì sao?" / đổi dạng / đảo chiều câu hỏi
  └─ sai ─────────────────────────► câu thăm dò để biết đúng kiểu lỗi
  │
  ▼
Xác nhận: lỗi lặp lại ở 1–2 câu khác mới ghi "khá chắc"   (không kết luận từ một lần nhầm)
  │
  ▼
Kết thúc: con nhận tóm tắt (mục 8) · người lớn nhận hồ sơ · app lên lịch sửa + kiểm lại
```

**Giới hạn một buổi:** tối đa ~12 câu thăm dò, ~20 phút. Con bấm "Dừng" lúc nào cũng được. Con trả lời "con không biết" 2 lần
liền → AI hạ xuống câu dễ hơn hoặc chuyển sang giải thích ngắn (từ lý thuyết KU), không dồn tiếp.

**Câu hỏi "vì sao" — cách phân biệt hiểu và vẹt:** đổi dạng (cùng kiến thức, khác hình thức); đảo chiều (cho kết quả, hỏi đề);
hỏi dự đoán trước khi tính; cho **bài giải có lỗi** và bảo con tìm chỗ sai; hỏi "nếu đổi … thì còn đúng không?".

### Bản đồ lỗi (nội dung soạn sẵn, kiểm như bài học)

Mỗi mảng có một bản đồ lỗi — **nguồn duy nhất** của câu hỏi và cách sửa mà AI dùng. Soạn bởi Claude, kiểm theo
`CONTENT_STANDARD.md` §7 (sympy, giải độc lập, audit AI), có gia sư xem.

```jsonc
{
  "strand": "rut-gon-sai",                       // mảng
  "units": ["f1-tgon", "c-rutgon"],              // KU liên quan
  "levels": [                                    // L1 cơ bản → L3 nâng cao (ý 2c)
    { "level": 1, "probes": ["rg-p1", "rg-p2"] }
  ],
  "probes": [{
    "id": "rg-p1",
    "item": { "...": "câu hỏi như item trong bài học (đáp án chấm bằng máy)" },
    "ask": "Con giải thích bước rút gọn của con.",
    "signatures": [                               // kiểu trả lời → lỗi nghi ngờ
      { "answer": "3", "misconception": "rg-m1" }
    ],
    "cues": { "rg-m1": ["gạch x ở tử và mẫu", "rút gọn x với x"] }   // dấu hiệu trong lời giải thích
  }],
  "misconceptions": [{
    "id": "rg-m1",
    "group": "Kỹ năng",                           // 1 trong 5 nhóm
    "code": "E02",                                // mã lỗi app đang dùng
    "name": "Rút gọn hạng tử qua dấu cộng",
    "confirm": ["rg-p4", "rg-p7"],                // câu để xác nhận
    "fix": {
      "explain": "lời giải thích ngắn (từ lý thuyết KU đã duyệt)",
      "contrast": ["cặp ví dụ ĐƯỢC rút gọn / KHÔNG ĐƯỢC rút gọn"],
      "drill": ["id câu luyện trong kho"],
      "recheck_days": 3
    }
  }]
}
```

### Vai trò của AI trong một lượt

AI nhận: bản đồ của mảng, câu đang hỏi, câu trả lời của con (đã chấm bằng máy), lời giải thích / ảnh, lịch sử lượt trước.
AI trả về **JSON**, không trả văn bản tự do:

```jsonc
{ "read": "con viết: gạch x ở tử và mẫu",              // AI đọc được gì (để người lớn kiểm)
  "hypothesis": { "id": "rg-m1", "confidence": "nghi ngờ" },
  "evidence": "“x ở trên và dưới nên bỏ được”",
  "next": { "type": "probe", "id": "rg-p4" },            // probe | why | explain | encourage | close
  "say": "≤ 80 chữ, tiếng Việt, không lộ đáp án câu tiếp theo" }
```

**Máy chủ kiểm trước khi hiện cho con:** `next.id` phải có trong bản đồ; `hypothesis.id` phải là lỗi có trong bản đồ; `say` qua
máy soát số (AI_TUTOR §4 lớp 3); đáp án của câu kế tiếp không được xuất hiện. Trượt → tạo lại 1 lần → vẫn trượt thì chuyển sang
câu kế tiếp theo thứ tự trong bản đồ, không cần AI.

## 5. Chế độ 2 — Sửa lỗi ("phòng khám lỗi")

Sau chẩn đoán, mỗi lỗi "khá chắc" sinh một **gói sửa** lấy từ `fix` của bản đồ:

1. **Giải thích ngắn** (đã duyệt) + **cặp so sánh** đúng / sai đặt cạnh nhau.
2. **Con tự giải thích lại** bằng lời của mình ("dạy lại cho AI") — AI chỉ hỏi tiếp khi lời giải thích còn thiếu ý chính.
3. **3–5 câu luyện đúng lỗi đó** (từ kho bài đã duyệt), trộn với câu không có bẫy để con phải *nhận ra* khi nào được rút gọn.
4. **Kiểm lại sau 3–7 ngày** (dùng lịch ôn sẵn có): đạt → lỗi chuyển "đã sửa"; trượt → báo gia sư đưa vào buổi dạy.

Ưu tiên 1 của phụ huynh nằm ở đây: lỗi cơ bản được **đếm** qua mọi bài làm (mã lỗi) — báo cáo tuần cho thấy lỗi nào đã hết, lỗi
nào còn.

## 6. Chế độ 3 — Huấn luyện giải bài nhiều bước

Cho bài từ kho đã duyệt (luyện đề 4.2, bài nâng cao 2c / 3c / 4b ý 2). AI là **huấn luyện viên**, không phải người giải.

| Bước | AI hỏi | App làm |
|---|---|---|
| Hiểu đề | "Đề cho gì? Cần tìm / chứng minh gì?" — con ghi ra | Lưu danh sách giả thiết / kết luận |
| Lập kế hoạch | **Phân tích ngược**: "Để có điều này, cần gì?" → lặp lại đến khi chạm giả thiết | Cây phân tích ngược (đã có ở S5 cho hình) |
| Thực hiện | "Bước này dựa vào đâu?" | Chấm từng bước nếu là câu nhiều bước |
| Nhìn lại | "Đã dùng hết giả thiết chưa? Có cách khác không?" | Lưu "bài học rút ra" của con |

**Chống bỏ cuộc** (thói quen nản bài dài):
- **Thời gian tự nghĩ** trước gợi ý (ví dụ 3 phút; gia sư chỉnh). Gợi ý theo nấc như hiện có — không bao giờ đưa cả bước.
- **Đếm số hướng con đã thử** và khen *quá trình*: "Con đã thử 3 hướng — hướng thứ 3 đang đi đúng" (không khen chỉ vì ra đáp số).
- Con bấm "Bỏ" → AI hỏi **một bước nhỏ nhất** con làm được ngay ("viết lại điều cần chứng minh"), chỉ một lần; con vẫn muốn
  dừng thì dừng, bài vào danh sách gia sư.
- Bài dài chia **mốc** (ý a → b → c); xong một mốc là có điểm dừng an toàn.
- Số lần thử, thời gian nghĩ chỉ hiện cho người lớn và cho con *trong bài đó* — **không chuỗi ngày, không bảng xếp hạng (D17).**

## 7. Ảnh bài làm và trình bày

- Con chụp **trang giấy làm bài** (không tên, không mặt — app nhắc trước khi chụp; con xem lại và cắt ảnh trước khi gửi).
- AI đọc ảnh → ghi lại **AI đọc được gì** (để con và người lớn kiểm; chỗ không chắc thì hỏi con "chỗ này con viết … đúng không?").
- **Soát trình bày** theo **khung 5 bài** của đề vào 10 (gia sư gửi bài mẫu; soạn thành danh sách soát): đặt ẩn + điều kiện, đơn vị,
  câu kết luận, đối chiếu điều kiện, trình bày chứng minh (vì … nên …).
- Kết quả: danh sách chỗ thiếu, **mỗi chỗ gắn điểm có thể bị trừ** (0,25) — không chấm thay gia sư.
- Lưu trong kho ảnh của app (Supabase Storage, RLS như hội thoại AI); phụ huynh xoá được; tự xoá sau [N] ngày (chốt khi code).

## 8. Kết quả sau mỗi buổi

**Con thấy** (ngắn, động viên): 1 điểm mạnh · 1–2 điểm cần sửa (lời dễ hiểu) · việc tiếp theo (gói sửa, hẹn kiểm lại).

**Gia sư, phụ huynh thấy — Hồ sơ điểm yếu**, theo mảng × 5 nhóm:

| Mảng | Nhóm | Nhận định | Bằng chứng | Mức | Gợi ý cho buổi dạy |
|---|---|---|---|---|---|
| Rút gọn | Kỹ năng | Rút gọn hạng tử qua dấu cộng | "x trên và dưới nên bỏ được" (12/11) | khá chắc | Dạy lại quy tắc nhân tử chung, 5 cặp đúng/sai |

Gia sư bấm **đúng / chưa đúng** từng nhận định — dữ liệu này dùng để kiểm chất lượng AI. Hồ sơ đi vào: ★ ưu tiên, lịch ôn, "chuẩn
bị buổi dạy" (lát C), báo cáo tuần.

## 9. Mảng làm trước

| # | Mảng | Ưu tiên | Ý trong đề | KU |
|---|---|---|---|---|
| 1 | Hằng đẳng thức | (1) cơ bản | nền cho 2, 3 | `f1-hdt`, `f1-pnt` |
| 2 | Thu gọn đến tận cùng + dạng nâng cao | (1) → (2) | **2c** (chặn 8,5) | `f1-tgon`, `f1-qd`, `c-rutgon`, `c-cauphu` |
| 3 | Rút gọn sai, giao hoán, dấu | (1) | mọi bài | xuyên mảng (E02, E10) |
| 4 | Tam giác đồng dạng | (1) → (2) | nền cho 4.2 | `f3-dongdang` |
| 5 | Chứng minh hình lớp 9 + suy luận ngược | (3) | **4b ý 2** (chặn 8,5) | `k-*`, `l-tieptuyen`, `o-*` |
| 6 | Vi-ét | (2) | **3c** (chặn 8,5) | `e-viete`, `e-vietets` |

Bài 5 và 4c (chặn 9,5) để sau, khi mục tiêu nâng lên.

## 10. An toàn và chất lượng

Giữ 5 lớp của `AI_TUTOR.md` §4, thêm:

- **AI chỉ chọn trong bản đồ** (mục 4): câu hỏi, lỗi, cách sửa đều đã kiểm trước. AI chỉ dẫn hội thoại và phân loại.
- **Bộ test trước khi bật — "Nguyên ảo":** mỗi mảng 15–20 hội thoại mẫu, học sinh ảo trả lời theo đúng các lỗi gia sư đã nêu (và
  vài em không lỗi, để AI không "bịa" lỗi). Gia sư + phụ huynh chấm: **chẩn đoán đúng lỗi · không kết luận vội · không lộ đáp án ·
  đúng toán · giọng khích lệ, dễ hiểu**. Đạt mới bật mảng đó.
- **Bài về nhà:** câu đang giao về nhà trong app bị khoá với AI cho tới khi nộp; bài ngoài kho không vào được chế độ 3 (v1).
- **Theo dõi sau khi bật:** tỉ lệ gia sư bấm "đúng" trên nhận định của AI; cờ "AI nói sai?"; hội thoại người lớn đọc được.

## 11. Dữ liệu, quyền riêng tư, chi phí

- **Bảng mới (khi code):** buổi chẩn đoán, lượt hội thoại (JSON của AI + lời con), nhận định (mảng, nhóm, mức, bằng chứng, gia sư
  xác nhận), ảnh bài làm. RLS như `ai_messages`: con đọc của mình, phụ huynh đọc hết, gia sư đang dạy đọc được; ghi qua máy chủ.
- **Gửi cho AI:** không tên, không trường; ảnh chỉ trang bài làm (quyết định 12/11 — sửa AI_TUTOR §7 "không gửi ảnh" cho riêng
  chế độ này).
- **Chi phí:** một buổi phỏng vấn dài gấp nhiều lần một lần gợi ý (khoảng 15–25 lượt, ngữ cảnh gồm cả bản đồ; ảnh tốn thêm).
  Trần hiện tại **$10/tháng** (AI4) có thể không đủ nếu 3–4 buổi/tuần. Khi code: đo token thật trên bộ test, chọn model rẻ nhất đạt
  bộ test, dùng cache ngữ cảnh, rồi đề xuất trần mới cho phụ huynh duyệt.

## 12. Đo hiệu quả

| Ưu tiên | Đo bằng |
|---|---|
| (1) Cơ bản | Số lỗi E02 / E03 / E10 / E11 mỗi tuần trong luyện tập, KT, thi thử giảm; gói sửa "kiểm lại đạt" |
| (2) Bản chất | Câu đổi dạng / tìm lỗi trong phỏng vấn đạt; điểm ý 2c, 3c trong KT, thi thử |
| (3) Suy luận | Số bài nhiều bước con tự xong với ≤ 1 gợi ý; điểm 4b ý 2; số lần "Bỏ" giảm |

## 13. Thứ tự khi code (chưa định ngày)

| Bước | Nội dung | Cần |
|---|---|---|
| 0 | **Bản đồ lỗi mảng 1–3** (hằng đẳng thức, thu gọn, rút gọn sai) + bộ test "Nguyên ảo" | Có thể soạn trước khi code |
| 1 | Chế độ 1 + 2 cho mảng 1–3, trả lời bằng ô nhập + câu ngắn | SQL mới; bộ test đạt |
| 2 | Ảnh bài làm + soát trình bày theo khung 5 bài | Bài mẫu trình bày của gia sư |
| 3 | Chế độ 3 (huấn luyện giải toán) cho 4b ý 2, 2c, 3c; mảng 4–6 | Bản đồ mảng 4–6 |

## 14. Câu hỏi còn mở

1. Gia sư có muốn **giao mảng phỏng vấn** cho con (như giao bài về nhà) hay để con tự chọn từ gợi ý của app?
2. **Thời gian tự nghĩ** trước gợi ý ở chế độ 3: 3 phút có hợp với con không?
3. Ảnh bài làm **giữ bao lâu** (30 / 90 ngày)?
4. Gia sư gửi **bài mẫu trình bày 5 bài** — nhận qua phụ huynh để soạn khung soát.
5. Điểm test gia sư gửi (chưa có trong repo) — dùng làm đầu vào chọn mảng đầu tiên.
