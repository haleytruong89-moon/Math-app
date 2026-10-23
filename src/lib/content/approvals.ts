import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { curriculum, getUnit, listModules, type ContentModule } from "@/lib/content";
import type { Module, Unit } from "@/lib/content/schema";
import { shelfStatus, studentView, unitReview, type ApprovalRow, type ReviewRow, type ShelfStatus, type UnitReview } from "./review";
import { vnDate } from "@/lib/learning/rules";

const PAGE = 1000; // Supabase "Max rows"

async function readAll<T>(table: string, cols: string): Promise<T[] | null> {
  const admin = createAdminClient();
  const out: T[] = [];
  for (let from = 0; from < 50 * PAGE; from += PAGE) {
    const r = await admin.from(table).select(cols).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (r.error) {
      console.error("approvals", table, r.error.message);
      return null;
    }
    out.push(...((r.data ?? []) as T[]));
    if ((r.data ?? []).length < PAGE) break;
  }
  return out;
}

/**
 * T7: every verdict and approval (content metadata, no student data), once per request. Read with the admin
 * client so a student's own pages can compute what they may see. On a read error only git-approved units show.
 */
export const loadReviewData = cache(async (): Promise<{ rows: ReviewRow[]; approvals: ApprovalRow[] }> => {
  const [rows, approvals] = await Promise.all([
    readAll<ReviewRow>("item_reviews", "unit_id, item_id, verdict, note, grading_hash, content_hash, reviewer_id, created_at"),
    readAll<ApprovalRow>("unit_approvals", "unit_id, action, note, actor_id, created_at"),
  ]);
  return { rows: rows ?? [], approvals: approvals ?? [] };
});

export async function reviewOf(unitId: string): Promise<UnitReview | null> {
  const f = getUnit(unitId);
  if (!f) return null;
  const d = await loadReviewData();
  return unitReview(f.unit, d.rows, d.approvals);
}

/** Modules as a student sees them; `includeDrafts` (tutor views) keeps the rest as plain drafts. */
export async function studentModules(opts: { includeDrafts?: boolean } = {}): Promise<ContentModule[]> {
  const d = await loadReviewData();
  return listModules().map((m) => ({
    ...m,
    unitList: m.unitList.flatMap((u) => {
      const v = studentView(u, unitReview(u, d.rows, d.approvals));
      return v ? [v] : opts.includeDrafts ? [u] : [];
    }),
  }));
}

export async function studentUnit(unitId: string): Promise<{ unit: Unit; module: Module } | null> {
  const f = getUnit(unitId);
  if (!f) return null;
  const d = await loadReviewData();
  const v = studentView(f.unit, unitReview(f.unit, d.rows, d.approvals));
  return v ? { unit: v, module: f.module } : null;
}

export type ShelfRow = { id: string; title: string; module: string; moduleTitle: string; track: string; status: ShelfStatus; approvedOn: string | null; reviewed: number; total: number; fix: number };

/** Kho bài: every roadmap KU with its status and review progress. */
export async function shelf(): Promise<ShelfRow[]> {
  const d = await loadReviewData();
  const { units, modules } = curriculum();
  const title = new Map(modules.map((m) => [m.id, m.title]));
  return units.map((e) => {
    const f = getUnit(e.id);
    const rv = f ? unitReview(f.unit, d.rows, d.approvals) : null;
    return {
      id: e.id,
      title: e.title,
      module: e.module,
      moduleTitle: title.get(e.module) ?? e.module,
      track: e.track,
      status: shelfStatus(f?.unit ?? null, rv),
      approvedOn: f?.unit.status === "approved" ? (f.unit.approvedOn ?? null) : rv?.approved ? vnDate(rv.approved.at) : null,
      reviewed: rv ? rv.counts.ok + rv.counts.fix : 0,
      total: rv ? rv.items.length : 0,
      fix: rv?.counts.fix ?? 0,
    };
  });
}
