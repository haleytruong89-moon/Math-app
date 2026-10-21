# Curriculum Design — App Toán

> **Source of truth:** This file lives in the repo and is the canonical reference for content creation order,
> KU definitions, and time estimates.
> Approved: 05/10/2026 (curriculum structure + time estimates confirmed by parent).
> Revised 05/10/2026 after the design review (decisions LT1–LT12 in `docs/SPEC.md` §0): timeline compressed to
> **12/10/2026 → 31/03/2027**, Track C starts earlier, table data fixed. The machine-readable copy of §2
> will live in `content/curriculum.json` (S6a); when both exist, the JSON is what the app uses and `npm test` keeps them in sync.
> Revised 06/10/2026 (LT17–LT18) after indexing 68 practice papers + Hà Nội 2025/2026 structure (`docs/SOURCE_INDEX.md`):
> 8 rarely-tested KUs moved to **P2**, optimisation merged 5 → 3 KUs, Track C starts week 7. **48 KUs: 40 core + 8 P2.** · 17/10/2026 (LT19): Bài toán thực tế bằng PT/HPT kéo lên đợt 4 theo đánh giá của gia sư; thêm g-giaihpt, g-chuso → **50 KUs: 42 core + 8 P2.** · 21/10/2026 (LT21): rà soát hình học — thêm f3-tugiac (bù lớp 8), tách o-chungminh → o-chungminh + o-thanghang, gộp l-kethop vào l-tieptuyen/o-dongdang, thêm q-dagiac (P2) → **52 KUs: 43 core + 9 P2.**
> Upstream: `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` (master plan, 51 sections, domains A–Q + F0–F3).
> Teacher assessment: Hằng đẳng thức chưa thuộc (F1.4), thu gọn đa thức chưa tận cùng (F1.1/F1.5/F1.6),
> nâng cao căn thức chưa làm được (C), hình cần đồng dạng (F3.7/F3.8), trình bày thiếu kết luận.
> Teacher score: hiện tối đa 8–8.5 nếu không luyện nghiêm túc; target 8.5–9.25 cho trường chuyên.

---

## 1. Cấu trúc tổng thể — 2 Track song song

Thay vì 4 giai đoạn tuần tự, chương trình tổ chức thành **2 track chạy song song** + 1 track mở sau:

```
Track A ─── Lõi đại số (prerequisite chain, nặng)
│ F1 → C → D → E → G → H+Q
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

### Weekly learning pattern (SPEC §0: 4 buổi/tuần)

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

### 2.1 Track A — Lõi đại số (21 KUs)

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
| 15 | e-giaodiem | viet | Giao điểm parabol – đường thẳng & Viète | 9 | e-viete | P2 | 0.5 | partial | 55 | master-plan §9–10 | E9+F5–F8: hoành độ giao điểm, tham số — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 49 | g-giaihpt | bai-toan-tt | Giải hệ PT bậc nhất hai ẩn | 9 | — | P0 | 0.5 | full | 45 | LT19 (gia sư, SGK Toán 9 chương 1) | Thế, cộng đại số, đặt ẩn phụ $u=\frac1x$; hệ vô nghiệm/vô số nghiệm. Numeric + MCQ |
| 50 | g-chuso | bai-toan-tt | Toán chữ số & tìm số | 9 | g-giaihpt | P1 | 0.25 | full | 40 | LT19 (chuyên đề gia sư §1) | $\overline{ab}=10a+b$, đổi chỗ chữ số, điều kiện chữ số. Câu nhiều bước |
| 16 | g-chuyendong | bai-toan-tt | Chuyển động & dòng nước | 9 | g-giaihpt | P0 | 0.5 | partial | 55 | master-plan §11 | G4+G5: s=vt, xuôi/ngược dòng. Numeric answer nhưng setup khó grade |
| 17 | g-nangsuat | bai-toan-tt | Năng suất, làm chung, vòi nước | 9 | g-giaihpt | P0 | 0.5 | partial | 55 | master-plan §11 | G6+G7: năng suất=1/t. Scaffolded: chọn bảng→lập PT→giải→kiểm tra |
| 18 | g-phantram | bai-toan-tt | Giá bán, lãi suất, tăng giảm % | 9 | g-giaihpt | P1 | 0.5 | full | 45 | master-plan §11 | G2+G3+G9: numeric (tính tiền, lãi). Phần lớn auto-gradable |
| 19 | g-honhop | bai-toan-tt | Bài toán dẫn tới PT bậc hai & pha trộn | 9 | d-ptbh | P1 | 0.5 | partial | 55 | master-plan §11 | G8+G10+G13: nồng độ, kích thước hình, PT bậc hai |

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
| — | htl-1 | he-thuc-luong | Bốn hệ thức lượng: hiểu và nhớ | 9 | — | P0 | 0.5 | full | 20 | existing | ĐÃ CÓ — approved 02/10 |
| — | htl-2 | he-thuc-luong | Tính độ dài bằng hệ thức lượng | 9 | htl-1 | P0 | 0.5 | full | 25 | existing | ĐÃ CÓ — approved 02/10. Tiêu đề + thời lượng lấy theo file nội dung |
| 28 | i-giaitgv | he-thuc-luong | Giải tam giác vuông | 9 | htl-1 | P2 | 0.25 | full | 30 | master-plan §13 | I2–I5: sin/cos/tan, máy tính, độ/phút. Numeric — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 29 | i-ungdung | he-thuc-luong | Ứng dụng TSLG: góc nâng/hạ & bài thực tế | 9 | i-giaitgv | P2 | 0.5 | full | 35 | master-plan §13 | I6–I8: chiều cao, khoảng cách, nhiều bước. Numeric — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 30 | f-hamso | ham-so | Hàm số bậc nhất & mặt phẳng Oxy | 9 | — | P2 | 0.25 | full | 30 | master-plan §10 | F1+F2: vẽ, đọc tọa độ, tìm hệ số. MCQ+numeric — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 31 | f-parabol | ham-so | Parabol y=ax² & điểm thuộc đồ thị | 9 | f-hamso | P2 | 0.25 | full | 35 | master-plan §10 | F3+F4: tính a, tọa độ đỉnh. Numeric — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |

### 2.3 Track C — Hình học đường tròn (12 KUs; f3-dongdang ở GĐ2, J–O từ GĐ3)

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 32 | f3-dongdang | backfill-hinh | Tam giác đồng dạng & tỉ số cạnh | 8 | — | P0 | indirect | partial | 50 | teacher-assessment | GV: hình báo động. F3.7+F3.8: dấu hiệu, tỉ số, tính cạnh |
| 51 | f3-tugiac | backfill-hinh | Tứ giác đặc biệt, đường trung bình & Thalès | 8 | — | P0 | indirect | partial | 50 | LT21 (rà soát 68 đề) | F3: dấu hiệu hình bình hành / chữ nhật / thoi / vuông, đường trung bình tam giác – hình thang, Thalès, tính chất đường phân giác. Công cụ của ~21 câu "trung điểm", 7 câu "hình bình hành / cân" ở Bài 4.2 |
| 33 | j-coban | duong-tron | Đường tròn: tâm, bán kính, dây, góc ở tâm | 9 | — | P0 | 0.25 | full | 30 | master-plan §14 | J1–J4: khái niệm cơ bản. MCQ+numeric |
| 34 | j-cung | duong-tron | Cung, độ dài cung & hình quạt tròn | 9 | j-coban | P2 | 0.25 | full | 30 | master-plan §14 | J5–J8: l=πRn/180, S quạt. Numeric — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 35 | k-goiintiep | noi-tiep | Góc nội tiếp & các tính chất | 9 | j-coban | P0 | 0.5 | partial | 45 | master-plan §15 | K1–K3: chắn nửa ĐT→90°, cùng chắn cung. MCQ+proof |
| 36 | k-tugiacnt | noi-tiep | Tứ giác nội tiếp: dấu hiệu & ứng dụng | 9 | k-goiintiep | P0 | 0.5 | partial | 55 | master-plan §15 | K4–K7: 4 dấu hiệu, NT→ĐD→tích đoạn. Proof-heavy |
| 37 | l-tieptuyen | tiep-tuyen | Tiếp tuyến: dấu hiệu & hai TT từ một điểm | 9 | j-coban | P0 | 0.5 | partial | 50 | master-plan §16 | L1–L3: OC⊥d, AB=AC. MCQ+proof. Gộp L4–L5 từ l-kethop (21/10, LT21): tiếp tuyến kết hợp dây – góc, trung điểm / song song |
| ~~38~~ | ~~l-kethop~~ | | gộp vào l-tieptuyen (L4–L5) + o-dongdang (21/10, LT21) — 0/68 đề có câu riêng | | | | | | | | |
| 39 | m-vitri | vi-tri-td | Vị trí tương đối: điểm, đường thẳng, 2 đường tròn | 9 | j-coban | P2 | 0.25 | full | 35 | master-plan §17 | M1–M5: phân loại vị trí, tiếp xúc. MCQ — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 40 | n-ngoainoi | vi-tri-td | Đường tròn ngoại tiếp & nội tiếp tam giác | 9 | k-goiintiep | P2 | 0.25 | partial | 40 | master-plan §18 | N1–N5: tâm = giao trung trực/phân giác. MCQ+proof — **P2 (LT17): hầu như không ra trong 68 đề; học khi dư thời gian** |
| 53 | q-dagiac | duong-tron | Đa giác đều & phép quay | 9 | j-coban | P2 | 0.25 | full | 30 | SGK Toán 9 (KNTT Bài 30) — LT21 | Đa giác đều, góc ở tâm, phép quay giữ nguyên hình. **P2: không có ở Bài 4.2 của 68 đề; học khi dư thời gian** |
| 41 | o-chungminh | hinh-nang-cao | CM vuông góc, song song, phân giác & góc bằng nhau | 9 | k-tugiacnt, f3-dongdang | P1 | 0.5 | tutor | 70 | master-plan §19 | O1, O2, O6 + góc bằng nhau (tách 21/10, LT21). Phân tích ngược + C2/C3 (S5) |
| 42 | o-dongdang | hinh-nang-cao | Đồng dạng trong đường tròn & tích đoạn thẳng | 9 | o-chungminh, l-tieptuyen | P1 | 0.5 | tutor | 70 | master-plan §19 | O7–O8: NT→ĐD→tỉ số→PA·PB=PC·PD |
| 52 | o-thanghang | hinh-nang-cao | CM thẳng hàng, trung điểm, đồng quy & hình đặc biệt | 9 | o-chungminh, f3-tugiac | P1 | 0.5 | tutor | 70 | LT21 (tách từ o-chungminh) | O3, O4, O5, O10: thẳng hàng (15 câu/68 đề), trung điểm, đồng quy, hình bình hành / tam giác cân — chủ yếu 4.2c |
| 43 | o-nangcao | hinh-nang-cao | Điểm cố định, đường cố định & điểm di động | 9 | o-dongdang | P1 | 0.5 | tutor | 75 | master-plan §19 | ★GATE 9.5 — O9–O15. Chỉ cho HS có năng lực |

### 2.4 BĐT & Tối ưu (3 KUs sau khi gộp — LT17, cuối Track A)

Bài 5 chỉ **0,5 điểm** (khung đề Hà Nội 2025–2026 và cả 68 đề) → gộp từ 5 KU xuống 3. h-bdt gộp vào hq-amgm; hq-nangcao bỏ
(dạng tối ưu rời rạc / BĐT hình học hầu như không ra; gia sư xử lý nếu cần).

| # | id | module | title | grade | prereq | priority | examWeight | gradable | estMinutes | source | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 45 | hq-amgm | toi-uu | BĐT cơ bản, AM-GM & tìm MAX/MIN | 9 | f1-hdt | P1 | 0.25 | partial | 55 | master-plan §12+21 | H1–H9 + Q2–Q3: xét hiệu, bình phương ≥ 0, a+b≥2√(ab), ĐK dấu bằng (gộp h-bdt 06/10) |
| 46 | hq-doanhthu | toi-uu | Tối ưu kinh tế: doanh thu, lợi nhuận, chi phí | 9 | hq-amgm, d-ptbh | P0 | 0.5 | partial | 55 | master-plan §21 | Q1+Q4–Q6: R=giá×SL, L=(bán−vốn)×SL. 31/68 đề |
| 47 | hq-hinhhoc | toi-uu | Tối ưu hình học: diện tích, thể tích, hộp cắt góc | 9 | hq-amgm | P0 | 0.5 | partial | 55 | master-plan §21 | Q7–Q10: chu vi cố định→S max, hộp không nắp. 34/68 đề |
| ~~44~~ | ~~h-bdt~~ | | gộp vào hq-amgm (06/10) | | | | | | | | |
| ~~48~~ | ~~hq-nangcao~~ | | bỏ (06/10) — tối ưu rời rạc, BĐT hình học | | | | | | | | |

### 2.5 Tổng kết (sau LT17, LT19, LT21)

| Nhóm | KU lõi (P0/P1) | KU P2 | Tổng |
|------|---------|---------|------|
| Track A — Lõi đại số + tối ưu | 23 (F1 4, C 5, D 3, E 2, G 6, tối ưu 3) | 1 (e-giaodiem) | 24 |
| Track B — Quick wins | 10 (A 2, B 3, P 3, htl-1, htl-2) | 4 (i-giaitgv, i-ungdung, f-hamso, f-parabol) | 14 |
| Track C — Hình học | 10 (f3 ×2, j-coban, k ×2, l-tieptuyen, o ×4) | 4 (j-cung, m-vitri, n-ngoainoi, q-dagiac) | 14 |
| **Tổng** | **43** (41 mới + 2 có sẵn) | **9** | **52** |

---

## 3. Ước tính thời gian

### 3.1 Tổng thời gian (sau LT17)

| Hạng mục | Giờ |
|----------|-----|
| Initial learning (40 KU lõi) | ~35h |
| Ôn tập 3 vòng (D+1, D+7, D+21) | ~25h |
| Retry cho ~30% KUs fail lần đầu | ~4h |
| Mixed review / interleaving hàng tuần | ~13h |
| **Tổng lõi** | **~77 giờ** (trước: ~90h với 50 KU) |
| 8 KU P2 (nếu dư thời gian) | +~8h |
| LT21 (21/10): +f3-tugiac, o-thanghang, −l-kethop; +q-dagiac (P2) | lõi +~1,5h; P2 +~0,5h |

Bỏ/hạ 10 KU tiết kiệm **~11–13 giờ**, dồn cho hình học (Bài 4.2, ~3đ) và ôn trộn.

### 3.2 Quy về ngày / buổi

| Chế độ | Buổi/tuần | Phút/buổi | Phút/ngày (TB) | Phù hợp |
|--------|-----------|-----------|-----------------|---------|
| **Mức chuẩn (đã chốt)** | 4 | ~50 | ~29 | Xong 40 KU lõi trước 31/03/2027 |
| Mức có P2 | 4 | ~55 | ~32 | Thêm 8 KU P2 |
| Mức đẩy nhanh | 5 | ~50 | ~36 | Buffer cho Tết / tuần ốm, thêm ôn hình |

> **Mốc đã chốt 05/10/2026:** bắt đầu **thứ Hai 12/10/2026**, học xong KU lõi trước **31/03/2027**
> (~24 tuần, trừ ~1,5 tuần Tết ≈ 23 tuần học). Tháng 4–5/2027: chỉ luyện đề + ôn duy trì trong app.
> Thi dự kiến đầu tháng 6/2027 (chờ Sở GD công bố). Đến 31/03 cần ~72 giờ → ~3,2 giờ/tuần.

### 3.3 Phân bổ theo giai đoạn (LT18: Track C từ tuần 7)

| GĐ | Tuần | Ngày | Track A | Track B/C | KU mới | Ghi chú |
|----|------|------|---------|-----------|--------|---------|
| 1 | 1–6 | 12/10 – 22/11 | F1 backfill (4) | a-tanso, b-phepthu, a-bieudo, b-xsuat, p-trunon, b-haib, p-cau, p-ghep (8) | 12 | Tuần 1: htl-1/2 trên app + F1 với gia sư trên giấy; F1 lên app từ tuần 2 |
| 2 | 7–13 | 23/11 – 10/01 | C (5) + D (3) | **f3-dongdang, f3-tugiac, j-coban, k-goiintiep, k-tugiacnt** (5) | 13 | Hình học bắt đầu sớm (GV báo động; Bài 4.2 ~3đ). k-tugiacnt có trong 64/68 đề |
| 3 | 14–19 | 11/01 – 21/02 | E (2) + G (4) | l-tieptuyen, o-chungminh, o-dongdang (3) | 9 | Tuần 17–18 (01–14/02) Tết: chỉ ôn. **Xong mốc 8.5 cuối GĐ3** |
| 4 | 20–25 | 22/02 – 31/03 | Tối ưu (3) | o-thanghang, o-nangcao (2) | 5 | Nhẹ KU mới → nhiều ôn trộn + đề Bài 4.2 trên giấy. KU P2 nếu dư |
| — | 26–34 | 01/04 – đầu 06 | — | — | 0 | Luyện đề (gia sư + giấy), app chỉ còn ôn D+21 và ôn duy trì |

### 3.4 Estimation per KU (cách tính chi tiết)

Mỗi KU gồm: theory → worked example → faded example → 8 practice → 5 exit test (rút từ kho 8 câu, LT13). Chuẩn soạn: `docs/CONTENT_STANDARD.md`.

| Mức khó | KUs | First pass | 3 vòng ôn | Retry (30%) | Tổng/KU |
|---------|-----|-----------|-----------|-------------|---------|
| Dễ (A, B, P, I cơ bản) | ~13 | ~25 min | ~17 min | +5 min | **~47 min** |
| Trung bình (F1, C basics, D, F hàm số) | ~15 | ~42 min | ~28 min | +6 min | **~76 min** |
| Khó (C rút gọn, E tham số, G, H+Q, J–O) | ~22 | ~62 min | ~42 min | +8 min | **~112 min** |

---

## 4. Exam gate analysis (sửa 06/10 theo khung đề thật)

Khung đề Toán vào 10 Hà Nội (đề minh hoạ 2025, đề thi 2025, 2026) và cả 68 đề luyện: 5 bài, 120 phút.
Nguồn: luatminhkhue.vn (minh hoạ 2025), hocmai.vn + daibieunhandan.vn (đề 2026, đăng 31/05/2026) — tham khảo, chờ đề minh hoạ 2027.

| Bài | Điểm | Nội dung | KU lõi |
|---|---|---|---|
| 1 | **1,5** | Thống kê (tần số ghép nhóm, biểu đồ) + xác suất | a-tanso, a-bieudo, b-phepthu, b-xsuat, b-haib |
| 2 | **1,5** | Căn thức: tính giá trị · rút gọn · **câu phụ 2c (phân loại)** | c-dkxd → c-cauphu (+ F1) |
| 3 | **2,5** | 2 bài toán thực tế bằng PT/HPT + PT bậc hai / Viète | g-*, d-*, e-viete, e-vietets |
| 4 | **4,0** | 4.1 hình khối thực tế (~1đ) · 4.2 hình phẳng đường tròn a/b/c (~3đ, **ý c phân loại**) | p-*, f3, j-coban, k-*, l-*, o-* |
| 5 | **0,5** | Tối ưu thực tế (bất phương trình / BĐT) — **phân loại** | hq-* |

### 4.1 Mốc 8.5

Mất tối đa 1,5đ. Kế hoạch: chấp nhận mất Bài 5 (0,5đ) + một phần 4.2c (~0,75đ) + sai sót nhỏ.
**Phải chắc:** Bài 1, 2a–2b, 3, 4.1, 4.2a–b. **KU bắt buộc vững:** c-rutgon, c-cauphu, e-vietets, k-tugiacnt, l-tieptuyen,
o-chungminh, o-dongdang, p-ghep, g-* → xong cuối GĐ3 (~21/02/2027). **LT19 (17/10):** g-giaihpt, g-chuso, g-nangsuat, g-phantram, g-chuyendong (phần lập HPT bậc nhất) học ngay từ GĐ1 theo gia sư; chỉ g-honhop (dẫn tới PT bậc hai) giữ ở GĐ3.

### 4.2 Mốc 9.5

Mất tối đa 0,5đ: cần thêm **2c** chắc chắn và **một trong hai** câu phân loại (4.2c hoặc Bài 5).
4.2c đáng ~0,75–1đ, Bài 5 chỉ 0,5đ → **ưu tiên 4.2c (o-thanghang, o-nangcao, o-dongdang)** hơn tối ưu.

---

## 5. Gradability map

App grading capabilities: MCQ (2–6 options) và single exact numeric. **KHÔNG chấm được:** biểu thức có biến, cặp nghiệm, tập nghiệm, chứng minh hình học tự do, đồ thị.

| Mức | Ý nghĩa | KU count | KUs |
|---|---|---|---|
| **full** | Mọi câu là MCQ / đáp số → app tự chấm | 29 | g-giaihpt, g-chuso, f1-hdt, f1-pnt, c-dkxd, c-coban, c-truccan, d-ptbh, d-nhamnghiem, e-viete, g-phantram, a-tanso, a-bieudo, b-phepthu, b-xsuat, b-haib, p-trunon, p-cau, p-ghep, htl-1, htl-2, i-giaitgv, i-ungdung, f-hamso, f-parabol, j-coban, j-cung, m-vitri, q-dagiac |
| **scaffolded** | Dùng câu nhiều bước (item type `steps`, LT5) → app tự chấm hết | 4 | f1-tgon, f1-qd, c-rutgon, c-cauphu |
| **partial** | App chấm phần MCQ/đáp số/nhiều bước; phần chứng minh / tập nghiệm làm trên giấy với gia sư → nhãn "cần gia sư xác nhận" (LT6) | 15 | d-thamso, e-vietets, e-giaodiem, g-chuyendong, g-nangsuat, g-honhop, f3-dongdang, f3-tugiac, k-goiintiep, k-tugiacnt, l-tieptuyen, n-ngoainoi, hq-amgm, hq-doanhthu, hq-hinhhoc |
| **tutor** | App chỉ có phần nhận dạng / bước then chốt; kỹ năng chính (chứng minh tự do) gia sư chấm trên giấy | 4 | o-chungminh, o-thanghang, o-dongdang, o-nangcao |

**33/52 KU (63%) app tự chấm toàn bộ** (full + scaffolded). 19 KU có phần gia sư. Từ S5 (21/10), câu phân tích ngược, điền lí do (C3) và sắp xếp bước (C2) cho phần chứng minh cũng tự chấm; viết tự do vẫn do gia sư: mức trong app tính trên phần tự chấm,
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
- **F3:** f3-dongdang, f3-tugiac (2 KU — prerequisite cho J, K, O; f3-tugiac thêm 21/10, LT21)

F0 (số học nền) và F2 (PT bậc nhất) giả định đã biết — không tạo KU riêng.

### H3. Hình học mở khi nào?

**Trả lời (sửa 06/10, LT18):** Track C từ **tuần 7 (23/11)**, song song căn thức:
1. GĐ2: f3-dongdang → f3-tugiac → j-coban → k-goiintiep → k-tugiacnt
2. GĐ3: l-tieptuyen → o-chungminh → o-dongdang — **đủ mốc 8.5 (4.2a–b)**
3. GĐ4: o-thanghang, o-nangcao (4.2c) + ôn trộn nhiều

Chứng minh viết tự do làm trên giấy với gia sư (LT6); app luyện nhận dạng, tính góc/độ dài, bước then chốt. Hình học tương tác
C1–C3 (S5) cần thiết kế trước ~11/2026 để dùng từ GĐ2. (21/10: thiết kế xong — `docs/superpowers/specs/2026-10-21-s5-geometry-design.md`; code 28/10–~11/11; C1 làm sau.)

### H4. Những KU nào app chấm được 100%?

**Trả lời:** 28 KU full + 4 KU câu nhiều bước = **32/50 (64%)**. Danh sách ở §5.
(Bản trước ghi 28 + 6 = 34 — số đếm không khớp bảng, đã sửa 05/10.)

### H5. Giải pháp cho KUs "partial"?

**Trả lời (chốt LT5, LT6):**
1. **Câu nhiều bước** — f1-tgon, f1-qd, c-rutgon, c-cauphu và phần lập PT của g-chuyendong, g-nangsuat.
2. **Hybrid** — app chấm phần MCQ/đáp số; phần chứng minh/tập nghiệm làm trên giấy, KU gắn nhãn "cần gia sư xác nhận". 14 KU partial.
3. **Gia sư là chính** — 4 KU tutor; app chỉ giữ phần nhận dạng. Không có chụp ảnh bài làm trong P1.

### H6. Thứ tự tạo content? (lịch nén, duyệt xong trước ngày ở cột cuối)

**Nguyên tắc:** (1) chuỗi tiên quyết, (2) trọng số đề, (3) loại chấm. Nội dung phải **được duyệt trước khi cần học ít nhất 1–2 tuần**.
Mỗi KU qua kiểm tra độc lập (agent thứ hai giải lại + script tính lại đáp số) trước khi tới phụ huynh; gia sư soát đợt có C, E, G (LT10).

| Đợt | KUs | Cần cho | Duyệt xong trước |
|------|------|-------|-----|
| 1 | f1-hdt, f1-pnt, a-tanso, b-phepthu (+ chuẩn hoá htl-1/2) | GĐ1 tuần 2 (chỉ cần S6a) | 18/10/2026 |
| 2 | f1-tgon, f1-qd, a-bieudo, b-xsuat | GĐ1 tuần 3 (cần S6b: nhiều bước, hình) | 25/10/2026 |
| 3 | p-trunon, p-cau, p-ghep, b-haib, c-dkxd | GĐ1 cuối, GĐ2 đầu | 08/11/2026 |
| 4 | **g-giaihpt, g-chuso, g-nangsuat, g-phantram, g-chuyendong** (LT19 — gia sư soát G) | Ngay: gia sư đang dạy HPT, trường học chương 1 | 01/11/2026 |
| 5 | f3-dongdang, j-coban, c-coban, c-truccan | GĐ2 (Track C bắt đầu 23/11) | 15/11/2026 |
| 6 | c-rutgon, c-cauphu, k-goiintiep, k-tugiacnt | GĐ2 (mốc 8.5) — gia sư soát | 29/11/2026 |
| 7 | d-ptbh, d-nhamnghiem, d-thamso, l-tieptuyen, f3-tugiac | GĐ2 cuối, GĐ3 | 13/12/2026 |
| 8 | e-viete, e-vietets, o-chungminh, o-dongdang, g-honhop | GĐ3 (mốc 8.5) — gia sư soát | 03/01/2027 |
| 9 | o-thanghang, o-nangcao, hq-amgm | GĐ4 | 07/02/2027 |
| 10 | hq-doanhthu, hq-hinhhoc | GĐ4 | 21/02/2027 |
| P2 | i-giaitgv, i-ungdung, f-hamso, f-parabol, e-giaodiem, j-cung, m-vitri, n-ngoainoi, q-dagiac | Chỉ khi dư thời gian | — |

Tổng 41 KU lõi mới (+ htl-1, htl-2 đã có) + 9 KU P2 (LT21, 21/10). Đợt 8 cũ (G) chuyển lên đợt 4 (LT19); đợt 4–7 cũ thành 5–8, giữ nguyên ngày. Trung bình ~2 KU/tuần soạn; phụ huynh duyệt ~1 giờ/tuần.

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
| 8 | b-xsuat | B | xac-suat | Xác suất cổ điển & một bước | b-phepthu | full | 0.5 |
| 9 | c-dkxd | A | can-thuc | Điều kiện xác định biểu thức căn | f1-qd | full | 0.25 |
| 10 | p-trunon | B | hinh-khoi | Hình trụ & hình nón: công thức | — | full | 0.5 |

---

## 8. Module registry

Map giữa module ID và domain(s) trong master plan:

| module id | domain(s) | units | title |
|---|---|---|---|
| backfill-dai-so | F1 | f1-hdt, f1-pnt, f1-tgon, f1-qd | Bù lỗ hổng đại số lớp 7–8 |
| backfill-hinh | F3 | f3-dongdang, f3-tugiac | Bù lỗ hổng hình học lớp 8 |
| thong-ke | A | a-tanso, a-bieudo | Thống kê |
| xac-suat | B | b-phepthu, b-xsuat, b-haib | Xác suất |
| can-thuc | C | c-dkxd, c-coban, c-truccan, c-rutgon, c-cauphu | Căn bậc hai & biểu thức chứa căn |
| pt-bac-hai | D | d-ptbh, d-nhamnghiem, d-thamso | Phương trình bậc hai |
| viet | E | e-viete, e-vietets, e-giaodiem | Định lý Viète |
| ham-so | F | f-hamso, f-parabol | Hàm số & parabol |
| bai-toan-tt | G | g-giaihpt, g-chuso, g-chuyendong, g-nangsuat, g-phantram, g-honhop | Giải bài toán bằng PT/HPT |
| hinh-khoi | P | p-trunon, p-cau, p-ghep | Hình khối trong thực tiễn |
| he-thuc-luong | I | htl-1, htl-2, i-giaitgv, i-ungdung | Hệ thức lượng trong tam giác vuông |
| duong-tron | J | j-coban, j-cung, q-dagiac | Đường tròn cơ bản |
| noi-tiep | K | k-goiintiep, k-tugiacnt | Góc & tứ giác nội tiếp |
| tiep-tuyen | L | l-tieptuyen | Tiếp tuyến |
| vi-tri-td | M, N | m-vitri, n-ngoainoi | Vị trí tương đối & ngoại/nội tiếp |
| hinh-nang-cao | O | o-chungminh, o-thanghang, o-dongdang, o-nangcao | Hình học tổng hợp nâng cao |
| toi-uu | H, Q | hq-amgm, hq-doanhthu, hq-hinhhoc | BĐT & tối ưu (gộp 06/10) |

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
- Cách gắn mã lỗi E01–E15, cấp câu, nguồn, kiểm tra: `docs/CONTENT_STANDARD.md` (LT13–LT16)
- Hint ladder H0–H6 — dành cho AI giảng bài (D9), chưa dùng trong KU

---

## Changelog

| Date | Change |
|---|---|
| 05/10/2026 | Initial version: 2-track structure, 50 KUs, time estimates, H1–H6. Approved by parent. |
| 05/10/2026 | Design review (LT1–LT12): timeline 12/10/2026 → 31/03/2027; f3-dongdang to GĐ2, Track C from GĐ3; 13 rows given their missing examWeight; gradability counts reconciled (26/4/15/5, 60% fully auto); content batches re-dated; §9 matches the real schema + planned changes. |
| 06/10/2026 | LT17–LT18 from the 68-paper index + Hà Nội 2025/26 structure: 8 KUs → P2, optimisation 5 → 3 KUs (48 total, 40 core), Track C from week 7, exam gates recomputed (Bài 4 = 4đ, Bài 5 = 0,5đ), batches re-dated, ~77h core. |
| 17/10/2026 | LT19–LT20: tutor-directed — G strand (linear PT/HPT word problems) pulled to batch 4 (01/11); new g-giaihpt, g-chuso (50 KUs, 42 core); g-chuyendong/g-nangsuat/g-phantram now require g-giaihpt, quadratic word problems gathered in g-honhop (batch 8, needs d-ptbh); old batches 4–7 renumbered 5–8, dates unchanged. Tutor PDFs become a content source (LT20). |
| 21/10/2026 | LT21 geometry audit (68-paper Bài 4.2 + Toán 9 GDPT 2018): +f3-tugiac (batch 7), o-chungminh split → o-chungminh + o-thanghang (batch 9), l-kethop folded into l-tieptuyen / o-dongdang, +q-dagiac (P2). **52 KUs: 43 core + 9 P2.** Sổ tay suy ngược gains 4 "cấu hình mẫu". |
