import Link from "next/link";
import { signOut } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/dal";

const ROLE_LABEL = { parent: "Phụ huynh", tutor: "Gia sư", student: "Học sinh" } as const;

export function AppHeader({
  user,
  nav,
  wide = false,
}: {
  user: CurrentUser;
  nav?: { href: string; label: string }[];
  /** Match a wide page body (the tutor workspace, max-w-6xl). */
  wide?: boolean;
}) {
  return (
    <header className="border-b border-border bg-surface font-display">
      <div className={`mx-auto flex ${wide ? "max-w-6xl" : "max-w-5xl"} flex-wrap items-center justify-between gap-3 px-4 py-3`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-base text-on-accent" aria-hidden>∑</span>
            App Toán
          </span>
          <span className="text-sm text-muted">
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
