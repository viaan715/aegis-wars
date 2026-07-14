import Link from "next/link";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper-soft">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            Renovation<span className="text-gold">Restart</span>
          </Link>
          <span className="text-sm text-ink-soft">Your progress is saved automatically</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
