import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { tutorStudent, tutorToday } from "@/lib/tutor/workspace";

export type TutorTab = "today" | "bai" | "giao" | "buoi" | "work" | "thi-thu";
const TABS: { id: TutorTab; label: string; path: string }[] = [
  { id: "today", label: "Hôm nay", path: "" },
  { id: "bai", label: "Kho bài", path: "/bai" },
  { id: "giao", label: "Giao bài", path: "/giao" },
  { id: "buoi", label: "Buổi dạy", path: "/buoi" },
  { id: "work", label: "Bài làm", path: "/work" },
  { id: "thi-thu", label: "Thi thử", path: "/thi-thu" },
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Per-student header + tabs of the tutor workspace (v2, 21/10): who the student is, and how many things wait on
 * each tab (Hôm nay: homework to correct + an unlogged teaching day; Kho bài: KUs waiting for review).
 */
export async function TutorTabs({ studentId, studentName, active }: { studentId: string; studentName: string; active: TutorTab }) {
  const user = await getCurrentUser();
  const [student, today] = await Promise.all([tutorStudent(studentId), user ? tutorToday(user.id, studentId) : null]);
  const counts: Partial<Record<TutorTab, { n: number; warn: boolean }>> = today
    ? { today: { n: today.homeworkDone + (today.sessionDue ? 1 : 0), warn: true }, bai: { n: today.waiting.length, warn: false } }
    : {};
  return (
    <div className="mb-6 border-b border-border">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft font-display font-bold text-accent" aria-hidden>
          {initials(studentName)}
        </span>
        <div>
          <p className="font-display text-base font-bold leading-tight">{studentName}</p>
          <p className="font-display text-xs text-muted">{student?.grade ? `Lớp ${student.grade} · ` : ""}bàn làm việc của gia sư</p>
        </div>
      </div>
      <nav className="mt-3 flex flex-wrap gap-x-6" aria-label="Bàn làm việc">
        {TABS.map((t) => {
          const c = counts[t.id];
          return (
            <Link
              key={t.id}
              href={`/tutor/${studentId}${t.path}`}
              aria-current={t.id === active ? "page" : undefined}
              className={`relative -mb-px flex items-center gap-1.5 border-b-[3px] py-3 font-display text-[15px] font-semibold ${t.id === active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t.label}
              {!!c?.n && (
                <span className={`rounded-full px-1.5 text-xs font-bold ${c.warn ? "bg-star-soft text-warn ring-1 ring-star/40" : "bg-accent-soft text-accent"}`} aria-label={`${c.n} việc`}>
                  {c.n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
