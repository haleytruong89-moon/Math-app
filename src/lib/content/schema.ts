// Content format for modules / knowledge units (KU) / items (D16, §3.3).
// Content is JSON in /content, written by Claude, approved by the parent via pull request.
// Pure module (no Next/React imports) so `node --test` can load it directly.
import { z } from "zod";
import { parseAnswer } from "./grade.ts";
import { checkSvg } from "./svg.ts";

const Id = z.string().regex(/^[a-z0-9-]+$/, "id: chỉ dùng a-z, 0-9, dấu gạch ngang");
/** Text may contain inline TeX between $…$ and **bold**. */
const Text = z.string().trim().min(1);
export const ErrorCode = z.string().regex(/^E(0[1-9]|1[0-5])$/, "mã lỗi phải thuộc E01–E15");
export const Level = z.enum(["L1", "L2", "L3"]);

/** LT16: a wrong answer rooted in an earlier KU links to it ("Ôn lại: …", shown from S6b). */
const Mistake = z.object({ code: ErrorCode, feedback: Text, review: Id.optional() });

/** LT7: an inline SVG drawing (strict whitelist, theme colours) with its text alternative. */
export const SvgFigure = z
  .object({ svg: z.string(), alt: Text })
  .strict()
  .superRefine((f, ctx) => {
    for (const msg of checkSvg(f.svg)) ctx.addIssue({ code: "custom", message: msg });
  });
export type SvgFigure = z.infer<typeof SvgFigure>;

/** CONTENT_STANDARD fields shared by every item type; none of them reaches the browser yet (see publicItem). */
const Authoring = {
  /** LT15: where an L3 / exam-style item comes from, e.g. "68 đề – Đề 12, Bài 2c (chuyển thể)". */
  source: Text.optional(),
  /** LT14: "which method / first step?" item; wrong options are E05. */
  recognition: z.literal(true).optional(),
  /** AI2: pre-written hints H1 goal → H2 recognise → H3 tool (practice only). */
  hints: z.tuple([Text, Text, Text]).optional(),
  figure: SvgFigure.optional(),
};

export const McqItem = z
  .object({
    id: Id,
    type: z.literal("mcq"),
    level: Level,
    prompt: Text,
    ...Authoring,
    options: z.array(Text).min(2).max(6),
    correct: z.number().int().nonnegative(),
    /** Wrong option index (as string) → error code + targeted feedback. */
    mistakes: z.record(z.string().regex(/^\d$/), Mistake).optional(),
    solution: Text,
  })
  .strict()
  .superRefine((it, ctx) => {
    if (it.correct >= it.options.length) ctx.addIssue({ code: "custom", message: `${it.id}: correct ngoài phạm vi options` });
    if (new Set(it.options).size !== it.options.length) ctx.addIssue({ code: "custom", message: `${it.id}: options trùng nhau` });
    for (const k of Object.keys(it.mistakes ?? {})) {
      const i = Number(k);
      if (i === it.correct || i >= it.options.length) ctx.addIssue({ code: "custom", message: `${it.id}: mistakes[${k}] không phải đáp án sai hợp lệ` });
    }
  });

export const NumericItem = z
  .object({
    id: Id,
    type: z.literal("numeric"),
    level: Level,
    prompt: Text,
    ...Authoring,
    /** Exact value in answer syntax: 12, 4,8, 12/5, 2√3, √3/2 … */
    answer: z.string(),
    unit: z.string().optional(),
    /** Typical wrong answers → error code + targeted feedback. */
    mistakes: z.array(Mistake.extend({ answer: z.string() })).optional(),
    solution: Text,
  })
  .strict()
  .superRefine((it, ctx) => {
    const v = parseAnswer(it.answer);
    if (v === null) {
      ctx.addIssue({ code: "custom", message: `${it.id}: answer "${it.answer}" không đọc được` });
      return;
    }
    for (const m of it.mistakes ?? []) {
      const w = parseAnswer(m.answer);
      if (w === null) ctx.addIssue({ code: "custom", message: `${it.id}: mistake "${m.answer}" không đọc được` });
      else if (Math.abs(w - v) < 1e-9) ctx.addIssue({ code: "custom", message: `${it.id}: mistake "${m.answer}" lại bằng đáp án đúng` });
    }
  });

