import type { WeeklyFacts } from "@/lib/ai/weekly";

const dm = (iso: string) => iso.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
const dmy = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const num = (n: number) => String(n).replace(".", ",");

export type WeeklyRow = { period: string; facts: WeeklyFacts; ai: { text: string } | null; comment_status: "ok" | "failed" | "off" | "none"; created_at: string };

const STATUS_NOTE: Record<WeeklyRow["comment_status"], string> = {
  ok: "",
  failed: "Tuần này không có nhận xét tự động (máy chủ không xác nhận được số liệu trong câu AI viết).",
  off: "Không có nhận xét tự động: AI đang tắt, chưa có khoá, hết hạn mức tháng này hoặc tạm lỗi.",
  none: "",
};

/** S8a: one weekly report. Numbers come from `facts` (the database); only "Nhận xét" is AI text, checked by the server. */
export function WeeklyReportView({ row }: { row: WeeklyRow }) {
  const f = row.facts;
  return (
    <article className="rounded-xl border border-border bg-surface p-5" data-testid="weekly-report">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          Tuần {dm(f.from)} – {dm(f.to)}
        </h3>
        <span className="font-mono text-xs text-muted">tạo lúc {new Date(row.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
      </header>

      <section className="mt-4 rounded-lg bg-accent-soft p-4" data-testid="weekly-comment">
        <p className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Nhận xét</p>
        {row.ai ? <p className="mt-1 font-body leading-relaxed">{row.ai.text}</p> : <p className="mt-1 text-sm text-muted">{STATUS_NOTE[row.comment_status]}</p>}
        {row.ai && <p className="mt-2 text-xs text-muted">AI viết, máy chủ đã đối chiếu mọi con số với dữ liệu bên dưới.</p>}
      </section>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3" data-testid="weekly-numbers">
        <Fact label="Buổi học" value={`${f.studyDays}/${f.goalDays}`} />
        <Fact label="Bài kiểm tra đã nộp" value={f.exits} />
        <Fact label="Lượt ôn đã xong" value={f.reviews} testid="weekly-reviews" />
        <Fact label="Buổi dạy đã ghi" value={f.sessions} />
        <Fact label="Bài về nhà (giao / xong / chữa)" value={`${f.homework.given} / ${f.homework.done} / ${f.homework.reviewed}`} />
        <Fact label="Bài ôn quá hạn hôm nay" value={f.overdueReviews} />
      </dl>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <List title="Bài vững thêm (≥ M3)" items={f.newSolid} empty="Chưa có bài nào lên M3 trong tuần." />
        <List
          title="Lỗi lặp lại (≥ 2 lần)"
          items={f.repeatedErrors.map((e) => `${e.label} · ${e.count} lần`)}
          empty="Không có lỗi nào lặp lại."
          testid="weekly-errors"
        />
        <List
          title="Tiến độ tới mốc"
          items={f.milestones.map((m) => `${m.title}: ${m.solid}/${m.total} bài vững · hạn ${dmy(m.due)} · cần ~${num(m.perWeek)} bài/tuần${m.late ? ` · ${m.late} bài trễ` : ""}`)}
          empty="—"
        />
        <List title="Bài trễ lịch" items={f.late} empty="Không có bài trễ lịch." warn />
      </div>
    </article>
  );
}

function Fact({ label, value, testid }: { label: string; value: string | number; testid?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2" data-testid={testid}>
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-base tabular-nums">{value}</dd>
    </div>
  );
}

function List({ title, items, empty, warn = false, testid }: { title: string; items: string[]; empty: string; warn?: boolean; testid?: string }) {
  return (
    <section data-testid={testid}>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      {items.length ? (
        <ul className={`mt-1 list-disc pl-5 text-sm ${warn ? "text-warn" : ""}`}>
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}
