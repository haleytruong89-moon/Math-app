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
          { href: "/parent/bao-cao", label: "Báo cáo tuần" },
          { href: "/parent/content", label: "Nội dung" },
          { href: "/parent/accounts", label: "Tài khoản" },
          { href: "/parent/ai", label: "AI" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
