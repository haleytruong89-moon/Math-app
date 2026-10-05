# Content brief — cầu nối brainstorm nội dung (claude.ai) ↔ app (Claude Code)

> Viết 05/10/2026. Dùng khi brainstorm **danh sách bài học lớp 8–9 + thứ tự ưu tiên** trên claude.ai
> (Project "STUDY BB"). Dán cả file này vào cuộc trò chuyện đó. Mục 4 là thứ app cần nhận lại;
> mục 5 là các câu cần chốt. Kết quả mang về repo: `docs/CURRICULUM.md` (mục 4) → Claude Code soạn bài (S6).

## 1. App hiện có gì

- **1 module** "Hệ thức lượng trong tam giác vuông" (mạch I), **2 bài đã duyệt**:
  `htl-1` Bốn hệ thức lượng: hiểu và nhớ (~20 phút) · `htl-2` Tính độ dài bằng hệ thức lượng (~25 phút).
- Nguồn gốc: file hub `deliverables/he-thuc-luong-tam-giac-vuong.html` (chương 0–7; đã dùng phần đầu).
- Thang mức M0–M4, mạch A–Q, mã lỗi E01–E15, thang gợi ý H0–H6: theo
  `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` (hub). App chỉ lưu **mã** lỗi; tên lỗi nằm ở master plan.

## 2. Một "bài" (KU) trong app gồm gì — cố định, mọi bài như nhau

| Phần | Nội dung | Số lượng |
|---|---|---|
| Lý thuyết | Vài đoạn ngắn, có công thức | 1+ đoạn |
| Lời giải mẫu | Một bài giải từng bước, mỗi bước có "Vì sao làm bước này?"; con phải xem hết mới được tự làm | ≥ 2 bước + 1 câu tự giải thích |
| Lời giải khuyết bước | Bài tương tự, vài bước để trống cho con điền (được thử lại, sai 2 lần thì hiện lời giải) | ≥ 1 chỗ trống |
| Luyện tập | Câu L1 → L2, chấm 1 lần, câu sai quay lại cuối | **8 câu** (tối thiểu 4) |
| Bài kiểm tra cuối | Tự làm, không gợi ý, nộp mới xem đáp án; ≥ 80% và không lặp 1 mã lỗi ≥ 2 lần → M3 | **5 câu** (tối thiểu 4) |

- Mỗi câu (kể cả chỗ trống) có: đề, đáp án, **lời giải**, và các **đáp án sai hay gặp** kèm mã lỗi + lời nhắc riêng.
- Thời lượng 1 bài: 5–60 phút (hiện ~20–25).
- **Lịch ôn sau khi đạt M3:** D+1 → D+7 → D+21 → 60 ngày/lần; câu ôn lấy từ phần luyện tập.
- Một bài thuộc đúng **1 module** (= 1 mạch A–Q); thứ tự trong module cố định (`order`).

## 3. Giới hạn chấm tự động — quan trọng khi chọn dạng bài

App chấm được **2 dạng câu**:

1. **Trắc nghiệm** 2–6 phương án, đúng 1 đáp án.
2. **Đáp số là MỘT con số chính xác**: số nguyên, thập phân, phân số, căn, có thể âm.
   Nhận dạng tương đương (`12/5` = `2,4`; `2√3` = `√12`), **không** nhận số làm tròn (`3,46` ≠ `2√3`).
   Có thể kèm đơn vị hiển thị (cm…).

App **chưa** chấm được:
- biểu thức chứa chữ (`2x + 3`, rút gọn biểu thức) — trừ khi hỏi giá trị tại một điểm, hoặc trắc nghiệm;
- **hai nghiệm / cặp nghiệm** (phương trình bậc hai, hệ phương trình) — phải tách: "nghiệm lớn hơn = ?", "x = ?" rồi "y = ?", hoặc trắc nghiệm;
- tập nghiệm bất phương trình, khoảng — chỉ qua trắc nghiệm;
- **chứng minh hình học** (C1–C5, lát S5 — làm sau); vẽ đồ thị; bài văn lời giải.

