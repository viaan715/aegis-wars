import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis Audit — Synthetic Data Quality Grade",
  description: "Upload synthetic training data and get an A-F quality grade with repetition, diversity, drift, and corruption checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2 3 6v6c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10V6l-9-4Z"
                  stroke="var(--series-1)"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              Aegis Audit
            </Link>
            <nav className="flex items-center gap-5 text-sm text-[var(--text-secondary)]">
              <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">
                Dashboard
              </Link>
              <Link href="/pricing" className="transition-colors hover:text-[var(--text-primary)]">
                Pricing
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="flex-1 px-6">{children}</main>
        <footer className="border-t px-6 py-6 text-center text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>
          Aegis Audit — analysis runs statistically, no data leaves this deployment unless you configure it to.
        </footer>
      </body>
    </html>
  );
}
