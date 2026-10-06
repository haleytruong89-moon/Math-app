import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { loadStudentState, type RoadmapNode, type UnitState } from "@/lib/learning/state";
import { RULES, daysBetween } from "@/lib/learning/rules";
import { practiceFirstTries } from "@/lib/learning/rules";
import { dueLabel } from "@/lib/learning/homework";
import { displayLevel, latestByUnit, type ConfirmationRow } from "@/lib/learning/overview";
import { masteryOf } from "@/components/student/mastery";

export const metadata: Metadata = { title: "Hành trình của con — App Toán" };

const STAGE = { 1: "D+1", 2: "D+7", 3: "D+21", 4: "duy trì" } as const;

const TRACK = { A: "Lõi đại số", B: "Bài ghi điểm nhanh", C: "Hình học đường tròn" } as const;

/**
 * Mockup ProgressMap + LT9: summary strip, then track → module; only the module(s) in progress are
 * expanded, the rest collapse to one row with a bar. 🔒 Khoá · 🌰 Chưa bắt đầu · "Sắp có" (no content yet).
 */
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
    shown: displayLevel(u.mastery.level, confs.get(u.unit.id), u.history),
  }));
  const count = (f: (l: number) => boolean) => nodes.filter((n) => f(n.shown.level)).length;
  const shownOf = new Map(nodes.map((n) => [n.u.unit.id, n.shown]));
  const titleOf = new Map(state.roadmap.map((n) => [n.entry.id, n.entry.title]));
  // Expanded: groups with a KU in progress; if none anywhere, the group of the first suggestion.
  const active = new Set(state.roadmap.filter((n) => n.state?.inProgress).map((n) => n.entry.id));
  if (!active.size && state.suggestions[0]) active.add(state.suggestions[0].unit.id);
  const byModule = (nodes: RoadmapNode[]) =>
    [...new Set(nodes.map((n) => n.entry.module))].map((id) => ({ m: state.modules.find((x) => x.id === id)!, list: nodes.filter((n) => n.entry.module === id) }));
  const bySeq = (a: RoadmapNode, b: RoadmapNode) => a.entry.seq - b.entry.seq;
  const tracks = (["A", "B", "C"] as const).map((t) => ({
    t,
    modules: byModule(state.roadmap.filter((n) => n.entry.track === t && n.entry.priority !== "P2").sort(bySeq)),
  }));
  // LT17: rarely-tested KUs come after the core, in their own group.
  const extra = byModule(state.roadmap.filter((n) => n.entry.priority === "P2").sort((a, b) => a.entry.track.localeCompare(b.entry.track) || bySeq(a, b)));
  const moduleBlock = ({ m, list }: { m: (typeof state.modules)[number]; list: RoadmapNode[] }, testId: string) => {
    const done = list.filter((n) => (shownOf.get(n.entry.id)?.level ?? n.level) >= 3).length;
    const open = list.some((n) => active.has(n.entry.id));
    return (
      <details key={testId} open={open} className="rounded-xl border border-border bg-surface px-3 py-2" data-testid={testId}>
        <summary className="flex cursor-pointer items-center gap-3 py-1">
          <span className="min-w-0 flex-1 text-sm font-semibold">{m.title}</span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(done / list.length) * 100}%` }} />
          </span>
          <span className="font-mono text-[11px] text-muted">
            {done}/{list.length}
          </span>
        </summary>
        <ol className="mt-2 flex flex-col pb-1">
          {list.map((n, i) => {
            const shown = shownOf.get(n.entry.id);
            const level = shown?.level ?? n.level;
            return (
              <li key={n.entry.id} className="flex flex-col" data-testid={`node-${n.entry.id}`}>
                {i > 0 && <Connector from={list[i - 1].status === "open" ? (shownOf.get(list[i - 1].entry.id)?.level ?? 0) : 0} to={n.status === "open" ? level : 0} />}
                {n.status === "open" && n.state ? (
                  <Node u={n.state} level={level} confirmed={!!shown?.confirmed} today={state.today} />
                ) : (
                  <ClosedNode node={n} prereqTitles={n.entry.prereq.map((p) => titleOf.get(p) ?? p)} />
                )}
              </li>
            );
          })}
        </ol>
      </details>
    );
  };

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

      {tracks.map(({ t, modules }) => (
        <section key={t} className="mt-6" aria-label={TRACK[t]} data-testid={`track-${t}`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{TRACK[t]}</h2>
          <div className="mt-2 flex flex-col gap-2">
            {modules.map((g) => moduleBlock(g, `module-${g.m.id}`))}
          </div>
        </section>
      ))}

      {extra.length > 0 && (
        // One collapsed row unless a KU in it is active, so the map stays within 2 screens.
        <details
          className="mt-6"
          aria-label="Học thêm khi dư thời gian"
          data-testid="track-extra"
          open={extra.some((g) => g.list.some((n) => active.has(n.entry.id)))}
        >
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-muted">
            Học thêm khi dư thời gian · {extra.reduce((k, g) => k + g.list.length, 0)} bài
          </summary>
          <p className="mt-1 text-xs text-muted">Ít ra trong đề thi — mở sau khi con vững các bài chính.</p>
          <div className="mt-2 flex flex-col gap-2">{extra.map((g) => moduleBlock(g, `extra-${g.m.id}`))}</div>
        </details>
      )}
    </>
  );
}

function ClosedNode({ node, prereqTitles }: { node: RoadmapNode; prereqTitles: string[] }) {
  const locked = node.status === "locked";
  return (
    <div className="flex items-center gap-3.5 py-1 opacity-60">
      <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-dashed border-border bg-bg text-[26px]">
        {locked ? "🔒" : "·"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{node.entry.title}</span>
        <span className="mt-1 block text-[11px] text-muted">
          {locked ? `Khoá — cần đạt M3: ${prereqTitles.join(", ")}` : "Sắp có"}
        </span>
      </span>
    </div>
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
