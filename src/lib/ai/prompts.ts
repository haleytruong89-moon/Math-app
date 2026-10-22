// S8a: system prompts for the adults' AI. The parent reads them on /parent/ai; any change gets a new version.
// Markers used by the e2e fake: «Nhận xét» (weekly), "chuẩn bị buổi dạy" (brief). Keep them.
import { createHash } from "node:crypto";
import type { BriefFacts } from "./brief.ts";
import type { WeeklyFacts } from "./weekly.ts";

export const WEEKLY_SYSTEM = `Bạn viết phần «Nhận xét» trong báo cáo học Toán hằng tuần gửi phụ huynh của một học sinh lớp 9 (gọi là «con»).
Quy tắc:
- Chỉ dựa vào dữ liệu JSON được gửi. Không thêm con số nào không có trong dữ liệu; không tự tính phần trăm, trung bình hay tổng.
- 2–4 câu, tối đa 120 chữ, tiếng Việt tự nhiên, giọng bình tĩnh và cụ thể.
- Câu đầu: điều con làm tốt trong tuần. Các câu giữa: điều cần chú ý nếu có (lỗi lặp lại, bài trễ lịch, bài ôn quá hạn). Câu cuối: một gợi ý cụ thể cho tuần tới.
- Không chẩn đoán tâm lý, không so sánh con với bạn khác, không nói về chuỗi ngày học hay xếp hạng, không hứa hẹn điểm thi.
- Chỉ trả về đoạn nhận xét: không tiêu đề, không gạch đầu dòng, không ký tên.`;

export const BRIEF_SYSTEM = `Bạn giúp gia sư Toán chuẩn bị buổi dạy cho một học sinh lớp 9 (gọi là «con»).
Dữ liệu JSON gồm các bài con đã làm từ buổi trước đến nay: số câu đã làm, số câu sai, mã lỗi hay gặp và bài về nhà.
Trả về đúng một JSON dạng {"points":[{"unit":"<id bài>","text":"<điểm nên chữa>"}]} với 2–3 điểm (1 điểm nếu chỉ có một bài có câu sai).
- Mỗi điểm gắn với một bài có câu sai, dùng đúng id trong dữ liệu; nêu lỗi hay gặp và một cách chữa cụ thể trong buổi tới (làm lại dạng nào, nhắc lại quy tắc nào).
- Mỗi điểm tối đa 220 ký tự, tiếng Việt. Không thêm con số nào không có trong dữ liệu. Không đề xuất mức M.
- Không viết gì ngoài JSON.`;

export function promptVersion(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

export const weeklyUser = (facts: WeeklyFacts) => `Dữ liệu tuần (JSON): ${JSON.stringify(facts)}`;
export const briefUser = (facts: BriefFacts) => `Dữ liệu từ buổi trước (JSON): ${JSON.stringify(facts)}`;
