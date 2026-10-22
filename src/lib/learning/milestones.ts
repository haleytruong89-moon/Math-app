// S4b: progress to the exam milestones 8.5 / 9.5 and KUs late against the phase plan (CURRICULUM.md §3.3, §4).
// Pure, so `node --test` covers it; S8's weekly report reuses it. Rulings 22/10 (docs/SPEC.md §0):
// a milestone counts every core KU of its phases (P2 never, KUs without content yet do — they still have to be learnt),
// "solid" = shown level ≥ M3 (exit test passed; the D+7/D+21 reviews to M4 are not needed), and a KU is late once
// its phase is over while it is still below M3.
import type { Curriculum, CurriculumPhase } from "../content/curriculum.ts";
import type { Level } from "./rules.ts";

export const SOLID: Level = 3;

export type MilestoneUnit = {
  id: string;
  title: string;
  phase: number;
  phaseTo: string;
  level: Level;
  hasContent: boolean;
  mustSolid: boolean;
  late: boolean;
};

export type MilestoneProgress = {
  id: string;
  title: string;
  due: string;
  total: number;
  solid: number;
  mustSolid: { total: number; solid: number };
  /** Core KUs whose phase is already over — all of them should be solid by now. */
  expected: number;
  late: MilestoneUnit[];
  weeksLeft: number;
  /** KUs still to make solid per remaining week (0 when done, `remaining` when the due date has passed). */
  perWeek: number;
  units: MilestoneUnit[];
};

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);

/** The phase `today` falls in; before the start → the first, after the end → null. */
export function currentPhase(phases: CurriculumPhase[], today: string): CurriculumPhase | null {
  if (phases.length && today < phases[0].from) return phases[0];
  return phases.find((p) => p.from <= today && today <= p.to) ?? null;
}

type Input = { levels: Map<string, Level>; withContent: Set<string>; today: string };

function unitRows(c: Curriculum, { levels, withContent, today }: Input, mustSolid: Set<string> = new Set()): MilestoneUnit[] {
  const phaseTo = new Map(c.phases.map((p) => [p.n, p.to]));
  return c.units
    .filter((u) => u.phase !== null && u.priority !== "P2")
    .map((u) => {
      const level = levels.get(u.id) ?? 0;
      const to = phaseTo.get(u.phase!) ?? c.learnBy;
      return { id: u.id, title: u.title, phase: u.phase!, phaseTo: to, level, hasContent: withContent.has(u.id), mustSolid: mustSolid.has(u.id), late: to < today && level < SOLID };
    });
}

/** Core KUs late against the plan: their phase ended before `today` and they are below M3. Earliest phase first. */
export function lateUnits(c: Curriculum, input: Input): MilestoneUnit[] {
  return unitRows(c, input)
    .filter((u) => u.late)
    .sort((a, b) => a.phase - b.phase);
}

export function milestoneProgress(c: Curriculum, input: Input): MilestoneProgress[] {
  return c.milestones.map((m) => {
    const must = new Set(m.mustSolid);
    const units = unitRows(c, input, must).filter((u) => m.phases.includes(u.phase));
    const solid = units.filter((u) => u.level >= SOLID).length;
    const remaining = units.length - solid;
    const left = days(input.today, m.due);
    const weeksLeft = left > 0 ? Math.ceil(left / 7) : 0;
    return {
      id: m.id,
      title: m.title,
      due: m.due,
      total: units.length,
      solid,
      mustSolid: { total: units.filter((u) => u.mustSolid).length, solid: units.filter((u) => u.mustSolid && u.level >= SOLID).length },
      expected: units.filter((u) => u.phaseTo < input.today).length,
      late: units.filter((u) => u.late).sort((a, b) => a.phase - b.phase),
      weeksLeft,
      perWeek: remaining === 0 ? 0 : weeksLeft === 0 ? remaining : Math.round((remaining / weeksLeft) * 10) / 10,
      units,
    };
  });
}
