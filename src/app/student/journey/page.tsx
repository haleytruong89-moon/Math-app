import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { listModules } from "@/lib/content";
import { loadStudentState, type UnitState } from "@/lib/learning/state";
import { RULES, daysBetween } from "@/lib/learning/rules";
import { practiceFirstTries } from "@/lib/learning/rules";
import { dueLabel } from "@/lib/learning/homework";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { masteryOf } from "@/components/student/mastery";

export const metadata: Metadata = { title: "Hành trình của con — App Toán" };

const STAGE = { 1: "D+1", 2: "D+7", 3: "D+21", 4: "duy trì" } as const;

/** Mockup ProgressMap: summary strip + one vertical path per module (spec 2026-10-05 §3). */
export default async function JourneyPage() {
  const user = await requireRole("student");
  const supabase = await createClient();
  const { data: me } = await supabase.from("students").select("id, consent_at").eq("profile_id", user.id).maybeSingle();
  if (!me?.consent_at) redirect("/student");

  const [state, confRows] = await Promise.all([
    loadStudentState(supabase, me.id),
    supabase.from("parent_confirmations").select("unit_id, level, system_level, created_at").eq("student_id", me.id).order("created_at", { ascending: false }).limit(500),
  ]);
  const confs = latestByUnit((confRows.data ?? []) as ConfirmationRow[]);
  const nodes = state.units.map((u) => ({
    u,
    shown: displayLevel(u.mastery.level, confs.get(u.unit.id), { attempts: u.attempts, workedViewed: u.workedViewed, reviewsCompleted: !!u.review?.completed }),
  }));
  const count = (f: (l: number) => boolean) => nodes.filter((n) => f(n.shown.level)).length;
  const modules = listModules().filter((m) => nodes.some((n) => n.u.unit.module === m.id));

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/student" aria-label="Về trang chính" className="grid size-10 place-items-center rounded-full text-accent hover:bg-accent-soft">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M13 4l-6 6 6 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Hành trình của con</h1>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center" data-testid="journey-summary">
        <Tile n={count((l) => l >= 3)} label="Đã vững" cls="bg-good-soft text-good" />
        <Tile n={count((l) => l === 1 || l === 2)} label="Đang học" cls="bg-warn-soft text-warn" />
        <Tile n={count((l) => l === 0)} label="Chưa bắt đầu" cls="bg-surface text-muted border border-border" />
      </div>

      {modules.map((m) => {
        const list = nodes.filter((n) => n.u.unit.module === m.id);
        return (
          <section key={m.id} className="mt-6" aria-label={m.title}>
            <h2 className="text-sm font-semibold text-muted">{m.title}</h2>
            <ol className="mt-3 flex flex-col">
              {list.map(({ u, shown }, i) => (
                <li key={u.unit.id} className="flex flex-col" data-testid={`node-${u.unit.id}`}>
                  {i > 0 && <Connector from={list[i - 1].shown.level} to={shown.level} />}
                  <Node u={u} level={shown.level} confirmed={shown.confirmed} today={state.today} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}

function Tile({ n, label, cls }: { n: number; label: string; cls: string }) {
  return (
    <div className={`rounded-xl px-2 py-2.5 ${cls}`}>
      <p className="text-xl font-extrabold tabular-nums">{n}</p>
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

function Connector({ from, to }: { from: number; to: number }) {
  if (to === 0) return <span aria-hidden className="ml-[30px] h-7 border-l-[3px] border-dashed border-border" />;
  return (
    <span
      aria-hidden
      className="ml-[30px] h-7 w-[3px] rounded"
      style={{ background: `linear-gradient(${masteryOf(from).ring},${masteryOf(to).ring})` }}
    />
  );
}

function Node({ u, level, confirmed, today }: { u: UnitState; level: number; confirmed: boolean; today: string }) {
  const m = masteryOf(level);
  const recent = practiceFirstTries(u.attempts).slice(-RULES.practiceWindow);
  const right = recent.filter((a) => a.correct).length;
  let status: React.ReactNode = null;
  if (level === 0) status = "Chưa bắt đầu";
  else if (level === 1) status = u.mastery.enoughData ? "Mới bắt đầu" : `Chưa đủ dữ liệu (${u.mastery.answers} câu)`;
  else if (level === 2)
    status = (
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-24 overflow-hidden rounded bg-border">
          <span className="block h-full rounded" style={{ width: `${(right / RULES.practiceWindow) * 100}%`, background: m.ring }} />
        </span>
        {right}/{RULES.practiceWindow} đúng
      </span>
    );
  else if (u.review?.dueOn) {
    const late = daysBetween(u.review.dueOn, today) >= 0;
    status = late ? "Đến hạn ôn" : `Ôn ${STAGE[u.review.stage]} · ${dueLabel(u.review.dueOn, today).replace(/^hạn /, "")}`;
  }

  return (
    <Link href={`/student/learn/${u.unit.id}`} className={`flex items-center gap-3.5 rounded-xl py-1 ${level === 0 ? "opacity-60" : ""}`}>
      <span
        aria-hidden
        className={`grid size-16 shrink-0 place-items-center rounded-full text-[28px] ${level === 0 ? "border-[3px] border-dashed" : "border-[3px]"}`}
        style={{ background: `linear-gradient(135deg,${m.from},${m.to})`, borderColor: m.ring }}
      >
        {m.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug">{u.unit.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-md px-2 py-0.5 font-bold" style={{ background: m.from, color: m.text }}>
            M{level} — {m.label}
          </span>
          {confirmed && <span className="font-medium text-good">bố mẹ chốt</span>}
        </span>
        {status && <span className="mt-1 block text-[11px] text-muted">{status}</span>}
      </span>
    </Link>
  );
}
