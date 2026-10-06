// LT13: each exit test draws 5 items from the bank of 8 (1 L1 + 2 L2 + 2 L3), unseen items first,
// then the ones seen longest ago. Deterministic from the history, so the server re-draws on submit
// and refuses a different set — no table needed.
import { RULES, type AttemptRow } from "./rules.ts";

type BankItem = { id: string; level: string };

/** FNV-1a: a stable pseudo-random order within a level (ties among unseen items). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Item ids for the next exit run, in bank order. `attempts` = this student's answers on this unit;
 * `salt` = student + unit, so two students (or two units) don't get the same order.
 */
export function drawExit(bank: BankItem[], attempts: AttemptRow[], salt: string): string[] {
  const { size, quota } = RULES.exitDraw;
  if (bank.length <= size) return bank.map((b) => b.id);

  const exits = attempts.filter((a) => a.mode === "exit");
  const lastSeen = new Map<string, string>();
  for (const a of exits) if ((lastSeen.get(a.item_id) ?? "") < a.created_at) lastSeen.set(a.item_id, a.created_at);
  const seed = `${salt}:${new Set(exits.map((a) => a.exit_run)).size}`;
  // Unseen ("" sorts first), then oldest last-seen, then the seeded shuffle.
  const order = (x: BankItem, y: BankItem) =>
    (lastSeen.get(x.id) ?? "").localeCompare(lastSeen.get(y.id) ?? "") || hash(`${seed}:${x.id}`) - hash(`${seed}:${y.id}`);

  const picked = new Set<string>();
  for (const [level, n] of Object.entries(quota))
    bank.filter((b) => b.level === level).sort(order).slice(0, n).forEach((b) => picked.add(b.id));
  // A bank that doesn't follow the standard: fill up from what is left, same order.
  for (const b of bank.filter((b) => !picked.has(b.id)).sort(order)) {
    if (picked.size >= size) break;
    picked.add(b.id);
  }
  return bank.filter((b) => picked.has(b.id)).map((b) => b.id);
}

/** The draw for one student and unit (same salt on the page and in submitExit). */
export function exitDrawFor(studentId: string, unit: { id: string; exit: BankItem[] }, attempts: AttemptRow[]): string[] {
  return drawExit(unit.exit, attempts, `${studentId}:${unit.id}`);
}
