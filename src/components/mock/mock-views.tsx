import Link from "next/link";
import { curriculumUnit, mockSheet } from "@/lib/content";
import { texToHtml } from "@/lib/content/tex";
import { errorLabel } from "@/lib/content/errors";
import { MOCK_PAPERS } from "@/lib/content/mock";
import { lostByUnit, mockStatus, mockTotals, pts, STATUS_LABEL, suggestNext, type MockExamRow, type MockScoreRow } from "@/lib/learning/mock";
import { vnDate } from "@/lib/learning/rules";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { PriorityButton } from "@/components/tutor/priority-button";
import { Rich } from "@/components/lesson/rich";
import { card, sectionTitle } from "@/components/ui/styles";
import { cancelMock, reviewAgain, scheduleMock } from "@/app/thi-thu/actions";

// Thi thử (S9, 07/11/2026): views shared by the tutor and the parent. Server components; the score sheet (answers)
// is only ever rendered here, for adults.

export const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const TARGETS = [8.5, 9.5];

/** The 12 papers with their state, the schedule form and the line of scores. */
export function MockOverview({ studentId, exams, hrefFor }: { studentId: string; exams: MockExamRow[]; hrefFor: (paper: number) => string }) {
  const byPaper = new Map(exams.map((e) => [e.paper, e]));
  const next = suggestNext(exams, vnDate());
  const free = MOCK_PAPERS.filter((p) => !byPaper.has(p));
  const graded = exams.filter((e) => e.graded_at).sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on));
  return (
    <div className="flex flex-col gap-5">
      {graded.length > 0 && (
        <section className={`${card} p-4`} data-testid="mock-trend" aria-label="Điểm các đề thi thử">
          <h2 className={sectionTitle}>Điểm thi thử</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {graded.map((e) => (
              <li key={e.id} className="grid grid-cols-[64px_1fr_48px] items-center gap-3 text-sm">
                <span className="font-mono text-xs text-muted">Đề {e.paper}</span>
                <span className="relative h-3 rounded bg-bg">
                  <span className="absolute inset-y-0 left-0 rounded bg-accent" style={{ width: `${Number(e.total) * 10}%` }} />
                  {TARGETS.map((t) => (
                    <span key={t} className="absolute inset-y-[-3px] w-px bg-ink/40" style={{ left: `${t * 10}%` }} aria-hidden />
                  ))}
                </span>
                <span className="text-right font-mono font-semibold">{pts(e.total ?? 0)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Vạch mốc: 8,5 và 9,5.</p>
        </section>
      )}

      {free.length > 0 && (
        <section className={`${card} p-4`} aria-label="Hẹn lịch thi thử">
          <h2 className={sectionTitle}>Hẹn lịch</h2>
          <p className="mt-1 text-sm text-muted">Nhịp đã chốt: mỗi tháng 1 đề (01–03/2027), từ 04/2027 mỗi tuần 1 đề. Con làm trên giấy 120 phút; phụ huynh in đề từ sách.</p>
          <ActionForm action={scheduleMock} submitLabel="Hẹn lịch" className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="studentId" value={studentId} />
            <label className={labelClass}>
              Đề
              <select name="paper" defaultValue={next?.paper ?? free[0]} className={inputClass} data-testid="mock-paper">
                {free.map((p) => (
                  <option key={p} value={p}>Đề {p}{mockSheet(p) ? "" : " (chưa có phiếu chấm)"}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Ngày thi
              <input type="date" name="date" defaultValue={next?.date} className={inputClass} data-testid="mock-date" />
            </label>
          </ActionForm>
        </section>
      )}

      <section className={`${card} overflow-x-auto`} aria-label="Các đề thi thử">
        <table className="w-full text-sm" data-testid="mock-list">
          <thead className="text-left font-mono text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-2">Đề</th><th className="px-4 py-2">Ngày</th><th className="px-4 py-2">Trạng thái</th><th className="px-4 py-2">Điểm</th><th className="px-4 py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_PAPERS.map((p) => {
              const e = byPaper.get(p);
              const st = e ? mockStatus(e) : "none";
              return (
                <tr key={p} data-testid={`mock-row-${p}`}>
                  <td className="px-4 py-2 font-semibold">Đề {p}{!mockSheet(p) && <span className="ml-1 text-xs font-normal text-muted">· chưa có phiếu chấm</span>}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e ? dmy(e.scheduled_on) : "—"}</td>
                  <td className={`px-4 py-2 ${st === "finished" ? "font-semibold text-warn" : st === "graded" ? "text-good" : "text-muted"}`}>{STATUS_LABEL[st]}</td>
                  <td className="px-4 py-2 font-mono font-semibold">{e?.total != null ? pts(e.total) : ""}</td>
                  <td className="px-4 py-2 text-right">
                    {st === "scheduled" && (
                      <ActionForm action={cancelMock} submitLabel="Huỷ lịch" variant="quiet" className="inline-flex">
                        <input type="hidden" name="studentId" value={studentId} />
                        <input type="hidden" name="paper" value={p} />
                      </ActionForm>
                    )}
                    {e && (st !== "scheduled" || e.scheduled_on <= vnDate()) && (
                      <Link href={hrefFor(p)} className="font-display text-sm font-semibold text-accent hover:underline">
                        {st === "graded" ? "Xem kết quả" : "Mở phiếu chấm"}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/** Totals per Bài, the tutor's comment, and the KUs that lost points with ★ / "Ôn lại" (suggestions only). */
export function MockResult({ studentId, exam, scores, priorities }: { studentId: string; exam: MockExamRow; scores: MockScoreRow[]; priorities: Set<string> }) {
  const sheet = mockSheet(exam.paper);
  if (!sheet || !exam.graded_at) return null;
  const t = mockTotals(sheet, scores);
  const lost = lostByUnit(sheet, scores);
  return (
    <section className="flex flex-col gap-4" data-testid="mock-result">
      <div className={`${card} p-4`}>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">Kết quả Đề {exam.paper}</p>
        <p className="mt-1 font-display text-3xl font-bold" data-testid="mock-total">{pts(t.total)}<span className="text-lg text-muted">/10</span></p>
        <ul className="mt-3 grid grid-cols-5 gap-2 text-center text-sm">
          {t.bai.map((b) => (
            <li key={b.bai} className={`rounded-lg border px-2 py-1.5 ${b.got < b.max ? "border-warn/50" : "border-border"}`}>
              <p className="font-mono text-[11px] text-muted">Bài {b.bai}</p>
              <p className="font-semibold">{pts(b.got)}/{pts(b.max)}</p>
            </li>
          ))}
        </ul>
        {exam.comment && <p className="mt-3 text-sm"><span className="text-muted">Gia sư nhận xét:</span> {exam.comment}</p>}
      </div>
      <div className={`${card} p-4`}>
        <h2 className={sectionTitle}>Bài học bị mất điểm</h2>
        {lost.length === 0 ? (
          <p className="mt-2 text-sm text-good">Không mất điểm ở bài nào.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border" data-testid="mock-lost">
            {lost.map((l) => (
              <li key={l.unitId} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-[1_1_240px]">
                  <span className="font-semibold">{curriculumUnit(l.unitId)?.title ?? l.unitId}</span>
                  <span className="ml-2 font-mono text-xs text-muted">−{pts(l.lost)} điểm · ý {l.parts.join(", ")}</span>
                </span>
                <PriorityButton studentId={studentId} unitId={l.unitId} op="toggle" label={priorities.has(l.unitId) ? "★ Cần tập trung" : "☆ Cần tập trung"} title={priorities.has(l.unitId) ? "Bỏ ★" : "Gắn ★ cho con tập trung"} on={priorities.has(l.unitId)} wide />
                <ActionForm action={reviewAgain} submitLabel="Ôn lại ngày mai" variant="quiet" className="inline-flex items-center gap-2">
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="unitId" value={l.unitId} />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">Chỉ là gợi ý: app không tự đổi ★ hay lịch ôn.</p>
      </div>
    </section>
  );
}

/** The score sheet as a read-only table (parent), or with inputs (tutor grading). */
export function SheetTable({ paper, scores, editable }: { paper: number; scores: MockScoreRow[]; editable: boolean }) {
  const sheet = mockSheet(paper);
  if (!sheet) return <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Đề {paper} chưa có phiếu chấm.</p>;
  const got = new Map(scores.map((s) => [s.part, s]));
  return (
    <div className={`${card} overflow-x-auto`}>
      {sheet.status === "draft" && (
        <p className="border-b border-border bg-warn-soft px-3 py-2 text-sm text-warn" data-testid="sheet-draft">
          Phiếu chấm bản nháp (Claude soạn, đã giải kiểm tra độc lập). Thầy/cô soát trước khi chấm; thấy đáp số hay điểm từng ý chưa hợp lý thì báo phụ huynh để sửa.
        </p>
      )}
      {sheet.note && (
        <div className="border-b border-border px-3 py-2 text-sm">
          <span className="text-muted">Lưu ý về đề:</span> <Rich as="span" html={texToHtml(sheet.note)} />
        </div>
      )}
      <table className="w-full text-sm" data-testid="mock-sheet">
        <thead className="text-left font-mono text-xs uppercase tracking-wider text-muted">
          <tr><th className="px-3 py-2">Ý</th><th className="px-3 py-2">Đáp số / ý chính</th><th className="px-3 py-2">Bài học</th><th className="px-3 py-2">Điểm</th><th className="px-3 py-2">{editable ? "Mã lỗi · ghi chú" : "Ghi chú"}</th></tr>
        </thead>
        <tbody className="divide-y divide-border align-top">
          {sheet.parts.map((p) => {
            const s = got.get(p.part);
            return (
              <tr key={p.part} data-testid={`part-${p.part}`}>
                <td className="px-3 py-2 font-mono font-semibold">{p.part}</td>
                <td className="px-3 py-2"><Rich as="div" html={texToHtml(p.answer)} /></td>
                <td className="px-3 py-2 text-xs text-muted">{p.units.map((u) => curriculumUnit(u)?.title ?? u).join(" · ")}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {editable ? (
                    <input name={`p_${p.part}`} type="number" min={0} max={p.max} step={0.25} defaultValue={s ? Number(s.points) : undefined} required aria-label={`Điểm ý ${p.part}`} className="w-20 rounded-lg border border-border bg-surface px-2 py-1 font-mono" />
                  ) : (
                    <span className="font-mono">{s ? pts(s.points) : "—"}</span>
                  )}
                  <span className="ml-1 font-mono text-xs text-muted">/{pts(p.max)}</span>
                </td>
                {editable && (
                  <td className="px-3 py-2">
                    <ErrorSelect name={`e_${p.part}`} value={s?.error_code ?? ""} />
                    <input name={`n_${p.part}`} maxLength={300} defaultValue={s?.note ?? ""} placeholder="Ghi chú (nếu có)" aria-label={`Ghi chú ý ${p.part}`} className="mt-1 w-full min-w-40 rounded-lg border border-border bg-surface px-2 py-1 text-sm" />
                  </td>
                )}
                {!editable && <td className="px-3 py-2 text-xs text-muted">{[errorLabel(s?.error_code), s?.note].filter(Boolean).join(" · ")}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ErrorSelect({ name, value }: { name: string; value: string }) {
  const codes = ["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10", "E11", "E12", "E13", "E14", "E15"];
  return (
    <select name={name} defaultValue={value} aria-label="Mã lỗi" className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-sm">
      <option value="">— không lỗi —</option>
      {codes.map((c) => (
        <option key={c} value={c}>{errorLabel(c)}</option>
      ))}
    </select>
  );
}
