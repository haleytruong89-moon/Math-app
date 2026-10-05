import "server-only";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "@/lib/content/schema";
import { loadStudentState, type UnitState } from "@/lib/learning/state";
import { vnDate } from "@/lib/learning/rules";
import { commonErrors, durationLabel, workEntries, type WorkAttempt, type WorkEntry } from "@/lib/learning/work";
import { RightTriangleAltitude } from "@/components/lesson/figure";
import { Rich } from "@/components/lesson/rich";

const MODE_LABEL = { practice: "Luyện tập", exit: "Kiểm tra", review: "Ôn lại" } as const;
const LEVEL_BG = ["bg-m0", "bg-m1", "bg-m2", "bg-m3", "bg-m4"] as const;
const ddmm = (iso: string) => vnDate(iso).split("-").reverse().slice(0, 2).join("/");
const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

type Proposal = { unit_id: string; level: number; created_at: string };

type Props = {
  supabase: SupabaseClient;
  student: { id: string; full_name: string };
  basePath: string;
  back: { href: string; label: string };
  unitId: string | null;
  all: boolean;
  proposer: string; // label before "đề xuất": "Bạn" for a tutor, "Gia sư" for the parent
};

/**
 * "Bài làm của con" (spec 2026-10-05, part A). Reads through the caller's RLS client:
 * a tutor sees only an actively assigned student, the parent only their own children.
 */
