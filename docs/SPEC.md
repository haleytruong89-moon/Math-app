# App Toán — Product spec (repo copy)

> **Source of truth:** `claude/PJ_APP_TOAN.md` in the claude.ai Project "STUDY BB" (the parent edits it there).
> This file is a copy so every coding session — including Claude Code in VS Code and the nightly
> scheduled runs, which cannot read the Project — works from the same spec.
> Synced: 03/10/2026 from PJ_APP_TOAN v1.0 (01/10/2026) + build decisions below.
> If the two disagree, the Project doc wins; update this copy in the same PR that relies on the change.
> Status columns in §4 are as of 01/10 — current status lives in `docs/PROGRESS.md`.
> Sections kept: §1 goals, §2 decisions D1–D19, §2.5–2.7 non-goals / user stories / acceptance criteria,
> §3 architecture, §4 roadmap, §9–10. Research (§5) and the deliverable inventory (§8) stay in the hub.

## 0. Decisions taken during the build (approved by the parent)

| Date | Decision | Where |
|---|---|---|
| 02/10/2026 | Mastery numbers: M2 = last 5 practice first-tries ≥ 60%; M3 = last exit test ≥ 80% with no error code repeated ≥ 2; M4 = M3 + passed the D+21 review; < 5 answers → "chưa đủ dữ liệu" | `docs/P1_PLAN.md` §2, `src/lib/learning/rules.ts` |
| 02/10/2026 | Review: 3 questions per unit, pass = ≥ 2/3; fail → back to D+1; pass + "easy" → next interval ×1.5 | same |
| 02/10/2026 | Weekly goal = 4 study days/week (Mon–Sun, Vietnam time); a study day = an exit test, a review, or ≥ 5 practice answers | same |
| 02/10/2026 | Units `htl-1`, `htl-2` approved for students | `content/he-thuc-luong/` |
| 02/10/2026 | 8 practice + 5 exit questions per unit for the pilot | content |
| 02/10/2026 | New SQL is pasted into Supabase by the parent; no automatic migrations to the live database | `docs/P1_PLAN.md` §1 |
| 03/10/2026 | After D+21: keep a **maintenance review every 60 days** until the exam (fail → back to D+1, M4 lost until D+21 is passed again) | rules.ts, migration 0005 |
| 03/10/2026 | **Pilot early**: Nguyên starts with the approved units once S3 (tutor log) is in; S4 parent dashboard and more content follow during the pilot | `docs/P1_PLAN.md` §3 |
| 03/10/2026 | Geometry proof items **C1–C3 (S5) move to after the pilot starts** (deviation from §3.4 / §4 "P1"; hub doc to be updated) | `docs/P1_PLAN.md` §3 |
| 05/10/2026 | Review questions come from **practice items only**; reloading the review page resumes the unfinished run | `src/lib/learning/rules.ts` (`planReview`) |
| 05/10/2026 | Tutor tools (T1–T5): homework is done on paper and corrected by the tutor next session, never counted in mastery or the weekly goal (D4 unchanged); task sheets/photos via **Google Drive links** (≤ 3, no file storage in the app); default due date today + 3; the student sees the tutor's correction note; "Bài làm của con" shows practice/exit/review only (no faded steps) | `docs/superpowers/specs/2026-10-05-tutor-tools-design.md` |
| 05/10/2026 | S4 (P1–P3): tutor schedule = fixed weekdays chosen when assigning (reminder when a scheduled day passes > 24h without a logged session); parent-confirmed level is **display only**, shown while the system level is unchanged since confirming; every confirmation is kept | `docs/superpowers/specs/2026-10-05-parent-overview-design.md` |
| 05/10/2026 | **Student UX** (U1–U8, mockup approved): warm cream + teal theme on student routes only; greeting header with weekly ring on home only; journey page `/student/journey` (🌰 M0 → 🌱 → 🌿 → 🌳 → ⭐); feedback card after practice/review answers — **no "Thử lại"**, session total "Đúng x/y câu lượt này" (not a streak, D17), level nudge by the real rules, "Con trả lời / Đáp án đúng" | `docs/superpowers/specs/2026-10-05-student-ux-design.md` |
| 05/10/2026 | Error names E01–E15 from master plan §26: English canonical, Vietnamese shown to the student | `src/lib/content/errors.ts` |
| 03/10/2026 | Nightly scheduled build at 23:00 (Vietnam) for remaining slices; parent reviews, runs SQL and merges each morning | `docs/PROGRESS.md` |

