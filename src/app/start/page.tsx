import type { Metadata } from "next";
import Link from "next/link";
import StartPicker from "./StartPicker";

export const metadata: Metadata = {
  title: "Start your Restart Report | Renovation Restart",
  description: "Tell us what kind of project got stuck so we can organize it correctly.",
};

export default function StartPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-lg font-semibold text-stone-900">
            Renovation Restart
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          What kind of project stalled?
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          We currently build Restart Reports for kitchen and bathroom renovations — the two most
          common mid-size projects with a predictable enough sequence of stages that we can tell
          you, with confidence, what should already be done.
        </p>
        <div className="mt-8">
          <StartPicker />
        </div>
      </main>
    </div>
  );
}
