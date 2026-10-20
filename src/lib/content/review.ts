// T7 (S10): per-item content review and unit approval. Pure — shared by the tutor and parent screens,
// the student's view of a unit and the tests. Hashes are always computed from the current content on the server.
import { createHash } from "node:crypto";
import { itemHash } from "./lock.ts";
import type { Item, Unit } from "./schema.ts";
import { vnDate } from "../learning/rules.ts";

export const LESSON = "_lesson";
export const REVIEW_RULES = { noteMax: 500, minPractice: 4, minExit: 5 } as const;

export type Verdict = "ok" | "fix";
export type ReviewRow = { unit_id: string; item_id: string; verdict: Verdict; note: string | null; grading_hash: string; content_hash: string; reviewer_id: string; created_at: string };
export type ApprovalRow = { unit_id: string; action: "approve" | "return"; note: string | null; actor_id: string; created_at: string };
export type ItemStatus = "unseen" | "ok" | "fix" | "changed";
export type Reviewable = { id: string; kind: "lesson" | "practice" | "exit"; gradingHash: string; contentHash: string; item: Item | null };
export type ReviewEntry = Reviewable & { status: ItemStatus; note: string | null; reviewedAt: string | null };
export type UnitReview = {
  items: ReviewEntry[];
  counts: Record<ItemStatus, number>;
  approved: { at: string; by: string } | null;
  canApprove: { ok: true } | { ok: false; reason: string };
  okIds: Set<string>;
};
export type ShelfStatus = "approved" | "reapprove" | "waiting" | "none";

/** JSON with object keys sorted at every level, so hashes don't depend on key order (arrays keep their order). */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  return JSON.stringify(v ?? null);
}

const h16 = (v: unknown) => createHash("sha256").update(canonicalJson(v)).digest("hex").slice(0, 16);

/** What gets a verdict: the lesson block (theory, worked, faded), then practice, then exit items. */
export function reviewables(unit: Unit): Reviewable[] {
  const faded = unit.faded.steps.flatMap((s) => ("item" in s ? [s.item] : []));
  return [
    { id: LESSON, kind: "lesson", gradingHash: h16(faded.map(itemHash)), contentHash: h16({ theory: unit.theory, worked: unit.worked, faded: unit.faded, figure: unit.figure ?? null }), item: null },
    ...unit.practice.map((it) => ({ id: it.id, kind: "practice" as const, gradingHash: itemHash(it), contentHash: h16(it), item: it })),
    ...unit.exit.map((it) => ({ id: it.id, kind: "exit" as const, gradingHash: itemHash(it), contentHash: h16(it), item: it })),
  ];
}

/** ok stays ok through wording edits; a changed grading key, or any edit after "Cần sửa", asks for another look. */
export function statusOf(r: Reviewable, latest: ReviewRow | undefined): ItemStatus {
  if (!latest) return "unseen";
  if (latest.verdict === "ok") return latest.grading_hash === r.gradingHash ? "ok" : "changed";
  return latest.content_hash === r.contentHash ? "fix" : "changed";
}

export function unitReview(unit: Unit, rows: ReviewRow[], approvals: ApprovalRow[]): UnitReview {
  const latest = new Map<string, ReviewRow>();
  for (const r of rows) {
    if (r.unit_id !== unit.id) continue;
    const prev = latest.get(r.item_id);
    if (!prev || prev.created_at <= r.created_at) latest.set(r.item_id, r);
  }
  const items: ReviewEntry[] = reviewables(unit).map((r) => {
    const l = latest.get(r.id);
    return { ...r, status: statusOf(r, l), note: l?.note ?? null, reviewedAt: l?.created_at ?? null };
  });
  const counts: Record<ItemStatus, number> = { unseen: 0, ok: 0, fix: 0, changed: 0 };
  for (const i of items) counts[i.status]++;
  const okIds = new Set(items.filter((i) => i.status === "ok").map((i) => i.id));
  const okOf = (k: Reviewable["kind"]) => items.filter((i) => i.kind === k && i.status === "ok").length;
  const last = approvals.filter((a) => a.unit_id === unit.id).sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1);
  const left = counts.unseen + counts.changed;
  const canApprove: UnitReview["canApprove"] = !okIds.has(LESSON)
    ? { ok: false, reason: "Phần lý thuyết & bài mẫu chưa đạt." }
    : left
      ? { ok: false, reason: `Còn ${left} câu chưa xem.` }
      : okOf("practice") < REVIEW_RULES.minPractice
        ? { ok: false, reason: `Cần ít nhất ${REVIEW_RULES.minPractice} câu luyện tập đạt (đang có ${okOf("practice")}).` }
        : okOf("exit") < REVIEW_RULES.minExit
          ? { ok: false, reason: `Cần ít nhất ${REVIEW_RULES.minExit} câu kiểm tra đạt (đang có ${okOf("exit")}).` }
          : { ok: true };
  return { items, counts, approved: last?.action === "approve" ? { at: last.created_at, by: last.actor_id } : null, canApprove, okIds };
}

/**
 * The unit as a student may see it: git-approved units whole (the H2 lock protects them); DB-approved units
 * with only their "ok" items, and only while the lesson block is ok and enough items remain.
 */
export function studentView(unit: Unit, review: UnitReview | null): Unit | null {
  if (unit.status === "approved") return unit;
  if (!review?.approved || !review.okIds.has(LESSON)) return null;
  const practice = unit.practice.filter((i) => review.okIds.has(i.id));
  const exit = unit.exit.filter((i) => review.okIds.has(i.id));
  if (practice.length < REVIEW_RULES.minPractice || exit.length < REVIEW_RULES.minExit) return null;
  return { ...unit, status: "approved", approvedOn: vnDate(review.approved.at), practice, exit };
}

export function shelfStatus(unit: Unit | null, review: UnitReview | null): ShelfStatus {
  if (!unit) return "none";
  if (unit.status === "approved") return "approved";
  if (review?.approved) return studentView(unit, review) ? "approved" : "reapprove";
  return "waiting";
}

/** The next item that still needs a look (unseen or changed), after `afterId` and wrapping around. */
export function nextToReview(review: UnitReview, afterId?: string): string | null {
  const todo = (e: ReviewEntry) => e.status === "unseen" || e.status === "changed";
  const i = afterId ? review.items.findIndex((e) => e.id === afterId) : -1;
  const order = [...review.items.slice(i + 1), ...review.items.slice(0, i + 1)];
  return order.find(todo)?.id ?? null;
}

/** "Cần sửa" notes as one block the parent pastes to a Claude content session. */
export function fixNotesText(list: { unitId: string; unitTitle: string; itemId: string; note: string; at: string }[]): string {
  return list
    .map((n) => `- ${n.unitId} (${n.unitTitle}) / ${n.itemId}: ${n.note} — ${vnDate(n.at).slice(5).split("-").reverse().join("/")}`)
    .join("\n");
}