## 1. Mục tiêu

Web app riêng (tách khỏi SkillGrow) hỗ trợ Hạnh Nguyên học Toán 9 và luyện thi vào 10 (~06/2027), dùng chung giữa **phụ huynh – gia sư – học sinh**, để trả lời được bất kỳ lúc nào:
- Cái gì **đã dạy** / chưa dạy?
- Cái gì con **đã hiểu** (mức M0–M4) / chưa hiểu?
- Cái gì **đến hạn ôn lại**?

Nội dung bám theo `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md` (M0–M4, 17 domain A–Q, error taxonomy E01–E15, hint ladder H0–H6, lịch ôn D0/D+1/D+7/D+21). Xây **từng module một**, không xây đồ sộ ngay.

**Phân biệt với SkillGrow:** SkillGrow chỉ là nơi tracking & tổng hợp đa kỹ năng; học Toán thì phải qua App Toán. (Có thể nối dữ liệu tổng hợp sang SkillGrow sau — chưa thuộc phạm vi.)

## 2. Quyết định đã chốt (phụ huynh xác nhận 01/10/2026)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | App Toán tách riêng khỏi SkillGrow | |
| D2 | Gia sư **bắt buộc** cập nhật trực tiếp trên app (không qua Zalo) | |
| D3 | Tài khoản do phụ huynh cấp; **mỗi gia sư 1 tài khoản**, khoá khi nghỉ, tạo mới khi đổi GV | Giữ lịch sử ai dạy/ai đánh giá |
| D4 | Học sinh **làm bài online** để kiểm tra (không chụp bài giấy); bài tập xây từ đơn giản → phức tạp theo module | |
| D5 | Học liệu **nằm trong app**; xây theo từng module | Xem D16 cho quy trình duyệt |
| D6 | Hosting: GitHub + Vercel + Supabase (gói free), phụ huynh tự tạo tài khoản theo hướng dẫn | Kèm biện pháp D19 |
| D7 | Thiết bị: laptop, tablet, điện thoại → giao diện responsive | |
| D8 | Gia sư **đề xuất** mức hiểu, hệ thống **đối chiếu** với kết quả bài kiểm tra, lệch thì phụ huynh chốt | |
| D9 | Có **AI hỏi đáp** để học sinh hỏi lại câu sai; AI giảng theo framework (H0–H6, E01–E15), không trả lời chung chung | Dùng Claude API — **billing riêng** với gói claude.ai |
| D10 | Nhắc lịch ôn **trong app** trước (chưa Zalo/email) | |
| D11 | Thiết kế đa học sinh từ đầu — **An dùng sau** | |
| D12 | Chứng minh hình học: thang C1–C5; chỉ C5 (viết tự do) do AI chấm sơ bộ + gia sư xác nhận | |
| D13 | Module đầu tiên: **Hệ thức lượng** (đã có nội dung HTML) | |
| D14 | **Lịch ôn:** giữ D+1/7/21; **ôn trộn nhiều KU** (interleaving); ôn sai → về D+1, ôn đúng dễ → giãn thêm; **chưa dùng FSRS** nhưng log đủ dữ liệu để nâng cấp sau | Rà soát best practice |
| D15 | **Mức hiểu:** tiêu chí đơn giản (trung bình các lần gần nhất), luôn hiển thị **kèm số lần đã làm (độ chắc chắn)**; không dùng BKT | Rà soát best practice |
| D16 | **Nội dung:** JSON trong GitHub; Claude soạn → phụ huynh xem trên **link preview** → duyệt mới lên app thật | Rà soát best practice |
| D17 | **Động lực:** không streak, không bảng xếp hạng; dùng mục tiêu tuần + bản đồ tiến độ | Rà soát best practice |
| D18 | **Đồng thuận của Nguyên:** phụ huynh nói rõ với con và để con đồng ý trước khi app ghi dữ liệu học & hội thoại AI | Luật BVDLCN 91/2025/QH15 |
| D19 | **Giữ app luôn chạy & sao lưu:** tác vụ tự động "gõ cửa" hằng ngày (tránh Supabase free tự dừng sau 1 tuần) + xuất dữ liệu hằng tuần vào GitHub riêng tư | Rà soát best practice |

