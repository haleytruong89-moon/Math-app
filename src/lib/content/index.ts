import "server-only";
import { Module, Unit, type Item } from "./schema.ts";
import { texToHtml } from "./tex.ts";
import type { PublicItem, PublicUnit } from "./public.ts";

// Content registry. To add a module/unit: add the JSON under /content and import it here
// (the content test fails if module.json and the files disagree).
import htlModule from "../../../content/he-thuc-luong/module.json";
import htl1 from "../../../content/he-thuc-luong/htl-1.json";
import htl2 from "../../../content/he-thuc-luong/htl-2.json";

const MODULES = [{ module: Module.parse(htlModule), units: [htl1, htl2].map((u) => Unit.parse(u)) }];

export type ContentModule = Module & { unitList: Unit[] };

export function listModules(): ContentModule[] {
  return MODULES.map(({ module, units }) => ({
    ...module,
    unitList: [...units].sort((a, b) => a.order - b.order),
  }));
}

export function getUnit(id: string): { unit: Unit; module: Module } | null {
  for (const { module, units } of MODULES) {
    const unit = units.find((u) => u.id === id);
    if (unit) return { unit, module };
  }
  return null;
}

export type ItemMode = "faded" | "practice" | "exit" | "review";

/** Find an item in the part of the unit that matches the mode (so exit items can't be "practised"). */
export function findItem(unit: Unit, itemId: string, mode: ItemMode): Item | null {
  const pool: Item[] =
    mode === "faded"
      ? unit.faded.steps.flatMap((s) => ("item" in s ? [s.item] : []))
      : mode === "practice"
        ? unit.practice
        : mode === "exit"
          ? unit.exit
          : unit.practice; // review: practice only, so exit-test solutions stay unseen until a retake
  return pool.find((i) => i.id === itemId) ?? null;
}

export function fadedItems(unit: Unit): Item[] {
  return unit.faded.steps.flatMap((s) => ("item" in s ? [s.item] : []));
}

export function publicItem(it: Item): PublicItem {
  return {
    id: it.id,
    type: it.type,
    level: it.level,
    promptHtml: texToHtml(it.prompt),
    optionsHtml: it.type === "mcq" ? it.options.map(texToHtml) : undefined,
    unit: it.type === "numeric" ? it.unit : undefined,
  };
}

export function toPublicUnit(unit: Unit, module: Module): PublicUnit {
  return {
    id: unit.id,
    moduleTitle: module.title,
    title: unit.title,
    status: unit.status,
    estMinutes: unit.estMinutes,
    figure: unit.figure,
    theoryHtml: unit.theory.map(texToHtml),
    worked: {
      problemHtml: texToHtml(unit.worked.problem),
      steps: unit.worked.steps.map((s) => ({ html: texToHtml(s.text), whyHtml: s.why ? texToHtml(s.why) : undefined })),
      selfExplainHtml: texToHtml(unit.worked.selfExplain),
    },
    faded: {
      problemHtml: texToHtml(unit.faded.problem),
      steps: unit.faded.steps.map((s) =>
        "item" in s
          ? { kind: "blank" as const, promptHtml: texToHtml(s.prompt), item: publicItem(s.item) }
          : { kind: "text" as const, html: texToHtml(s.text) },
      ),
    },
    practice: unit.practice.map(publicItem),
    exit: unit.exit.map(publicItem),
  };
}
