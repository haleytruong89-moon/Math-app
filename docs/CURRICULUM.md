# Curriculum Design — App Toán

> **Source of truth:** This file lives in the repo and is the canonical reference for content creation order,
> KU definitions, and time estimates.
> Approved: 05/10/2026 (curriculum structure + time estimates confirmed by parent).
> Revised 05/10/2026 after the design review (decisions LT1–LT12 in `docs/SPEC.md` §0): timeline compressed to
> **12/10/2026 → 31/03/2027**, Track C starts earlier, table data fixed. The machine-readable copy of §2
> will live in `content/curriculum.json` (S6a); when both exist, the JSON is what the app uses and `npm test` keeps them in sync.
> Upstream: `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` (master plan, 51 sections, domains A–Q + F0–F3).
> Teacher assessment: Hằng đẳng thức chưa thuộc (F1.4), thu gọn đa thức chưa tận cùng (F1.1/F1.5/F1.6),
> nâng cao căn thức chưa làm được (C), hình cần đồng dạng (F3.7/F3.8), trình bày thiếu kết luận.
> Teacher score: hiện tối đa 8–8.5 nếu không luyện nghiêm túc; target 8.5–9.25 cho trường chuyên.

---

## 1. Cấu trúc tổng thể — 2 Track song song

Thay vì 4 giai đoạn tuần tự, chương trình tổ chức thành **2 track chạy song song** + 1 track mở sau:

```
Track A ─── Lõi đại số (prerequisite chain, nặng)
│ F1 → C → D → E → (F parabol) → G → H+Q
│
├── Track B ─── Quick wins (independent, nhẹ, 100% gradable)
│   A + B + P + I (song song với Track A từ ngày 1)
│
└── Track C ─── Hình học đường tròn (F3.7 ở GĐ2 từ tuần 7, J–O từ GĐ3 tuần 14)
    F3.7 → J → K → L → M/N → O
```

### Lý do chọn cấu trúc này

| Vấn đề của cấu trúc tuần tự | Cách 2 track giải quyết |
|---|---|
| A+B đặt quá muộn → mất điểm dễ | Track B cho làm A+B ngay tuần 1 |
| F3.7 đặt quá sớm (trước khi cần) | F3.7 chỉ mở ngay trước J–O |
| Không interleave được (D14) | Buổi 1 Track A + Buổi 2 Track B → tự nhiên xen kẽ |
| Gradability mù mờ cho scaffolded items | Track B 100% gradable → motivation sớm |
| 8 tuần toàn F1+C → chán | Track B chen vào giữ nhịp |

### Weekly learning pattern (D20: 4 buổi/tuần)

| Buổi | Nội dung | Track |
|------|----------|-------|
| 1 | 1 KU mới đại số | A |
| 2 | 1 KU mới quick-win | B |
| 3 | Tiếp tục hoặc ôn Track A | A |
| 4 | Ôn trộn A + B (interleaving, D14) | Mixed |

Cuối tuần có thể thêm buổi 5 để tăng tốc, đặc biệt ở GĐ 3–4 khi nội dung nặng hơn.
Khi Track B hết bài (khoảng tuần 13), buổi 2 chuyển sang Track C. App gợi ý 1 bài Track A + 1 bài Track B/C đã mở khoá, con chọn (LT3).

---

## 2. Bảng KU đầy đủ

