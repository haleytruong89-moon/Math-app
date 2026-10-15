// CONTENT_STANDARD §7 step 1: rules a KU must meet beyond the schema (LT13, LT14, LT16, AI2).
// Pure module so `node --test` can load it.
import type { Item, Unit } from "./schema.ts";

const PRACTICE = { L1: 3, L2: 3, L3: 2 };
const EXIT_BANK = { L1: 2, L2: 3, L3: 3 };
const MAX_HINT_WORDS = 25;
/** CONTENT_STANDARD §6: exams 57–68 of the 68-exam book are kept untouched for mock tests (from ~01/2027). */
const RESERVED_EXAM = /Đề\s*(5[7-9]|6[0-8])(?!\d)/;
/** Options are shown in file order, so the key must not sit mostly in one slot (batch 2 had 47 of 50 at option 0). */
const MCQ_BALANCE = { min: 8, maxShare: 0.6 };

const levels = (items: Item[]) => ({
  L1: items.filter((i) => i.level === "L1").length,
  L2: items.filter((i) => i.level === "L2").length,
  L3: items.filter((i) => i.level === "L3").length,
});
const same = (a: Record<string, number>, b: Record<string, number>) => Object.keys(b).every((k) => a[k] === b[k]);
const shape = (n: Record<string, number>) => `${n.L1} L1 + ${n.L2} L2 + ${n.L3} L3`;

/**
 * Does a hint give the answer away? Only answers of 2+ characters are checked (a lone digit is everywhere),
 * as a standalone token — not an exponent / index ($x^{12}$) and not part of a longer number (120).
 */
export function hintRevealsAnswer(hint: string, answer: string): boolean {
  const a = answer.replace(/\s/g, "");
  if (a.length < 2) return false;
  const h = hint.replace(/\s/g, "");
  const esc = a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^0-9,.^_{])${esc}(?![0-9])`).test(h);
}

function mistakesOf(it: Item): { code: string; review?: string }[] {
  if (it.type === "steps") return it.steps.flatMap((st) => mistakesOf(st.item));
  return it.type === "mcq" ? Object.values(it.mistakes ?? {}) : (it.mistakes ?? []);
}

/** Issues in Vietnamese for the author; empty = meets the standard. `prereqs` = all prerequisites of the KU. */
export function checkStandard(u: Unit, prereqs: Set<string>): string[] {
  const out: string[] = [];
  const all = [...u.faded.steps.flatMap((s) => ("item" in s ? [s.item] : [])), ...u.practice, ...u.exit];
  for (const it of all)
    for (const m of mistakesOf(it))
      if (m.review && !prereqs.has(m.review)) out.push(`${it.id}: review "${m.review}" không phải bài tiên quyết của ${u.id}`);
      else if (m.code === "E12" && !m.review) out.push(`${it.id}: mã E12 (hổng nền) cần review tới bài nền`);
  for (const it of all.flatMap((x) => [x, ...(x.type === "steps" ? x.steps.map((st) => st.item) : [])]))
    if (it.source && RESERVED_EXAM.test(it.source))
      out.push(`${it.id}: source "${it.source}" — ${it.source.match(RESERVED_EXAM)![0]} để dành cho thi thử, chỉ dùng Đề 1–56`);
  const mcqs = all.flatMap((x) => (x.type === "steps" ? x.steps.map((st) => st.item) : [x])).filter((i) => i.type === "mcq");
  if (mcqs.length >= MCQ_BALANCE.min) {
    const slots = new Map<number, number>();
    for (const m of mcqs) slots.set(m.correct, (slots.get(m.correct) ?? 0) + 1);
    const [slot, n] = [...slots].sort((a, b) => b[1] - a[1])[0];
    if (n > MCQ_BALANCE.maxShare * mcqs.length)
      out.push(`${u.id}: ${n}/${mcqs.length} câu trắc nghiệm có đáp án đúng ở phương án ${slot + 1} — đảo vị trí để không đoán được`);
  }
  const p = levels(u.practice);
  if (u.practice.length !== 8 || !same(p, PRACTICE)) out.push(`${u.id}: luyện tập cần 8 câu ${shape(PRACTICE)} (đang ${shape(p)})`);
  const rec = u.practice.filter((i) => i.recognition);
  if (!rec.length) out.push(`${u.id}: luyện tập cần ≥ 1 câu nhận dạng (recognition: true)`);
  for (const it of rec)
    if (it.type !== "mcq") out.push(`${it.id}: câu nhận dạng phải là trắc nghiệm`);
    else if (mistakesOf(it).some((m) => m.code !== "E05")) out.push(`${it.id}: phương án sai của câu nhận dạng dùng mã E05`);
  for (const it of u.practice) {
    if (!it.hints) {
      out.push(`${it.id}: câu luyện cần 3 gợi ý (hints)`);
      continue;
    }
    it.hints.forEach((h, i) => {
      if (h.split(/\s+/).filter(Boolean).length > MAX_HINT_WORDS) out.push(`${it.id}: gợi ý H${i + 1} quá 25 chữ`);
      const answers = it.type === "numeric" ? [it.answer] : it.type === "steps" ? it.steps.flatMap((st) => (st.item.type === "numeric" ? [st.item.answer] : [])).slice(-1) : [];
      if (answers.some((a) => hintRevealsAnswer(h, a))) out.push(`${it.id}: gợi ý H${i + 1} chứa đáp số`);
    });
  }

  const x = levels(u.exit);
  if (u.exit.length !== 8 || !same(x, EXIT_BANK)) out.push(`${u.id}: kho kiểm tra cần 8 câu ${shape(EXIT_BANK)} (đang ${shape(x)})`);
  for (const it of u.exit) if (it.hints) out.push(`${it.id}: câu kiểm tra không có gợi ý`);
  if (!u.exit.some((i) => i.source)) out.push(`${u.id}: kho kiểm tra cần ≥ 1 câu dạng đề thi có source`);
  return out;
}
