"use client";

import { useState } from "react";
import type { AnalysisReport } from "@/lib/analysis/types";
import { GRADE_DESCRIPTIONS } from "@/lib/analysis/grade";
import { UploadDropzone } from "@/components/UploadDropzone";
import { QualityScoreMeter } from "@/components/QualityScoreMeter";
import { StatTile } from "@/components/StatTile";
import { DimensionBarChart } from "@/components/DimensionBarChart";
import { ScoreHistogram } from "@/components/ScoreHistogram";
import { FlaggedPointsTable } from "@/components/FlaggedPointsTable";

const SAMPLES = [
  { label: "High-quality sample", file: "/samples/high-quality.jsonl" },
  { label: "Repetitive garbage sample", file: "/samples/repetitive-garbage.jsonl" },
];

export function Dashboard() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function runAnalysis(file: File) {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Analysis failed.");
      }
      setReport(data as AnalysisReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  async function runSample(path: string, label: string) {
    setLoading(true);
    setError(null);
    setFileName(label);
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      const file = new File([blob], path.split("/").pop() ?? "sample.jsonl");
      await runAnalysis(file);
    } catch {
      setError("Could not load the sample dataset.");
      setLoading(false);
    }
  }

  function reset() {
    setReport(null);
    setError(null);
    setFileName(null);
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Synthetic Data Quality Auditor</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Upload a CSV or JSON/JSONL dataset of synthetic training data. We run repetition, token-diversity,
          semantic-drift, and corruption checks and return an A–F quality grade plus a list of flagged records.
        </p>

        <div className="mt-8">
          <UploadDropzone onFile={runAnalysis} disabled={loading} fileName={loading ? fileName : null} />
        </div>

        {error && (
          <p className="mt-3 rounded-md border px-3 py-2 text-sm text-[var(--status-critical)]" style={{ borderColor: "var(--border)" }}>
            {error}
          </p>
        )}

        {loading && <p className="mt-3 text-sm text-[var(--text-secondary)]">Analyzing {fileName}…</p>}

        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Or try a sample:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.file}
              onClick={() => runSample(s.file, s.label)}
              disabled={loading}
              className="rounded-md border px-3 py-1.5 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{report.fileName}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {report.format.toUpperCase()} · {report.recordCount.toLocaleString()} records
            {report.textField && (
              <>
                {" "}
                · text field <code className="font-mono text-xs">{report.textField}</code>
              </>
            )}
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
          style={{ borderColor: "var(--border)" }}
        >
          Analyze another file
        </button>
      </div>

      {report.truncated && (
        <p className="mb-4 rounded-md border px-3 py-2 text-xs text-[var(--status-serious)]" style={{ borderColor: "var(--border)" }}>
          Dataset exceeds 20,000 records — analysis ran on the first 20,000 rows only.
        </p>
      )}
      {report.parseIssues.length > 0 && (
        <p className="mb-4 rounded-md border px-3 py-2 text-xs text-[var(--status-warning)]" style={{ borderColor: "var(--border)" }}>
          {report.parseIssues.length} row(s) had parse issues and were skipped or partially recovered.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-4 rounded-xl border p-6" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
          <QualityScoreMeter score={report.overallScore} grade={report.grade} />
          <p className="max-w-[220px] text-center text-sm text-[var(--text-secondary)]">{GRADE_DESCRIPTIONS[report.grade]}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Records analyzed" value={report.recordCount.toLocaleString()} />
          <StatTile label="Flagged records" value={report.totalFlaggedCount.toLocaleString()} />
          <StatTile
            label="Duplicate rate"
            value={`${report.dimensions.find((d) => d.key === "repetition")?.metrics.find((m) => m.label === "Duplicate rate")?.value ?? "0%"}`}
          />
          <StatTile
            label="Vocabulary size"
            value={report.dimensions.find((d) => d.key === "diversity")?.metrics.find((m) => m.label === "Vocabulary size")?.value ?? "0"}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border p-6" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Dimension breakdown</h2>
          <DimensionBarChart dimensions={report.dimensions} />
        </div>
        <div className="rounded-xl border p-6" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Record score distribution</h2>
          <ScoreHistogram buckets={report.histogram} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Flagged records
          <span className="ml-2 font-normal text-[var(--text-muted)]">({report.totalFlaggedCount.toLocaleString()})</span>
        </h2>
        <FlaggedPointsTable flagged={report.flagged} totalFlaggedCount={report.totalFlaggedCount} />
      </div>
    </div>
  );
}