### 2.1 Track A — Lõi đại số (19 KUs)

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | f1-hdt | backfill-dai-so | 7 hằng đẳng thức đáng nhớ | 8 | — | P0 | indirect | full | 35 | teacher-assessment | GV xác nhận: chưa thuộc → prerequisite #1 |
| 2 | f1-pnt | backfill-dai-so | Phân tích đa thức thành nhân tử | 8 | f1-hdt | P0 | indirect | full | 40 | teacher-assessment | 4 phương pháp: nhóm, HĐT, tách hạng tử, đặt nhân tử chung |
| 3 | f1-tgon | backfill-dai-so | Thu gọn đa thức & phân thức | 8 | f1-hdt, f1-pnt | P0 | 1.0 | scaffolded | 50 | teacher-assessment | GV: "không làm đến tận cùng" — 1đ đề thi. Scaffolded MCQ |
| 4 | f1-qd | backfill-dai-so | Quy đồng & điều kiện xác định | 8 | f1-tgon | P0 | indirect | scaffolded | 45 | master-plan §4 | ĐKXĐ = prerequisite trực tiếp cho C |
| 5 | c-dkxd | can-thuc | Điều kiện xác định biểu thức căn | 9 | f1-qd | P0 | 0.25 | full | 30 | master-plan §7 | MCQ: chọn ĐKXĐ đúng. Phản xạ: căn ≥ 0, mẫu ≠ 0 |
| 6 | c-coban | can-thuc | Căn thức cơ bản | 9 | c-dkxd | P0 | 0.25 | full | 40 | master-plan §7 | √(a²)=\|a\|, nhân/chia căn, đưa ra/vào dấu căn |
| 7 | c-truccan | can-thuc | Trục căn thức ở mẫu | 9 | c-coban | P0 | 0.25 | full | 40 | master-plan §7 | Numeric: nhập kết quả trục căn |
| 8 | c-rutgon | can-thuc | Rút gọn biểu thức chứa căn | 9 | c-truccan | P0 | 1.0 | scaffolded | 70 | master-plan §7 | ★GATE 8.5 — Bài 2 đề thi (1–1.5đ). Scaffolded: ĐKXĐ→nhân tử→dạng→kết quả |
| 9 | c-cauphu | can-thuc | Câu phụ sau rút gọn | 9 | c-rutgon | P0 | 0.5 | scaffolded | 65 | master-plan §7 | Covers C5–C12: tính giá trị, PT, BPT, so sánh, nguyên, max/min |
| 10 | d-ptbh | pt-bac-hai | PT bậc hai: biệt thức & công thức nghiệm | 9 | f1-qd | P0 | 0.5 | full | 40 | master-plan §8 | Δ, công thức nghiệm, công thức thu gọn. Numeric answers |
| 11 | d-nhamnghiem | pt-bac-hai | Nhẩm nghiệm & phân tích nhân tử qua nghiệm | 9 | d-ptbh | P1 | 0.25 | full | 35 | master-plan §8 | D5+D6: nhẩm a+b+c=0, a-b+c=0, phân tích |
| 12 | d-thamso | pt-bac-hai | PT bậc hai chứa tham số | 9 | d-ptbh | P0 | 0.5 | partial | 55 | master-plan §8 | D7: ĐK có nghiệm, 2 nghiệm phân biệt. MCQ cho ĐK + numeric |
| 13 | e-viete | viet | Viète cơ bản: tổng tích & biểu thức đối xứng | 9 | d-ptbh | P0 | 0.5 | full | 45 | master-plan §9 | E1–E5: S, P, x₁²+x₂², lập PT. Numeric answers |
| 14 | e-vietets | viet | Viète có tham số | 9 | e-viete, d-thamso | P0 | 0.5 | partial | 65 | master-plan §9 | ★GATE 8.5 — E6–E7: ĐK nghiệm + biểu thức đạt max/min |
| 15 | e-giaodiem | viet | Giao điểm parabol – đường thẳng & Viète | 9 | e-viete | P1 | 0.5 | partial | 55 | master-plan §9–10 | E9+F5–F8: hoành độ giao điểm, tham số |
| 16 | g-chuyendong | bai-toan-tt | Chuyển động & dòng nước | 9 | d-ptbh | P0 | 0.5 | partial | 55 | master-plan §11 | G4+G5: s=vt, xuôi/ngược dòng. Numeric answer nhưng setup khó grade |
| 17 | g-nangsuat | bai-toan-tt | Năng suất, làm chung, vòi nước | 9 | d-ptbh | P0 | 0.5 | partial | 55 | master-plan §11 | G6+G7: năng suất=1/t. Scaffolded: chọn bảng→lập PT→giải→kiểm tra |
| 18 | g-phantram | bai-toan-tt | Giá bán, lãi suất, tăng giảm % | 9 | d-ptbh | P1 | 0.5 | full | 45 | master-plan §11 | G2+G3+G9: numeric (tính tiền, lãi). Phần lớn auto-gradable |
| 19 | g-honhop | bai-toan-tt | Pha trộn, hình học có ẩn & dẫn tới PT bậc hai | 9 | d-ptbh | P1 | 0.5 | partial | 55 | master-plan §11 | G8+G10+G13: nồng độ, kích thước hình, PT bậc hai |

