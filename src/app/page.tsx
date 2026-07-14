import Link from "next/link";
import { PRICING_TIERS, formatPrice } from "@/lib/pricing";

const ACCENTS = ["gold", "teal", "coral", "lavender"] as const;

const ACCENT_CLASSES: Record<(typeof ACCENTS)[number], { bg: string; borderT: string }> = {
  gold: { bg: "bg-gold", borderT: "border-t-gold" },
  teal: { bg: "bg-teal", borderT: "border-t-teal" },
  coral: { bg: "bg-coral", borderT: "border-t-coral" },
  lavender: { bg: "bg-lavender", borderT: "border-t-lavender" },
};

const REPORT_CONTENTS = [
  {
    title: "Project timeline",
    detail: "Contract signed → milestones → your last contact with the contractor, all in one line.",
  },
  {
    title: "Work completed vs. contracted scope",
    detail: "What the contract promised, mapped against the stage things actually stopped at.",
  },
  {
    title: "Money paid vs. value received",
    detail: "Flags it when what you've paid looks out of step with what's actually been done.",
  },
  {
    title: "Missing documents",
    detail: "Permits, lien waivers, change orders, inspection sign-offs — what you have and what you don't.",
  },
  {
    title: "Questions for your next contractor",
    detail: "The specific things to ask before anyone quotes the remaining work.",
  },
  {
    title: "Plain-language summary",
    detail: "What the paperwork actually says, in normal English — always with a not-legal-advice disclaimer.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Upload what you have",
    detail: "Contract, receipts, invoices, photos, texts, emails, payment records. Partial folders are normal.",
  },
  {
    step: "2",
    title: "Answer a few questions",
    detail: "What was promised, what stage things stopped at, what you've already tried. About 3 minutes.",
  },
  {
    step: "3",
    title: "We read every document",
    detail: "Dates, amounts, scope items, and promises get pulled out of each file automatically.",
  },
  {
    step: "4",
    title: "Preview for free",
    detail: "See your timeline and a couple of flagged issues before you pay anything.",
  },
  {
    step: "5",
    title: "Unlock and download",
    detail: "Get the full report as a formatted PDF, ready to hand to your next contractor.",
  },
];

const FAQS = [
  {
    q: "Is this legal advice?",
    a: "No. Renovation Restart summarizes what your paperwork says in plain language. It is not legal advice, and every report includes a disclaimer. For decisions about money owed, contract disputes, or possible legal action, talk to a licensed attorney in your state.",
  },
  {
    q: "What if I don't have all my documents?",
    a: "That's normal — most people in this situation have a scattered, incomplete folder. Upload whatever you have, even if it's just the contract or a handful of texts. The report will tell you what's missing.",
  },
  {
    q: "Do you handle roofing, additions, or other project types?",
    a: "Not yet. Renovation Restart currently covers kitchen and bathroom renovations, where the sequence of stages is standard enough to say with confidence what should already be done. Other project types are coming.",
  },
  {
    q: "How long does this take?",
    a: "Uploading and answering the questionnaire takes about 10 minutes. Your free preview is ready right after that.",
  },
  {
    q: "What happens to my documents?",
    a: "Your files are used only to generate your report. They are not shared, sold, or used to train anything beyond producing your Restart Report.",
  },
];