## 2.5 Non-Goals (phiên bản đầu — KHÔNG làm)

| Non-Goal | Lý do |
|---|---|
| Không thay thế gia sư | Nghiên cứu (Cognitive Tutor Geometry) cho thấy phần mềm một mình không tốt hơn giáo viên; app chỉ hỗ trợ, không tự dạy |
| Không làm offline / PWA ngoại tuyến | Nhà luôn có mạng; đồng bộ dữ liệu khi mất mạng phức tạp không tương xứng lợi ích ở quy mô 1 gia đình |
| Không dùng streak / bảng xếp hạng | Rà soát best practice: gây áp lực, không phù hợp người học tuổi 14 (D17) |
| Không tự chấm 100% chứng minh hình học viết tự do (C5) | LLM chấm proof còn quá dễ dãi (QEDBench, RefGrader) — luôn cần gia sư xác nhận, không giao hẳn cho máy |
| Không dùng mô hình xác suất (BKT) để tính mastery | Tiêu chí đơn giản cho kết quả tương đương, dễ hiểu và dễ gỡ lỗi hơn (D15) |
| Không mở rộng cho An ngay | Thiết kế đa học sinh từ đầu nhưng chỉ triển khai cho Nguyên ở P1–P3 (D11) |
| Không tích hợp ngược vào SkillGrow ở bản này | SkillGrow là tầng tổng hợp riêng; nối dữ liệu là việc của giai đoạn sau, ngoài phạm vi P0–P4 |

## 2.6 User Stories theo vai trò

**Phụ huynh**
- Là phụ huynh, tôi muốn tạo và khoá tài khoản gia sư/học sinh, để kiểm soát ai được truy cập dữ liệu của con.
- Là phụ huynh, tôi muốn thấy ngay 3 con số (KU đạt M3+, bài ôn quá hạn, cờ lệch) khi mở app, để biết tình hình trong 30 giây mà không cần đọc chi tiết.
- Là phụ huynh, tôi muốn được báo khi mức gia sư đề xuất và mức hệ thống tính lệch nhau, để tôi là người quyết định cuối cùng thay vì máy tự chốt.
- Là phụ huynh, tôi muốn duyệt nội dung bài học qua một link xem trước trước khi nó hiển thị cho Nguyên, để đảm bảo chất lượng trước khi con nhìn thấy.
- Là phụ huynh, tôi muốn thấy buổi dạy nào gia sư chưa ghi sau 24 giờ, để nhắc kịp thời thay vì mất dấu.

**Gia sư**
- Là gia sư, tôi muốn ghi buổi dạy trong dưới 2 phút trên điện thoại, để không tốn thời gian ngoài giờ dạy.
- Là gia sư, tôi muốn thấy điểm các bài làm gần nhất của Nguyên khi đề xuất mức hiểu, để đề xuất có căn cứ thay vì cảm tính.
- Là gia sư, tôi muốn xác nhận hoặc chấm lại bài chứng minh hình học AI đã sơ chấm, để đảm bảo đánh giá chính xác trước khi tính vào mastery.
- Là gia sư (mới), tôi muốn nhận tài khoản riêng khi bắt đầu dạy, để lịch sử dạy của tôi tách biệt với gia sư trước.

