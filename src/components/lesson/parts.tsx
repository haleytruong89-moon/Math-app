"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { CheckResult } from "@/lib/content/public";
import { Rich } from "./rich";

// Small building blocks shared by the lesson and review players.

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border bg-surface p-4 ${className}`}>{children}</section>;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg bg-accent px-4 py-3 font-display font-bold text-on-accent disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function ErrorLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-warn">
      {text}
    </p>
  );
}

/** Time the current question was shown (for attempt durations); set after mount to keep render pure. */
export function useStartTime() {
  const t = useRef(0);
  useEffect(() => {
    t.current = Date.now();
  }, []);
  return t;
}

/** Runs a server call, shows its error message if it returns one. */
export function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<string | void>) =>
    start(async () => {
      setError(null);
      try {
        const msg = await fn();
        if (msg) setError(msg);
      } catch {
        setError("Mất kết nối. Kiểm tra mạng rồi thử lại.");
      }
    });
  return { pending, error, run };
}


export function Feedback({ result, retry }: { result: Extract<CheckResult, { understood: true }>; retry?: boolean }) {
  return (
    <div
      className={`mt-3 rounded-lg px-3 py-2 text-sm leading-relaxed ${
        result.correct ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
      }`}
    >
      <p className="font-display font-semibold">{result.correct ? "Đúng rồi!" : retry ? "Chưa đúng — thử lại nhé." : "Chưa đúng."}</p>
      {result.feedbackHtml && <Rich as="p" html={result.feedbackHtml} className="mt-1" />}
      {result.solutionHtml && (
        <div className="mt-1.5 text-ink">
          <span className="font-display font-semibold">Lời giải: </span>
          <Rich html={result.solutionHtml} />
        </div>
      )}
    </div>
  );
}
