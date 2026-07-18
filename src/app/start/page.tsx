import type { Metadata } from "next";
import Link from "next/link";
import StartPicker from "./StartPicker";

export const metadata: Metadata = {
  title: "Start your Restart Report | Renovation Restart",
  description: "Tell us what kind of project got stuck so we can organize it correctly.",
};

export default function StartPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            Renovation<span className="text-gold">Restart</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-14">
        <span className="kicker text-coral">Step 1</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          What kind of project stalled?
        </h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Pick the closest match. Each project type has its own predictable sequence of stages, so
          we can tell you, with confidence, what should already be done.
        </p>
        <div className="mt-8">
          <StartPicker />
        </div>
      </main>
    </div>
  );
}