**Học sinh (Nguyên)**
- Là học sinh, tôi muốn mở app và thấy ngay "hôm nay cần làm" (bài mới + bài ôn), để không phải tự nhớ cần ôn gì.
- Là học sinh, tôi muốn xem lời giải mẫu trước khi tự làm một dạng bài mới, để không bị bỏ rơi giữa chừng.
- Là học sinh, tôi muốn hỏi AI khi làm sai một câu, để được gợi ý từng bước thay vì nhận đáp án ngay.
- Là học sinh, tôi muốn thấy bản đồ tiến độ của mình thay vì chuỗi ngày liên tục (streak), để không bị áp lực nếu nghỉ một hôm.
- Là học sinh, tôi muốn biết dữ liệu học và hội thoại AI của mình được ghi lại và ai xem được, trước khi bắt đầu dùng app (D18).

## 2.7 Acceptance Criteria theo màn hình (chốt sau khi duyệt mockup 01/10/2026)

**Học sinh — "Hôm nay cần làm"**
- Mở app khi có bài ôn đến hạn → danh sách ưu tiên bài ôn trước bài mới; mỗi mục có badge loại (Ôn lại/Bài mới), thời gian ước tính, nút hành động.
- ≥ 2 KU đến hạn ôn cùng lúc → câu hỏi trong phiên phải **trộn giữa các KU**, không 2 câu liên tiếp cùng KU/cách giải (D14).
- Trả lời sai lúc luyện tập (không phải exit/mastery test) và bấm "Hỏi AI" → AI gợi ý theo hint ladder từ mức thấp nhất (H0), **không đưa đáp án ngay**.
- Đang làm exit test / mastery test → khung hỏi AI **bị tắt/ẩn hoàn toàn**, không có cách mở lại.
- Gặp KU mới lần đầu → bắt buộc xem hết lời giải mẫu trước khi hệ thống mở phần tự giải (không cho bỏ qua).
- Hoàn thành một buổi học → thanh mục tiêu tuần cập nhật ngay; không hiển thị streak hay bảng xếp hạng ở bất kỳ đâu (D17).
- Chưa có xác nhận đồng ý theo D18 → app hiển thị màn hình giải thích & xin đồng ý trước khi vào "Hôm nay cần làm", không có đường vòng.

**Gia sư — "Ghi buổi dạy"**
- Tick một KU đã dạy → hệ thống hiển thị ngay điểm bài gần nhất của Nguyên làm bằng chứng, trước khi gia sư chọn mức đề xuất.
- Đã tick KU nhưng chưa chọn mức M0–M4 → nút "Lưu buổi dạy" chặn hoặc cảnh báo, không cho lưu đề xuất rỗng.
- Form hợp lệ và bấm "Lưu buổi dạy" → lưu thành công, hiển thị thời điểm lưu gần nhất; toàn bộ thao tác thực hiện được trong ≤ 2 phút trên điện thoại.
- Bài chứng minh hình học C5 đã được AI sơ chấm → gia sư phải **xác nhận hoặc chấm lại** trước khi kết quả được tính vào mastery; chưa xác nhận thì không tự động tính.
- Gia sư mới nhận lớp → tài khoản mới hoàn toàn tách biệt (không dùng lại tài khoản cũ); lịch sử buổi dạy trước đó vẫn gắn đúng gia sư cũ.
- Gia sư đăng nhập xem danh sách học sinh → chỉ thấy học sinh được gán cho mình (RLS), không thấy học sinh khác.

