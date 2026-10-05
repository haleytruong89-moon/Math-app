# Pilot checklist — 2 tuần đầu (S7)

> Bắt đầu 05/10/2026 · kết thúc dự kiến 19/10/2026. Người dùng: Nguyên (học sinh), 1 gia sư, phụ huynh.
> Mục tiêu: biết app có **được dùng đều**, **số liệu có đúng**, và **quy tắc có hợp lý** không — trước khi
> soạn nhiều bài và làm tiếp S4/S5. Không cần hoàn hảo; ghi lại là đủ.

## 1. Trước ngày đầu (đã xong 05/10)

- [x] App thật chạy bản mới nhất (PR #4, #5, #7) — https://math-app-gules.vercel.app
- [x] Tài khoản con + gia sư tạo đúng, gia sư được gán; con đã đồng ý (D18)
- [x] Sao lưu hằng tuần chạy được (GitHub → Actions → Weekly database backup)
- [ ] Gửi gia sư: link app, email + mật khẩu, 3 câu hướng dẫn ở mục 2

## 2. Hướng dẫn ngắn cho từng người

**Con:** mỗi ngày mở app → làm thẻ đầu tiên ở "Hôm nay cần làm" (ôn trước, rồi bài đang học, rồi bài mới).
Mục tiêu tuần: 4 buổi. Có bài về nhà của thầy/cô thì làm ra giấy, xong bấm "Con làm xong rồi".

**Gia sư:** sau mỗi buổi dạy (≤ 24h): "Ghi buổi dạy" → tick bài đã dạy → xem bằng chứng → chọn mức M0–M4
→ ghi chú → (tuỳ) giao bài về nhà → Lưu. Trước buổi: "Xem bài làm" để biết con sai câu nào.
Buổi sau: chữa bài về nhà → "Đã chữa" + nhận xét.

**Phụ huynh:** mỗi tuần 1 lần (gợi ý Chủ nhật) làm mục 4; gặp lỗi thì ghi theo mục 5.

## 3. Theo dõi hằng ngày (phụ huynh, 1 phút — không bắt buộc)

- Con có mở app hôm nay không? (hỏi con, hoặc "Xem bài làm" → có câu mới)
- Có gì con kêu khó hiểu / app báo lỗi?

## 4. Tổng kết mỗi tuần (phụ huynh, ~10 phút)

Trên app: Tổng quan → **Xem bài làm** (từng bài: mức, số câu, lỗi hay gặp, câu sai).
S4 (trang Tổng quan đầy đủ) chưa có → các con số dưới đây lấy bằng câu SQL ở mục 6 (chỉ đọc).

| # | Câu hỏi | Tuần 1 | Tuần 2 | Ngưỡng cần để ý |
|---|---|---|---|---|
| 1 | Số buổi học trong tuần (mục tiêu 4) | | | < 2 → hỏi con vướng gì |
| 2 | Số câu đã làm / số bài đạt M3+ | | | |
| 3 | Lượt ôn đến hạn mà quá hạn > 2 ngày | | | > 0 → nhắc con |
| 4 | Gia sư ghi buổi đủ chưa (số buổi dạy thật vs số buổi đã ghi) | | | thiếu → nhắc gia sư |
| 5 | Mức gia sư đề xuất **lệch ≥ 1 bậc** so với mức hệ thống ở bài nào? | | | có → xem bài làm, hỏi gia sư |
| 6 | Bài về nhà: đã giao / con báo xong / đã chữa | | | |
| 7 | Lỗi hay gặp nhất (mã E..) | | | lặp lại → báo Claude soạn thêm câu |
| 8 | Con thấy thế nào (dễ/khó, chán/vui, quá dài?) | | | |

## 5. Gặp lỗi thì ghi thế nào

Ghi vào cuối file này (mục 7) hoặc nhắn thẳng cho Claude Code, mỗi lỗi 1 dòng:
**ai** (con / gia sư / phụ huynh) · **lúc nào** (ngày giờ) · **ở màn hình nào** · **làm gì** · **thấy gì** · ảnh chụp nếu có.
Không gửi mật khẩu, không chụp chuỗi kết nối database.

## 6. Câu SQL tổng kết tuần (Supabase → SQL Editor, chỉ đọc)

```sql
-- Số buổi học / câu đã làm theo ngày, 14 ngày gần nhất (giờ Việt Nam)
select (a.created_at at time zone 'Asia/Ho_Chi_Minh')::date as ngay,
       count(*) as so_cau,
       count(*) filter (where a.mode = 'practice') as luyen,
       count(*) filter (where a.mode = 'exit') as kiem_tra,
       count(*) filter (where a.mode = 'review') as on_lai,
       round(100.0 * avg(case when a.correct then 1 else 0 end)) as phan_tram_dung
from public.attempts a
where a.created_at > now() - interval '14 days' and a.mode <> 'faded'
group by 1 order by 1;

-- Lịch ôn: bài nào đến hạn / quá hạn
select r.unit_id, r.stage, r.due_on, current_date - r.due_on as so_ngay_qua_han
from public.review_queue r order by r.due_on;

-- Buổi dạy + mức đề xuất so với mức hệ thống lúc đề xuất
select t.taught_on, p.display_name as gia_su, tp.unit_id, tp.level as de_xuat, tp.system_level as he_thong, t.note
from public.teaching_sessions t
join public.profiles p on p.id = t.tutor_id
left join public.tutor_proposals tp on tp.session_id = t.id
order by t.taught_on desc;

-- Bài về nhà
select h.created_at::date as giao_ngay, h.due_on as han, h.task,
       h.done_at is not null as con_bao_xong, h.reviewed_at is not null as da_chua, h.review_note
from public.homework h order by h.created_at desc;
```

## 7. Cuối pilot (~19/10) — cùng Claude Code xem lại

1. App có được dùng đều không (≥ 3 buổi/tuần)? Gia sư có ghi buổi đều không?
2. Mức M của hệ thống có khớp cảm nhận của gia sư không? Bài nào lệch, vì sao?
3. Các con số quy tắc (đã duyệt 02/10, "chỉnh theo dữ liệu thật sau"): M2 = 5 câu luyện đầu ≥ 60% ·
   M3 = kiểm tra ≥ 80% · ôn 3 câu, đạt ≥ 2/3 · D+1/D+7/D+21 → 60 ngày · mục tiêu 4 buổi/tuần ·
   8 câu luyện + 5 câu kiểm tra/bài. Cái nào cần đổi?
4. Ưu tiên tiếp: S4 (Tổng quan phụ huynh), giao diện học sinh mới, soạn bài (S6), hình học (S5), AI (P2)?

### Ghi lỗi / góp ý trong pilot

| Ngày | Ai | Màn hình | Chuyện gì | Đã báo Claude? |
|---|---|---|---|---|
| | | | | |