/** One answer box: what a faded blank or a step of a multi-step item can be. */
export const SimpleItem = z.discriminatedUnion("type", [McqItem, NumericItem]);
export type SimpleItem = z.infer<typeof SimpleItem>;

/**
 * LT5: a shared stem and 2–5 steps, each one decision (mcq / numeric), counted as ONE question:
 * right only if every step is; the error code is the first wrong step's. Step ids: <item id>-s<n>.
 */
export const StepsItem = z
  .object({
    id: Id,
    type: z.literal("steps"),
    level: Level,
    prompt: Text,
    ...Authoring,
    steps: z.array(z.object({ prompt: Text, item: SimpleItem }).strict()).min(2).max(5),
    solution: Text,
  })
  .strict()
  .superRefine((it, ctx) => {
    it.steps.forEach((st, i) => {
      if (st.item.id !== `${it.id}-s${i + 1}`) ctx.addIssue({ code: "custom", message: `${it.id}: bước ${i + 1} phải có id "${it.id}-s${i + 1}"` });
    });
  });

export const Item = z.union([SimpleItem, StepsItem]);
export type Item = z.infer<typeof Item>;

const WorkedStep = z.object({ text: Text, why: Text.optional() }).strict();
const FadedStep = z.union([
  z.object({ text: Text }).strict(),
  z.object({ prompt: Text, item: SimpleItem }).strict(),
]);

/** The built-in drawing (htl-1/2) or an inline SVG (LT7). */
export const Figure = z.union([z.enum(["right-triangle-altitude"]), SvgFigure]);

export const Unit = z
  .object({
    id: Id,
    module: Id,
    order: z.number().int().positive(),
    title: Text,
    /** Students only ever see "approved" units (D16). */
    status: z.enum(["draft", "approved"]),
    approvedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    estMinutes: z.number().int().min(5).max(90),
    figure: Figure.optional(),
    theory: z.array(Text).min(1),
    worked: z.object({ problem: Text, steps: z.array(WorkedStep).min(2), selfExplain: Text }).strict(),
    faded: z.object({ problem: Text, steps: z.array(FadedStep).min(2) }).strict(),
    practice: z.array(Item).min(4),
    exit: z.array(Item).min(4),
  })
  .strict()
  .superRefine((u, ctx) => {
    if (u.status === "approved" && !u.approvedOn) ctx.addIssue({ code: "custom", message: `${u.id}: approved cần approvedOn` });
    const ids = [
      ...u.faded.steps.flatMap((s) => ("item" in s ? [s.item.id] : [])),
      ...[...u.practice, ...u.exit].flatMap((i) => [i.id, ...(i.type === "steps" ? i.steps.map((st) => st.item.id) : [])]),
    ];
    const seen = new Set<string>();
    for (const id of ids) {
      if (!id.startsWith(`${u.id}-`)) ctx.addIssue({ code: "custom", message: `${id}: id câu phải bắt đầu bằng "${u.id}-"` });
      if (seen.has(id)) ctx.addIssue({ code: "custom", message: `${id}: id câu bị trùng` });
      seen.add(id);
    }
    if (!u.faded.steps.some((s) => "item" in s)) ctx.addIssue({ code: "custom", message: `${u.id}: lời giải khuyết bước cần ít nhất 1 chỗ trống` });
  });
export type Unit = z.infer<typeof Unit>;

// Module domains: master plan A–Q or backfill F0–F3 (LT1). The old single "domain" field still reads.
const ModuleDomain = z.string().regex(/^([A-Q]|F[0-3])$/, "domain phải thuộc A–Q hoặc F0–F3");
export const Module = z
  .object({
    id: Id,
    title: Text,
    domains: z.array(ModuleDomain).min(1).optional(),
    domain: z.string().regex(/^[A-Q]$/).optional(),
    units: z.array(Id).min(1),
  })
  .strict()
  .refine((m) => m.domains || m.domain, { message: "module cần domains" })
  .transform(({ domain, domains, ...m }) => ({ ...m, domains: domains ?? [domain!] }));
export type Module = z.infer<typeof Module>;