**Phụ huynh — "Tổng quan"**
- Mở dashboard → 3 con số đầu trang (KU đạt M3+/tổng, bài ôn quá hạn, cờ lệch) hiển thị ngay ở lần render đầu, không cần cuộn/bấm thêm.
- Mức gia sư đề xuất và mức hệ thống tính lệch ≥ 1 bậc → mục "Cần chú ý" liệt kê KU đó kèm cả hai giá trị + bằng chứng (điểm các bài gần nhất) + nút "Xem & chốt mức".
- Phụ huynh chốt mức hiểu từ màn hình cờ lệch → giá trị "mức phụ huynh chốt" được ghi là nguồn cuối cùng; cờ ⚠️ biến mất khỏi danh sách cần chú ý.
- Một buổi dạy quá 24 giờ chưa được gia sư ghi → mục "Cần chú ý" hiển thị nhắc nhở kèm nút hành động nhắc gia sư.
- Nội dung mới đã soạn (JSON + preview) → phụ huynh xem được qua **link preview hiển thị như bài thật** (không phải JSON thô) trước khi có nút publish.
- KU chưa đủ số lần làm để tin cậy → ô mức hiểu gắn nhãn "chưa đủ dữ liệu" thay vì hiển thị một mức chắc chắn (D15).

## 3. Kiến trúc v1.0

### 3.1 Stack
| Lớp | Chọn |
|---|---|
| Frontend + server | Next.js trên Vercel; có manifest "thêm vào màn hình chính" (không làm offline) |
| DB + Auth + Storage | Supabase (Postgres, RLS bật cho **mọi bảng**) |
| Code & nội dung | GitHub repo → Vercel auto-deploy; mỗi thay đổi có link preview |
| Công thức | KaTeX (hiển thị), MathLive (nhập) |
| Hình học | SVG / GeoGebra embed |
| AI | Claude API gọi phía server, có trần chi phí tháng |
| Vận hành | Tác vụ ping hằng ngày + backup hằng tuần (D19) |

### 3.2 Vai trò & quyền
| Chức năng | Phụ huynh | Gia sư | Học sinh |
|---|---|---|---|
| Tạo/khoá tài khoản | ✅ | — | — |
| Duyệt & publish module/bài tập | ✅ | — | — |
| Ghi buổi dạy | xem | ✅ | — |
| Đề xuất mức M0–M4 | xem | ✅ | — |
| Chốt mức hiểu | ✅ | — | — |
| Làm bài, lịch ôn | xem | xem | ✅ |
| Hỏi AI | xem log | xem log | ✅ |
| Báo cáo | ✅ toàn bộ | ✅ chỉ học sinh được gán | ✅ của mình |

### 3.3 Cấu trúc nội dung
- Module (= domain) → Knowledge Unit (KU) → mỗi KU gồm: lý thuyết tương tác, ví dụ mẫu, ngân hàng bài L1–L4, exit test, mastery test, error map (E01–E15), remediation.
- Lưu dạng **JSON trong repo** (tham khảo định dạng Perseus của Khan Academy): mỗi câu hỏi có KU, cấp độ, đáp án/lời giải chuẩn, mã lỗi gắn với đáp án sai thường gặp.
- Quy trình: Claude soạn → link preview → phụ huynh duyệt → publish (D16).

### 3.4 Thang dạng bài & chấm
| Cấp | Dạng | Chấm | Phase |
|---|---|---|---|
| 1 | Trắc nghiệm, đúng/sai | Tự động | P1 |
| 2 | Nhập đáp số (căn, phân số) | Tự động, chấp nhận dạng tương đương | P1 |
| 3 | Nhập biểu thức/phương trình | Tự động (so tương đương) | P3 |
| 4 | Giải theo bước | Tự động từng bước + gắn mã lỗi | P3 |

