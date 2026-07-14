"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "extracting" | "building" | "done" | "error";

const STEP_LABELS: Record<Step, string> = {
  extracting: "Reading your documents and pulling out dates, amounts, and scope…",
  building: "Comparing what was promised against what's been done…",
  done: "Done — redirecting to your preview…",
  error: "Something went wrong.",
};

export default function ProcessingRunner({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("extracting");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      try {
        const extractRes = await fetch(`/api/projects/${projectId}/extract`, { method: "POST" });
        if (!extractRes.ok) {
          const data = await extractRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Extraction failed.");
        }

        setStep("building");
        const reportRes = await fetch(`/api/projects/${projectId}/report`, { method: "POST" });
        if (!reportRes.ok) {
          const data = await reportRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Report generation failed.");
        }

        setStep("done");
        router.push(`/projects/${projectId}/preview`);
      } catch (err) {
        setStep("error");
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }

    run();
  }, [projectId, router]);

  return (
    <div className="flex flex-col items-center py-24 text-center">
      {step !== "error" && (
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-gold" />
      )}
      <p className="mt-6 max-w-sm text-ink">{STEP_LABELS[step]}</p>
      {error && (
        <div className="mt-4 max-w-sm">
          <p className="text-sm text-coral">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-paper-soft"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
