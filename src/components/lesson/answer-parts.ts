// Splitting an answer string into its parts — shared by the inputs (no JSX, no "use client").
import type { PublicItem } from "@/lib/content/public";

const SEP = "|";

/** LT5 steps / S5 analysis levels. */
export const stepParts = (item: PublicItem, value: string) => {
  const n = item.steps?.length ?? 0;
  const parts = value.split(SEP);
  return Array.from({ length: n }, (_, i) => parts[i] ?? "");
};

/** S5 C3: one shown bank position (or "") per blank. */
export const proofParts = (item: PublicItem, value: string) => {
  const n = (item.proofLines ?? []).flat().filter((s) => "blank" in s).length;
  const parts = value.split(SEP);
  return Array.from({ length: n }, (_, i) => parts[i] ?? "");
};

/** S5 C2: shown positions in the chosen order. */
export const orderPicked = (value: string) => (value.trim() ? value.split(",").map(Number) : []);
