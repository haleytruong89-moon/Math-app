// Error taxonomy E01–E15 (master plan §26, sent by the parent 05/10/2026).
// English names are canonical (match the hub docs); the student sees the Vietnamese name.
// Note: the Remediation Router (§27) only covers 7 of these codes so far.

export const ERROR_CODES = [
  { code: "E01", en: "Calculation Error", vi: "Tính toán sai" },
  { code: "E02", en: "Algebra Manipulation", vi: "Biến đổi đại số sai" },
  { code: "E03", en: "Formula Recall", vi: "Nhớ sai công thức" },
  { code: "E04", en: "Concept Gap", vi: "Chưa hiểu khái niệm" },
  { code: "E05", en: "Recognition Gap", vi: "Chưa nhận ra dạng bài" },
  { code: "E06", en: "Strategy Gap", vi: "Chưa tìm được hướng giải" },
  { code: "E07", en: "Modeling / Representation Gap", vi: "Chưa chuyển đề thành mô hình" },
  { code: "E08", en: "Geometry Reading / Drawing", vi: "Đọc hoặc vẽ hình sai" },
  { code: "E09", en: "Proof Logic Gap", vi: "Lập luận chứng minh chưa chặt" },
  { code: "E10", en: "Careless Error", vi: "Sơ ý" },
  { code: "E11", en: "Presentation Error", vi: "Trình bày thiếu hoặc sai" },
  { code: "E12", en: "Prerequisite Gap", vi: "Hổng kiến thức nền" },
  { code: "E13", en: "Time Management", vi: "Chưa phân bổ thời gian" },
  { code: "E14", en: "Domain / Condition / Unit Error", vi: "Sai điều kiện, miền hoặc đơn vị" },
  { code: "E15", en: "Calculator / Rounding Error", vi: "Sai do máy tính hoặc làm tròn" },
] as const;

/** "E04 — Chưa hiểu khái niệm"; an unknown code stays bare; nothing → null. */
export function errorLabel(code: string | null | undefined, lang: "vi" | "en" = "vi"): string | null {
  if (!code) return null;
  const e = ERROR_CODES.find((x) => x.code === code);
  return e ? `${e.code} — ${e[lang]}` : code;
}
