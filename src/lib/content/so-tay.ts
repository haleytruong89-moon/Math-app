// S5: "Sổ tay suy ngược" — goal → ways → signs in the problem, plus recurring figures with their ready-made facts.
// Reviewed and approved like content (draft until the parent approves in a PR). Pure for node tests.
import { z } from "zod";
import { SvgFigure } from "./schema.ts";

const Id = z.string().regex(/^[a-z0-9-]+$/);
const Text = z.string().trim().min(1);

export const SoTay = z
  .object({
    status: z.enum(["draft", "approved"]),
    approvedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    goals: z
      .array(
        z
          .object({
            id: Id,
            title: Text,
            tip: Text,
            ways: z.array(z.object({ how: Text, sign: Text, units: z.array(Id).min(1) }).strict()).min(1),
          })
          .strict(),
      )
      .min(1),
    figures: z.array(z.object({ id: Id, title: Text, figure: SvgFigure.optional(), facts: z.array(Text).min(1) }).strict()),
  })
  .strict()
  .refine((s) => s.status !== "approved" || !!s.approvedOn, { message: "approved cần approvedOn" });
export type SoTay = z.infer<typeof SoTay>;

/** Issues in Vietnamese; empty = fine. Every KU named must be on the roadmap. */
export function checkSoTay(s: SoTay, unitIds: Set<string>): string[] {
  const out: string[] = [];
  for (const g of s.goals) for (const w of g.ways) for (const u of w.units) if (!unitIds.has(u)) out.push(`so-tay ${g.id}: bài "${u}" không có trong lộ trình`);
  const ids = [...s.goals.map((g) => g.id), ...s.figures.map((f) => f.id)];
  if (new Set(ids).size !== ids.length) out.push("so-tay: id trùng");
  return out;
}