Hình vẽ: hiện có **1 hình** (tam giác vuông có đường cao). Bài cần hình khác → ghi rõ hình gì để làm thêm.

→ Khi xếp ưu tiên, ghi cho mỗi bài: **"chấm được ngay"** / **"cần đổi cách hỏi"** / **"chờ tính năng"** (chứng minh, đồ thị…).

## 4. App cần nhận lại gì từ buổi brainstorm (`docs/CURRICULUM.md`)

Một bảng, mỗi dòng 1 bài (KU). Cột:

| Cột | Ý nghĩa | Ví dụ |
|---|---|---|
| `id` | mã ngắn, chữ thường + gạch ngang, không trùng | `htl-3`, `pt2-1`, `l8-hdt-1` |
| `module` | nhóm bài (= 1 mạch A–Q của master plan) | `he-thuc-luong` (I) |
| `title` | tên bài cho con | "Tỉ số lượng giác của góc nhọn" |
| `grade` | **8** (nền tảng cần bù) hay **9** | 9 |
| `prereq` | các `id` cần học trước | `htl-2` |
| `priority` | P1 (thi vào 10, làm ngay) / P2 / P3 | P1 |
| `examWeight` | tần suất trong đề thi vào 10 (cao / vừa / thấp) | cao |
| `gradable` | chấm được ngay / cần đổi cách hỏi / chờ tính năng | chấm được ngay |
| `estMinutes` | ước lượng | 25 |
| `source` | lấy từ đâu (chương nào của file HTML, SGK trang…) | HTML ch.4 |
| `notes` | lỗi hay gặp, điểm cần nhấn | "nhầm sin/cos" |

Thêm 1 đoạn ngắn: **10 bài đầu tiên nên soạn** (theo thứ tự) — Claude Code soạn theo đúng thứ tự này.

## 5. Câu cần chốt trong buổi brainstorm (ảnh hưởng tới app)

| # | Câu hỏi | Vì sao ảnh hưởng | Mặc định hiện nay |
|---|---|---|---|
| H1 | **Ai mở bài cho con**: phụ huynh, gia sư, hay cả hai? | Hiện chỉ phụ huynh duyệt nội dung và bài mở theo thứ tự cố định (D16). "Hub để giáo viên chọn" = tính năng mới | Phụ huynh |
| H2 | Gia sư có được **đổi thứ tự / chọn bài tiếp theo** cho con không? | Cần màn hình chọn bài cho gia sư + lưu "lộ trình riêng" của con | Không — thứ tự cố định |
| H3 | Bài **lớp 8** hiện thế nào: cùng danh sách, hay mục "Ôn nền tảng" riêng; có bắt buộc không? | Thứ tự "Hôm nay cần làm" và bản đồ tiến độ | Chưa có |
| H4 | Gia sư **duyệt nội dung** bài nháp (ngoài phụ huynh)? | Quy trình D16 | Chỉ phụ huynh |
| H5 (=Q12) | Mỗi bài thêm **bộ kiểm tra thứ 2** (đổi số) cho lần làm lại? | Lần làm lại hiện dùng đúng 5 câu cũ → dễ nhớ đáp án | Chưa có |
| H6 | Có cần dạng câu mới (biểu thức, cặp nghiệm, đồ thị) trước khi soạn hàng loạt? | Tính năng chấm mới phải làm trước | Không — đổi cách hỏi |

## 6. Sau buổi brainstorm

1. Lưu kết quả mục 4 + câu trả lời mục 5 vào `docs/CURRICULUM.md` (hoặc dán vào Claude Code).
2. Claude Code: cập nhật `docs/SPEC.md` §0 nếu H1–H6 đổi quyết định; lên kế hoạch tính năng "hub" nếu H1/H2 = có.
3. Claude Code soạn bài theo "10 bài đầu tiên" (S6), dạng **nháp** → phụ huynh xem ở `/parent/content` → duyệt → mở cho con.
