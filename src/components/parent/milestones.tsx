import type { CurriculumPhase } from "@/lib/content/curriculum";
import type { MilestoneProgress, MilestoneUnit } from "@/lib/learning/milestones";

const dmy = (iso: string) => iso.split("-").reverse().join("/");
const dm = (iso: string) => dmy(iso).slice(0, 5);

/** S4b: progress to 8.5 / 9.5 (CURRICULUM.md §4). Server component, display only. */
export function MilestoneCards({ progress, phase }: { progress: MilestoneProgress[]; phase: CurriculumPhase | null }) {
  return (
    <>
      <h3 id="moc" className="mt-8 font-display text-base font-semibold">
        Tiến độ tới mốc
      </h3>
      <p className="mt-1 text-sm text-muted" data-testid="phase">
        {phase ? `Đang ở giai đoạn ${phase.n} (${dm(phase.from)} – ${dm(phase.to)})` : "Đã hết lịch học bài mới — giờ là luyện đề và ôn."} · Bài vững = M3 trở lên (đã qua bài kiểm tra).
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {progress.map((m) => (
          <Card key={m.id} m={m} />
        ))}
      </div>
    </>
  );
}

function Card({ m }: { m: MilestoneProgress }) {
  const pct = (n: number) => (m.total ? Math.round((n / m.total) * 100) : 0);
  const behind = m.expected > m.solid;
  return (
    <article className="rounded-xl border border-border bg-surface p-4" data-testid={`milestone-${m.id}`} aria-label={m.title}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display font-semibold">{m.title}</h4>
        <span className="font-mono text-xs text-muted">hạn {dmy(m.due)}</span>
      </header>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums" data-testid="milestone-solid">
        {m.solid}/{m.total} <span className="text-sm font-normal text-muted">bài vững</span>
      </p>
      <div
        className="relative mt-2 h-2.5 rounded-full bg-bg"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={m.total}
        aria-valuenow={m.solid}
        aria-label={`${m.title}: ${m.solid}/${m.total} bài vững`}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct(m.solid)}%` }} />
        {m.expected > 0 && (
          <div className="absolute -top-1 h-4.5 w-0.5 bg-ink" style={{ left: `${pct(m.expected)}%` }} title={`Theo lịch lẽ ra đã vững ${m.expected} bài`} />
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Bài trọng tâm ★</dt>
        <dd className="text-right font-mono tabular-nums">
          {m.mustSolid.solid}/{m.mustSolid.total}
        </dd>
        <dt className="text-muted">Theo lịch lẽ ra đã vững</dt>
        <dd className={`text-right font-mono tabular-nums ${behind ? "text-warn" : ""}`}>{m.expected}</dd>
        <dt className="text-muted">{m.weeksLeft ? `Còn ${m.weeksLeft} tuần, cần` : "Đã tới hạn, còn thiếu"}</dt>
        <dd className="text-right font-mono tabular-nums" data-testid="milestone-pace">
          {m.weeksLeft ? `~${String(m.perWeek).replace(".", ",")} bài/tuần` : `${m.total - m.solid} bài`}
        </dd>
      </dl>
      {m.late.length > 0 && (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn" data-testid="milestone-late">
          {m.late.length} bài trễ lịch — xem mục &ldquo;Cần chú ý&rdquo;.
        </p>
      )}
      <p className="mt-3 text-xs text-muted">Số tuần còn lại gồm cả Tết. Bài chưa soạn vẫn được tính vì con vẫn phải học.</p>
    </article>
  );
}

/** S4b: the late KUs as one "Cần chú ý" entry, earliest phase first. */
export function LateNotice({ late, visible }: { late: MilestoneUnit[]; visible: Set<string> }) {
  if (!late.length) return null;
  return (
    <li className="rounded-xl border border-warn bg-warn-soft p-4 text-sm" data-testid="late">
      <p className="font-display font-semibold text-ink">{late.length} bài trễ lịch</p>
      <p className="mt-1 text-muted">Đã hết giai đoạn của bài mà con chưa đạt M3.</p>
      <ul className="mt-2 flex flex-col gap-1">
        {late.map((u) => (
          <li key={u.id} data-testid={`late-${u.id}`}>
            <b>{u.title}</b>{" "}
            <span className="font-mono text-xs text-muted">
              · GĐ{u.phase} hết {dm(u.phaseTo)} · M{u.level}
              {!visible.has(u.id) && " · con chưa mở được (bài chưa soạn hoặc chưa duyệt)"}
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}
