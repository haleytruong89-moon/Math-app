import type { Metadata } from "next";
import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ActionForm, inputClass, labelClass } from "@/components/action-form";
import { saveAiSettings } from "@/app/parent/actions";
import { hasAiKey } from "@/lib/ai/client";
import { monthSpendRows } from "@/lib/ai/usage";
import { AI_MODELS, AI_RULES, MODEL_LABEL, budget, monthKey, spendByKind, usdLabel } from "@/lib/ai/rules";
import { BRIEF_SYSTEM, STUDENT_SYSTEM, WEEKLY_SYSTEM, promptVersion } from "@/lib/ai/prompts";
import Link from "next/link";
import { saveStudentAi, evalStatus } from "./actions";
import { getUnit } from "@/lib/content";
import { vnDate } from "@/lib/learning/rules";

export const metadata: Metadata = { title: "AI — App Toán" };

const KIND_LABEL: Record<string, string> = { weekly: "Báo cáo tuần", brief: "Tóm tắt gia sư", student: "AI cho con", eval: "Bộ test" };

// S8a (spec §5.3, AI4): spend this month vs the $10 cap, the adults' AI switch and model, the prompts, latest calls.
export default async function AiPage() {
  await requireRole("parent");
  const supabase = await createClient();
  const month = monthKey(vnDate());
  const [settings, rows, recent, flagged, passHaiku, passSonnet] = await Promise.all([
    supabase.from("ai_settings").select("staff_enabled, staff_model, student_enabled, student_model, student_prompt_version").eq("id", 1).maybeSingle(),
    monthSpendRows(month),
    supabase.from("ai_usage").select("kind, model, input_tokens, output_tokens, cost_micros, created_at").order("created_at", { ascending: false }).limit(20),
    // S8b: messages flagged by the student ("AI nói sai?") or by the guard, newest first.
    supabase.from("ai_messages").select("id, unit_id, item_id, role, content, flag, flagged_at").in("flag", ["student", "guard"]).order("flagged_at", { ascending: false }).limit(20),
    evalStatus("claude-haiku-5-5"),
    evalStatus("claude-sonnet-5-5"),
  ]);
  const pass: Record<string, Awaited<ReturnType<typeof evalStatus>>> = { "claude-haiku-5-5": passHaiku, "claude-sonnet-5-5": passSonnet };
  const studentVersion = promptVersion(STUDENT_SYSTEM);
  const spend = spendByKind(rows);
  const b = budget(spend.total);
  const s = settings.data;

  return (
    <>
      <h1 className="font-display text-2xl font-bold">AI</h1>
      {!hasAiKey() && (
        <p className="mt-3 rounded-lg border border-warn bg-warn-soft p-3 text-sm text-warn">
          Chưa có khoá ANTHROPIC_API_KEY trên máy chủ: báo cáo và tóm tắt vẫn có số liệu, chỉ không có nhận xét AI.
        </p>
      )}

      <section className="mt-6 rounded-xl border border-border bg-surface p-4" data-testid="ai-spend">
        <h2 className="font-display text-base font-semibold">Chi phí tháng {month.slice(5)}/{month.slice(0, 4)}</h2>
        <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${b.warn ? "text-warn" : ""}`}>
          {usdLabel(spend.total)} <span className="text-sm font-normal text-muted">/ ${AI_RULES.monthlyCapUsd} · {spend.calls} lượt gọi</span>
        </p>
        {b.paused ? (
          <p className="mt-2 text-sm text-warn">Đã chạm hạn mức: AI tạm dừng tới tháng sau. Gợi ý viết sẵn và số liệu vẫn chạy.</p>
        ) : b.warn ? (
          <p className="mt-2 text-sm text-warn">Đã dùng trên 90 % hạn mức tháng.</p>
        ) : null}
        <ul className="mt-2 text-sm text-muted">
          {Object.entries(spend.byKind).map(([k, v]) => (
            <li key={k}>
              {KIND_LABEL[k] ?? k}: {usdLabel(v)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-base font-semibold">Báo cáo tuần và tóm tắt cho gia sư</h2>
        <ActionForm action={saveAiSettings} submitLabel="Lưu" className="mt-3 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="staffEnabled" defaultChecked={!!s?.staff_enabled} data-testid="staff-enabled" /> Dùng AI viết nhận xét và điểm nên chữa
          </label>
          <label className={`${labelClass} max-w-sm`}>
            Model
            <select name="staffModel" defaultValue={(s?.staff_model as string) ?? "claude-haiku-5-5"} className={inputClass}>
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {MODEL_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4" data-testid="student-ai">
        <h2 className="font-display text-base font-semibold">&ldquo;Hỏi thêm&rdquo; cho con</h2>
        <p className="mt-1 text-sm text-muted">
          Con hỏi AI sau khi đã mở hết gợi ý viết sẵn, hoặc sau khi trả lời sai. Máy chủ chặn câu trả lời lộ đáp án, có số lạ hoặc quá dài; con có nút &ldquo;AI nói sai?&rdquo;. Chỉ bật được cho model đã đạt{" "}
          <Link href="/parent/ai/bo-test" className="text-accent hover:underline">bộ test</Link> với bản lệnh hiện tại.
        </p>
        <p className="mt-2 text-sm" data-testid="student-ai-state">
          Trạng thái: <b>{s?.student_enabled ? (s.student_prompt_version === studentVersion ? "đang bật" : "tạm tắt — lệnh đã đổi, cần chấm lại bộ test") : "đang tắt"}</b>
        </p>
        <ul className="mt-2 text-sm text-muted">
          {AI_MODELS.map((m) => (
            <li key={m}>
              {MODEL_LABEL[m]}: {pass[m].passed ? "đạt bộ test" : `chưa đạt (đã chấm ${pass[m].scored}, sai toán ${pass[m].mathWrong})`}
            </li>
          ))}
        </ul>
        <ActionForm action={saveStudentAi} submitLabel="Lưu" className="mt-3 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="studentEnabled" defaultChecked={!!s?.student_enabled} data-testid="student-enabled" /> Bật &ldquo;Hỏi thêm&rdquo; cho con
          </label>
          <label className={`${labelClass} max-w-sm`}>
            Model
            <select name="studentModel" defaultValue={(s?.student_model as string) ?? "claude-haiku-5-5"} className={inputClass}>
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {MODEL_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </section>

      <section id="bi-bao" className="mt-6 rounded-xl border border-border bg-surface p-4" data-testid="ai-flagged">
        <h2 className="font-display text-base font-semibold">Tin AI bị báo</h2>
        {!flagged.data?.length ? (
          <p className="mt-2 text-sm text-muted">Chưa có tin nào bị báo.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {flagged.data.map((m) => (
              <li key={m.id as number} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-mono text-[11px] text-muted">
                  {m.flag === "student" ? "Con báo “AI nói sai?”" : "Máy chủ chặn → con thấy gợi ý viết sẵn"} · {getUnit(m.unit_id as string)?.unit.title ?? (m.unit_id as string)} · {(m.item_id as string).replace(`${m.unit_id as string}-`, "")} ·{" "}
                  {new Date(m.flagged_at as string).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.content as string}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="font-display text-base font-semibold">Lệnh hệ thống (phụ huynh duyệt)</h2>
        {[
          ["Nhận xét báo cáo tuần", WEEKLY_SYSTEM],
          ["Tóm tắt cho gia sư", BRIEF_SYSTEM],
          ["Hỏi thêm cho con", STUDENT_SYSTEM],
        ].map(([name, text]) => (
          <details key={name} className="mt-2">
            <summary className="cursor-pointer text-sm">
              {name} <span className="font-mono text-xs text-muted">· bản {promptVersion(text)}</span>
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-bg p-3 font-body text-sm">{text}</pre>
          </details>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-base font-semibold">20 lượt gọi gần nhất</h2>
        <table className="mt-2 w-full text-left text-sm" data-testid="ai-calls">
          <thead className="text-muted">
            <tr>
              <th className="py-1">Lúc</th>
              <th>Việc</th>
              <th>Model</th>
              <th className="text-right">Token vào / ra</th>
              <th className="text-right">Chi phí</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {(recent.data ?? []).map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1">{new Date(r.created_at as string).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td>{KIND_LABEL[r.kind as string] ?? (r.kind as string)}</td>
                <td>{r.model as string}</td>
                <td className="text-right">
                  {r.input_tokens as number} / {r.output_tokens as number}
                </td>
                <td className="text-right">{usdLabel(r.cost_micros as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!recent.data?.length && <p className="mt-2 text-sm text-muted">Chưa có lượt gọi nào.</p>}
      </section>
    </>
  );
}
