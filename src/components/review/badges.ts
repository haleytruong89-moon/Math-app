import type { ShelfStatus } from "@/lib/content/review";
export const SHELF_BADGE: Record<ShelfStatus, [string, string]> = {
  approved: ["Đã duyệt", "bg-good-soft text-good"],
  waiting: ["Chờ duyệt", "bg-warn-soft text-warn"],
  reapprove: ["Cần duyệt lại", "bg-warn-soft text-warn"],
  none: ["Chưa soạn", "border border-border text-muted"],
};
