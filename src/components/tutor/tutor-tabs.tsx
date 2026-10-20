import Link from "next/link";

export type TutorTab = "today" | "bai" | "giao" | "buoi" | "work";
const TABS: { id: TutorTab; label: string; path: string }[] = [
  { id: "today", label: "Hôm nay", path: "" },
  { id: "bai", label: "Kho bài", path: "/bai" },
  { id: "giao", label: "Giao bài", path: "/giao" },
  { id: "buoi", label: "Buổi dạy", path: "/buoi" },
  { id: "work", label: "Bài làm", path: "/work" },
];

/** Per-student navigation of the tutor workspace (mockup "Bàn làm việc gia sư"). */
export function TutorTabs({ studentId, studentName, active }: { studentId: string; studentName: string; active: TutorTab }) {
  return (
    <div className="mb-5 border-b border-border">
      <p className="font-display text-sm text-muted">
        <Link href="/tutor" className="text-accent hover:underline">Học sinh</Link> · {studentName}
      </p>
      <nav className="mt-2 flex flex-wrap gap-1" aria-label="Bàn làm việc">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/tutor/${studentId}${t.path}`}
            aria-current={t.id === active ? "page" : undefined}
            className={`border-b-[3px] px-3.5 py-2.5 font-display text-sm font-semibold ${t.id === active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