**Riêng chứng minh hình học (thang giảm dần hỗ trợ):**
| Bậc | Dạng | Chấm | Phase |
|---|---|---|---|
| C1 | Kéo hình động (drag test), chọn dự đoán | Tự động | P1 |
| C2 | Sắp xếp bước chứng minh (Proof Blocks, có bước nhiễu) | Tự động, báo sai từ dòng nào | P1 |
| C3 | Chứng minh 2 cột: chọn/điền lý do | Tự động | P1 |
| C4 | Chọn đường phụ cần kẻ + sắp xếp | Tự động | P3 |
| C5 | Viết tự do như bài thi | AI sơ chấm theo lời giải chuẩn → gia sư xác nhận | P3 |

### 3.5 Trình tự học trong 1 KU (mới — worked example & fading)
1. Xem **lời giải mẫu** (kèm câu hỏi tự giải thích "vì sao làm bước này?").
2. Lời giải mẫu **khuyết dần bước** → học sinh điền.
3. Tự giải hoàn toàn (L1 → L4).
4. Exit test (AI tắt).

### 3.6 Mức hiểu (mastery)
- Mỗi KU lưu 3 giá trị: mức gia sư đề xuất / mức hệ thống tính / mức phụ huynh chốt. Lệch ≥ 1 bậc → cờ ⚠️.
- Mức hệ thống = **trung bình các lần làm gần nhất**, hiển thị kèm **số lần đã làm**; ít lần → gắn nhãn "chưa đủ dữ liệu" (D15).
- KU yếu / hay quên → yêu cầu nhiều lần đúng hơn mới lên mức.
- Ngưỡng số cụ thể chốt khi làm module 1. Ví dụ khởi điểm: M3 = exit test ≥ 80% + không lặp lỗi nghiêm trọng; M4 = qua lượt ôn D+21. KU hình học: M3+ cần qua C3 + ≥ 1 bài C5 gia sư đã xác nhận.
- **AI tắt trong exit test / mastery test.**

### 3.7 Lịch ôn (D14)
- KU đạt ngưỡng → sinh lượt ôn D+1, D+7, D+21.
- **Mỗi phiên ôn trộn câu từ nhiều KU khác nhau** (không 2 câu liên tiếp cùng cách giải).
- Ôn sai → KU đó quay về D+1; ôn đúng dễ dàng → giãn khoảng cách tiếp theo.
- Log mọi lượt ôn (đúng/sai, thời gian, mức dễ/khó) để có thể chuyển sang FSRS khi đủ dữ liệu.

### 3.8 Màn hình theo vai trò
| Vai trò | Màn hình chính |
|---|---|
| Học sinh | **"Hôm nay cần làm"** (bài mới + bài ôn đến hạn), phiên 20–30 phút; bản đồ tiến độ; mục tiêu tuần. Không streak/xếp hạng (D17) |
| Gia sư | Form ghi buổi dạy **≤ 2 phút trên điện thoại**: tick KU đã dạy từ danh sách, đề xuất mức hiểu **kèm bằng chứng hệ thống** (điểm gần nhất), ghi chú tuỳ chọn |
| Phụ huynh | Đầu trang **3 con số**: KU đạt M3+/tổng · bài ôn quá hạn · cờ lệch đánh giá. Dưới: bảng màu theo domain; buổi dạy chưa ghi > 24h; tóm tắt tuần tự động |

### 3.9 AI giảng bài
| Thiết kế | Cách làm |
|---|---|
| Ngữ cảnh | Đề + **lời giải chuẩn đã duyệt** + bài làm + mã lỗi + lý thuyết KU. **Không gửi họ tên học sinh** |
| Phong cách | Hint ladder H0→H6, Socratic; 6 tiêu chí sư phạm (LearnLM): học chủ động, giảm quá tải, thích ứng, khơi tò mò, siêu nhận thức, bám chủ đề |
| Chống tính sai | Giải thích dựa trên lời giải đã duyệt, không tự giải lại |
| Giới hạn | Chỉ Toán & bài đang làm; giới hạn lượt/ngày; trần chi phí; tắt khi làm bài kiểm tra |
| Kiểm định trước khi bật | **Bộ test 20–30 lỗi sai điển hình** → phụ huynh chấm câu trả lời AI theo rubric → đạt mới bật cho Nguyên |
| Minh bạch | Lưu toàn bộ hội thoại, phụ huynh & gia sư xem được |
| System prompt | Tài liệu riêng, phụ huynh duyệt trước khi bật |