### 2.2 Track B — Quick wins (12 new + 2 existing = 14 KUs)

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | a-tanso | thong-ke | Tần số & tần số tương đối | 9 | — | P0 | 0.5 | full | 25 | master-plan §5 | A1–A3: bảng tần số, f=n/N, ghép nhóm. 100% MCQ+numeric |
| 21 | a-bieudo | thong-ke | Biểu đồ & khai thác dữ liệu | 9 | a-tanso | P0 | 0.5 | full | 30 | master-plan §5 | A4+A5: đọc biểu đồ, tỷ lệ, so sánh. MCQ |
| 22 | b-phepthu | xac-suat | Phép thử & không gian mẫu | 9 | — | P0 | 0.5 | full | 25 | master-plan §6 | B1+B2: liệt kê KQ, đếm. MCQ+numeric |
| 23 | b-xsuat | xac-suat | Xác suất cổ điển & một bước | 9 | b-phepthu | P0 | 0.5 | full | 30 | master-plan §6 | B3+B4: P(A)=n(A)/n(Ω). Numeric |
| 24 | b-haib | xac-suat | Xác suất hai bước & công cụ đếm | 9 | b-xsuat | P1 | 0.5 | full | 35 | master-plan §6 | B5+B6: sơ đồ cây, bảng 2 chiều, có/không hoàn lại. MCQ+numeric |
| 25 | p-trunon | hinh-khoi | Hình trụ & hình nón: công thức | 9 | — | P0 | 0.5 | full | 25 | master-plan §20 | P1+P2: Sxq, Stp, V. Numeric. Áp dụng công thức |
| 26 | p-cau | hinh-khoi | Hình cầu & hình bán cầu | 9 | p-trunon | P1 | 0.25 | full | 25 | master-plan §20 | P3+P4: S=4πR², V=4/3πR³. Phân biệt cong/toàn phần |
| 27 | p-ghep | hinh-khoi | Hình ghép, thể tích còn lại & vật liệu | 9 | p-trunon, p-cau | P0 | 0.5 | full | 35 | master-plan §20 | P5–P10: ghép hình, khoét, sơn, đổi đơn vị. Numeric |
| — | htl-1 | he-thuc-luong | Hệ thức lượng cơ bản | 9 | — | P0 | 0.5 | full | 30 | existing | ĐÃ CÓ — approved 02/10 |
| — | htl-2 | he-thuc-luong | Ứng dụng hệ thức lượng | 9 | htl-1 | P0 | 0.5 | full | 35 | existing | ĐÃ CÓ — approved 02/10 |
| 28 | i-giaitgv | he-thuc-luong | Giải tam giác vuông | 9 | htl-1 | P0 | 0.25 | full | 30 | master-plan §13 | I2–I5: sin/cos/tan, máy tính, độ/phút. Numeric |
| 29 | i-ungdung | he-thuc-luong | Ứng dụng TSLG: góc nâng/hạ & bài thực tế | 9 | i-giaitgv | P1 | 0.5 | full | 35 | master-plan §13 | I6–I8: chiều cao, khoảng cách, nhiều bước. Numeric |
| 30 | f-hamso | ham-so | Hàm số bậc nhất & mặt phẳng Oxy | 9 | — | P1 | 0.25 | full | 30 | master-plan §10 | F1+F2: vẽ, đọc tọa độ, tìm hệ số. MCQ+numeric |
| 31 | f-parabol | ham-so | Parabol y=ax² & điểm thuộc đồ thị | 9 | f-hamso | P1 | 0.25 | full | 35 | master-plan §10 | F3+F4: tính a, tọa độ đỉnh. Numeric |

### 2.3 Track C — Hình học đường tròn (12 KUs; f3-dongdang ở GĐ2, J–O từ GĐ3)

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 32 | f3-dongdang | backfill-hinh | Tam giác đồng dạng & tỉ số cạnh | 8 | — | P0 | indirect | partial | 50 | teacher-assessment | GV: hình báo động. F3.7+F3.8: dấu hiệu, tỉ số, tính cạnh |
| 33 | j-coban | duong-tron | Đường tròn: tâm, bán kính, dây, góc ở tâm | 9 | — | P0 | 0.25 | full | 30 | master-plan §14 | J1–J4: khái niệm cơ bản. MCQ+numeric |
| 34 | j-cung | duong-tron | Cung, độ dài cung & hình quạt tròn | 9 | j-coban | P1 | 0.25 | full | 30 | master-plan §14 | J5–J8: l=πRn/180, S quạt. Numeric |
| 35 | k-goiintiep | noi-tiep | Góc nội tiếp & các tính chất | 9 | j-coban | P0 | 0.5 | partial | 45 | master-plan §15 | K1–K3: chắn nửa ĐT→90°, cùng chắn cung. MCQ+proof |
| 36 | k-tugiacnt | noi-tiep | Tứ giác nội tiếp: dấu hiệu & ứng dụng | 9 | k-goiintiep | P0 | 0.5 | partial | 55 | master-plan §15 | K4–K7: 4 dấu hiệu, NT→ĐD→tích đoạn. Proof-heavy |
| 37 | l-tieptuyen | tiep-tuyen | Tiếp tuyến: dấu hiệu & hai TT từ một điểm | 9 | j-coban | P0 | 0.5 | partial | 50 | master-plan §16 | L1–L3: OC⊥d, AB=AC. MCQ+proof |
| 38 | l-kethop | tiep-tuyen | Tiếp tuyến kết hợp dây – góc – đồng dạng | 9 | l-tieptuyen, k-tugiacnt | P1 | 0.5 | tutor | 65 | master-plan §16 | L4+L5: bài tổng hợp. Gia sư chấm |
| 39 | m-vitri | vi-tri-td | Vị trí tương đối: điểm, đường thẳng, 2 đường tròn | 9 | j-coban | P1 | 0.25 | full | 35 | master-plan §17 | M1–M5: phân loại vị trí, tiếp xúc. MCQ |
| 40 | n-ngoainoi | vi-tri-td | Đường tròn ngoại tiếp & nội tiếp tam giác | 9 | k-goiintiep | P1 | 0.25 | partial | 40 | master-plan §18 | N1–N5: tâm = giao trung trực/phân giác. MCQ+proof |
| 41 | o-chungminh | hinh-nang-cao | CM vuông góc, song song, thẳng hàng, đồng quy | 9 | k-tugiacnt, f3-dongdang | P1 | 0.5 | tutor | 70 | master-plan §19 | O1–O6: proof skeleton. Gia sư chấm |
| 42 | o-dongdang | hinh-nang-cao | Đồng dạng trong đường tròn & tích đoạn thẳng | 9 | o-chungminh, l-tieptuyen | P1 | 0.5 | tutor | 70 | master-plan §19 | O7–O8: NT→ĐD→tỉ số→PA·PB=PC·PD |
| 43 | o-nangcao | hinh-nang-cao | Điểm cố định, đường cố định & điểm di động | 9 | o-dongdang | P2 | 0.5 | tutor | 75 | master-plan §19 | ★GATE 9.5 — O9–O15. Chỉ cho HS có năng lực |

