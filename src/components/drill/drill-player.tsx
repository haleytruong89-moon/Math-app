"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicUnit } from "@/lib/content/public";
import { PracticeStage } from "@/components/lesson/lesson-player";
import { SvgFigure } from "@/components/lesson/figure";
import { Rich } from "@/components/lesson/rich";

/** Luyện đề 4.2: read the problem → draw the figure on paper → see it → the proof items → the full solution. */
export function DrillPlayer({
  unit,
  figure,
  problemHtml,
  solutionHtml,
  backHref,
}: {
  unit: PublicUnit;
  figure: { svg: string; alt: string };
  problemHtml: string;
  solutionHtml: string;
  backHref: string;
}) {
  const [drawn, setDrawn] = useState(false);
  const [stage, setStage] = useState<"items" | "solution">("items");
  const btn = "rounded-xl bg-accent px-4 py-3 font-display font-bold text-on-accent";
  return (
    <div data-wide="" className="flex flex-col gap-4">
      <Link href={backHref} className="text-sm text-accent hover:underline">
        ← Luyện đề hình
      </Link>
      <h1 className="font-display text-xl font-bold">{unit.title}</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4" aria-label="Đề bài">
          <Rich as="div" html={problemHtml} className="whitespace-pre-line font-body leading-relaxed" />
          {drawn ? (
            <SvgFigure figure={figure} className="mx-auto max-w-[360px]" />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm" data-testid="draw-first">
              <p>Con tự vẽ hình vào giấy theo đề trước, rồi mới xem hình mẫu.</p>
              <button type="button" className={`mt-3 ${btn}`} onClick={() => setDrawn(true)}>
                Đã vẽ xong — xem hình
              </button>
            </div>
          )}
        </section>
        <section aria-label="Bài làm">
          {stage === "items" ? (
            <PracticeStage unit={unit} drill onDone={() => setStage("solution")} recapHref={(id) => `/student/recap/${id}`} />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4" data-testid="drill-solution">
              <h2 className="font-display text-lg font-bold">Lời giải đầy đủ</h2>
              <Rich as="div" html={solutionHtml} className="whitespace-pre-line font-body leading-relaxed" />
              <Link href={backHref} className={`text-center ${btn}`}>
                Về Luyện đề hình
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
