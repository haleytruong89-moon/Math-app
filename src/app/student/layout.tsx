import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    // Warm student theme (spec 2026-10-05): tokens are overridden for everything inside.
    <div className="student-theme min-h-dvh bg-bg text-ink">
      <AppHeader user={user} />
      <main className="mx-auto max-w-md px-4 py-6">{children}</main>
    </div>
  );
}