### 2.4 BĐT & Tối ưu (5 KUs, mở cuối Track A)

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 44 | h-bdt | toi-uu | Bất đẳng thức: tính chất & xét hiệu | 9 | f1-hdt | P1 | 0.25 | partial | 40 | master-plan §12 | H1–H5: đổi chiều, bình phương ≥ 0. MCQ+proof |
| 45 | hq-amgm | toi-uu | AM-GM / Cauchy & tìm MAX/MIN | 9 | h-bdt | P0 | 0.5 | partial | 50 | master-plan §12+21 | H6–H9 + Q2–Q3: a+b≥2√(ab), ĐK dấu bằng |
| 46 | hq-doanhthu | toi-uu | Tối ưu kinh tế: doanh thu, lợi nhuận, chi phí | 9 | hq-amgm, d-ptbh | P0 | 0.5 | partial | 55 | master-plan §21 | Q1+Q4–Q6: R=giá×SL, L=(bán−vốn)×SL |
| 47 | hq-hinhhoc | toi-uu | Tối ưu hình học: diện tích, thể tích, hộp cắt góc | 9 | hq-amgm | P0 | 0.5 | partial | 55 | master-plan §21 | Q7–Q10: chu vi cố định→S max, hộp không nắp |
| 48 | hq-nangcao | toi-uu | Tối ưu rời rạc & bài tổng hợp | 9 | hq-doanhthu, hq-hinhhoc | P2 | 0.5 | tutor | 65 | master-plan §21 | ★GATE 9.5 — Q11–Q16: x nguyên, BĐT hình học, parabol |

### 2.5 Tổng kết

| Nhóm | Modules | KUs mới | KUs có sẵn | Tổng |
|------|---------|---------|------------|------|
| Track A — Lõi đại số | backfill-dai-so, can-thuc, pt-bac-hai, viet, bai-toan-tt | 19 | 0 | 19 |
| Track B — Quick wins | thong-ke, xac-suat, hinh-khoi, he-thuc-luong, ham-so | 12 | 2 | 14 |
| Track C — Hình học | backfill-hinh, duong-tron, noi-tiep, tiep-tuyen, vi-tri-td, hinh-nang-cao | 12 | 0 | 12 |
| H+Q — BĐT & Tối ưu | toi-uu | 5 | 0 | 5 |
| **Tổng** | **17 modules** | **48 new** | **2 existing** | **50** |

---

## 3. Ước tính thời gian

### 3.1 Tổng thời gian

| Hạng mục | Giờ |
|----------|-----|
| Initial learning (50 KUs) | ~42h |
| Ôn tập 3 vòng (D+1, D+7, D+21) | ~30h |
| Retry cho ~30% KUs fail lần đầu | ~5h |
| Mixed review / interleaving hàng tuần | ~13h |
| **Tổng** | **~90 giờ** |

### 3.2 Quy về ngày / buổi

| Chế độ | Buổi/tuần | Phút/buổi | Phút/ngày (TB) | Phù hợp |
|--------|-----------|-----------|-----------------|---------|
| **Mức chuẩn (đã chốt)** | 4 | ~55 | ~32 | Xong 50 KU trước 31/03/2027 |
| Mức thoải mái | 5 | ~45 | ~32 | Cùng tổng giờ, buổi ngắn hơn |
| Mức đẩy nhanh | 5 | ~55 | ~39 | Có buffer cho tuần Tết / tuần ốm |

> **Mốc đã chốt 05/10/2026:** bắt đầu **thứ Hai 12/10/2026**, học xong 50 KU trước **31/03/2027**
> (~24 tuần, trừ ~1,5 tuần Tết ≈ 23 tuần học). Tháng 4–5/2027: chỉ luyện đề + ôn duy trì trong app.
> Thi dự kiến đầu tháng 6/2027 (chờ Sở GD công bố). Đến 31/03 cần ~85 giờ (phần ôn D+21 của các KU cuối rơi sang tháng 4)
> → ~3,7 giờ/tuần, tức 4 buổi × ~55 phút, nhiều hơn mức 26 tuần ban đầu ~10%.

### 3.3 Phân bổ theo giai đoạn (lịch nén, 12/10/2026 → 31/03/2027)

