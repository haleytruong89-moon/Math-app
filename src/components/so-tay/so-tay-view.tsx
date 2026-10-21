"use client";

import { useState } from "react";
import type { PublicSoTay } from "@/lib/content";
import { Rich } from "@/components/lesson/rich";
import { SvgFigure } from "@/components/lesson/figure";

/** S5: goals on the left; the chosen goal's ways (+ signs in the problem, lessons) on the right; recurring figures below. */
export function SoTayView({ data }: { data: PublicSoTay }) {
  const [g, setG] = useState(0);
  const cur = data.goals[g];
  return (
    <div className="flex flex-col gap-6 font-display">
      <div className="flex flex-wrap items-start gap-5">
        <nav aria-label="Muốn chứng minh" className="flex min-w-0 flex-[1_1_240px] flex-col gap-1 rounded-xl border border-border bg-surface p-2">
          <p className="px-2 pb-1 pt-1 font-mono text-xs uppercase tracking-wider text-muted">Muốn chứng minh…</p>
          {data.goals.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setG(i)}
              aria-current={i === g ? "true" : undefined}
              className={`min-h-11 rounded-lg px-3 text-left font-semibold ${i === g ? "bg-accent-soft text-accent" : "hover:bg-bg"}`}
            >
              <Rich html={x.titleHtml} />
            </button>
          ))}
        </nav>
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-3" data-testid="so-tay-goal" aria-label="Các cách chứng minh">
          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <p className="text-sm text-muted">Muốn chứng minh</p>
            <Rich as="p" html={cur.titleHtml} className="text-2xl font-bold" />
            <Rich as="p" html={cur.tipHtml} className="mt-1 text-sm text-muted" />
          </div>
          {cur.ways.map((w, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface px-5 py-3.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent">{i + 1}</span>
              <div className="min-w-0">
                <Rich as="p" html={w.howHtml} className="font-body text-lg font-semibold" />
                <p className="mt-1 text-sm">
                  <b className="text-warn">Nhận ra trong đề:</b> <Rich html={w.signHtml} />
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">Học ở bài: {w.units.map((u) => u.title).join(" · ")}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
      {data.figures.length > 0 && (
        <section aria-label="Cấu hình mẫu">
          <h2 className="text-lg font-bold">Cấu hình hay gặp trong đề — thấy hình này, nghĩ ngay tới…</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.figures.map((f) => (
              <div key={f.id} className="rounded-xl border border-border bg-surface p-4" data-testid="so-tay-figure">
                <Rich as="p" html={f.titleHtml} className="font-semibold" />
                {f.figure && <SvgFigure figure={f.figure} className="my-2 max-w-[260px]" />}
                <ul className="mt-2 list-disc pl-5 font-body text-sm leading-relaxed">
                  {f.factsHtml.map((h, i) => (
                    <li key={i}>
                      <Rich html={h} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
