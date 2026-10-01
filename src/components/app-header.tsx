import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/dal";

const ROLE_LABEL = { parent: "Phụ huynh", tutor: "Gia sư", student: "Học sinh" } as const;

export function AppHeader({
  user,
  nav,
}: {
  user: CurrentUser;
  nav?: { href: string; label: string }[];
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-bold">App Toán</span>
          <span className="font-mono text-xs text-muted">
            {ROLE_LABEL[user.role]} · {user.displayName}
          </span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {nav?.map((n) => (
            <Link key={n.href} href={n.href} className="text-accent hover:underline">
              {n.label}
            </Link>
          ))}
          <form action={signOut}>
            <button type="submit" className="text-muted hover:text-ink">
              Đăng xuất
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
