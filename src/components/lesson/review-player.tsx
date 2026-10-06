"use client";

import Link from "next/link";
import { useState } from "react";
import type { CheckResult, ReviewQuestion, ReviewSummary } from "@/lib/content/public";
import { checkReview, finishReview } from "@/app/learn/actions";
import { RightTriangleAltitude, SvgFigure } from "./figure";
import { FORMAT_HINT, ItemInput, isBlank } from "./item-input";
import { Rich } from "./rich";
import { Card, ErrorLine, PrimaryButton, useAction, useStartTime } from "./parts";
import { QuestionFeedback } from "@/components/student/question-feedback";
import { sessionTally } from "@/lib/learning/student-ux";

const STAGE_LABEL = { 1: "D+1", 2: "D+7", 3: "D+21", 4: "duy trì" } as const;

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", timeZone: "UTC" });
}

/** One mixed review session: questions from several units, interleaved (D14). */
export function ReviewPlayer({
  runId,
  questions,
  answered,
  units,
  hasFigure,
}: {
  runId: string;
  questions: ReviewQuestion[];
  /** Answers already given in this run before a reload; they count and aren't asked again. */
  answered: { unitId: string; correct: boolean }[];
  units: { id: string; title: string; stage: 1 | 2 | 3 | 4 }[];
  hasFigure: boolean;
}) {
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Extract<CheckResult, { understood: true }> | null>(null);
  const [score, setScore] = useState(() => {
    const s: Record<string, { correct: number; total: number }> = {};
    for (const a of answered) {
      const u = (s[a.unitId] ??= { correct: 0, total: 0 });
      u.total += 1;
      if (a.correct) u.correct += 1;
    }
    return s;
  });
  const [ratings, setRatings] = useState<Record<string, "easy" | "normal">>({});
  const [summary, setSummary] = useState<Extract<ReviewSummary, { ok: true }> | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]); // this session only (U2)
  const { pending, error, run } = useAction();
  const startedAtRef = useStartTime();

  const q = questions[pos];
  const finished = pos >= questions.length;
  const title = (id: string) => units.find((u) => u.id === id)?.title ?? id;

  const check = () =>
    run(async () => {
      if (isBlank(q.item, value)) return "Con chưa trả lời.";
      setHint(null);
      const r = await checkReview({ runId, unitId: q.unitId, itemId: q.item.id, answer: value, durationMs: Date.now() - startedAtRef.current });
      if (!r.ok) return r.message;
      if (!r.understood) {
        setHint(FORMAT_HINT);
        return;
      }
      setResult(r);
      setResults((x) => [...x, r.correct]);
      setScore((s) => {
        const u = s[q.unitId] ?? { correct: 0, total: 0 };
        return { ...s, [q.unitId]: { correct: u.correct + (r.correct ? 1 : 0), total: u.total + 1 } };
      });
    });

  const next = () => {
    setPos(pos + 1);
    setValue("");
    setResult(null);
    startedAtRef.current = Date.now();
  };

  const save = () =>
    run(async () => {
      const r = await finishReview({ runId, ratings });
      if (!r.ok) return r.message;
      setSummary(r);
    });

  if (summary) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold">Xong lượt ôn</h1>
        {summary.units.map((u) => (
          <Card key={u.unitId}>
            <p className="font-display font-semibold">{title(u.unitId)}</p>
            <p className="mt-1 text-sm">
              Đúng {u.correct}/{u.total} ·{" "}
              {!u.passed ? (
                <span className="text-warn">Chưa chắc lắm — ôn lại vào <b>{formatDate(u.nextDueOn)}</b></span>
              ) : u.completed ? (
                <>
                  <b className="text-good">Nhớ chắc rồi!</b> Ôn duy trì lần tới: <b>{formatDate(u.nextDueOn)}</b>
                </>
              ) : (
                <>Lần ôn tiếp: <b>{formatDate(u.nextDueOn)}</b></>
              )}
            </p>
          </Card>
        ))}
        <Link href="/student" className="rounded-lg bg-accent px-4 py-3 text-center font-display font-bold text-on-accent">
          Về trang chính
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold">Gần xong rồi</h1>
        <p className="text-muted">Với những bài con làm đúng, con thấy thế nào?</p>
        {units.map((u) => {
          const s = score[u.id] ?? { correct: 0, total: 0 };
          const passed = s.total > 0 && s.correct / s.total >= 2 / 3 - 1e-9;
          return (
            <Card key={u.id}>
              <p className="font-display font-semibold">{u.title}</p>
              <p className="mt-1 text-sm text-muted">
                Đúng {s.correct}/{s.total}
              </p>
              {passed ? (
                <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Mức độ bài ${u.title}`}>
                  {(["easy", "normal"] as const).map((r) => {
                    const on = (ratings[u.id] ?? "normal") === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setRatings((x) => ({ ...x, [u.id]: r }))}
                        className={`rounded-lg border px-3 py-2.5 font-display text-sm ${on ? "border-accent bg-accent-soft font-semibold" : "border-border bg-surface"}`}
                      >
                        {r === "easy" ? "Dễ, làm nhanh" : "Bình thường"}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-warn">Bài này sẽ được ôn lại vào ngày mai.</p>
              )}
            </Card>
          );
        })}
        <PrimaryButton className="w-full" disabled={pending} onClick={save}>
          {pending ? "Đang lưu…" : "Lưu kết quả ôn"}
        </PrimaryButton>
        <ErrorLine text={error} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-mono text-xs text-muted">Ôn lại · trộn {units.length} bài</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Ôn lại</h1>
        <p className="mt-1 text-sm text-muted">
          {units.map((u) => `${u.title} (${STAGE_LABEL[u.stage]})`).join(" · ")}
        </p>
      </div>
      <Card>
        <div className="flex items-center justify-between font-mono text-xs text-muted" data-unit={q.unitId} data-item={q.item.id}>
          <span>
            Câu {answered.length + pos + 1}/{answered.length + questions.length}
          </span>
          <span className="truncate pl-3">{q.unitTitle}</span>
        </div>
        {hasFigure && <RightTriangleAltitude className="my-2 max-w-[220px]" />}
        {q.figure && <SvgFigure figure={q.figure} className="my-2 max-w-[220px]" />}
        {q.item.figure && <SvgFigure figure={q.item.figure} className="my-2" />}
        <Rich as="div" html={q.item.promptHtml} className="mt-2 leading-relaxed" />
        <ItemInput key={`${q.item.id}-${pos}`} item={q.item} value={value} onChange={setValue} disabled={!!result || pending} onEnter={() => !result && check()} />
        {result ? (
          <QuestionFeedback
            result={result}
            mode="review"
            tally={sessionTally(results)}
            index={results.length - 1}
            nextLabel={pos + 1 < questions.length ? "Câu tiếp" : "Xem kết quả"}
            onNext={next}
          />
        ) : (
          <PrimaryButton className="mt-4 w-full" disabled={pending} onClick={check}>
            {pending ? "Đang chấm…" : "Kiểm tra"}
          </PrimaryButton>
        )}
        <ErrorLine text={hint ?? error} />
      </Card>
    </div>
  );
}
