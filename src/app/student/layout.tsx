import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("student");
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-md px-4 py-8">{children}</main>
    </>
  );
}
