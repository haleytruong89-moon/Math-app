// Student screens (spec 2026-10-05 student UX). Pure, so `node --test` covers it.
import { RULES } from "./rules.ts";

/** By the hour in Vietnam: before 11:00 morning, before 18:00 afternoon, otherwise evening. */
export function greeting(at: Date): "Chào buổi sáng" | "Chào buổi chiều" | "Chào buổi tối" {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(at)) % 24;
  if (h >= 4 && h < 11) return "Chào buổi sáng";
  if (h >= 11 && h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export type NudgeInput = { level: number; practiceCount: number; practiceRight: number };

/** What it takes to reach the next level — always the real rule (U6), never "n more right answers → M3". */
export function masteryNudge(m: NudgeInput): { text: string; progress?: { done: number; total: number } } {
  const window = RULES.practiceWindow; // 5
  const needRight = Math.ceil(RULES.m2Rate * window - 1e-9); // 3 of 5
  if (m.level <= 1) {
    if (m.practiceCount < window)
      return { text: `Làm thêm ${window - m.practiceCount} câu luyện để hệ thống đánh giá lên M2`, progress: { done: m.practiceCount, total: window } };
    return { text: `Cần đúng thêm ${Math.max(1, needRight - m.practiceRight)} câu trong ${window} câu gần nhất để lên M2`, progress: { done: m.practiceRight, total: window } };
  }
  if (m.level === 2) return { text: "Làm bài kiểm tra cuối để lên M3" };
  if (m.level === 3) return { text: "Qua lượt ôn D+21 để lên M4" };
  return { text: "Đã vững — giữ phong độ khi ôn nhé" };
}

/**
 * The nudge shown after a practice answer — none while a parent-confirmed level is in effect: the
 * confirmation is display only (P2) and would otherwise contradict the system-level nudge.
 */
export function practiceNudge(m: NudgeInput, confirmedInEffect: boolean): ReturnType<typeof masteryNudge> | null {
  return confirmedInEffect ? null : masteryNudge(m);
}

export const PRAISE = ["Giỏi lắm!", "Làm tốt lắm!", "Chuẩn rồi!"] as const;

export function praise(i: number): string {
  return PRAISE[((i % PRAISE.length) + PRAISE.length) % PRAISE.length];
}

/** Session-only count (U2): every graded answer shown this session, right or wrong — never a streak. */
export function sessionTally(results: boolean[]): { right: number; total: number } {
  return { right: results.filter(Boolean).length, total: results.length };
}
