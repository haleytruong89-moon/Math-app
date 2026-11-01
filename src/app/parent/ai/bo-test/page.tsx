import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { Rich } from "@/components/lesson/rich";
import { findItem, getUnit } from "@/lib/content";
import { texToHtml } from "@/lib/content/tex";
import { AI_MODELS, MODEL_LABEL } from "@/lib/ai/rules";
import { studentPromptVersion } from "@/lib/ai/usage";
import { EVAL_CRITERIA, EVAL_PASS, evalSummary } from "@/lib/ai/student";
import { buildEvalCases, runEval, scoreEval, updateEvalCase } from "../actions";

export const metadata: Metadata = { title: "Bộ test AI — App Toán" };
// Running a batch of the test set calls the API a few times in parallel.
export const maxDuration = 60;

type CaseRow = { id: number; unit_id: string; item_id: string; stage: "before" | "after"; answer: string | null; error_code: string | null; question: string };
type ResultRow = { id: number; case_id: number; model: string; output: string; guard: { ok: boolean; reasons?: string[] } | null; scores: number[] | null; math_wrong: boolean | null };

// S8b (AI_TUTOR §4 layer 4): the parent builds, runs and scores the test set; a model passes for the current prompt
// version with ≥ 20 scored cases, no "sai toán" and a mean ≥ 1.6. Only then can "Hỏi thêm" be switched on.
export default async function EvalPage(props: PageProps<"/parent/ai/bo-test">) {
  await requireRole("parent");
  const sp = await props.searchParams;
  const model = AI_MODELS.find((m) => m === sp.model) ?? AI_MODELS[0];
  const version = studentPromptVersion();
  const supabase = await createClient();
  const [cases, results] = await Promise.all([
    supabase.from("ai_eval_cases").select("id, unit_id, item_id, stage, answer, error_code, question").eq("archived", false).order("id", { ascending: true }).limit(200),
    supabase.from("ai_eval_results").select("id, case_id, model, output, guard, scores, math_wrong").eq("prompt_version", version).limit(1000),
  ]);
  const list = (cases.data ?? []) as CaseRow[];
  const all = (results.data ?? []) as ResultRow[];
  const live = new Set(list.map((c) => c.id));
  const summaries = AI_MODELS.map((m) => ({ m, s: evalSummary(all.filter((r) => r.model === m && live.has(r.case_id))) }));
  const byCase = new Map(all.filter((r) => r.model === model).map((r) => [r.case_id, r]));

  return (
    <>
      <Link href="/parent/ai" className="text-sm text-accent hover:underline">← AI</Link>
      <h1 className="mt-2 font-display text-2xl font-bold">Bộ test &ldquo;Hỏi thêm&rdquo;</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Trước khi bật cho con: chạy các tình huống (lấy từ lỗi thật của con), đọc câu trả lời AI và chấm 6 tiêu chí 0–2. <b>Đạt</b> khi có ít nhất {EVAL_PASS.minScored} tình huống đã chấm, không câu nào &ldquo;sai toán&rdquo;, điểm trung bình ≥ {String(EVAL_PASS.meanMin).replace(".", ",")}. Bản lệnh hiện tại: <span className="font-mono">{version}</span> — đổi lệnh thì phải chấm lại.
      </p>

      <section className="mt-5 grid gap-3 sm:grid-cols-2" data-testid="eval-summary">
        {summaries.map(({ m, s }) => (
          <div key={m} className={`rounded-xl border p-4 ${s.passed ? "border-good bg-good-soft" : "border-border bg-surface"}`} data-testid={`eval-${m}`}>
            <p className="font-display font-semibold">{MODEL_LABEL[m]}</p>
            <p className="mt-1 text-sm">
              Đã chấm {s.scored}/{EVAL_PASS.minScored} · sai toán {s.mathWrong} · trung bình {s.mean === null ? "—" : s.mean.toFixed(2).replace(".", ",")}
            </p>
            <p className={`mt-1 text-sm font-semibold ${s.passed ? "text-good" : "text-muted"}`}>{s.passed ? "Đạt — bật được cho con" : "Chưa đạt"}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap items-end gap-3">
        <ActionForm action={buildEvalCases} submitLabel={list.length ? "Thêm tình huống từ lỗi mới" : "Tạo bộ test từ lỗi thật của con"} variant="quiet" />
        <ActionForm action={runEval} submitLabel="Chạy các tình huống chưa có kết quả" className="flex flex-wrap items-end gap-2">
          <label className={labelClass}>
            Model
            <select name="model" defaultValue={model} className={inputClass}>
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>{MODEL_LABEL[m]}</option>
              ))}
            </select>
          </label>
        </ActionForm>
        <nav className="flex gap-2 text-sm" aria-label="Xem kết quả của">
          {AI_MODELS.map((m) => (
            <Link key={m} href={`?model=${m}`} aria-current={m === model ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${m === model ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-bg"}`}>
              Xem: {m.replace("claude-", "")}
            </Link>
          ))}
        </nav>
      </section>

      {!list.length && <p className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm text-muted">Chưa có tình huống. Bấm &ldquo;Tạo bộ test&rdquo; để lấy từ các câu con đã làm sai.</p>}

      <ol className="mt-6 flex flex-col gap-4" data-testid="eval-cases">
        {list.map((c, i) => {
          const f = getUnit(c.unit_id);
          const it = f && findItem(f.unit, c.item_id, "practice");
          const r = byCase.get(c.id);
          return (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4" data-testid={`case-${c.id}`}>
              <p className="font-mono text-xs text-muted">
                #{i + 1} · {f?.unit.title ?? c.unit_id} · {c.stage === "before" ? "trước khi con trả lời (không được lộ đáp án)" : `sau khi con trả lời sai: “${c.answer ?? ""}”${c.error_code ? ` (${c.error_code})` : ""}`}
              </p>
              {it && <Rich as="div" html={texToHtml(it.prompt)} className="mt-1 text-sm leading-relaxed" />}
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted">Câu hỏi của con: “{c.question}” — sửa / bỏ</summary>
                <ActionForm action={updateEvalCase} submitLabel="Lưu" variant="quiet" className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <textarea name="question" defaultValue={c.question} maxLength={300} rows={2} className={inputClass} aria-label="Câu hỏi của con" />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="archive" /> Bỏ tình huống này</label>
                </ActionForm>
              </details>
              {r ? (
                <div className="mt-3 rounded-lg bg-bg p-3">
                  <p className="font-mono text-[11px] text-muted">
                    AI trả lời{r.guard?.ok ? "" : ` · máy chủ chặn (${(r.guard?.reasons ?? []).join(", ")}) → con sẽ thấy gợi ý viết sẵn`}
                  </p>
                  <Rich as="div" html={texToHtml(r.output)} className="mt-1 text-sm leading-relaxed" />
                  {r.scores ? (
                    <p className="mt-2 text-sm" data-testid="scored">
                      Đã chấm: {r.scores.join(" · ")}{r.math_wrong ? " · SAI TOÁN" : ""}
                    </p>
                  ) : (
                    <ActionForm action={scoreEval} submitLabel="Lưu điểm" className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      {EVAL_CRITERIA.map((name, k) => (
                        <label key={name} className={`${labelClass} w-36`}>
                          {name}
                          <select name={`s${k}`} defaultValue="2" className={inputClass}>
                            <option value="2">2 — tốt</option>
                            <option value="1">1 — tạm</option>
                            <option value="0">0 — không đạt</option>
                          </select>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 text-sm font-semibold text-warn"><input type="checkbox" name="mathWrong" /> Sai toán</label>
                    </ActionForm>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Chưa chạy với {MODEL_LABEL[model]}.</p>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
