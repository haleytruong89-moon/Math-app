import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    // Warm student theme (spec 2026-10-05): tokens are overridden for everything inside.
    <div className="student-theme min-h-dvh bg-bg text-ink">
      <AppHeader user={user} />
      {/* S5: a page marked data-wide (geometry proof lessons, Sổ tay) uses the laptop width; the rest stays phone-width. */}
      <main className="mx-auto max-w-md px-4 py-6 has-[[data-wide]]:max-w-5xl">{children}</main>
    </div>
  );
}
