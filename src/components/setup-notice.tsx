export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">App Toán</h1>
      <p className="mt-6 rounded-lg border border-dashed border-border bg-surface px-3 py-2 font-mono text-xs text-muted">
        Chưa cấu hình kết nối Supabase (thiếu biến môi trường
        NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
      </p>
    </main>
  );
}
