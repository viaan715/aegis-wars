"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@/lib/types";

const OPTIONS: { type: ProjectType; label: string; blurb: string }[] = [
  {
    type: "kitchen",
    label: "Kitchen renovation",
    blurb: "Cabinets, countertops, appliances, plumbing & electrical rough-in.",
  },
  {
    type: "bathroom",
    label: "Bathroom renovation",
    blurb: "Tile, waterproofing, vanity, tub or shower, fixtures.",
  },
];

export default function StartPicker() {
  const router = useRouter();
  const [loading, setLoading] = useState<ProjectType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(type: ProjectType) {
    setLoading(type);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectType: type }),
      });
      if (!res.ok) throw new Error("Could not start a new project.");
      const { project } = await res.json();
      router.push(`/projects/${project.id}/upload`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => choose(opt.type)}
          disabled={loading !== null}
          className="group flex flex-col items-start rounded-xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:border-amber-600 hover:shadow-md disabled:opacity-60"
        >
          <span className="text-lg font-semibold text-stone-900">{opt.label}</span>
          <span className="mt-1 text-sm text-stone-500">{opt.blurb}</span>
          <span className="mt-4 text-sm font-medium text-amber-700 group-hover:underline">
            {loading === opt.type ? "Starting…" : "Start with this project type →"}
          </span>
        </button>
      ))}
      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
      <p className="sm:col-span-2 text-xs text-stone-400">
        More project types (roofing, additions) are coming. For now Renovation Restart covers
        kitchen and bathroom jobs, where the stages and scope are predictable enough to flag
        what&apos;s missing with confidence.
      </p>
    </div>
  );
}
