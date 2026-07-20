"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectType } from "@/lib/types";
import { PROJECT_TYPE_GROUPS, PROJECT_TYPE_META } from "@/lib/project-stages";

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
    <div className="space-y-10">
      {PROJECT_TYPE_GROUPS.map((group) => (
        <div key={group.name}>
          <h2 className="kicker text-teal">{group.name}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.types.map((type) => (
              <button
                key={type}
                onClick={() => choose(type)}
                disabled={loading !== null}
                className="rounded-lg border border-line bg-paper px-4 py-3 text-left text-sm font-medium text-ink transition hover:border-gold hover:bg-paper-soft disabled:opacity-60"
              >
                {loading === type ? "Starting…" : PROJECT_TYPE_META[type].label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
