"use client";

import Link from "next/link";
import { useState } from "react";
import type { CheckResult, ExitResult, PublicItem, PublicUnit } from "@/lib/content/public";
import { checkAnswer, completeFaded, markWorkedViewed, submitExit } from "@/app/learn/actions";
import { parseAnswer } from "@/lib/content/grade";
import { RightTriangleAltitude } from "./figure";
import { FORMAT_HINT, ItemInput } from "./item-input";
import { Rich } from "./rich";
import { Card, ErrorLine, Feedback, PrimaryButton, useAction, useStartTime } from "./parts";
import { QuestionFeedback } from "@/components/student/question-feedback";
import { sessionTally } from "@/lib/learning/student-ux";

// One knowledge unit, in the order fixed by §3.5:
// worked example (must be viewed in full) → faded example → practice L1→L2 → exit test.

type Stage = "learn" | "faded" | "practice" | "exit";
const STAGES: { id: Stage; label: string }[] = [
  { id: "learn", label: "Lời giải mẫu" },
  { id: "faded", label: "Điền bước" },
  { id: "practice", label: "Luyện tập" },
  { id: "exit", label: "Kiểm tra" },
];

export function LessonPlayer({
  unit,
  mode,
  initial,
  backHref,
  testOut = false,
}: {
  unit: PublicUnit;
  mode: "student" | "preview";
  initial: { workedViewed: boolean; fadedDone: boolean };
  backHref: string;
  /** LT4: the exit test taken directly, once (track B / backfill KUs). */
  testOut?: boolean;
}) {
  const [workedViewed, setWorkedViewed] = useState(initial.workedViewed);
  const [fadedDone, setFadedDone] = useState(initial.fadedDone);
  const [stage, setStage] = useState<Stage>(initial.fadedDone ? "practice" : initial.workedViewed ? "faded" : "learn");

  const unlocked = (s: Stage) => s === "learn" || (s === "faded" ? workedViewed : fadedDone);

  if (testOut) {
    return (
      <div>
        <p className="font-mono text-xs text-muted">{unit.moduleTitle}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{unit.title}</h1>
        <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <b>Kiểm tra vượt:</b> nếu con đã biết bài này, làm luôn bài kiểm tra. Đạt từ 80% là xong bài, hẹn ôn lại ngày mai.
          Chưa đạt cũng không sao — con học bài như bình thường. Chỉ được làm <b>một lần</b>.
        </p>
        <div className="mt-6">
          <ExitStage unit={unit} backHref={backHref} testOut />
        </div>
      </div>
    );
  }

  return (
    <div>
      {mode === "preview" && (
        <p className="mb-4 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
          Chế độ xem trước của phụ huynh — bấm thử như học sinh, <b>không ghi dữ liệu</b>.
          {unit.status === "draft" ? " Bài này đang là bản nháp, học sinh chưa thấy." : " Bài đã duyệt, học sinh đang thấy."}
        </p>
      )}
      <p className="font-mono text-xs text-muted">{unit.moduleTitle}</p>
      <h1 className="mt-1 font-display text-2xl font-bold">{unit.title}</h1>

      <nav aria-label="Các phần của bài" className="mt-5 grid grid-cols-4 gap-1.5">
        {STAGES.map((s, i) => {
          const open = unlocked(s.id);
          const active = s.id === stage;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!open}
              onClick={() => setStage(s.id)}
              aria-current={active ? "step" : undefined}
              className={`rounded-lg border px-1 py-2 text-center font-display text-xs leading-tight ${
                active ? "border-accent bg-accent text-on-accent" : open ? "border-border bg-surface" : "border-border bg-transparent text-muted opacity-60"
              }`}
            >
              <span className="block font-mono">{i + 1}</span>
              {s.label}
              {!open && " 🔒"}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {stage === "learn" && (
          <LearnStage
            unit={unit}
            alreadyViewed={workedViewed}
            onDone={async () => {
              const r = await markWorkedViewed(unit.id);
              if (!r.ok) return r.message ?? "Có lỗi, thử lại.";
              setWorkedViewed(true);
              setStage("faded");
            }}
          />
        )}
        {stage === "faded" && (
          <FadedStage
            unit={unit}
            alreadyDone={fadedDone}
            onDone={async () => {
              const r = await completeFaded(unit.id);
              if (!r.ok) return r.message ?? "Có lỗi, thử lại.";
              setFadedDone(true);
              setStage("practice");
            }}
          />
        )}
        {stage === "practice" && <PracticeStage unit={unit} onDone={() => setStage("exit")} />}
        {stage === "exit" && <ExitStage unit={unit} backHref={backHref} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------

// ---------------------------------------------------------------------

function LearnStage({ unit, alreadyViewed, onDone }: { unit: PublicUnit; alreadyViewed: boolean; onDone: () => Promise<string | void> }) {
  const steps = unit.worked.steps;
  const [shown, setShown] = useState(alreadyViewed ? steps.length : 1);
  const { pending, error, run } = useAction();
  const allShown = shown >= steps.length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Lý thuyết</h2>
        {unit.figure === "right-triangle-altitude" && <RightTriangleAltitude className="my-3" />}
        <ul className="mt-2 flex flex-col gap-2 leading-relaxed">
          {unit.theoryHtml.map((h, i) => (
            <li key={i}>
              <Rich html={h} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">Lời giải mẫu</h2>
        <Rich as="p" html={unit.worked.problemHtml} className="mt-2 font-semibold" />
        <ol className="mt-3 flex flex-col gap-3">
          {steps.slice(0, shown).map((s, i) => (
            <li key={i} className="rounded-lg border border-border px-3 py-2.5">
              <span className="font-mono text-xs text-muted">Bước {i + 1}</span>
              <Rich as="div" html={s.html} className="mt-1 leading-relaxed" />
              {s.whyHtml && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-accent">Vì sao làm bước này?</summary>
                  <Rich as="p" html={s.whyHtml} className="mt-1.5 leading-relaxed text-muted" />
                </details>
              )}
            </li>
          ))}
        </ol>
        {!allShown && (
          <PrimaryButton className="mt-4 w-full" onClick={() => setShown(shown + 1)}>
            Bước tiếp theo ({shown}/{steps.length})
          </PrimaryButton>
        )}
      </Card>

      {allShown && (
        <Card className="border-accent">
          <p className="font-display text-sm font-semibold">Tự hỏi mình trước khi sang phần sau:</p>
          <Rich as="p" html={unit.worked.selfExplainHtml} className="mt-1.5 leading-relaxed" />
          <PrimaryButton className="mt-4 w-full" disabled={pending} onClick={() => run(onDone)}>
            {pending ? "Đang lưu…" : alreadyViewed ? "Sang phần điền bước" : "Con đã xem hết, sang phần điền bước"}
          </PrimaryButton>
          <ErrorLine text={error} />
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------

type BlankState = { value: string; tries: number; solved: boolean; result?: Extract<CheckResult, { understood: true }> };

function FadedStage({ unit, alreadyDone, onDone }: { unit: PublicUnit; alreadyDone: boolean; onDone: () => Promise<string | void> }) {
  const steps = unit.faded.steps;
  const blankIdx = steps.flatMap((s, i) => (s.kind === "blank" ? [i] : []));
  const [blanks, setBlanks] = useState<Record<number, BlankState>>({});
  const [hint, setHint] = useState<string | null>(null);
  const { pending, error, run } = useAction();
  const startedAtRef = useStartTime();

  const firstOpen = blankIdx.find((i) => !blanks[i]?.solved);
  const visibleUntil = firstOpen ?? steps.length - 1;
  const allSolved = firstOpen === undefined;

  const check = (i: number, item: PublicItem) =>
    run(async () => {
      const b = blanks[i] ?? { value: "", tries: 0, solved: false };
      if (!b.value.trim()) return "Con chưa trả lời.";
      setHint(null);
      const r = await checkAnswer({
        unitId: unit.id,
        itemId: item.id,
        mode: "faded",
        answer: b.value,
        durationMs: Date.now() - startedAtRef.current,
        reveal: b.tries >= 1,
      });
      if (!r.ok) return r.message;
      if (!r.understood) {
        setHint(FORMAT_HINT);
        return;
      }
      startedAtRef.current = Date.now();
      setBlanks((all) => ({ ...all, [i]: { ...b, tries: b.tries + 1, solved: r.correct, result: r } }));
    });

  return (
    <div className="flex flex-col gap-4">
      {unit.figure === "right-triangle-altitude" && <RightTriangleAltitude />}
      <Card>
        <Rich as="p" html={unit.faded.problemHtml} className="font-semibold" />
        <ol className="mt-3 flex flex-col gap-3">
          {steps.slice(0, visibleUntil + 1).map((s, i) => {
            if (s.kind === "text")
              return (
                <li key={i} className="rounded-lg border border-border px-3 py-2.5 leading-relaxed">
                  <Rich html={s.html} />
                </li>
              );
            const b = blanks[i] ?? { value: "", tries: 0, solved: false };
            const active = i === firstOpen;
            return (
              <li key={i} className={`rounded-lg border px-3 py-2.5 ${active ? "border-accent" : "border-border"}`}>
                <Rich as="p" html={s.promptHtml} className="font-display text-sm font-semibold" />
                <Rich as="div" html={s.item.promptHtml} className="mt-1.5 leading-relaxed" />
                <ItemInput
                  item={s.item}
                  value={b.value}
                  disabled={b.solved || pending}
                  onChange={(v) => setBlanks((all) => ({ ...all, [i]: { ...b, value: v } }))}
                  onEnter={() => check(i, s.item)}
                />
                {b.result && <Feedback result={b.result} retry={!b.solved} />}
                {active && (
                  <PrimaryButton className="mt-3" disabled={pending} onClick={() => check(i, s.item)}>
                    {pending ? "Đang chấm…" : b.tries ? "Kiểm tra lại" : "Kiểm tra"}
                  </PrimaryButton>
                )}
                {active && <ErrorLine text={hint ?? error} />}
              </li>
            );
          })}
        </ol>
      </Card>
      {(allSolved || alreadyDone) && (
        <PrimaryButton className="w-full" disabled={pending} onClick={() => run(onDone)}>
          {pending ? "Đang lưu…" : "Sang phần luyện tập"}
        </PrimaryButton>
      )}
      {allSolved && <ErrorLine text={error} />}
    </div>
  );
}


// ---------------------------------------------------------------------

function PracticeStage({ unit, onDone }: { unit: PublicUnit; onDone: () => void }) {
  // One graded try per item; items answered wrong come back once at the end.
  const [queue, setQueue] = useState<PublicItem[]>(unit.practice);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Extract<CheckResult, { understood: true }> | null>(null);
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]); // this session only (U2)
  const [requeued, setRequeued] = useState(false);
  const { pending, error, run } = useAction();
  const startedAtRef = useStartTime();

  const finished = pos >= queue.length;
  const item = queue[pos];

  const check = () =>
    run(async () => {
      if (!value.trim()) return "Con chưa trả lời.";
      setHint(null);
      const r = await checkAnswer({
        unitId: unit.id,
        itemId: item.id,
        mode: "practice",
        answer: value,
        durationMs: Date.now() - startedAtRef.current,
      });
      if (!r.ok) return r.message;
      if (!r.understood) {
        setHint(FORMAT_HINT);
        return;
      }
      setResult(r);
      setResults((x) => [...x, r.correct]);
      const first = !(item.id in firstTry);
      setRequeued(first && !r.correct);
      if (first) {
        setFirstTry((f) => ({ ...f, [item.id]: r.correct }));
        if (!r.correct) setQueue((q) => [...q, item]);
      }
    });

  const next = () => {
    setPos(pos + 1);
    setValue("");
    setResult(null);
    startedAtRef.current = Date.now();
  };

  if (finished) {
    const right = Object.values(firstTry).filter(Boolean).length;
    return (
      <Card>
        <h2 className="font-display text-lg font-bold">Xong phần luyện tập</h2>
        <p className="mt-2">
          Đúng ngay lần đầu: <b className="tabular-nums">{right}/{unit.practice.length}</b> câu.
        </p>
        <p className="mt-1 text-sm text-muted">Phần tiếp theo là bài kiểm tra ngắn: không có gợi ý, xem đáp án sau khi nộp.</p>
        <PrimaryButton className="mt-4 w-full" onClick={onDone}>
          Làm bài kiểm tra
        </PrimaryButton>
      </Card>
    );
  }

  const isRetry = pos >= unit.practice.length;
  return (
    <Card>
      <div className="flex items-center justify-between font-mono text-xs text-muted">
        <span>
          Câu {Math.min(pos + 1, unit.practice.length)}/{unit.practice.length}
          {isRetry && " · làm lại câu sai"}
        </span>
        <span>{item.level === "L1" ? "Cơ bản" : "Vận dụng"}</span>
      </div>
      {unit.figure === "right-triangle-altitude" && <RightTriangleAltitude className="my-2 max-w-[220px]" />}
      <Rich as="div" html={item.promptHtml} className="mt-2 leading-relaxed" />
      <ItemInput key={`${item.id}-${pos}`} item={item} value={value} onChange={setValue} disabled={!!result || pending} onEnter={() => !result && check()} />
      {result ? (
        <QuestionFeedback
          result={result}
          mode="practice"
          tally={sessionTally(results)}
          index={results.length - 1}
          requeued={requeued}
          nextLabel="Câu tiếp theo"
          onNext={next}
        />
      ) : (
        <PrimaryButton className="mt-4 w-full" disabled={pending} onClick={check}>
          {pending ? "Đang chấm…" : "Kiểm tra"}
        </PrimaryButton>
      )}
      <ErrorLine text={hint ?? error} />
    </Card>
  );
}

// ---------------------------------------------------------------------

function ExitStage({ unit, backHref, testOut = false }: { unit: PublicUnit; backHref: string; testOut?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Extract<ExitResult, { ok: true }> | null>(null);
  const { pending, error, run } = useAction();
  const startedAtRef = useStartTime();

  const unanswered = unit.exit.filter((i) => !answers[i.id]?.trim()).length;
  // Format check only (no answers in the browser): don't let a typo cost a test point.
  const unreadable = unit.exit.flatMap((it, i) =>
    it.type === "numeric" && answers[it.id]?.trim() && parseAnswer(answers[it.id]) === null ? [i + 1] : [],
  );

  const submit = () =>
    run(async () => {
      if (unreadable.length) return `Câu ${unreadable.join(", ")}: ${FORMAT_HINT.charAt(0).toLowerCase()}${FORMAT_HINT.slice(1)}`;
      if (unanswered && !window.confirm(`Còn ${unanswered} câu chưa làm. Câu bỏ trống tính là sai. Vẫn nộp bài?`)) return;
      const r = await submitExit({ unitId: unit.id, answers, durationMs: Date.now() - startedAtRef.current, testOut });
      if (!r.ok) return r.message;
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="font-display text-lg font-bold">Kết quả bài kiểm tra</h2>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {result.score}/{result.total} <span className="text-base font-normal text-muted">({pct}%)</span>
          </p>
          {result.testOut && (
            <p className="mt-2 font-semibold" data-testid="testout-result">
              {result.testOut.passed ? "Con đã qua kiểm tra vượt — bài này xong rồi!" : "Chưa qua kiểm tra vượt — không sao, con học bài này từ lời giải mẫu nhé."}
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            {result.nextReviewOn
              ? "Tốt lắm! Bài này đã được hẹn ôn lại vào ngày mai để nhớ lâu."
              : pct >= 80
                ? "Tốt lắm! Con đã đạt yêu cầu của bài này."
                : "Xem lại các câu sai bên dưới, rồi làm lại phần luyện tập nhé."}
          </p>
        </Card>
        {unit.exit.map((it, i) => {
          const r = result.items.find((x) => x.id === it.id)!;
          return (
            <Card key={it.id}>
              <p className="font-mono text-xs text-muted">Câu {i + 1}</p>
              <Rich as="div" html={it.promptHtml} className="mt-1 leading-relaxed" />
              <p className="mt-2 text-sm">
                Con trả lời:{" "}
                {it.type === "mcq" && r.answer !== "" ? (
                  <Rich html={it.optionsHtml![Number(r.answer)] ?? r.answer} />
                ) : (
                  <b className="font-mono">{r.answer || "(bỏ trống)"}</b>
                )}
              </p>
              <Feedback result={{ ok: true, understood: true, correct: r.correct, feedbackHtml: r.feedbackHtml, solutionHtml: r.solutionHtml }} />
            </Card>
          );
        })}
        {result.testOut && !result.testOut.passed && (
          <Link href={`/student/learn/${unit.id}`} className="rounded-lg bg-accent px-4 py-3 text-center font-display font-bold text-on-accent">
            Bắt đầu học bài này
          </Link>
        )}
        <Link href={backHref} className="rounded-lg border border-border bg-surface px-4 py-3 text-center font-display font-semibold">
          Về trang chính
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-accent-soft px-3 py-2 text-sm">
        <b>Bài kiểm tra cuối:</b> {unit.exit.length} câu, tự làm, không có gợi ý và không hỏi AI. Nộp bài xong mới xem đáp án.
      </p>
      {unit.figure === "right-triangle-altitude" && <RightTriangleAltitude className="max-w-[220px]" />}
      {unit.exit.map((it, i) => (
        <Card key={it.id}>
          <p className="font-mono text-xs text-muted">Câu {i + 1}</p>
          <Rich as="div" html={it.promptHtml} className="mt-1 leading-relaxed" />
          <ItemInput item={it} value={answers[it.id] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [it.id]: v }))} disabled={pending} />
        </Card>
      ))}
      <PrimaryButton className="w-full" disabled={pending} onClick={submit}>
        {pending ? "Đang nộp…" : "Nộp bài"}
      </PrimaryButton>
      <ErrorLine text={error} />
    </div>
  );
}
