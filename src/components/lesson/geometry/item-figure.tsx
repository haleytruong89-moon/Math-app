"use client";

import { useState } from "react";
import type { PublicItem } from "@/lib/content/public";
import { SvgFigure } from "../figure";

/** An item's figure; with S5 `drawFirst` it stays folded until she says she drew it on paper (nothing recorded). */
export function ItemFigure({ item, className = "my-2" }: { item: PublicItem; className?: string }) {
  const [open, setOpen] = useState(!item.drawFirst);
  if (!item.figure) return null;
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="draw-first"
        className="my-2 w-full rounded-lg border border-dashed border-border px-3 py-3 text-left text-sm"
      >
        ✏️ Con tự vẽ hình ra giấy trước, như khi đi thi. <b className="text-accent">Đã vẽ xong — xem hình</b>
      </button>
    );
  return <SvgFigure figure={item.figure} className={className} />;
}