### 3.10 Bảo mật & dữ liệu
- RLS trên mọi bảng; khoá quản trị (service role) chỉ ở server, không bao giờ trên trình duyệt.
- Gia sư chỉ thấy học sinh được gán.
- Không gửi thông tin định danh sang AI.
- Nguyên được giải thích & đồng ý (D18).
- Backup hằng tuần (D19).

### 3.11 Mô hình dữ liệu (sơ bộ)
`users`, `students`, `tutor_assignments`, `modules`, `units`, `items`, `attempts`, `sessions`, `mastery` (3 mức + số lần), `review_queue`, `review_log`, `ai_chats`, `ai_eval_cases`.

## 4. Milestones / Roadmap

| # | Phase | Nội dung | Trạng thái |
|---|---|---|---|
| M0 | Discovery & kiến trúc | Thu thập yêu cầu, research hình học, kiến trúc v0.1 | ✅ Xong 01/10/2026 |
| M0.5 | Rà soát best practice | Đối chiếu 10 hạng mục → chốt v1.0 | ✅ Xong 01/10/2026 |
| P0 | Khung app | Tạo tài khoản dịch vụ; auth 3 vai trò; trang quản trị tài khoản; ping + backup | ⬜ Tiếp theo |
| P1 | Module Hệ thức lượng | Lời giải mẫu & fading; bài cấp 1–2 + C1–C3; ghi buổi dạy; mastery + cờ lệch; lịch ôn trộn; 3 dashboard → **pilot 2 tuần** | ⬜ |
| P2 | AI giảng bài | Bộ test AI → phụ huynh duyệt → bật cho Nguyên | ⬜ |
| P3 | Nâng cao | Cấp 3–4, C4–C5, đề tổng hợp, báo cáo tuần/tháng | ⬜ |
| P4+ | Mở rộng | Thêm module theo lộ trình 24 tuần; thêm An | ⬜ |

## 9. Exit criteria

Dự án đóng khi: app chạy thật cho cả 3 vai trò; phủ đủ các module theo lộ trình 24 tuần; dùng xuyên suốt đến kỳ thi vào 10; retrospective hoàn tất.

## 10. Còn để ngỏ (chốt trong lúc build)

| Hạng mục | Chốt khi nào |
|---|---|
| Ngưỡng số mastery (%, số lần đúng) | Khi soạn module 1 (P1) |
| Quy tắc giãn lịch ôn khi "đúng dễ dàng" | P1 |
| Rubric chấm AI tutor & bộ 20–30 test case | Đầu P2 |
| Có lên gói trả phí Supabase không | Sau pilot P1 |

## 11. Design artifacts

| Artifact | Link |
|---|---|
| Architecture & mastery flow | https://claude.ai/artifact/CwCTQkvaSsCEvTCCFdYUjN |
| Mockup — Học sinh "Hôm nay cần làm" | https://claude.ai/artifact/SbYxtyyYq9tQ17XFBZPeWQ |
| Mockup — Gia sư "Ghi buổi dạy" | https://claude.ai/artifact/1phBDeaFTdVAhbcN9UWxUu |
| Mockup — Phụ huynh "Tổng quan" | https://claude.ai/artifact/3tku853tUt4UonMZxUPtFV |

Content source for module 1: hub file `deliverables/he-thuc-luong-tam-giac-vuong.html` (chapters 0–7); master plan (domains A–Q, error codes E01–E15, hint ladder H0–H6): hub file `deliverables/PROJECT_HOC_TOAN_LOP9_6_THANG_MASTER.md`.
