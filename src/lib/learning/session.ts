// Tutor "Ghi buổi dạy" form rules (P1_PLAN §3 S3, SPEC §2.7). Pure, so `node --test` covers it.
import { z } from "zod";
import { addDays, daysBetween, type Level } from "./rules.ts";

export const SESSION_RULES = {
  maxBackdateDays: 7, // a session can be logged up to 7 days late, never for the future
  noteMax: 500,
} as const;

export type SessionInput = {
  studentId: unknown;
  taughtOn: unknown;
  note: unknown;
  units: unknown[]; // ticked unit ids
  levels: Record<string, unknown>; // unit id → "0".."4" (missing = not chosen)
};

export type SessionValue = {
  studentId: string;
  taughtOn: string;
  note: string | null;
  proposals: { unitId: string; level: Level }[];
};

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày dạy không hợp lệ.");

/**
 * Validates a submitted session. `units` maps every known unit id to its title (for messages).
 * A session with no unit ticked is allowed only with a note (e.g. a lesson on a topic that is
 * not in the app yet) so the parent still sees that it happened.
 */
export function parseSession(
  input: SessionInput,
  today: string,
  units: Map<string, string>,
): { ok: true; value: SessionValue } | { ok: false; error: string } {
  const studentId = z.uuid().safeParse(input.studentId);
  if (!studentId.success) return { ok: false, error: "Không tìm thấy học sinh." };

  const day = IsoDate.safeParse(input.taughtOn);
  if (!day.success || Number.isNaN(Date.parse(`${day.data}T00:00:00Z`)) || addDays(day.data, 0) !== day.data)
    return { ok: false, error: "Ngày dạy không hợp lệ." };
  if (day.data > today) return { ok: false, error: "Ngày dạy không được ở tương lai." };
  if (daysBetween(day.data, today) > SESSION_RULES.maxBackdateDays)
    return { ok: false, error: `Chỉ ghi được buổi dạy trong ${SESSION_RULES.maxBackdateDays} ngày gần nhất.` };

  // Forms submit line breaks as CRLF while the textarea counts them as one character.
  const note = typeof input.note === "string" ? input.note.replace(/\r\n?/g, "\n").trim() : "";
  if (note.length > SESSION_RULES.noteMax) return { ok: false, error: `Ghi chú tối đa ${SESSION_RULES.noteMax} ký tự.` };

  const ticked = [...new Set(input.units.map(String))];
  const unknown = ticked.filter((u) => !units.has(u));
  if (unknown.length) return { ok: false, error: "Có bài học không tồn tại. Tải lại trang rồi thử lại." };
  if (!ticked.length && !note) return { ok: false, error: "Chọn ít nhất một bài đã dạy, hoặc ghi chú buổi này dạy gì." };

  const proposals: SessionValue["proposals"] = [];
  const missing: string[] = [];
  for (const unitId of ticked) {
    const raw = input.levels[unitId];
    const level = typeof raw === "string" && /^[0-4]$/.test(raw) ? (Number(raw) as Level) : null;
    if (level === null) missing.push(units.get(unitId)!);
    else proposals.push({ unitId, level });
  }
  if (missing.length) return { ok: false, error: `Chọn mức đề xuất cho: ${missing.map((t) => `“${t}”`).join(", ")}.` };

  return { ok: true, value: { studentId: studentId.data, taughtOn: day.data, note: note || null, proposals } };
}
