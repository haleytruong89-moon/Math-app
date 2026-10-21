import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("tutor");
  return (
    <>
      <AppHeader user={user} wide />
      {/* v2 (21/10): sans-serif for the workspace; math content (items, lessons) keeps the serif via font-body. */}
      <main className="mx-auto max-w-6xl px-4 py-6 font-display">{children}</main>
    </>
  );
}
