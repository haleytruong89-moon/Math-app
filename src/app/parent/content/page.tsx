import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { listModules } from "@/lib/content";

export const metadata: Metadata = { title: "Nội dung — App Toán" };

export default async function ContentPage() {
  await requireRole("parent");
  const modules = listModules();

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Nội dung bài học</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Bài <b>Nháp</b> chỉ phụ huynh thấy. Mở từng bài, bấm thử như học sinh (không ghi dữ liệu). Bài ổn thì nói với
        Claude <i>&ldquo;duyệt bài …&rdquo;</i>; chỗ nào sai thì ghi lại để sửa. Học sinh chỉ thấy bài <b>Đã duyệt</b>.
      </p>

      {modules.map((m) => (
        <section key={m.id} className="mt-8">
          <h2 className="font-display text-base font-semibold">
            {m.title} <span className="font-mono text-xs font-normal text-muted">· mạch {m.domains.join(", ")}</span>
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {m.unitList.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <span className="font-mono text-xs text-muted">{u.order}. </span>
                  {u.title}
                  <div className="font-mono text-xs text-muted">
                    {u.practice.length} câu luyện · {u.exit.length} câu kiểm tra · ~{u.estMinutes} phút
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${
                      u.status === "approved" ? "bg-good-soft text-good" : "bg-warn-soft text-warn"
                    }`}
                  >
                    {u.status === "approved" ? `Đã duyệt ${u.approvedOn}` : "Nháp"}
                  </span>
                  <Link href={`/parent/content/${u.id}`} className="text-sm text-accent hover:underline">
                    Xem trước →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
