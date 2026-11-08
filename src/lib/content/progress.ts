// Kiểm tra tiến bộ (progress tests) and the 8,5 target (08/11/2026, docs/superpowers/specs/2026-11-08-ke-hoach-8-5-design.md).
// A progress test is a short paper (part of the exam) every 2 weeks before thi thử. Unlike a thi thử score sheet it
// carries the problem text — re-written from Đề 1–56 with new numbers — so the app can show and print it. Pure, so
// `node --test` covers it.
import { z } from "zod";
import { SvgFigure } from "./schema.ts";
import { baiOf, MockPart, PART_KEY } from "./mock.ts";

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Text = z.string().trim().min(1);

export const ProgressProblem = z
  .object({
    /** Exam Bài (1–5); the problem's parts are scored as <bai>.<n>[a-c] on the sheet. */
    bai: z.number().int().min(1).max(5),
    /** Paragraphs (TeX in $…$, **bold**); tables as KaTeX arrays. */
    text: z.array(Text).min(1),
    figure: SvgFigure.optional(),
  })
  .strict();
export type ProgressProblem = z.infer<typeof ProgressProblem>;

export const ProgressPart = MockPart.extend({
  /** Where the part comes from: "68 đề – Đề 12, Bài 1.1, tr.40 (đổi số liệu)". Đề 57–68 are reserved. */
  source: Text.max(160),
}).strict();
export type ProgressPart = z.infer<typeof ProgressPart>;

export const ProgressTest = z
  .object({
    /** KT<n>: 1–20 (the DB checks the same range). */
    n: z.number().int().min(1).max(20),
    /** Planned date (parent choice 08/11: every 2 weeks, Sundays). The adult still schedules it. */
    date: IsoDate,
    /** Paper (the tutor grades per part) or in the app (auto-graded — slice A2). */
    mode: z.enum(["paper"]),
    minutes: z.number().int().min(15).max(120),
    status: z.enum(["draft", "approved"]),
    approvedOn: IsoDate.optional(),
    /** One line for adults: which phase / Bài it covers. */
    covers: Text.max(300),
    problems: z.array(ProgressProblem).min(1),
    parts: z.array(ProgressPart).min(2),
    note: z.string().trim().max(400).optional(),
  })
  .strict()
  .refine((t) => t.status !== "approved" || !!t.approvedOn, { message: "approved cần approvedOn" });
export type ProgressTest = z.infer<typeof ProgressTest>;

export const TargetGroup = z
  .object({
    /** "1", "2", "3", "4.1", "4.2", "5" — a part belongs to the group whose key is its prefix. */
    key: z.enum(["1", "2", "3", "4.1", "4.2", "5"]),
    label: Text.max(60),
    max: z.number().positive().max(4),
    target: z.number().min(0).max(4),
    /** Core KUs behind this group (for "bài học vững x/y"). */
    units: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
  })
  .strict();
export type TargetGroup = z.infer<typeof TargetGroup>;

export const ProgressBank = z
  .object({
    target: z.object({ total: z.number().min(5).max(10), groups: z.array(TargetGroup).length(6) }).strict(),
    tests: z.array(ProgressTest),
  })
  .strict();
export type ProgressBank = z.infer<typeof ProgressBank>;

const quarter = (x: number) => Math.abs(x * 4 - Math.round(x * 4)) < 1e-9;
const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

/** The target group a part key belongs to ("4.2b" → "4.2", "1.1" → "1"). */
export function groupOf(part: string): TargetGroup["key"] {
  const b = baiOf(part);
  if (b === 4) return part.startsWith("4.1") ? "4.1" : "4.2";
  return String(b) as TargetGroup["key"];
}

/** Rules beyond the schema, in Vietnamese for the author; empty = fine. */
export function checkProgressBank(bank: ProgressBank, roadmap: Set<string>): string[] {
  const out: string[] = [];
  const g = bank.target.groups;
  const keys = g.map((x) => x.key);
  if (new Set(keys).size !== keys.length) out.push("Mục tiêu: nhóm trùng");
  if (sum(g.map((x) => x.max)) !== 10) out.push(`Mục tiêu: tổng điểm tối đa các nhóm là ${sum(g.map((x) => x.max))}, phải là 10`);
  if (sum(g.map((x) => x.target)) !== bank.target.total) out.push(`Mục tiêu: tổng điểm mục tiêu ${sum(g.map((x) => x.target))} khác ${bank.target.total}`);
  for (const x of g) {
    if (!quarter(x.max) || !quarter(x.target)) out.push(`Mục tiêu nhóm ${x.key}: điểm là bội của 0,25`);
    if (x.target > x.max) out.push(`Mục tiêu nhóm ${x.key}: mục tiêu lớn hơn điểm tối đa`);
    for (const u of x.units) if (!roadmap.has(u)) out.push(`Mục tiêu nhóm ${x.key}: KU "${u}" không có trong lộ trình`);
  }
  const ns = bank.tests.map((t) => t.n);
  const dup = ns.filter((n, i) => ns.indexOf(n) !== i);
  if (dup.length) out.push(`KT trùng số: ${[...new Set(dup)].join(", ")}`);
  for (const t of bank.tests) {
    const tag = `KT${t.n}`;
    const pk = t.parts.map((p) => p.part);
    const dp = pk.filter((k, i) => pk.indexOf(k) !== i);
    if (dp.length) out.push(`${tag}: ý trùng ${[...new Set(dp)].join(", ")}`);
    for (const k of pk) if (pk.some((o) => o !== k && o.startsWith(k) && /[.a-c]/.test(o[k.length] ?? ""))) out.push(`${tag}: ý ${k} đã chia nhỏ, chỉ chấm các ý con`);
    for (const p of t.parts) {
      if (!PART_KEY.test(p.part)) out.push(`${tag} ý ${p.part}: sai dạng`);
      if (!quarter(p.max)) out.push(`${tag} ý ${p.part}: điểm tối đa phải là bội của 0,25`);
      for (const u of p.units) if (!roadmap.has(u)) out.push(`${tag} ý ${p.part}: KU "${u}" không có trong lộ trình`);
      if (!t.problems.some((q) => q.bai === baiOf(p.part))) out.push(`${tag} ý ${p.part}: không có đề Bài ${baiOf(p.part)}`);
      // Đề 57–68 are reserved for thi thử (CONTENT_STANDARD §6).
      for (const m of p.source.matchAll(/Đề\s+(\d+)/g)) if (Number(m[1]) >= 57) out.push(`${tag} ý ${p.part}: Đề ${m[1]} để dành thi thử, không dùng`);
    }
    for (const q of t.problems) if (!t.parts.some((p) => baiOf(p.part) === q.bai)) out.push(`${tag}: Bài ${q.bai} không có ý nào để chấm`);
    if (sum(t.parts.map((p) => p.max)) > 10) out.push(`${tag}: tổng điểm quá 10`);
  }
  return out;
}
