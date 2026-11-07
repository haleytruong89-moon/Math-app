// Thi thử (S9, 07/11/2026, docs/superpowers/specs/2026-11-06-thi-thu-design.md §3): the score sheet of each mock
// paper (Đề 57–68). No problem text — the student sits the printed paper; the sheet is for the tutor who grades it.
// Pure, so `node --test` covers it.
import { z } from "zod";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** "1", "1.1", "4.2b": Bài 1–5, then the part number, then an optional sub-part a–c (the DB checks the same shape). */
export const PART_KEY = /^[1-5](\.[1-9][a-c]?)?$/;
export const MOCK_PAPERS = [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68] as const;

export const MockPart = z
  .object({
    part: z.string().regex(PART_KEY, "ý dạng 1.1, 4.2b"),
    /** Points, a multiple of 0,25. */
    max: z.number().positive().max(4),
    /** Final answer or key idea for the grader (TeX allowed). Never shown to the student. */
    answer: z.string().trim().min(1).max(400),
    /** KUs this part tests (1–2), from the curriculum. */
    units: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1).max(2),
  })
  .strict();
export type MockPart = z.infer<typeof MockPart>;

export const MockSheet = z
  .object({
    paper: z.number().int().min(57).max(68),
    status: z.enum(["draft", "approved"]),
    approvedOn: IsoDate.optional(),
    /** Book pages, so the adult can print the right ones ("tr. 130–131"). */
    pages: z.string().trim().min(1).max(40),
    parts: z.array(MockPart).min(5),
    note: z.string().trim().max(400).optional(),
  })
  .strict()
  .refine((s) => s.status !== "approved" || !!s.approvedOn, { message: "approved cần approvedOn" });
export type MockSheet = z.infer<typeof MockSheet>;

export const MockBank = z.object({ papers: z.array(MockSheet) }).strict();
export type MockBank = z.infer<typeof MockBank>;

export const baiOf = (part: string) => Number(part[0]);
const quarter = (x: number) => Math.abs(x * 4 - Math.round(x * 4)) < 1e-9;
const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

/** Rules beyond the schema, in Vietnamese for the author; empty = fine. */
export function checkSheet(s: MockSheet, roadmap: Set<string>): string[] {
  const out: string[] = [];
  const keys = s.parts.map((p) => p.part);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dup.length) out.push(`Đề ${s.paper}: ý trùng ${[...new Set(dup)].join(", ")}`);
  // A part and its own sub-parts are not both scored ("4.2" and "4.2b").
  for (const k of keys) if (keys.some((o) => o !== k && o.startsWith(k) && /[.a-c]/.test(o[k.length] ?? ""))) out.push(`Đề ${s.paper}: ý ${k} đã chia nhỏ, chỉ chấm các ý con`);
  for (const p of s.parts) {
    if (!quarter(p.max)) out.push(`Đề ${s.paper} ý ${p.part}: điểm tối đa phải là bội của 0,25`);
    for (const u of p.units) if (!roadmap.has(u)) out.push(`Đề ${s.paper} ý ${p.part}: KU "${u}" không có trong lộ trình`);
  }
  const total = sum(s.parts.map((p) => p.max));
  if (total !== 10) out.push(`Đề ${s.paper}: tổng điểm các ý là ${total}, phải là 10`);
  for (let b = 1; b <= 5; b++) if (!s.parts.some((p) => baiOf(p.part) === b)) out.push(`Đề ${s.paper}: thiếu Bài ${b}`);
  return out;
}

export function checkBank(bank: MockBank, roadmap: Set<string>): string[] {
  const nums = bank.papers.map((p) => p.paper);
  const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
  return [...(dup.length ? [`Đề trùng: ${[...new Set(dup)].join(", ")}`] : []), ...bank.papers.flatMap((p) => checkSheet(p, roadmap))];
}