| GĐ | Tuần | Ngày | Track A | Track B/C | KU mới | Ghi chú |
|----|------|------|---------|-----------|--------|---------|
| 1 | 1–6 | 12/10 – 22/11 | F1 backfill (4) | A (2) + B (3) + P (3) | 12 | Tuần 1: htl-1/2 trên app + F1 với gia sư trên giấy; F1 lên app từ tuần 2 |
| 2 | 7–13 | 23/11 – 10/01 | C (5) + D (3) | I (2) + F hàm số (2) + f3-dongdang | 13 | C nặng nhất; bù nền hình (đồng dạng) sớm vì GV báo động |
| 3 | 14–19 | 11/01 – 21/02 | E (3) + G (4) | j-coban, j-cung, k-goiintiep, k-tugiacnt, l-tieptuyen | 12 | Tuần 17–18 (01–14/02) Tết: chỉ ôn. **Xong gate 8.5 cuối GĐ3** |
| 4 | 20–25 | 22/02 – 31/03 | H+Q (5) | l-kethop, m-vitri, n-ngoainoi, o-chungminh, o-dongdang, o-nangcao | 11 | Nặng nhất. **Gate 9.5 xong 31/03** |
| — | 26–34 | 01/04 – đầu 06 | — | — | 0 | Luyện đề (gia sư + giấy), app chỉ còn ôn D+21 và ôn duy trì |

### 3.4 Estimation per KU (cách tính chi tiết)

Mỗi KU gồm: theory → worked example → faded example → 8 practice → 5 exit test.

| Mức khó | KUs | First pass | 3 vòng ôn | Retry (30%) | Tổng/KU |
|---------|-----|-----------|-----------|-------------|---------|
| Dễ (A, B, P, I cơ bản) | ~13 | ~25 min | ~17 min | +5 min | **~47 min** |
| Trung bình (F1, C basics, D, F hàm số) | ~15 | ~42 min | ~28 min | +6 min | **~76 min** |
| Khó (C rút gọn, E tham số, G, H+Q, J–O) | ~22 | ~62 min | ~42 min | +8 min | **~112 min** |

---

## 4. Exam gate analysis

### 4.1 Gate 8.5 (ý 2c + 3c + 4b ý 2)

| Câu hỏi gate | KU cần | Track |
|---|---|---|
| Ý 2c: rút gọn nâng cao căn thức (C) | c-rutgon, c-cauphu | A |
| Ý 3c: Viète tham số (E6) | e-vietets | A |
| Bài 4b ý 2: hình học chứng minh | k-tugiacnt, l-tieptuyen | C |

**→ Để đạt 8.5: phải hoàn thành Track A đến e-vietets (14 KUs) + Track C đến l-tieptuyen (6 KUs) = 20 KUs. Theo lịch nén: xong cuối GĐ3 (~21/02/2027).**

### 4.2 Gate 9.5 (ý 5 + 4c)

| Câu hỏi gate | KU cần | Track |
|---|---|---|
| Ý 5: tối ưu thực tế (Q) | hq-doanhthu, hq-hinhhoc, hq-nangcao | H+Q |
| Ý 4c: hình học nâng cao (O) | o-dongdang, o-nangcao | C |

**→ Để đạt 9.5: phải hoàn thành toàn bộ chương trình (50 KUs).**

### 4.3 Exam coverage matrix (from master plan §22)

| Phần đề | Điểm | Domains | KUs chính |
|---|---|---|---|
| Bài 1: Thống kê + Xác suất | 2đ | A, B | a-tanso, a-bieudo, b-phepthu, b-xsuat, b-haib |
| Bài 2: Căn thức + câu phụ | 1–1.5đ | C | c-dkxd → c-cauphu |
| Bài 3.1–3.2: Bài toán thực tế | 1đ | G | g-chuyendong, g-nangsuat, g-phantram, g-honhop |
| Bài 3.3: PT bậc hai / Viète | 1–1.5đ | D, E, F | d-ptbh → e-giaodiem |
| Bài 4.1: Hình khối | 0.5–1đ | P | p-trunon, p-cau, p-ghep |
| Bài 4.2: Hình học đường tròn | 1–2đ | J–O | j-coban → o-nangcao |
| Bài 5: Tối ưu / vận dụng | 1–1.5đ | H, Q | h-bdt → hq-nangcao |

---

## 5. Gradability map

App grading capabilities: MCQ (2–6 options) và single exact numeric. **KHÔNG chấm được:** biểu thức có biến, cặp nghiệm, tập nghiệm, chứng minh hình học tự do, đồ thị.

| Mức | Ý nghĩa | KU count | KUs |
|---|---|---|---|
| **full** | Mọi câu là MCQ / đáp số → app tự chấm | 26 | f1-hdt, f1-pnt, c-dkxd, c-coban, c-truccan, d-ptbh, d-nhamnghiem, e-viete, g-phantram, a-tanso, a-bieudo, b-phepthu, b-xsuat, b-haib, p-trunon, p-cau, p-ghep, htl-1, htl-2, i-giaitgv, i-ungdung, f-hamso, f-parabol, j-coban, j-cung, m-vitri |
| **scaffolded** | Dùng câu nhiều bước (item type `steps`, LT5) → app tự chấm hết | 4 | f1-tgon, f1-qd, c-rutgon, c-cauphu |
| **partial** | App chấm phần MCQ/đáp số/nhiều bước; phần chứng minh / tập nghiệm làm trên giấy với gia sư → nhãn "cần gia sư xác nhận" (LT6) | 15 | d-thamso, e-vietets, e-giaodiem, g-chuyendong, g-nangsuat, g-honhop, f3-dongdang, k-goiintiep, k-tugiacnt, l-tieptuyen, n-ngoainoi, h-bdt, hq-amgm, hq-doanhthu, hq-hinhhoc |
| **tutor** | App chỉ có phần nhận dạng / bước then chốt; kỹ năng chính (chứng minh tự do) gia sư chấm trên giấy | 5 | l-kethop, o-chungminh, o-dongdang, o-nangcao, hq-nangcao |