export async function StudentWork(props: Props) {
  const { supabase, student, basePath } = props;
  const [state, proposals] = await Promise.all([
    loadStudentState(supabase, student.id, { includeDrafts: true }),
    supabase
      .from("tutor_proposals")
      .select("unit_id, level, created_at")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (proposals.error) console.error("StudentWork proposals", proposals.error.message);
  const latest = new Map<string, Proposal>();
  for (const p of (proposals.data ?? []) as Proposal[]) if (!latest.has(p.unit_id)) latest.set(p.unit_id, p);

  // Only an id from the content is ever used in a query.
  const unit = props.unitId ? (state.units.find((u) => u.unit.id === props.unitId) ?? null) : null;

  return (
    <>
      <Link href={unit ? basePath : props.back.href} className="text-sm text-accent hover:underline">
        {unit ? "← Tất cả bài" : props.back.label}
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold">Bài làm của {student.full_name}</h1>
      {unit ? (
        <UnitWork {...props} u={unit} proposal={latest.get(unit.unit.id)} />
      ) : (
        <ul className="mt-6 flex flex-col gap-3" aria-label="Các bài">
          {state.units.map((u) => (
            <li key={u.unit.id}>
              <Link href={`${basePath}?unit=${u.unit.id}`} className="block rounded-xl border border-border bg-surface p-4 hover:border-accent">
                <Summary u={u} proposal={latest.get(u.unit.id)} proposer={props.proposer} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Summary({ u, proposal, proposer }: { u: UnitState; proposal?: Proposal; proposer: string }) {
  const errors = commonErrors(u.attempts);
  const graded = u.attempts.filter((a) => a.mode !== "faded").length;
  return (
    <div data-testid={`work-summary-${u.unit.id}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-medium ${LEVEL_BG[u.mastery.level]} ${u.mastery.level >= 2 ? "text-on-accent" : "text-ink"}`}
        >
          M{u.mastery.level}
        </span>
        <span className="min-w-0">
          <span className="block font-display font-semibold leading-snug">{u.unit.title}</span>
          <span className="font-mono text-xs text-muted">
            {graded ? (u.mastery.enoughData ? `${u.mastery.answers} câu đã làm` : `chưa đủ dữ liệu (${u.mastery.answers} câu)`) : "Chưa làm câu nào"}
            {u.mastery.lastExit && ` · kiểm tra gần nhất ${u.mastery.lastExit.right}/${u.mastery.lastExit.total}`}
          </span>
        </span>
      </div>
      {(errors.length > 0 || proposal) && (
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {errors.map((e) => (
            <span key={e.code} className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-warn">
              {e.code} × {e.count}
            </span>
          ))}
          {proposal && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-accent">
              {proposer} đề xuất M{proposal.level} · {ddmm(proposal.created_at)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

async function UnitWork(props: Props & { u: UnitState; proposal?: Proposal }) {
  const { u } = props;
  const { data, error } = await props.supabase
    .from("attempts")
    .select("item_id, mode, correct, error_code, exit_run, created_at, answer, duration_ms")
    .eq("student_id", props.student.id)
    .eq("unit_id", u.unit.id)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) console.error("StudentWork attempts", error.message);
  const rows = (data ?? []) as WorkAttempt[];
  const pool = new Map<string, Item>([...u.unit.practice, ...u.unit.exit].map((i) => [i.id, i]));
  const lookup = (id: string) => pool.get(id) ?? null;
  const wrong = workEntries(rows, lookup, { wrongOnly: true });
  const entries = props.all ? workEntries(rows, lookup, { wrongOnly: false }) : wrong;
  const total = rows.filter((r) => r.mode !== "faded").length;
  const href = (all: boolean) => `${props.basePath}?unit=${u.unit.id}${all ? "&all=1" : ""}`;
  const tab = (on: boolean) =>
    `rounded-lg px-3 py-2 text-center font-display text-sm ${on ? "bg-accent font-bold text-on-accent" : "border border-border bg-surface"}`;

  return (
    <>
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <Summary u={u} proposal={props.proposal} proposer={props.proposer} />
      </div>
      <nav className="mt-4 grid grid-cols-2 gap-2" aria-label="Lọc câu">
        <Link href={href(false)} aria-current={!props.all ? "page" : undefined} className={tab(!props.all)}>
          Chỉ câu sai ({wrong.length})
        </Link>
        <Link href={href(true)} aria-current={props.all ? "page" : undefined} className={tab(props.all)}>
          Tất cả ({total})
        </Link>
      </nav>
      <ul className="mt-4 flex flex-col gap-3" aria-label="Câu đã làm">
        {entries.map((e) => (
          <Entry key={e.key} e={e} figure={u.unit.figure === "right-triangle-altitude"} />
        ))}
        {!entries.length && (
          <li className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            {props.all ? "Con chưa làm câu nào ở bài này." : "Chưa có câu sai nào ở bài này."}
          </li>
        )}
      </ul>
    </>
  );
}

function Entry({ e, figure }: { e: WorkEntry; figure: boolean }) {
  const meta = [MODE_LABEL[e.mode], `${hhmm(e.at)} ${ddmm(e.at)}`, durationLabel(e.durationMs)].filter(Boolean).join(" · ");
  // answerHtml is escaped plain text or server-rendered KaTeX (work.ts), so Rich is safe here.
  return (
    <li className="rounded-xl border border-border bg-surface p-4" data-testid="work-entry" data-item={e.itemId} data-correct={e.correct}>
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted">
        <span>{meta}</span>
        {e.laterCorrect && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">Lần sau làm đúng</span>}
      </div>
      {/* Wrapper sets the size: the figure's own max-w-xs would win over a passed max-w class. */}
      {figure && (
        <div className="mx-auto my-2 w-40">
          <RightTriangleAltitude />
        </div>
      )}
      <Rich as="div" html={e.promptHtml} className="mt-2 leading-relaxed" />
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Con trả lời</dt>
        <dd className={e.correct ? "text-good" : "font-semibold text-warn"}>
          <Rich html={e.answerHtml} />
        </dd>
        {!e.correct && (
          <>
            <dt className="text-muted">Đáp án đúng</dt>
            <dd>
              <Rich html={e.correctHtml} />
            </dd>
          </>
        )}
        {e.errorCode && (
          <>
            <dt className="text-muted">Lỗi</dt>
            <dd>
              <span className="font-mono">{e.errorCode}</span>
              {e.feedbackHtml && (
                <>
                  {" — "}
                  <Rich html={e.feedbackHtml} />
                </>
              )}
            </dd>
          </>
        )}
      </dl>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-accent">Lời giải</summary>
        <Rich as="div" html={e.solutionHtml} className="mt-2 leading-relaxed" />
      </details>
    </li>
  );
}
