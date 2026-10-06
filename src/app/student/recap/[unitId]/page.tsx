import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getUnit, toPublicUnit } from "@/lib/content";
import { Rich } from "@/components/lesson/rich";
import { RightTriangleAltitude, SvgFigure } from "@/components/lesson/figure";

export const metadata: Metadata = { title: "Ôn lại bài nền — App Toán" };

/**
 * LT16: "Ôn lại: …" from a wrong answer opens the earlier KU read-only — theory + worked example.
 * Opened in a new tab so the current question isn't lost; records nothing, changes no progress.
 */
export default async function RecapPage(props: PageProps<"/student/recap/[unitId]">) {
  const user = await requireRole("student");
  const { unitId } = await props.params;
  const found = getUnit(unitId);
  if (!found || found.unit.status !== "approved") notFound();
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");

  const u = toPublicUnit(found.unit, found.module);
  return (
    <article className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-accent-soft px-3 py-2 text-sm">
        <b>Ôn lại bài nền</b> — chỉ để xem, không tính vào tiến độ. Xem xong, đóng tab này để quay lại câu đang làm.
      </p>
      <div>
        <p className="font-mono text-xs text-muted">{u.moduleTitle}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{u.title}</h1>
      </div>
      <section aria-label="Lý thuyết" className="flex flex-col gap-2 leading-relaxed">
        {u.theoryHtml.map((h, i) => (
          <Rich key={i} as="p" html={h} />
        ))}
      </section>
      {u.figure === "right-triangle-altitude" && <RightTriangleAltitude />}
      {u.figureSvg && <SvgFigure figure={u.figureSvg} />}
      <section aria-label="Lời giải mẫu" className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-lg font-bold">Lời giải mẫu</h2>
        <Rich as="p" html={u.worked.problemHtml} className="mt-2 font-semibold" />
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
          {u.worked.steps.map((s, i) => (
            <li key={i}>
              <Rich html={s.html} />
              {s.whyHtml && <Rich as="p" html={s.whyHtml} className="mt-1 text-sm text-muted" />}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
