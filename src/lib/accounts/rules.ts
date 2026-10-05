// Parent "Tài khoản" helpers (student profile edit/delete). Pure, so `node --test` covers it.

const canon = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

/** Deleting a student needs their name typed again; spacing and case don't matter, diacritics do. */
export function nameMatches(typed: unknown, name: string): boolean {
  return typeof typed === "string" && canon(typed) !== "" && canon(typed) === canon(name);
}

/** What a delete will remove, shown before the parent confirms. */
export function deleteImpact(n: { attempts: number; sessions: number; homework: number; hasLogin: boolean }): string {
  const parts = [
    n.attempts ? `${n.attempts} câu đã làm` : null,
    n.sessions ? `${n.sessions} buổi dạy` : null,
    n.homework ? `${n.homework} bài về nhà` : null,
    n.hasLogin ? "tài khoản đăng nhập" : null,
  ].filter(Boolean);
  return parts.length ? `Sẽ xoá vĩnh viễn: ${parts.join(", ")}.` : "Hồ sơ này chưa có dữ liệu học.";
}
