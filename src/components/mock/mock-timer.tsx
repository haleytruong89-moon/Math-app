"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finishMock, startMock } from "@/app/thi-thu/actions";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Thi thử (S9): "Bắt đầu" → 120-minute countdown → "Nộp bài". Only the times are recorded; nothing locks.
// Kiểm tra tiến bộ (08/11): the same with the test's own minutes; `exam` is the key ("57", "kt1").
export function MockTimer({ exam, minutes, startedAt }: { exam: string; minutes: number; startedAt: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const run = (fn: (key: string) => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn(exam);
      if (!r.ok) setError(r.message ?? "Có lỗi, thử lại.");
      router.refresh();
    });

  if (!startedAt)
    return (
      <div className="mt-4 flex flex-col items-start gap-2">
        <button type="button" disabled={pending} onClick={() => run(startMock)} className="rounded-xl bg-accent px-5 py-3 font-display font-bold text-on-accent disabled:opacity-60" data-testid="mock-start">
          {pending ? "Đang mở…" : `Bắt đầu — ${minutes} phút`}
        </button>
        {error && <p role="alert" className="text-sm text-warn">{error}</p>}
      </div>
    );

  const left = now === null ? null : Math.max(0, Math.round(minutes * 60 - (now - new Date(startedAt).getTime()) / 1000));
  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      <p className={`font-mono text-5xl font-bold ${left === 0 ? "text-warn" : ""}`} data-testid="mock-clock" aria-live="off">
        {left === null ? "—" : mmss(left)}
      </p>
      {left === 0 && <p className="text-sm font-semibold text-warn">Hết giờ — dừng bút và nộp bài.</p>}
      <button type="button" disabled={pending} onClick={() => run(finishMock)} className="rounded-xl bg-accent px-5 py-3 font-display font-bold text-on-accent disabled:opacity-60" data-testid="mock-finish">
        {pending ? "Đang nộp…" : "Nộp bài"}
      </button>
      {error && <p role="alert" className="text-sm text-warn">{error}</p>}
    </div>
  );
}
