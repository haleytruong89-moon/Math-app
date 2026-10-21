// The 48-KU roadmap (LT1, LT17; docs/CURRICULUM.md). Pure module (no Next/React imports) so `node --test` loads it.
import { z } from "zod";

const Id = z.string().regex(/^[a-z0-9-]+$/);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Master-plan domains A–Q plus backfill domains F0–F3. */
export const Domain = z.string().regex(/^([A-Q]|F[0-3])$/, "domain phải thuộc A–Q hoặc F0–F3");
export type Track = "A" | "B" | "C";

export const CurriculumModule = z.object({ id: Id, title: z.string().min(1), domains: z.array(Domain).min(1) }).strict();
export const CurriculumUnit = z
  .object({
    id: Id,
    module: Id,
    title: z.string().min(1),
    track: z.enum(["A", "B", "C"]),
    seq: z.number().int().positive(), // order inside its track (suggestions only)
    prereq: z.array(Id),
    examWeight: z.union([z.number().min(0), z.literal("indirect")]),
    grading: z.enum(["full", "scaffolded", "partial", "tutor"]),
    testOut: z.boolean(), // LT4
    batch: z.number().int().min(0).max(10), // content batch (CURRICULUM.md H6)
    priority: z.enum(["P0", "P1", "P2"]), // LT17: P2 = "Học thêm khi dư thời gian", suggested after the track's core
  })
  .strict();
export const Curriculum = z
  .object({ start: IsoDate, learnBy: IsoDate, modules: z.array(CurriculumModule).min(1), units: z.array(CurriculumUnit).min(1) })
  .strict();

export type CurriculumModule = z.infer<typeof CurriculumModule>;
export type CurriculumUnit = z.infer<typeof CurriculumUnit>;
export type Curriculum = z.infer<typeof Curriculum>;

type FileModule = { mod: { id: string; domains: string[]; units: string[] }; units: { id: string; module: string; title: string }[] };

/** Every rule of LT1 / P1_PLAN S6a ("Kiểm tra"); returns readable problems, [] when fine. */
export function checkCurriculum(c: Curriculum, files: FileModule[]): string[] {
  const errs: string[] = [];
  const byId = new Map<string, CurriculumUnit>();
  for (const u of c.units) {
    if (byId.has(u.id)) errs.push(`${u.id}: id trùng`);
    byId.set(u.id, u);
  }
  // LT17: P2 waits for the core, so the core must never wait for a P2 KU.
  for (const u of c.units)
    if (u.priority !== "P2")
      for (const p of u.prereq) if (byId.get(p)?.priority === "P2") errs.push(`${u.id}: bài lõi ${u.priority} phụ thuộc bài P2 ${p}`);
  const mods = new Map(c.modules.map((m) => [m.id, m]));
  if (mods.size !== c.modules.length) errs.push("module id trùng");

  const seqs = new Map<string, string>();
  for (const u of c.units) {
    const k = `${u.track}|${u.seq}`;
    if (seqs.has(k)) errs.push(`${u.id}: seq ${u.seq} trùng trong track ${u.track} (với ${seqs.get(k)})`);
    seqs.set(k, u.id);
    if (!mods.has(u.module)) errs.push(`${u.id}: module "${u.module}" không có`);
    if (u.testOut && !(u.track === "B" || u.module.startsWith("backfill-"))) errs.push(`${u.id}: testOut chỉ cho track B hoặc module backfill-*`);
    for (const p of u.prereq) {
      const q = byId.get(p) ?? c.units.find((x) => x.id === p);
      if (!q) errs.push(`${u.id}: tiên quyết "${p}" không có`);
      else if (q.track === u.track && q.seq >= u.seq) errs.push(`${u.id}: tiên quyết "${p}" phải có seq nhỏ hơn trong track ${u.track}`);
    }
  }

  // prerequisite cycles
  const state = new Map<string, 1 | 2>();
  const visit = (id: string, trail: string[]) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      errs.push(`vòng tiên quyết: ${[...trail.slice(trail.indexOf(id)), id].join(" → ")}`);
      return;
    }
    state.set(id, 1);
    for (const p of byId.get(id)?.prereq ?? []) if (byId.has(p)) visit(p, [...trail, id]);
    state.set(id, 2);
  };
  for (const u of c.units) visit(u.id, []);

  // content files ↔ curriculum
  for (const { mod, units } of files) {
    const cm = mods.get(mod.id);
    if (!cm) errs.push(`module "${mod.id}": có file nhưng không có trong curriculum`);
    else if ([...cm.domains].sort().join() !== [...mod.domains].sort().join()) errs.push(`module "${mod.id}": domains khác curriculum`);
    for (const f of units) {
      const cu = byId.get(f.id);
      if (!cu) errs.push(`${f.id}: có file nhưng không có trong curriculum`);
      else {
        if (cu.title !== f.title) errs.push(`${f.id}: title khác file ("${cu.title}" ≠ "${f.title}")`);
        if (cu.module !== f.module) errs.push(`${f.id}: module khác file`);
      }
    }
  }
  return errs;
}

/** Every KU reachable through prerequisites (direct or indirect) — valid targets of a mistake's "review" link (LT16). */
export function ancestors(c: Curriculum, id: string): Set<string> {
  const prereq = new Map(c.units.map((u) => [u.id, u.prereq]));
  const out = new Set<string>();
  const stack = [...(prereq.get(id) ?? [])];
  while (stack.length) {
    const p = stack.pop()!;
    if (out.has(p)) continue;
    out.add(p);
    stack.push(...(prereq.get(p) ?? []));
  }
  return out;
}

/** LT6: a KU with a part graded on paper by the tutor ("Cần gia sư xác nhận"). */
export function needsTutor(u: { grading: CurriculumUnit["grading"] }): boolean {
  return u.grading === "partial" || u.grading === "tutor";
}

/** S5: a geometry KU whose proofs are practised in the app (analysis, C3, C2) — track C and not fully auto-graded. */
export function isProofKu(u: { track: Track; grading: CurriculumUnit["grading"] }): boolean {
  return u.track === "C" && u.grading !== "full";
}
