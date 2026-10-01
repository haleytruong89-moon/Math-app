import { requireRole } from "@/lib/dal";
import { AppHeader } from "@/components/app-header";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("parent");
  return (
    <>
      <AppHeader
        user={user}
        nav={[
          { href: "/parent", label: "Tổng quan" },
          { href: "/parent/accounts", label: "Tài khoản" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
