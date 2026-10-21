import type { Metadata, Viewport } from "next";
import "@fontsource-variable/libre-franklin";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Toán",
  description: "Học Toán 9 và luyện thi vào 10 — phụ huynh, gia sư, học sinh dùng chung.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Always light (parent 21/10/2026: everyone is used to white screens; an OS dark mode made the tutor's view hard to read).
    <html lang="vi" data-theme="light">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
