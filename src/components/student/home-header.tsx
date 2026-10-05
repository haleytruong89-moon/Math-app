import { RULES } from "@/lib/learning/rules";
import { greeting } from "@/lib/learning/student-ux";

const R = 22;
const C = 2 * Math.PI * R;

/** Greeting header with the weekly-goal ring (mockup StudentHome; only on /student, scrolls away — U4). */
export function HomeHeader({ name, days, now }: { name: string; days: number; now: Date }) {
  const goal = RULES.weeklyGoalDays;
  const shown = Math.min(days, goal);
  const left = Math.max(0, goal - days);
  const date = now.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <header
      className="relative -mx-4 -mt-6 overflow-hidden rounded-b-3xl px-5 pb-6 pt-5 text-white"
      style={{ background: "linear-gradient(135deg,#0D9488 0%,#0F766E 100%)" }}
    >
      <span aria-hidden className="absolute -right-5 -top-3 size-30 rounded-full bg-white/10" />
      <p className="text-sm font-medium text-white/80">{greeting(now)}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{name}</h1>
      <p className="mt-0.5 font-mono text-xs text-white/75">{date}</p>

      <div className="mt-4 flex items-center gap-3.5 rounded-2xl bg-white/12 px-4 py-3.5">
        <div
          className="relative size-13 shrink-0"
          role="progressbar"
          aria-valuenow={days}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-label="Mục tiêu tuần"
        >
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden>
            <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <circle
              cx="26"
              cy="26"
              r={R}
              fill="none"
              stroke="#FCD34D"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - shown / goal)}
              transform="rotate(-90 26 26)"
            />
          </svg>
          <span aria-hidden className="absolute inset-0 grid place-items-center text-[15px] font-bold">
            {shown}/{goal}
          </span>
        </div>
        <div>
          <p className="text-[13px] font-semibold">Mục tiêu tuần này</p>
          <p className="mt-0.5 text-xs text-white/80">
            {shown}/{goal} buổi · {left ? `Thêm ${left} buổi nữa là đạt!` : "Đã đạt mục tiêu tuần!"}
          </p>
        </div>
      </div>
    </header>
  );
}