**30/50 KU (60%) app tự chấm toàn bộ** (full + scaffolded). 20 KU có phần gia sư: mức trong app tính trên phần tự chấm,
mức cuối = gia sư đề xuất (S3) + phụ huynh chốt (S4). Các KU g-chuyendong, g-nangsuat dùng thêm câu nhiều bước cho phần lập phương trình.

### Câu nhiều bước (scaffolded → item type `steps`)

Thay vì hỏi "Rút gọn P" (app không chấm được toàn bộ), tách thành chuỗi MCQs:

```
Step 1: ĐKXĐ → MCQ: chọn điều kiện đúng (4 options)
Step 2: Nhân tử mẫu → MCQ: chọn phân tích đúng
Step 3: Dạng rút gọn → MCQ: chọn kết quả rút gọn
Step 4: Tính giá trị → Numeric: nhập đáp số
```

→ Mỗi bước tự chấm. Cả chuỗi tính là **1 câu**: đúng khi đúng hết; mã lỗi lấy ở bước sai đầu tiên; khi luyện tập sai bước nào được gợi ý ngay bước đó; khi ôn lấy cả chuỗi (LT5).

---

## 6. Trả lời H1–H6

### H1. Bắt đầu từ đâu?

**Trả lời:** Bắt đầu từ **F1 backfill** (hằng đẳng thức, nhân tử, thu gọn), KHÔNG phải I (đã có) hay A (quá dễ để bắt đầu một mình).

**Lý do:** Teacher assessment xác nhận F1 là lỗ hổng #1 — thiếu nền tảng thì C, D, E đều không học được. Track B (A+B+P) chạy song song để giữ motivation.

### H2. Có cần KU bắt buộc cho lớp 7–8?

**Trả lời:** Có, bắt buộc 5 KUs:
- **F1:** f1-hdt, f1-pnt, f1-tgon, f1-qd (4 KUs — prerequisite cho C, D, E)
- **F3:** f3-dongdang (1 KU — prerequisite cho J, K, O)

F0 (số học nền) và F2 (PT bậc nhất) giả định đã biết — không tạo KU riêng.

### H3. Hình học mở khi nào?

**Trả lời (sửa 05/10 theo lịch nén):** f3-dongdang ở GĐ2 (tuần 7–13) vì GV báo động phần hình; Track C chạy từ GĐ3:
1. f3-dongdang (bù nền đồng dạng, GĐ2)
2. J đường tròn cơ bản → K góc / tứ giác nội tiếp → L tiếp tuyến (GĐ3, tuần 14–19) — **đủ gate 8.5 câu 4b**
3. L kết hợp, M/N vị trí tương đối + ngoại/nội tiếp, O nâng cao (GĐ4, tuần 20–25)

Chứng minh viết tự do làm trên giấy với gia sư (LT6); app luyện nhận dạng, tính góc/độ dài, bước then chốt.

### H4. Những KU nào app chấm được 100%?

**Trả lời:** 26 KU full + 4 KU câu nhiều bước = **30/50 (60%)**. Danh sách ở §5.
(Bản trước ghi 28 + 6 = 34 — số đếm không khớp bảng, đã sửa 05/10.)

### H5. Giải pháp cho KUs "partial"?

**Trả lời (chốt LT5, LT6):**
1. **Câu nhiều bước** — f1-tgon, f1-qd, c-rutgon, c-cauphu và phần lập PT của g-chuyendong, g-nangsuat.
2. **Hybrid** — app chấm phần MCQ/đáp số; phần chứng minh/tập nghiệm làm trên giấy, KU gắn nhãn "cần gia sư xác nhận". 15 KU partial.
3. **Gia sư là chính** — 5 KU tutor; app chỉ giữ phần nhận dạng. Không có chụp ảnh bài làm trong P1.

### H6. Thứ tự tạo content? (lịch nén, duyệt xong trước ngày ở cột cuối)

**Nguyên tắc:** (1) chuỗi tiên quyết, (2) trọng số đề, (3) loại chấm. Nội dung phải **được duyệt trước khi cần học ít nhất 1–2 tuần**.
Mỗi KU qua kiểm tra độc lập (agent thứ hai giải lại + script tính lại đáp số) trước khi tới phụ huynh; gia sư soát đợt có C, E, G (LT10).

