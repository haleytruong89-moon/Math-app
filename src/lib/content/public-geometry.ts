// S5: what the browser sees of the geometry proof items — rendered HTML in a shuffled order, never the key.
// Pure (no server-only import) so node tests cover it; index.ts calls it for publicItem / toPublicUnit.
import type { Item } from "./schema.ts";
import { displayOrder } from "./shuffle.ts";
import { texToHtml } from "./tex.ts";
import type { ProofSeg, PublicItem } from "./public.ts";

type Of<T extends Item["type"]> = Extract<Item, { type: T }>;

export function proofView(it: Of<"proof">): { proofLines: ProofSeg[][]; bankHtml: string[] } {
  const proofLines = it.lines.map((l) =>
    l
      .split(/(\[\[\d\]\])/)
      .filter(Boolean)
      .map((seg): ProofSeg => {
        const m = /^\[\[(\d)\]\]$/.exec(seg);
        return m ? { blank: Number(m[1]) - 1 } : { html: texToHtml(seg) };
      }),
  );
  return { proofLines, bankHtml: displayOrder(it.id, it.bank.length).map((k) => texToHtml(it.bank[k])) };
}

export function orderView(it: Of<"order">): { orderLinesHtml: string[]; extraCount: number } {
  const all = [...it.lines.map((l) => l.text), ...it.distractors.map((d) => d.text)];
  return { orderLinesHtml: displayOrder(it.id, all.length).map((k) => texToHtml(all[k])), extraCount: it.distractors.length };
}

/** Levels as asks + options; `node` (the right next fact) only comes back from the server after a check. */
export function analysisView(it: Of<"analysis">): { goalHtml: string; steps: { promptHtml: string; item: PublicItem }[] } {
  return {
    goalHtml: texToHtml(it.goal),
    steps: it.steps.map((st) => ({
      promptHtml: texToHtml(st.ask),
      item: { id: st.item.id, type: "mcq", level: st.item.level, promptHtml: texToHtml(st.item.prompt), optionsHtml: st.item.options.map(texToHtml) },
    })),
  };
}

export function workedAnalysisView(a: { goal: string; steps: { ask: string; node: string }[] }): { goalHtml: string; steps: { askHtml: string; nodeHtml: string }[] } {
  return { goalHtml: texToHtml(a.goal), steps: a.steps.map((s) => ({ askHtml: texToHtml(s.ask), nodeHtml: texToHtml(s.node) })) };
}