export default function LandingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold text-ink">
            Renovation<span className="text-gold">Restart</span>
          </span>
          <Link
            href="/start"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-on-accent hover:bg-gold-dark"
          >
            Start my report
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
          <span className="kicker text-coral">Kitchen &amp; bathroom renovations</span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Your contractor quit?{" "}
            <span className="bg-gold-soft px-1.5">Upload what you have</span>, get an organized
            handoff report.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
            Contract, receipts, texts, photos — turn the scattered folder into a clear picture of
            what&apos;s done, what you owe or are owed, and what your next contractor needs to know.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/start"
              className="rounded-lg bg-gold px-6 py-3 font-semibold text-on-accent hover:bg-gold-dark"
            >
              Start my Restart Report
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-ink-soft hover:text-ink hover:underline">
              See how it works ↓
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Takes about 10 minutes. Free preview before you pay anything.
          </p>
        </section>

        {/* Crisis framing */}
        <section className="border-y border-line bg-lavender-soft py-14">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="font-display text-xl font-medium text-ink">
              &ldquo;Contractor abandoned my project.&rdquo; &ldquo;Contractor quit mid renovation.&rdquo;
              &ldquo;Contractor stopped answering.&rdquo;
            </p>
            <p className="mt-4 text-ink-soft">
              If you searched something like that tonight, you&apos;re not alone — and you probably
              have a folder of contracts, receipts, and texts with no clear picture of where things
              actually stand. That&apos;s what Renovation Restart organizes.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-16">
          <span className="kicker block text-center text-teal">The process</span>
          <h2 className="mt-2 text-center font-display text-2xl font-bold text-ink sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((s, i) => {
              const accent = ACCENT_CLASSES[ACCENTS[i % ACCENTS.length]];
              return (
                <div key={s.step}>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${accent.bg} font-display text-sm font-bold text-on-accent`}
                  >
                    {s.step}
                  </span>
                  <h3 className="mt-3 font-medium text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{s.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* What's in the report */}
        <section className="border-y border-line bg-paper-soft py-16">
          <div className="mx-auto max-w-5xl px-6">
            <span className="kicker block text-center text-coral">The deliverable</span>
            <h2 className="mt-2 text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              What&apos;s in your Restart Report
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {REPORT_CONTENTS.map((r, i) => {
                const accent = ACCENT_CLASSES[ACCENTS[i % ACCENTS.length]];
                return (
                  <div
                    key={r.title}
                    className={`rounded-xl border border-line bg-paper p-5 border-t-4 ${accent.borderT}`}
                  >
                    <h3 className="font-medium text-ink">{r.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{r.detail}</p>
                  </div>
                );
              })}
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
              v1 covers kitchen and bathroom renovations — the most common mid-size projects, with a
              standard enough sequence of stages to say with confidence what should already be done.
              Roofing, additions, and other project types are coming.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-16">
          <span className="kicker block text-center text-lavender">Pricing</span>
          <h2 className="mt-2 text-center font-display text-2xl font-bold text-ink sm:text-3xl">
            One-time payment, no subscription
          </h2>
          <p className="mt-2 text-center text-ink-soft">
            You start free and only pay to unlock the full report.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {Object.values(PRICING_TIERS).map((tier) => (
              <div
                key={tier.id}
                className={`flex flex-col rounded-xl border p-6 ${
                  tier.id === "full"
                    ? "border-gold bg-gold-soft shadow-md"
                    : "border-line bg-paper"
                }`}
              >
                {tier.id === "full" && (
                  <span className="mb-2 self-start rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-on-accent">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
                <p className="text-sm text-ink-soft">{tier.tagline}</p>
                <p className="mt-3 text-3xl font-bold text-ink">{formatPrice(tier.priceCents)}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-teal">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/start"
              className="rounded-lg bg-gold px-6 py-3 font-semibold text-on-accent hover:bg-gold-dark"
            >
              Start my Restart Report
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-line bg-paper-soft py-16">
          <div className="mx-auto max-w-3xl px-6">
            <span className="kicker block text-center text-teal">Questions</span>
            <h2 className="mt-2 text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-8 divide-y divide-line">
              {FAQS.map((f) => (
                <div key={f.q} className="py-5">
                  <h3 className="font-medium text-ink">{f.q}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xs leading-relaxed text-ink-soft">
            Renovation Restart generates plain-language summaries from the documents and answers you
            provide. It is not legal advice. For decisions about money owed, contract disputes, liens,
            or possible legal action, consult a licensed attorney in your state.
          </p>
        </div>
      </footer>
    </div>
  );
}