| Đợt | KUs | Cần cho | Duyệt xong trước |
|------|------|-------|-----|
| 1 | f1-hdt, f1-pnt, a-tanso, b-phepthu | GĐ1 tuần 2 (chỉ cần S6a) | 18/10/2026 |
| 2 | f1-tgon, f1-qd, a-bieudo, b-xsuat | GĐ1 tuần 3 (cần S6b: nhiều bước, hình) | 25/10/2026 |
| 3 | p-trunon, p-cau, p-ghep, b-haib, c-dkxd | GĐ1 cuối, GĐ2 đầu | 08/11/2026 |
| 4 | c-coban, c-truccan, c-rutgon, c-cauphu | GĐ2 (gate 8.5) — gia sư soát | 22/11/2026 |
| 5 | d-ptbh, d-nhamnghiem, d-thamso, f3-dongdang, i-giaitgv, i-ungdung | GĐ2 | 06/12/2026 |
| 6 | f-hamso, f-parabol, e-viete, e-vietets, e-giaodiem | GĐ2 cuối, GĐ3 (gate 8.5) — gia sư soát | 27/12/2026 |
| 7 | g-chuyendong, g-nangsuat, g-phantram, g-honhop, j-coban, j-cung | GĐ3 — gia sư soát G | 10/01/2027 |
| 8 | k-goiintiep, k-tugiacnt, l-tieptuyen, h-bdt, hq-amgm | GĐ3 (gate 8.5), GĐ4 | 31/01/2027 |
| 9 | l-kethop, m-vitri, n-ngoainoi, hq-doanhthu, hq-hinhhoc | GĐ4 | 14/02/2027 |
| 10 | o-chungminh, o-dongdang, o-nangcao, hq-nangcao | GĐ4 (gate 9.5) | 01/03/2027 |

Tổng 48 KU mới (+ htl-1, htl-2 đã có). Trung bình ~2,5 KU/tuần soạn; phụ huynh duyệt ~1–1,5 giờ/tuần.

---

## 7. Interleaved sequence — 10 KUs đầu tiên (approved)

Thứ tự xen kẽ Track A và Track B để giữ motivation và interleaving (D14):

| # | id | track | module | title | prereq | gradable | examWeight |
|---|---|---|---|---|---|---|---|
| 1 | f1-hdt | A | backfill-dai-so | 7 hằng đẳng thức đáng nhớ | — | full | indirect |
| 2 | a-tanso | B | thong-ke | Tần số & tần số tương đối | — | full | 0.5 |
| 3 | f1-pnt | A | backfill-dai-so | Phân tích đa thức thành nhân tử | f1-hdt | full | indirect |
| 4 | b-phepthu | B | xac-suat | Phép thử & không gian mẫu | — | full | 0.5 |
| 5 | f1-tgon | A | backfill-dai-so | Thu gọn đa thức & phân thức | f1-hdt, f1-pnt | scaffolded | 1.0 |
| 6 | a-bieudo | B | thong-ke | Biểu đồ & khai thác dữ liệu | a-tanso | full | 0.5 |
| 7 | f1-qd | A | backfill-dai-so | Quy đồng & điều kiện xác định | f1-tgon | scaffolded | indirect |
| 8 | b-xsuat | B | xac-suat | Xác suất cổ điển & ứng dụng | b-phepthu | full | 0.5 |
| 9 | c-dkxd | A | can-thuc | Điều kiện xác định biểu thức căn | f1-qd | full | 0.25 |
| 10 | p-trunon | B | hinh-khoi | Hình trụ & hình nón: công thức | — | full | 0.5 |

---

## 8. Module registry

Map giữa module ID và domain(s) trong master plan:

| module id | domain(s) | units | title |
|---|---|---|---|
| backfill-dai-so | F1 | f1-hdt, f1-pnt, f1-tgon, f1-qd | Bù lỗ hổng đại số lớp 7–8 |
| backfill-hinh | F3 | f3-dongdang | Bù lỗ hổng hình học lớp 8 |
| thong-ke | A | a-tanso, a-bieudo | Thống kê |
| xac-suat | B | b-phepthu, b-xsuat, b-haib | Xác suất |
| can-thuc | C | c-dkxd, c-coban, c-truccan, c-rutgon, c-cauphu | Căn bậc hai & biểu thức chứa căn |
| pt-bac-hai | D | d-ptbh, d-nhamnghiem, d-thamso | Phương trình bậc hai |
| viet | E | e-viete, e-vietets, e-giaodiem | Định lý Viète |
| ham-so | F | f-hamso, f-parabol | Hàm số & parabol |
| bai-toan-tt | G | g-chuyendong, g-nangsuat, g-phantram, g-honhop | Giải bài toán bằng PT/HPT |
| hinh-khoi | P | p-trunon, p-cau, p-ghep | Hình khối trong thực tiễn |
| he-thuc-luong | I | htl-1, htl-2, i-giaitgv, i-ungdung | Hệ thức lượng trong tam giác vuông |
| duong-tron | J | j-coban, j-cung | Đường tròn cơ bản |
| noi-tiep | K | k-goiintiep, k-tugiacnt | Góc & tứ giác nội tiếp |
| tiep-tuyen | L | l-tieptuyen, l-kethop | Tiếp tuyến |
| vi-tri-td | M, N | m-vitri, n-ngoainoi | Vị trí tương đối & ngoại/nội tiếp |
| hinh-nang-cao | O | o-chungminh, o-dongdang, o-nangcao | Hình học tổng hợp nâng cao |
| toi-uu | H, Q | h-bdt, hq-amgm, hq-doanhthu, hq-hinhhoc, hq-nangcao | BĐT & tối ưu |

