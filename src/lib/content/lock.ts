// H2 (audit 19/10/2026): answers are stored as the student typed them — an MCQ answer is the
// option *index*. Changing the options, the right option or the right value of an item a student
// has already answered would silently re-mean that history. So once a unit is approved, the grading
// key of every recorded item is locked in content/approved.lock.json and a test refuses changes.
// Wording (prompt, solution, hints, feedback) stays editable. Pure module: used by the test and the script.
import { createHash } from "node:crypto";
import { afterOf } from "./grade.ts";

type Simple =
  | { id: string; type: "mcq"; options: string[]; correct: number }
  | { id: string; type: "numeric"; answer: string };
type Gradable =
  | Simple
  | { id: string; type: "steps"; steps: { item: Simple }[] }
  | { id: string; type: "analysis"; steps: { item: Simple }[] }
  | { id: string; type: "proof"; bank: string[]; blanks: { correct: number }[] }
  | { id: string; type: "order"; lines: { text: string; after?: number[] }[]; distractors: { text: string }[] };
type LockableUnit = {
  id: string;
  status: string;
  faded: { steps: ({ item: Simple } | { text: string })[] };
  practice: Gradable[];
  exit: Gradable[];
};

/** What decides right / wrong and what a stored answer means. */
function gradingKey(it: Gradable): unknown {
  if (it.type === "mcq") return ["mcq", it.options.map((o) => o.trim()), it.correct];
  if (it.type === "numeric") return ["numeric", it.answer.trim()];
  if (it.type === "analysis") return ["analysis", it.steps.map((s) => gradingKey(s.item))];
  // S5: the stored answer is a shown position — the bank / lines (and the id that seeds the shuffle) are part of the key.
  if (it.type === "proof") return ["proof", it.id, it.bank.map((b) => b.trim()), it.blanks.map((b) => b.correct)];
  if (it.type === "order")
    return ["order", it.id, it.lines.map((l, i) => [l.text.trim(), afterOf(it.lines, i)]), it.distractors.map((d) => d.text.trim())];
  return ["steps", it.steps.map((s) => gradingKey(s.item))];
}

export function itemHash(it: Gradable): string {
  return createHash("sha256").update(JSON.stringify(gradingKey(it))).digest("hex").slice(0, 16);
}

/** Every item whose answers are recorded in `attempts` (faded blanks, practice, exit), by id. */
export function recordedItems(u: LockableUnit): Gradable[] {
  return [...u.faded.steps.flatMap((s) => ("item" in s ? [s.item] : [])), ...u.practice, ...u.exit];
}

export type Lock = { units: Record<string, Record<string, string>> };

export type LockProblem = { unitId: string; itemId: string; kind: "changed" | "removed" | "unlocked" };

/**
 * Compare content with the lock. `changed` / `removed`: a locked item no longer grades the same
 * (or is gone) — refuse. `unlocked`: an approved unit has an item the lock doesn't know yet.
 */
export function checkLock(units: LockableUnit[], lock: Lock): LockProblem[] {
  const out: LockProblem[] = [];
  const byId = new Map(units.map((u) => [u.id, u]));
  for (const [unitId, items] of Object.entries(lock.units)) {
    const u = byId.get(unitId);
    const now = new Map((u ? recordedItems(u) : []).map((it) => [it.id, itemHash(it)]));
    for (const [itemId, h] of Object.entries(items)) {
      const cur = now.get(itemId);
      if (cur === undefined) out.push({ unitId, itemId, kind: "removed" });
      else if (cur !== h) out.push({ unitId, itemId, kind: "changed" });
    }
  }
  for (const u of units) {
    if (u.status !== "approved") continue;
    const locked = lock.units[u.id] ?? {};
    for (const it of recordedItems(u)) if (!(it.id in locked)) out.push({ unitId: u.id, itemId: it.id, kind: "unlocked" });
  }
  return out;
}

/**
 * The lock after adding every not-yet-locked item of approved units. Existing entries never change,
 * except the ids in `relock` (a deliberate wording fix of an option: new hash, or dropped if the item is gone).
 */
export function updateLock(units: LockableUnit[], lock: Lock, relock: Set<string> = new Set()): Lock {
  const next: Lock = { units: {} };
  const byId = new Map(units.map((u) => [u.id, u]));
  const ids = new Set([...Object.keys(lock.units), ...units.filter((u) => u.status === "approved").map((u) => u.id)]);
  for (const unitId of [...ids].sort()) {
    const u = byId.get(unitId);
    const now = new Map((u ? recordedItems(u) : []).map((it) => [it.id, itemHash(it)]));
    const entries: Record<string, string> = {};
    for (const [itemId, h] of Object.entries(lock.units[unitId] ?? {})) {
      if (!relock.has(itemId)) entries[itemId] = h;
      else if (now.has(itemId)) entries[itemId] = now.get(itemId)!;
    }
    if (u?.status === "approved") for (const [itemId, h] of now) if (!(itemId in entries)) entries[itemId] = h;
    if (Object.keys(entries).length) next.units[unitId] = entries;
  }
  return next;
}
