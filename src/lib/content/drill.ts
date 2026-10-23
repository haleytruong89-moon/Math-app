// Luyện đề 4.2 (23/10/2026, docs/superpowers/specs/2026-10-23-luyen-de-42-design.md): one real Bài 4.2 problem of
// Đề 1–56 split into auto-graded proof items (backward analysis, C3, C2). Pure, so `node --test` covers it.
import { z } from "zod";
import { Item, SvgFigure } from "./schema.ts";

const Id = z.string().regex(/^[a-z0-9-]+$/);
const Text = z.string().trim().min(1);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const DrillProblem = z
  .object({
    id: z.string().regex(/^ld-d\d{2}$/, "id dạng ld-dNN (NN = số đề, 2 chữ số)"),
    order: z.number().int().positive(),
    title: Text,
    source: Text,
    parts: z.array(z.enum(["a", "b"])).min(1),
    /** KUs the problem needs; it opens when every one is at M3 or has the tutor's ★. */
    needs: z.array(Id).min(1),
    status: z.enum(["draft", "approved"]),
    approvedOn: IsoDate.optional(),
    figure: SvgFigure,
    problem: Text,
    items: z.array(Item).min(2).max(4),
    solution: Text,
  })
  .strict()
  .refine((p) => p.status !== "approved" || !!p.approvedOn, { message: "approved cần approvedOn" });
export type DrillProblem = z.infer<typeof DrillProblem>;

export const DrillBank = z.object({ problems: z.array(DrillProblem) }).strict();
export type DrillBank = z.infer<typeof DrillBank>;

/** Exams 57–68 are reserved for mock tests (CONTENT_STANDARD §6); drills use Đề 1–56. */
const examNo = (source: string) => Number(source.match(/Đề\s*(\d+)/)?.[1] ?? NaN);

/** Rules beyond the schema, in Vietnamese for the author; empty = fine. */
export function checkDrill(p: DrillProblem, roadmap: Set<string>): string[] {
  const out: string[] = [];
  const n = examNo(p.source);
  if (!(n >= 1 && n <= 56)) out.push(`${p.id}: nguồn phải là Đề 1–56 (đang: "${p.source}")`);
  if (Number(p.id.slice(4)) !== n) out.push(`${p.id}: id phải theo số đề của nguồn (Đề ${n})`);
  for (const k of p.needs) if (!roadmap.has(k)) out.push(`${p.id}: bài cần "${k}" không có trong lộ trình`);
  p.items.forEach((it, i) => {
    if (it.id !== `${p.id}-${i + 1}`) out.push(`${p.id}: câu thứ ${i + 1} phải có id ${p.id}-${i + 1}`);
  });
  const count = (t: Item["type"]) => p.items.filter((i) => i.type === t).length;
  if (!count("analysis")) out.push(`${p.id}: cần ≥ 1 câu phân tích ngược`);
  if (!count("proof") && !count("order")) out.push(`${p.id}: cần ≥ 1 câu điền chỗ trống hoặc sắp xếp bước`);
  for (const it of p.items) {
    if (it.type === "analysis")
      it.steps.forEach((st, i) => {
        if (Object.keys(st.item.mistakes ?? {}).length < st.item.options.length - 1) out.push(`${it.id}: tầng ${i + 1}: mỗi hướng sai cần phản hồi`);
      });
    if (it.type === "proof" && it.blanks.some((b) => !Object.keys(b.mistakes ?? {}).length)) out.push(`${it.id}: mỗi chỗ trống cần ≥ 1 lựa chọn sai có phản hồi`);
    if (it.type === "order" && !it.distractors.length) out.push(`${it.id}: câu sắp xếp cần ≥ 1 bước nhiễu`);
  }
  return out;
}

export function checkDrillBank(b: DrillBank, roadmap: Set<string>): string[] {
  const out = b.problems.flatMap((p) => checkDrill(p, roadmap));
  const ids = b.problems.map((p) => p.id);
  if (new Set(ids).size !== ids.length) out.push("luyện đề: id trùng");
  const orders = b.problems.map((p) => p.order);
  if (new Set(orders).size !== orders.length) out.push("luyện đề: order trùng");
  return out;
}
