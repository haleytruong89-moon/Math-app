"use client";

// Kiểm tra tiến bộ (08/11): opens the browser's print dialog for the test page.
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-lg bg-accent px-4 py-2 font-display text-sm font-bold text-on-accent">
      In đề
    </button>
  );
}