---

## 9. Implementation notes

### 9.1 Content JSON structure (per KU)

Mỗi KU = 1 file `content/<module>/<unit-id>.json` theo schema thật (`src/lib/content/schema.ts`):

```json
{
  "id": "c-rutgon", "module": "can-thuc", "order": 4,
  "title": "Rút gọn biểu thức chứa căn",
  "status": "draft",
  "estMinutes": 70,
  "theory": ["…", "…"],
  "worked": { "problem": "…", "steps": [{ "text": "…", "why": "…" }], "selfExplain": "…" },
  "faded":  { "problem": "…", "steps": [{ "text": "…" }, { "prompt": "…", "item": { } }] },
  "practice": [ /* 8 items */ ],
  "exit":     [ /* 5 items */ ]
}
```

Thay đổi schema trong S6a/S6b (xem `docs/P1_PLAN.md`):
- `estMinutes` tối đa 60 → **90** (8 KU dài 65–75 phút chia làm 2 buổi; tiến độ giữa các buổi đã được lưu).
- `figure` từ enum cố định → thêm dạng **SVG inline** (LT7), đặt được ở unit hoặc từng câu.
- Item type mới **`steps`** (LT5).
- Track, thứ tự, tiên quyết, trọng số đề, loại chấm, cờ "cần gia sư xác nhận" **không** nằm trong file KU mà trong `content/curriculum.json` (LT1).
- Module: `domain` (1 chữ A–Q) → `domains` cho phép `F1`, `F3` và nhiều domain (`["H","Q"]`, `["M","N"]`).

### 9.2 KU per-item format (app capabilities)

| Item type | Input | Grade method | Example |
|---|---|---|---|
| `mcq` | 2–6 options, 1 correct | Chọn đúng/sai, đáp án sai gắn mã lỗi | "ĐKXĐ của √(x−3) là?" → A) x>3 B) x≥3 C) x≤3 D) x<3 |
| `numeric` | Một số chính xác | Nhận dạng tương đương (`12/5` = `2,4`; `2√3` = `√12`), **không** nhận số làm tròn của số vô tỉ | "Tính Δ khi a=1, b=−3, c=2" → 1 |
| `steps` (mới, S6b) | Đề chung + 2–5 bước MCQ/numeric | Tính 1 câu; đúng khi đúng hết; mã lỗi ở bước sai đầu tiên | Rút gọn P: ĐKXĐ → phân tích mẫu → kết quả → giá trị tại x=… |

Items app **KHÔNG chấm được** (cần tutor):
- Biểu thức có biến (e.g. "Rút gọn P = ...")
- Cặp nghiệm / tập nghiệm
- Chứng minh hình học viết tự do (C5 trong D12)
- Vẽ đồ thị

### 9.3 Review schedule integration

Per D14 + SPEC.md §0:
- D+1: 3 questions, pass ≥ 2/3
- D+7: 3 questions, pass ≥ 2/3
- D+21: 3 questions, pass ≥ 2/3 → M4
- Fail → back to D+1
- Pass + "easy" → next interval ×1.5
- After D+21: maintenance review every 60 days until exam
- Tối đa 5 bài/phiên ôn, bài quá hạn lâu nhất trước (LT8)

### 9.4 Mastery levels (confirmed in SPEC.md §0)

- **M0:** Chưa biết
- **M1:** Hiểu khi hướng dẫn
- **M2:** ≥60% last 5 practice first-tries
- **M3:** ≥80% exit test, no error code repeated ≥ 2
- **M4:** M3 + passed D+21 review
- **Kiểm tra vượt (LT4):** với Track B và nhóm bù nền F1/F3, làm thẳng bài kiểm tra 1 lần; ≥ 80% và không lặp mã lỗi → M3 + lịch ôn D+1; chưa đạt → học bình thường
- **Mở khoá (LT2):** mọi bài tiên quyết đạt M3, hoặc phụ huynh mở tay

### 9.5 What this document does NOT cover

- Exact item content (problems, solutions, distractors) — that's the content creation work
- Source mapping to 68-đề PDF — deferred until PDF is read (157 pages)
- AI tutor prompts (D9) — separate design doc
- Error taxonomy E01–E15 mapping per KU — deferred to content creation phase
- Hint ladder H0–H6 per item — deferred to content creation phase

---

## Changelog

| Date | Change |
|---|---|
| 05/10/2026 | Initial version: 2-track structure, 50 KUs, time estimates, H1–H6. Approved by parent. |
| 05/10/2026 | Design review (LT1–LT12): timeline 12/10/2026 → 31/03/2027; f3-dongdang to GĐ2, Track C from GĐ3; 13 rows given their missing examWeight; gradability counts reconciled (26/4/15/5, 60% fully auto); content batches re-dated; §9 matches the real schema + planned changes. |
